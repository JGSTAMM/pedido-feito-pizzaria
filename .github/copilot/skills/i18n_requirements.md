# i18n Requirements

## Objetivo
Garantir internacionalização consistente no ecossistema Web e API do Pedido Feito 2.0, com suporte obrigatório a pt-BR e en-US.

## 1) Locales Suportados
- Locale primário: pt-BR.
- Locale secundário obrigatório: en-US.
- Fallback oficial: en-US quando chave não existir no locale ativo.

## 2) Regra de Ouro
- Nenhum texto de interface pode ser hardcoded em componentes React, Controllers, Responses de API ou mensagens de validação customizadas.
- Todo texto exibido ao usuário deve vir de chave de tradução.

## 3) Escopo de Tradução Obrigatória
- Navegação, títulos, labels, placeholders, botões, toasts e mensagens de estado.
- Mensagens de erro e sucesso retornadas por backend para UI.
- Mensagens de bloqueio operacional, incluindo regras de caixa e validações de fluxo.

## 4) Convenção de Chaves
- Padrão: lowercase com separação por ponto e contexto de domínio.
- Formato recomendado: dominio.modulo.componente.acao
- Exemplos:
  - order.lock.cash_register_closed
  - cash_register.close.blocked_pending_orders
  - ui.catalog.empty.title

## 5) Organização de Arquivos
- Frontend React:
  - resources/js/i18n/pt-BR.json
  - resources/js/i18n/en-US.json
- Backend Laravel:
  - lang/pt_BR
  - lang/en_US
- Chaves de negócio compartilhadas entre API e Web devem manter semântica idêntica.

## 6) Boas Práticas de Texto
- Evitar concatenação manual de frases.
- Usar placeholders nomeados para valores dinâmicos.
- Garantir pluralização correta quando houver contagem.
- Datas, moedas e números devem usar formatação por locale.

## 7) White Label e i18n
- Nome de marca e variações por tenant não devem ser hardcoded.
- Identidade textual por tenant deve vir de configuração e também ser localizável quando aplicável.
- Mensagens operacionais devem ser neutras e reutilizáveis entre marcas.

## 8) Critérios de Revisão
- Toda nova tela ou endpoint deve ser auditado para strings hardcoded.
- PR só pode ser aprovado se as chaves novas existirem em pt-BR e en-US.
- Mudança de copy exige atualização sincronizada dos dois dicionários.

## 9) Critérios de Teste
- Testes de integração devem validar presença de mensagens por chave em respostas relevantes.
- Testes de frontend devem validar rendering via t(chave), nunca texto literal fixo.
- Fluxos críticos devem cobrir fallback quando tradução estiver ausente.

## 10) Definição de Pronto
Uma entrega internacionalizada está pronta quando:
- Não há string hardcoded visível ao usuário.
- Todas as chaves novas existem em pt-BR e en-US.
- Placeholders e pluralização estão corretos.
- Erros e mensagens de sucesso do backend também estão localizados.
