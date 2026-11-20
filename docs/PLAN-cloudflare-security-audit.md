# PLAN — Auditoria de Segurança Completa (`cloudflare/security-audit-skill`)

> **Modo:** PLANEJAMENTO ONLY (nenhum arquivo de código da aplicação foi alterado).
> **Skill:** `cloudflare/security-audit-skill` (commit `c1c8a8c`, modo **Full Audit Mode** — 6 fases, 100% independente, usando exclusivamente o container dedicado `cf-security-audit-sandbox:1.0.0`).
> **Agentes responsáveis:** `orchestrator` (coordenação/estado compartilhado), `research` (reconhecimento 1a–1d), `security-auditor` / `general` (caçadores Fase 2, críticos de cobertura, verificadores Fase 3 e Fase 5).

---

## 1. Parâmetros Confirmados (Socratic Gate) & Container Dedicado

### 1.1 Configuração da Execução

| Parâmetro | Valor Confirmado |
|---|---|
| **Modo Operacional** | `Full Audit Mode` (6 fases completas + artefatos JSON/Markdown) |
| **Perfil (`profile`)** | `deep` (unidades divididas por subsistema **e** modo de ciclo de vida; ondas de coverage-critic até passe limpo; verificadores independentes distintos na Fase 3 e Fase 5) |
| **Escopo (`scope_paths`)** | `["*"]` — Repositório completo: Backend Laravel (`app/`, `routes/`, `config/`, `database/`), Frontend React/Inertia (`resources/js/`) e App Garçom Flutter (`waiter_app/lib/`) |
| **Referência de Origem (`source_ref`)** | Branch `feature/loading-states-e-waiter-screens` @ `d9d42a189e785d71c1662f87b3d86dd10e5d3af4` (ou `main` após merge) |
| **Diretório da Skill** | `C:\Users\Admin\.gemini\antigravity\skills\cloudflare-security-audit` (instalação global também realizada via `npx skills add` em `~\.gemini\config\skills\security-audit` e `~\.agents\skills\security-audit`) e embarcada read-only em `/opt/cloudflare-security-audit` dentro do container |
| **Diretório de Saída (`output_dir`)** | `C:\Users\Admin\security-audit-skill\pedido-feito-pizzaria\run-1` (externo ao repositório) |
| **Container Sandbox Dedicado** | `cf-security-audit-sandbox:1.0.0` (construído a partir de `C:\Users\Admin\security-audit-skill\docker\Dockerfile`, base oficial `php:8.4-cli-bookworm`) |
| **Execução (`execution_policy`)** | `sandboxed-source-and-local-only` |

### 1.2 Arquitetura do Sandbox Dedicado (`cf-security-audit-sandbox:1.0.0`)

Imagem própria construída especificamente para a stack deste projeto (`PHP >= 8.4` conforme `vendor/composer/platform_check.php`) e para os requisitos de segurança da Cloudflare `security-audit-skill`:

| Componente / Capacidade | Especificação Verificada no Container | Uso na Auditoria |
|---|---|---|
| **Runtime PHP & Extensões** | `PHP 8.4.27 (cli)` com `pdo_sqlite`, `pdo_mysql`, `mbstring`, `xml`, `dom`, `zip`, `bcmath`, `intl`, `gd`, `pcntl`, `opcache` + `Composer 2.11.2` | Execução local isolada de harnesses PHP/Laravel usando banco SQLite em `/scratch` (sem rede e sem MySQL externo) |
| **Runtime JS / Python / DB** | `Node.js v22.23.5`, `Python 3.11.2`, `SQLite 3.40.1` | Harnesses React/JS/Node, inspeção de fixtures e execução de validadores |
| **Controles OS / Limites** | `/usr/bin/timeout`, `/usr/bin/prlimit`, usuário não-privilegiado `10001:10001` (`auditor`), `--network none --read-only --cap-drop=ALL --security-opt=no-new-privileges` | Isolamento estrito de processo, memória, CPU, PIDs e escrita confinada a `/scratch` |
| **Validadores Cloudflare** | `/opt/cloudflare-security-audit/validate-findings.cjs` e `validate-coverage-ledger.cjs` (**65/65 testes aprovados** dentro do container) | Validação obrigatória de `coverage-ledger.json` e `findings.json` |
| **Promoção Segura de Artefatos** | `/opt/cloudflare-security-audit/promote_artifact.py` (travessia POSIX `dir_fd` + `O_NOFOLLOW` + `O_NONBLOCK` + verificação dupla de `fstat` e limites de bytes) | Promoção controlada pelo Parent de evidências produzidas em `/scratch` para `artifacts/` |
| **Flutter / Dart (`waiter_app`)** | SDK Flutter não embarcado no container offline | Unidades Flutter analisadas via `method: "source"` (`artifact: null`); validações dependentes de execução móvel viram `needs_validation` |
| **Infraestrutura / Produção Externa** | Proxy reverso, TLS, Cloudflare/CDN e webhooks reais do Mercado Pago fora do repositório | Registrados como `needs_validation` com plano de validação seguro e não destrutivo para o proprietário |

**Comando padrão de execução sandboxed (Backend PHP/Laravel via SQLite & Frontend JS/Node):**

```powershell
docker run --rm --network none --read-only `
  --user 10001:10001 --cap-drop=ALL --security-opt=no-new-privileges `
  --cpus=1 --memory=512m --pids-limit=64 --ulimit fsize=10485760:10485760 `
  --tmpfs /tmp:rw,noexec,nosuid,size=64m `
  -e HOME=/scratch/home -e TMPDIR=/scratch/tmp -e COMPOSER_CACHE_DIR=/scratch/composer `
  -v "c:\Users\Admin\Desktop\PROJETOS\Pedido-Feito 2.0:/target:ro" `
  -v "C:\Users\Admin\security-audit-skill\pedido-feito-pizzaria\run-1\agents\<agent-id>\scratch:/scratch:rw" `
  cf-security-audit-sandbox:1.0.0 sh -c "<comando>"
```

> [!IMPORTANT]
> **Isolamento de Escrita (Regra da Skill):** O coordenador (Parent) é o único escritor dos arquivos compartilhados (`run-metadata.json`, `architecture.md`, `coverage-ledger.json`, `findings.json`, `REPORT.md`, `FINDINGS-DETAIL.md`, `NEEDS-VALIDATION.md`). Agentes caçadores e verificadores usam IDs canônicos minúsculos (`^[a-z0-9][a-z0-9_-]{0,63}$`, nunca nomes reservados do Windows) e escrevem **apenas** em seu próprio `scratch/`. Quando uma suíte PHP/Laravel precisar gravar cache em `bootstrap/cache` ou `storage/`, o script copia de `/target` (somente leitura) para uma cópia descartável dentro de `/scratch/app` sem jamais montar `/target` como gravável.

---

## 2. Arquitetura de Cobertura (`deep` Profile)

### 2.1 Subsistemas Mapeados (8)

1. `subsystem/auth-and-rbac` — Sessão web, login por PIN do garçom, tokens Sanctum, `RoleMiddleware`, `EnsureUserIsActive`, gestão de equipe (`UserController`, `Auth/`).
2. `subsystem/pos-and-floor` — Criação de pedidos no PDV, gestão de salão/mesas, fechamento de conta, divisão de pagamentos, caixa (`PosController`, `FloorController`, `TableController`, `CashRegisterController`).
3. `subsystem/customer-digital-menu` — Cardápio digital público, pedido via QR de mesa, cálculo de preços/broto/meio-a-meio, validação de cupons e taxa de entrega (`CustomerMenuController`, `OrderCreationService`).
4. `subsystem/payments-and-webhooks` — Integração Mercado Pago, validação de assinatura de webhook, proteção contra replay, resolução por referência externa (`WebhookController`, `MercadoPagoService`, `PaymentController`).
5. `subsystem/kds-and-printing` — Kitchen Display System (KDS), transições de status em tempo real, impressão térmica (`KdsController`, `OrderController`).
6. `subsystem/catalog-and-settings` — Produtos, tamanhos/sabores/bordas de pizza, configurações da loja, upload de arquivos (`ProductController`, `PizzaFlavorController`, `SettingController`).
7. `subsystem/frontend-spa` — Páginas React/Inertia (`CustomerMenu`, `POS`, `Floor`, incluindo o uso de `eval` identificado em `CalculatorPopover.jsx`), armazenamento local, scanner QR, boundaries DOM/XSS.
8. `subsystem/waiter-mobile-app` — App Flutter `waiter_app/lib/` (`api_service.dart`, armazenamento de token, fluxos de mesa/pedido/comanda, riscos de transporte HTTP cleartext/deep links).

### 2.2 Modos de Ciclo de Vida (`deep`)

Cada unidade relevante do ledger é desdobrada nos 3 modos de ciclo de vida exigidos pelo perfil `deep`:
1. `create-and-input` — Criação inicial, cadastro, ingestão de entrada não confiável.
2. `mutate-and-state-transition` — Atualizações, mudanças de status, divisão/junção, confirmação de pagamento.
3. `revoke-close-and-recovery` — Cancelamento, estorno, revogação de token, desativação de usuário, fechamento de mesa.

### 2.3 Arquivos Companion Selecionados (via `ATTACK-CLASSES.md`)

- `WEB-PROTOCOL-AND-AUTH.md` — Tokens Sanctum, sessão/CSRF, autenticação PIN, RBAC.
- `CLIENT-SIDE.md` — React SPA, `eval` em `CalculatorPopover.jsx`, `localStorage`, leitor QR.
- `PROTOCOLS-RPC-AND-MESSAGING.md` — Webhooks Mercado Pago, proteção contra replay e idempotência.
- `DATA-ISOLATION-AND-LIFECYCLE.md` — Ciclo de vida de pedidos/mesas, soft-deletes, estado em cache/sessão.
- `RESOURCE-EXHAUSTION-AND-AVAILABILITY.md` — Rate limits no cardápio digital público e webhooks não autenticados.
- `DESKTOP-MOBILE-AND-LOCAL-IPC.md` — Cliente móvel Flutter `waiter_app`, persistência de credenciais, transporte API.
- `CLOUD-AND-DEPLOYMENT.md` e `SUPPLY-CHAIN-AND-RELEASE.md` — Headers de segurança, exposição de `.env`/config, lockfiles (`composer.lock`, `package-lock.json`, `pubspec.lock`).

---

## 3. Quebra de Tarefas por Fase (Task Breakdown)

### Fase 0 — Setup & Budget Gate (`orchestrator`)
- [ ] **P0.1** Criar diretório externo `C:\Users\Admin\security-audit-skill\pedido-feito-pizzaria\run-1` e subpasta `agents/`.
- [ ] **P0.2** Inicializar `run-metadata.json` com `run_id: "run-1"`, `repo: "pedido-feito-pizzaria"`, `target`, `source_ref`, `profile: "deep"`, `scope_paths: ["*"]`, `budget: null` (ou teto explícito se definido antes do início), `execution_policy: "sandboxed-source-and-local-only"`, `sandbox_image: "cf-security-audit-sandbox:1.0.0"`, `companion_files`, `prior_runs: []`, e `run_status: "in_progress"`.
- [ ] **P0.3** Registrar explicitamente que não existe nenhum `coverage-ledger.json` nem `findings.json` prévio da Cloudflare para este repositório (auditoria iniciada do zero pela metodologia oficial Cloudflare).

**Critério de saída:** `run-metadata.json` gravado; gate de orçamento aprovado antes do reconhecimento.

---

### Fase 1 — Reconhecimento Paralelo & Ledger Determinístico (`research` × 4)
Lançar 4 agentes `research` em paralelo (somente leitura, sem rede):
- [ ] **P1.1 (`recon-1a-product-stack`)** — Mapear stack Laravel 12 / React 18 / Inertia / Flutter 3, pontos de entrada, comandos offline com PHP 8.4 + SQLite em `/scratch` e ausência do SDK Flutter no container.
- [ ] **P1.2 (`recon-1b-principals-authority`)** — Mapear todos os atores (Cliente público, Garçom PIN/Sanctum, Cozinha/KDS, Caixa/POS, Admin), middlewares e controles de autorização/isolamento.
- [ ] **P1.3 (`recon-1c-surfaces-sinks`)** — Inventariar superfícies de entrada (rotas `web.php`, `api.php`, `channels.php`, formulários, uploads, webhooks, storages client-side, Flutter `api_service.dart`) até seus sinks.
- [ ] **P1.4 (`recon-1d-execution-deployment`)** — Mapear controles de deploy/headers, fixtures PHPUnit/Vitest compatíveis com SQLite offline e confirmar os limites de execução dentro de `cf-security-audit-sandbox:1.0.0`.
- [ ] **P1.5 (`orchestrator`)** — Sintetizar `<output-dir>/architecture.md` (limite rígido ≤ 1.000 palavras) e gerar `<output-dir>/coverage-ledger.json` (array JSON com `coverage_id` codificado via RFC 3986: `surface::boundary::subsystem::attack_class::lifecycle`).
- [ ] **P1.6** Validar o ledger inicial dentro de `cf-security-audit-sandbox:1.0.0`:
  ```powershell
  docker run --rm --network none --read-only `
    --user 10001:10001 --cap-drop=ALL --security-opt=no-new-privileges `
    -v "C:\Users\Admin\security-audit-skill\pedido-feito-pizzaria\run-1:/out:ro" `
    cf-security-audit-sandbox:1.0.0 `
    node /opt/cloudflare-security-audit/validate-coverage-ledger.cjs /out/coverage-ledger.json
  ```

**Critério de saída:** `architecture.md` (≤ 1.000 palavras) e `coverage-ledger.json` validado com 0 erros.

---

### Fase 2 — Ondas de Busca Guiada por Cobertura (`general` Hunters + Critics)
- [ ] **P2.1 (Wave 1 — Hunters Isolados)** — Distribuir unidades do ledger entre caçadores focados nas 9 classes padrão (`Injection`, `Access control`, `Resource and file handling`, `Cryptography and secrets`, `Business logic`, `Feature abuse and data leakage`, `Chained vulnerabilities and trust boundaries`, `Wildcard`, `Obvious things`) + blocos companion selecionados. Cada caçador retorna exclusivamente JSON estruturado de candidatos (sem prosa solta).
- [ ] **P2.2 (Execução Isolada & Promoção Segura de Artefatos)** — Para reproduções locais PHP/Laravel (usando cópia descartável em `/scratch` + banco SQLite temporário) ou harnesses JS/Node dentro de `cf-security-audit-sandbox:1.0.0` (`--network none`), o Parent executa `/opt/cloudflare-security-audit/promote_artifact.py` para promover apenas os arquivos pré-declarados de `scratch/` para `artifacts/` com validação POSIX `O_NOFOLLOW` e limites estritos de bytes.
- [ ] **P2.3 (Wave 1 Coverage-Critic — `critic-wave-1`)** — Agente crítico independente revisa `coverage-ledger.json` + resultados da Wave 1 para apontar lacunas, caminhos paralelos não cobertos ou inconsistências de escopo.
- [ ] **P2.4 (Wave 2+ & `critic-final-clean`)** — Executar ondas adicionais para fechar todas as lacunas aceitas até atingir um passe limpo do crítico final (`critic-final-clean`).

**Critério de saída:** Todas as unidades in-scope cobertas ou explicitamente justificadas; lista consolidada de candidatos deduplicada por fingerprint estável.

---

### Fase 3 — Validação Independente de Candidatos (`general` Verifiers P3)
- [ ] **P3.1** Para cada candidato único (`confirmed` ou `needs_validation` proposto), instanciar um verificador **fresco** (`verifier-p3-<n>`) que **não** participou da busca na Fase 2.
- [ ] **P3.2** Fornecer ao verificador: candidato, ledger unit vinculada, blocos relevantes de `ATTACK-CLASSES.md`/companions, bloco de procedimento de promoção verbatim de `VALIDATION-AND-REPORTING.md` e os ramos de `report-schema.json`.
- [ ] **P3.3** O verificador tenta refutar o candidato relendo cada `file:line` na fonte atual, reproduzindo localmente no sandbox `cf-security-audit-sandbox:1.0.0` (quando PHP/SQLite ou JS/Node aplicável), confirmando fronteira de confiança real e calibrando severidade (`critical`/`high`/`medium`/`low`/`informational`) ou classificando como `needs_validation` / `rejected`.

**Critério de saída:** Veredito estruturado único (JSON válido) para cada fingerprint único.

---

### Fase 4 — Saída Estruturada & Validação de Contrato (`orchestrator`)
- [ ] **P4.1** Consolidar todos os registros (`confirmed`, `needs_validation`, `rejected`) ordenados por `fingerprint` em `<output-dir>/findings.json`, respeitando `additionalProperties: false` de `report-schema.json`.
- [ ] **P4.2** Atualizar `<output-dir>/coverage-ledger.json` com os vereditos e checks dos verificadores Fase 3.
- [ ] **P4.3** Rodar os dois validadores oficiais dentro de `cf-security-audit-sandbox:1.0.0` até zerar erros semânticos e estruturais:
  ```powershell
  docker run --rm --network none --read-only `
    --user 10001:10001 --cap-drop=ALL --security-opt=no-new-privileges `
    -v "C:\Users\Admin\security-audit-skill\pedido-feito-pizzaria\run-1:/out:ro" `
    cf-security-audit-sandbox:1.0.0 sh -c "node /opt/cloudflare-security-audit/validate-findings.cjs /out/findings.json && node /opt/cloudflare-security-audit/validate-coverage-ledger.cjs /out/coverage-ledger.json"
  ```

**Critério de saída:** Ambos os validadores retornam exit code `0`.

---

### Fase 5 — Verificação Independente Final (`deep` — Fresh `general` Verifiers P5)
*(Exigida pelo perfil `deep`: agentes completamente distintos dos caçadores da Fase 2 e dos verificadores da Fase 3.)*
- [ ] **P5.1** Instanciar verificadores frescos `verifier-p5-<n>` para revalidar cada registro `confirmed` e `needs_validation` em `findings.json` diretamente contra as linhas exatas do código-fonte e artefatos promovidos.
- [ ] **P5.2** Reconciliar eventuais correções de citação, severidade ou status no `findings.json` e `coverage-ledger.json`.
- [ ] **P5.3** Re-executar `validate-findings.cjs` e `validate-coverage-ledger.cjs` dentro de `cf-security-audit-sandbox:1.0.0` após a reconciliação final.

**Critério de saída:** Todos os registros finais auditados duas vezes de forma independente e validadores 100% verdes.

---

### Fase 6 — Relatórios Neutros de Alvo (`orchestrator`)
- [ ] **P6.1** Gerar `<output-dir>/REPORT.md` — Resumo executivo, postura de cobertura (`deep`), severidades confirmadas e escopo executado via `cf-security-audit-sandbox:1.0.0`.
- [ ] **P6.2** Gerar `<output-dir>/FINDINGS-DETAIL.md` — Evidências linha-a-linha, boundary violada, menor correção efetiva recomendada e testes de regressão sugeridos (sem modificar o código-fonte durante a auditoria).
- [ ] **P6.3** Gerar `<output-dir>/NEEDS-VALIDATION.md` — Todos os itens dependentes de SDK Flutter ou configuração de deploy externo, com plano de verificação seguro passo a passo para o proprietário.
- [ ] **P6.4** Atualizar `run-metadata.json` com `run_status: "completed"`.

---

## 4. Phase X — Checklist de Conclusão da Auditoria

- [ ] Container `cf-security-audit-sandbox:1.0.0` construído e validado (0 dependências externas de terceiros).
- [ ] `run-metadata.json` em estado terminal (`completed` ou `incomplete` com motivo explícito — nunca parar no meio de uma fase).
- [ ] `architecture.md` ≤ 1.000 palavras.
- [ ] `coverage-ledger.json` validado com `validate-coverage-ledger.cjs` (0 erros) dentro de `cf-security-audit-sandbox:1.0.0`.
- [ ] `findings.json` validado com `validate-findings.cjs` (0 erros) dentro de `cf-security-audit-sandbox:1.0.0`.
- [ ] Nenhum achado `needs_validation` com campo `severity` preenchido.
- [ ] Verificação dupla independente concluída (Fase 3 ≠ Fase 2; Fase 5 ≠ Fase 2 e Fase 3).
- [ ] `REPORT.md`, `FINDINGS-DETAIL.md` e `NEEDS-VALIDATION.md` 100% consistentes com `findings.json`.
- [ ] Repositório alvo mantido intacto (somente leitura durante toda a execução da auditoria).
