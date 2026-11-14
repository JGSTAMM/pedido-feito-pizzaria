# PLAN — Sincronização de Branches e Atualização da `main`

> Modo: **PLANEJAMENTO** (nenhum código alterado). Gerado em 2026-11-14.
> Agentes: `orchestrator` (git), `frontend-specialist` (validação React/i18n), `mobile-developer` (waiter_app), `code-reviewer`.

---

## 1. Diagnóstico (Fase -1 — Context Check)

### 1.1 Branches

`main` local == `origin/main` (`5b08e00`, 0 à frente / 0 atrás).

| Branch | Commits à frente da `main` | Atrás da `main` | Mesclada? | Remota existe? |
|---|---|---|---|---|
| `docs/atualizacao-readme` | 0 | 178 | ✅ | ✅ |
| `feature/gestao-equipe` | 0 | 177 | ✅ | ✅ |
| `feature/kds-e-recibos` | 0 | 176 | ✅ | ✅ |
| `refactor/remover-usuarios-legado` | 0 | 176 | ✅ | ✅ |
| `feature/kds-upgrade-e-recibo` | 0 | 175 | ✅ | ✅ |
| `feature/recibo-saas` | 0 | 175 | ✅ | ✅ |
| `feature/recibo-saas-kds-alert` | 0 | 173 | ✅ | ✅ |
| `feature/kds-reprint-live-preview` | 0 | 171 | ✅ | ✅ |
| `security/pentest-hardening` | 0 | 2 | ✅ (merge `90e5d1a`) | ❌ só local |

**Conclusão:** nenhuma branch tem trabalho pendente — todas já estão integradas. Não há merge de branch a fazer; são apenas resíduos.

### 1.2 Trabalho NÃO commitado na `main` (o que realmente falta integrar)

**Modificados (12):** `.gitignore`, `docs/PROJECT_DOCS.md`, `CustomerMenu/Index.jsx`, `CheckoutSummaryCard.jsx`, `CatalogList.jsx`, `Floor/.../CheckoutModal.jsx`, `POS/Index.jsx`, `POS/PaymentModal.jsx`, `i18n/{pt-BR,en-US,es-ES}.json`, `test/setupTests.js`.

**Novos (15):** `Components/LoadingButton.jsx`, `Components/Skeleton.jsx`, `test/LoadingButton.test.jsx`, `DOCUMENTACAO_PRODUTO_E_LANDING_PAGE.md`, `waiter_app/lib/core/widgets/{app_button,shimmer_loading}.dart`, e 9 telas em `waiter_app/lib/features/{auth,menu,order}/screens/`.

> [!IMPORTANT]
> **Achado crítico:** o `.gitignore` antigo tinha a regra `screens/` (sem âncora), que ignorava **todas** as pastas `screens/` do projeto. Por isso as telas do `waiter_app` (login, mesas, comandas, pedido, carrinho…) **nunca foram versionadas** no GitHub. A alteração local ancora as regras na raiz (`/screens/`), o que corrige o problema. Esse commit é prioritário.

---

## 2. Decisões confirmadas (Socratic Gate)

| # | Pergunta | Decisão |
|---|---|---|
| 1 | Destino das 9 branches mescladas | Excluir **locais e remotas** |
| 2 | Integração das alterações locais | Branch `feature/` → validar → merge na `main` |
| 3 | Push para `origin/main` | Sim, **após** testes passarem |

---

## 3. Task Breakdown

### Fase A — Segurança / Backup (orchestrator)
- [ ] **A1.** `git fetch --all --prune` e reconfirmar `0` commits à frente em cada branch (`git rev-list --count main..<branch>`).
- [ ] **A2.** Criar tag de segurança: `git tag backup/pre-sync-2026-11-14 main`.
- [ ] **A3.** Registrar SHAs de cada branch neste arquivo (rollback rápido via `git branch <nome> <sha>`).

| Branch | SHA |
|---|---|
| docs/atualizacao-readme | 7281840 |
| feature/gestao-equipe | 9d9a7bc |
| feature/kds-e-recibos | 86e9b3b |
| refactor/remover-usuarios-legado | 86e9b3b |
| feature/kds-upgrade-e-recibo | 450237c |
| feature/recibo-saas | 450237c |
| feature/recibo-saas-kds-alert | a70dc8c |
| feature/kds-reprint-live-preview | b15f7c9 |
| security/pentest-hardening | b1f0e13 |

**Verificação:** tag existe; todas as contagens = 0.

### Fase B — Integrar alterações locais (frontend-specialist + mobile-developer)
- [ ] **B1.** `git switch -c feature/loading-states-e-waiter-screens` (leva o working tree junto).
- [ ] **B2.** Revisar `DOCUMENTACAO_PRODUTO_E_LANDING_PAGE.md` — decidir se fica na raiz, vai para `docs/` ou entra no `.gitignore`.
- [ ] **B3.** Checar i18n: chaves novas presentes e sincronizadas nos 3 JSONs; sem strings hardcoded em `LoadingButton`/`Skeleton`.
- [ ] **B4.** Normalizar fim de linha (avisos CRLF→LF) — confirmar `.gitattributes`.
- [ ] **B5.** Commits atômicos (Conventional Commits):
  1. `fix(gitignore): anchor ignore rules to repo root` — `.gitignore`
  2. `feat(waiter-app): track screens and shared widgets` — `waiter_app/**`
  3. `feat(ui): add LoadingButton and Skeleton components with tests` — componentes + teste + `setupTests.js`
  4. `refactor(checkout): apply loading states in POS, Floor and CustomerMenu` — páginas + i18n
  5. `docs: update project docs` — `docs/PROJECT_DOCS.md` (+ doc de produto, se mantido)

**Verificação:** `git status` limpo na branch nova.

### Fase C — Validação (code-reviewer)
- [ ] **C1.** `npm run test:ui` (Vitest) — 100% verde, incluindo `LoadingButton.test.jsx`.
- [ ] **C2.** `npm run build` (Vite) — sem erros.
- [ ] **C3.** `php artisan test` — sem regressões no backend.
- [ ] **C4.** `cd waiter_app && flutter analyze` — sem erros nas telas recém-versionadas.
- [ ] **C5.** Revisão do diff pelo `code-reviewer` (sem CRITICAL/HIGH).

**Gate:** qualquer falha → corrigir na branch antes de seguir.

### Fase D — Merge e Push (orchestrator)
- [ ] **D1.** `git switch main` → `git merge --no-ff feature/loading-states-e-waiter-screens`.
- [ ] **D2.** Rodar novamente `npm run test:ui` na `main` (sanity check).
- [ ] **D3.** `git push origin main`.

**Verificação:** `git rev-list --left-right --count main...origin/main` = `0 0`.

### Fase E — Limpeza de branches (orchestrator)
- [ ] **E1.** Local: `git branch -d <branch>` para as 9 branches + a `feature/loading-states-e-waiter-screens` (`-d` recusa se não mesclada → proteção extra).
- [ ] **E2.** Remoto: `git push origin --delete` para as 8 branches remotas (+ a feature, se publicada).
- [ ] **E3.** `git fetch --prune` e `git branch -a` → deve listar só `main` e `origin/main`.
- [ ] **E4.** (Opcional) remover a tag de backup após alguns dias, ou mantê-la.

> [!CAUTION]
> A exclusão remota é irreversível no GitHub, mas todos os commits continuam na `main` e os SHAs estão na tabela A3 + tag de backup — rollback garantido.

---

## 4. Riscos

| Risco | Mitigação |
|---|---|
| Telas do waiter_app com segredos/URLs locais | Revisar `api_constants` / telas antes do commit B5-2 |
| `.gitignore` corrigido passa a expor outras pastas `screens/`/`scratch/` antes ignoradas | Rodar `git status --ignored` e conferir o que entra |
| Testes falharem por mudanças no `setupTests.js` | Gate da Fase C bloqueia o merge |
| Exclusão de branch errada | `git branch -d` (não `-D`) + tag + tabela de SHAs |

---

## Phase X — Checklist Final
- [ ] Tag `backup/pre-sync-2026-11-14` criada
- [ ] Alterações locais commitadas em branch e mescladas na `main`
- [ ] Vitest, Vite build, PHPUnit e `flutter analyze` verdes
- [ ] `main` == `origin/main`
- [ ] `git branch -a` mostra apenas `main` / `origin/main`
- [ ] `git status` limpo
