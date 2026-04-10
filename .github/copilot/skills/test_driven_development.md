# Test Driven Development

## Objetivo
Garantir evolucao segura e previsivel no Laravel 11 com TDD rigoroso, priorizando regras de dominio criticas.

## Escopo Obrigatorio
- Framework alvo: Laravel 11.
- Estrategia de teste: TDD estrito (Red -> Green -> Refactor).
- Ferramentas aceitas: Pest ou PHPUnit.
- Regra principal: nenhum codigo de implementacao entra antes de um teste falhando que defina o comportamento esperado.

## Regras de Execucao
- Todo requisito funcional deve iniciar por teste automatizado.
- O primeiro teste deve falhar por motivo funcional real (nao por erro de setup).
- A implementacao minima deve ser feita apenas para passar no teste atual.
- Refatoracao deve ocorrer com suite verde e sem alterar comportamento observado.
- Regras de dominio nao podem ser validadas so por teste de interface; devem ter testes de unidade e, quando aplicavel, integracao.

## Foco de Dominio Obrigatorio
- Precificacao Hibrida:
  - Cobrir regra de maior sabor, regra especial de Broto e cenarios limite.
  - Cobrir entradas invalidas e comportamentos de fallback definidos.
- Box Lock de Caixa:
  - Cobrir bloqueio com caixa fechado.
  - Cobrir bloqueio de fechamento com pedidos pendentes.
  - Cobrir fluxo permitido quando todas as condicoes de fechamento estiverem satisfeitas.

## Cobertura Minima
- Exigencia: 100 por cento de cobertura dos caminhos criticos de dominio.
- Caminhos criticos obrigatorios:
  - Precificacao Hibrida completa.
  - Politicas de Box Lock (abertura, criacao de pedido, fechamento).
  - Fluxo de impressao assinado por evento apos commit para evitar regressao funcional em operacoes criticas.
- Cobertura abaixo do limite em caminho critico bloqueia merge.

## Qualidade de Testes
- Testes devem ser deterministicos, sem dependencia de ordem de execucao.
- Cada teste deve validar um comportamento de negocio claro.
- Nomes de testes devem descrever regra e resultado esperado.
- Fixtures e factories devem ser simples, legiveis e orientadas a intencao.
- Mock deve ser usado apenas quando isolamento for necessario para regra de negocio.

## Integracao com Clean Code e i18n
- Este padrao complementa clean_code_standards.md garantindo que regras centrais em dominio/aplicacao sejam protegidas por testes desde o inicio.
- Este padrao complementa i18n_requirements.md exigindo testes para mensagens e erros criticos baseados em chave de traducao, nunca texto hardcoded.

## Definicao de Pronto
Uma entrega so esta pronta quando:
- Existe teste falhando inicial (Red) antes da implementacao.
- Todos os testes novos e antigos estao verdes.
- Caminhos criticos mantem cobertura de 100 por cento.
- Nao ha regressao nas regras de Precificacao Hibrida e Box Lock.
