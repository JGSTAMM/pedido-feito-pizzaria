> 🔒 **Localização e sugestão de correção disponíveis no PROguard.** Este relatório FREE mostra o que foi encontrado, não onde nem como corrigir.

# Relatório de Segurança — JGSTAMM/pedido-feito-pizzaria

**Scan:** `cmt5n3clz00gvwtz1pvux1h4j` · MANUAL · branch `main` · commit `4208eb668a94`
**Status:** COMPLETED · **Executado em:** 2026-08-23T10:03:39.309Z · **Concluído em:** 2026-08-23T10:08:43.225Z
**Relatório gerado em:** 2026-08-23T10:28:50.537Z por GitGuard

## Instruções para a IA que for corrigir isto

- Repositório alvo: JGSTAMM/pedido-feito-pizzaria, branch "main", commit 4208eb668a9456a2fc3f64712a2e74182cd77930. Aplique as correções diretamente nesse checkout.
- Em "dependencyUpgrades", cada entrada agrupa TODOS os CVEs de um mesmo pacote — faça UM upgrade por pacote (para "recommendedVersion" ou mais recente), não uma correção por CVE.
- Em "secrets", nunca tente adivinhar ou reconstruir o valor original do segredo (ele foi propositalmente redigido) — apenas remova/rotacione conforme "remediation".
- Depois de aplicar as correções, rode os testes existentes do projeto e, se disponível, o linter/build antes de considerar concluído.

## Resumo

- **Total de findings:** 32
- **Por severidade:** HIGH: 7 · MEDIUM: 24 · LOW: 1
- **Por scanner:** GITLEAKS: 1 · TRIVY: 29 · SYFT: 2

## Dependências para atualizar

### 📦 `filament/forms` (1 CVE) — severidade máxima: HIGH

**Ação recomendada:** atualizar de `v3.3.50` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| HIGH | CVE-2026-55409 | Filament: Disabled RichEditor field state can be used for XSS | — |

### 📦 `symfony/mailer` (1 CVE) — severidade máxima: HIGH

**Ação recomendada:** atualizar de `v7.4.8` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| HIGH | CVE-2026-45068 | Symfony is a PHP framework for web and console applications and a set  ... | — |

### 📦 `symfony/mime` (2 CVEs) — severidade máxima: HIGH

**Ação recomendada:** atualizar de `v7.4.9` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| HIGH | CVE-2026-45067 | ### Description  `Symfony\Component\Mime\Address` is the value-object  ... | — |
| MEDIUM | CVE-2026-45070 | Symfony is a PHP framework for web and console applications and a set  ... | — |

### 📦 `laravel/framework` (2 CVEs) — severidade máxima: HIGH

**Ação recomendada:** atualizar de `v12.58.0` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| HIGH | — | Laravel Framework: CRLF injection in default email rule  | — |
| MEDIUM | — | Laravel Framework: Temporary Signed URL Path Confusion | — |

### 📦 `symfony/http-foundation` (1 CVE) — severidade máxima: HIGH

**Ação recomendada:** atualizar de `v7.4.8` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| HIGH | CVE-2026-48736 | Symfony is a PHP framework for web and console applications and a set  ... | — |

### 📦 `symfony/http-kernel` (1 CVE) — severidade máxima: HIGH

**Ação recomendada:** atualizar de `v7.4.10` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| HIGH | CVE-2026-45075 | Symfony is a PHP framework for web and console applications and a set  ... | — |

### 📦 `guzzlehttp/guzzle` (7 CVEs) — severidade máxima: MEDIUM

**Ação recomendada:** atualizar de `7.10.0` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| MEDIUM | — | Guzzle: Host-only cookie scope is not preserved | — |
| MEDIUM | CVE-2026-55568 | Guzzle is an extensible PHP HTTP client. Prior to 7.12.1, in certain c ... | — |
| MEDIUM | CVE-2026-55767 | Guzzle is an extensible PHP HTTP client. Prior to 7.12.1, CookieJar in ... | — |
| MEDIUM | CVE-2026-59883 | Guzzle is an extensible PHP HTTP client. Prior to 7.12.3, CookieJar di ... | — |
| MEDIUM | — | Guzzle: Proxy-Authorization headers can be sent to origin servers | — |
| MEDIUM | — | Guzzle: Unbounded response cookies risk denial of service | — |
| MEDIUM | — | Guzzle: URI fragments disclosed in redirect Referer headers | — |

### 📦 `guzzlehttp/psr7` (4 CVEs) — severidade máxima: MEDIUM

**Ação recomendada:** atualizar de `2.9.0` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| MEDIUM | CVE-2026-49214 | guzzlehttp/psr7 is a PSR-7 HTTP message library implementation in PHP. ... | — |
| MEDIUM | CVE-2026-55766 | guzzlehttp/psr7 is a PSR-7 HTTP message library implementation in PHP. ... | — |
| MEDIUM | CVE-2026-59882 | guzzlehttp/psr7 is a PSR-7 HTTP message library implementation in PHP. ... | — |
| MEDIUM | CVE-2026-48998 | guzzlehttp/psr7: guzzlehttp/psr7: Information disclosure via improper Host header validation | — |

### 📦 `symfony/html-sanitizer` (5 CVEs) — severidade máxima: MEDIUM

**Ação recomendada:** atualizar de `v7.4.8` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| MEDIUM | CVE-2026-45064 | Symfony is a PHP framework for web and console applications and a set  ... | — |
| MEDIUM | CVE-2026-45066 | Symfony is a PHP framework for web and console applications and a set  ... | — |
| MEDIUM | CVE-2026-45753 | Symfony is a PHP framework for web and console applications and a set  ... | — |
| MEDIUM | CVE-2026-48760 | Symfony is a PHP framework for web and console applications and a set  ... | — |
| MEDIUM | CVE-2026-48761 | Symfony is a PHP framework for web and console applications and a set  ... | — |

### 📦 `symfony/routing` (2 CVEs) — severidade máxima: MEDIUM

**Ação recomendada:** atualizar de `v7.4.9` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| MEDIUM | CVE-2026-45065 | Symfony is a PHP framework for web and console applications and a set  ... | — |
| MEDIUM | CVE-2026-48784 | Symfony is a PHP framework for web and console applications and a set  ... | — |

### 📦 `filament/filament` (1 CVE) — severidade máxima: MEDIUM

**Ação recomendada:** atualizar de `v3.3.50` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| MEDIUM | CVE-2026-48500 | Filament: Unauthenticated temporary file upload on auth pages | — |

### 📦 `filament/tables` (1 CVE) — severidade máxima: MEDIUM

**Ação recomendada:** atualizar de `v3.3.50` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| MEDIUM | CVE-2026-48067 | Filament has inconsistent scope enforcement for its AttachAction and AssociateAction Select fields | — |

### 📦 `symfony/polyfill-intl-idn` (1 CVE) — severidade máxima: LOW

**Ação recomendada:** atualizar de `v1.37.0` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| LOW | CVE-2026-46644 | Symfony Polyfill backports PHP features and provides compatibility lay ... | — |

## Segredos expostos

### 🔑 ? — Secret detected: Detected a Generic API Key, potentially exposing access to various services and sensitive operations. (HIGH)

Regra: `generic-api-key`

**Remediação:** Remova o valor do código-fonte e mova para uma variável de ambiente / secret manager. Se for uma credencial real (não um placeholder de exemplo), revogue-a imediatamente — ela já está exposta no histórico do Git mesmo após removida do arquivo atual.

## Outros findings

| Severidade | Scanner | Categoria | Título | Local |
|---|---|---|---|---|
| MEDIUM | SYFT | LICENSE | Restrictive license: GPL-2.0-only in nette/schema | — |
| MEDIUM | SYFT | LICENSE | Restrictive license: GPL-2.0-only in nette/utils | — |
