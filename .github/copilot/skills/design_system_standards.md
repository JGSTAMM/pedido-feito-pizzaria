# Design System Standards

## Objetivo
Definir o padrao arquitetural de CSS para a Trilha 1 (UI/UX White Label), com foco em escalabilidade, consistencia visual e troca de tema por tenant sem reescrever componentes.

## Alinhamento com Governanca Existente
- Complementa clean_code_standards.md: UI orientada a tokens globais e CSS modular desacoplado de framework utilitario.
- Complementa i18n_requirements.md: identidade visual por tenant deve ser configuravel, sem texto de marca hardcoded em componentes.

## 1) Hierarquia Oficial de Design Tokens

### 1.1 Cores
Hierarquia semantica e obrigatoria:
- Core:
  - `--pf-color-primary-*`
  - `--pf-color-secondary-*`
  - `--pf-color-neutral-*`
- Feedback:
  - `--pf-color-feedback-success-*`
  - `--pf-color-feedback-warning-*`
  - `--pf-color-feedback-error-*`
  - `--pf-color-feedback-info-*`
- Surface e texto:
  - `--pf-color-surface-*`
  - `--pf-color-text-*`
  - `--pf-color-border-*`

Escala recomendada para familias de cor:
- `50, 100, 200, 300, 400, 500, 600, 700, 800, 900`

Exemplo:
- `--pf-color-primary-500`: cor principal de acao.
- `--pf-color-feedback-error-600`: erro em destaque.

### 1.2 Tipografia
Tokens obrigatorios:
- Familia:
  - `--pf-font-family-base`
  - `--pf-font-family-heading`
  - `--pf-font-family-mono`
- Escala de tamanho:
  - `--pf-font-size-xs`
  - `--pf-font-size-sm`
  - `--pf-font-size-md`
  - `--pf-font-size-lg`
  - `--pf-font-size-xl`
  - `--pf-font-size-2xl`
  - `--pf-font-size-3xl`
- Peso:
  - `--pf-font-weight-regular`
  - `--pf-font-weight-medium`
  - `--pf-font-weight-semibold`
  - `--pf-font-weight-bold`
- Altura de linha:
  - `--pf-line-height-tight`
  - `--pf-line-height-normal`
  - `--pf-line-height-relaxed`

### 1.3 Espacamentos e Grid
Escala base de espacamento:
- `--pf-space-0`, `--pf-space-1`, `--pf-space-2`, `--pf-space-3`, `--pf-space-4`, `--pf-space-5`, `--pf-space-6`, `--pf-space-8`, `--pf-space-10`, `--pf-space-12`, `--pf-space-16`, `--pf-space-20`, `--pf-space-24`

Grid/layout:
- `--pf-grid-columns`: numero de colunas padrao.
- `--pf-grid-gutter`: espacamento horizontal entre colunas.
- `--pf-grid-margin-inline`: margem lateral de layout.
- `--pf-container-max-width`: largura maxima para conteudo central.

### 1.4 Border Radius
Escala obrigatoria:
- `--pf-radius-none`
- `--pf-radius-sm`
- `--pf-radius-md`
- `--pf-radius-lg`
- `--pf-radius-xl`
- `--pf-radius-pill`

## 2) Convencao de Nomenclatura (CSS Modular)
Padrao unico e obrigatorio: kebab-case.

### 2.1 Classes CSS Modules
- Usar classes em kebab-case.
- Exemplo: `.order-card`, `.checkout-summary`, `.payment-status-badge`.

### 2.2 Custom Properties
- Prefixo global obrigatorio: `--pf-`.
- Estrutura: `--pf-{categoria}-{subcategoria}-{token}`.
- Exemplo: `--pf-color-primary-500`, `--pf-space-4`, `--pf-radius-md`.

### 2.3 Estados e Variantes
- Estado com sufixo semantico em kebab-case.
- Exemplo: `.button-primary`, `.button-primary-disabled`, `.input-error`.

### 2.4 Regras proibidas
- Nomes opacos (ex: `.box1`, `.x2`).
- Mistura de camelCase e kebab-case em classes.
- Variavel CSS sem prefixo `--pf-`.

## 3) Organizacao de Variaveis CSS para White Label por Tenant

### 3.1 Estrutura de arquivos recomendada
- `resources/css/tokens/base.css`: tokens default globais.
- `resources/css/tokens/semantic.css`: mapeamento semantico para componentes.
- `resources/css/themes/tenant-default.css`: override do tenant padrao.
- `resources/css/themes/tenant-<slug>.css`: override por tenant.
- `resources/css/components/*.module.css`: estilos modulares por componente.

### 3.2 Camadas de tokens
- Camada 1 (Core): valores puros (paleta, escala de espaco, tipografia, radius).
- Camada 2 (Semantic): papeis de UI (acao primaria, superficie, texto secundario, borda critica).
- Camada 3 (Component): uso local em modulo CSS consumindo apenas tokens semanticos.

### 3.3 Seletor de tenant
Tenant deve ser aplicado no root da aplicacao:
- `[data-tenant="default"]`
- `[data-tenant="lucchese"]`
- `[data-tenant="<slug>"]`

Exemplo de estrategia:
- `:root` define base.
- `[data-tenant="lucchese"]` sobrescreve apenas tokens necessarios (cor, fonte, raio, espacamento contextual).
- Componentes continuam inalterados.

### 3.4 Contrato minimo de theme por tenant
Cada tenant deve fornecer, no minimo:
- Cor primaria (`--pf-color-primary-500` e contraste relacionado).
- Cor secundaria (`--pf-color-secondary-500`).
- Cores de feedback (success, warning, error, info).
- Fontes base e heading.
- Radius base (`--pf-radius-md` e `--pf-radius-lg`).

## 4) Estrutura de Tokens (Blueprint Inicial)
```css
:root {
  /* Core colors */
  --pf-color-primary-500: #3b82f6;
  --pf-color-secondary-500: #14b8a6;
  --pf-color-feedback-success-600: #16a34a;
  --pf-color-feedback-warning-600: #d97706;
  --pf-color-feedback-error-600: #dc2626;
  --pf-color-feedback-info-600: #2563eb;

  /* Typography */
  --pf-font-family-base: "Work Sans", sans-serif;
  --pf-font-family-heading: "Sora", sans-serif;
  --pf-font-size-sm: 0.875rem;
  --pf-font-size-md: 1rem;
  --pf-font-size-lg: 1.125rem;
  --pf-line-height-normal: 1.5;

  /* Spacing */
  --pf-space-2: 0.5rem;
  --pf-space-4: 1rem;
  --pf-space-6: 1.5rem;
  --pf-grid-gutter: 1rem;
  --pf-container-max-width: 80rem;

  /* Radius */
  --pf-radius-sm: 0.375rem;
  --pf-radius-md: 0.5rem;
  --pf-radius-lg: 0.75rem;
}

[data-tenant="lucchese"] {
  --pf-color-primary-500: #b45309;
  --pf-color-secondary-500: #065f46;
  --pf-font-family-heading: "Playfair Display", serif;
  --pf-radius-md: 0.625rem;
}
```

## 5) Regras de Implementacao para o SeniorDeveloper
- Componente novo deve consumir apenas tokens semanticos ou core definidos aqui.
- Proibido valor hardcoded de cor, fonte, espaco e radius em `.module.css` quando token equivalente existir.
- Toda alteracao de tema deve acontecer em arquivo de tenant, nao em componente.
- Mudancas de token exigem validacao visual em pelo menos 1 tenant extra.

## 6) Qualidade e Testes Minimos
- Validar que troca de `data-tenant` altera tema sem quebrar layout.
- Validar contraste minimo para textos e feedback critico.
- Validar que componentes continuam funcionando sem customizacao (tenant default).

## 7) Definicao de Pronto
Uma entrega de UI White Label so esta pronta quando:
- Tokens seguem esta hierarquia e nomenclatura.
- CSS Modules seguem kebab-case de forma consistente.
- Tema por tenant pode ser trocado por custom properties sem editar componente.
- Nao existem hardcodes visuais que violem o contrato de tokens.
