# Git Workflow Automation

## Objetivo
Padronizar o fluxo de colaboracao para manter historico limpo, revisao rapida e release previsivel.

## Convencao Obrigatoria de Commits
- Todo commit deve seguir Conventional Commits.
- Prefixos obrigatorios por tipo de mudanca:
  - feat: nova funcionalidade.
  - fix: correcao de bug.
  - chore: manutencao sem impacto funcional direto.
  - refactor: melhoria estrutural sem mudar comportamento externo.
  - test: adicao ou ajuste de testes.
  - docs: documentacao.
- Estrutura recomendada da mensagem:
  - tipo(escopo): resumo curto no imperativo
- Exemplos validos:
  - feat(pricing): centralize hybrid pizza price calculation
  - fix(cash-register): block close when pending orders exist
  - test(printing): cover after-commit dispatch behavior

## Estrategia Obrigatoria de Branches
- Branch principal protegida: main.
- Toda entrega deve nascer de branch dedicada.
- Prefixos obrigatorios:
  - feature/ para novas funcionalidades.
  - hotfix/ para correcoes urgentes de producao.
  - chore/ para manutencao tecnica planejada.
- Padrao de nome recomendado:
  - feature/nome-curto-da-entrega
  - hotfix/descricao-curta-incidente

## Regras de Integracao
- Merge direto em main e proibido.
- Integracao ocorre via Pull Request com revisao obrigatoria.
- PR deve conter:
  - descricao de contexto e impacto.
  - evidencias de teste automatizado.
  - checklist de risco e rollback quando aplicavel.
- Commits devem ser pequenos, atomicos e semanticamente coerentes.

## Gate de Qualidade
- Nao aprovar PR com testes falhando.
- Nao aprovar PR com cobertura critica abaixo do minimo definido em test_driven_development.md.
- Nao aprovar PR com violacao de clean_code_standards.md ou i18n_requirements.md.

## Integracao com Clean Code e i18n
- Este fluxo reforca clean_code_standards.md ao exigir historico rastreavel para refatoracoes e regras de dominio.
- Este fluxo reforca i18n_requirements.md ao exigir PR com validacao de chaves de traducao em pt-BR e en-US quando houver alteracao de texto visivel ao usuario.

## Definicao de Pronto
Uma mudanca so pode ser considerada pronta quando:
- Foi desenvolvida em branch adequada (feature/ ou hotfix/ quando aplicavel).
- Possui commits no padrao Conventional Commits.
- Passou por PR com validacao tecnica e testes verdes.
- Atende aos requisitos de Clean Code, i18n e TDD do projeto.
