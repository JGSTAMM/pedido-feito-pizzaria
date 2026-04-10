# Plano de Implementacao - Cardapio Digital

## 1. Objetivo
Implementar o cardapio digital completo com experiencia mobile-first, suporte a pt-BR/es-ES/en-US, alinhamento visual ao admin e fluxo de pedido online com pagamento Mercado Pago.

## 2. Base Atual do Projeto
- Frontend de cardapio e checkout ja existe em React/Inertia.
- Backend de pedido online, polling de status e webhook Mercado Pago ja existe.
- Tokens CSS e tema admin ja existem para reaproveitamento.

Arquivos de referencia:
- routes/web.php
- routes/api.php
- resources/js/Pages/CustomerMenu/CustomerMenu.jsx
- resources/js/Pages/CustomerMenu/Checkout.jsx
- resources/js/i18n/pt-BR.json
- resources/js/i18n/en-US.json
- app/Http/Controllers/Api/OnlinePaymentController.php
- app/Services/PaymentGatewayService.php
- resources/css/tokens/variables.css
- resources/css/filament/admin/theme.css

## 3. Fluxo Funcional (Produto)
1. Tela de Bem-vindo
- Selecao de idioma: pt-BR, es-ES, en-US.
- Persistencia da escolha e redirecionamento para inicio.

2. Tela de Inicio
- Exibir nome do restaurante (config admin).
- Exibir horario do dia conforme calendario.
- Exibir status: aberto/fechado.
- Botao para perfil da loja.
- Blocos/atalhos:
  - Monte sua pizza
  - Sabores mais pedidos
  - Abas por tipo: tradicionais, doces, especiais.
- Navbar inferior:
  - Inicio
  - Pedidos
  - Promocoes
  - Carrinho

3. Tela Monte sua Pizza
- Visualizacao pizza inteira com seletor circular (estilo 3D).
- Visualizacao meia pizza com seletor meia-lua.
- Regra de fracionamento:
  - Pizza grande (12 fatias): ate 3 sabores.
  - Meia pizza (6 fatias): 1 sabor.
- Ao clicar no sabor:
  - Foto do sabor
  - Ingredientes
  - Permitir adicionar/remover ingrediente.
- Todos os dados vindos do admin.

4. Identificacao do Cliente
- Nome completo
- Numero de celular

5. Tipo de Atendimento
- Comer no local: leitura de QR code da mesa.
- Entrega: endereco completo.
- Retirar no local.

6. Pagamento
- Integracao Mercado Pago (Pix e cartao), via backend existente.
- Preparar para uso por chave/token em variaveis de ambiente.

7. Status do Pedido e WhatsApp
- Tela de acompanhamento do status.
- Botao de confirmacao/contato no WhatsApp.

## 4. Regras de Arquitetura (Obrigatorias)
1. Regras de negocio em Application/Domain, nao em componentes de UI.
2. Controller fino: validar entrada, chamar Action/Service, responder.
3. Fonte unica de verdade para regras criticas (sem duplicacao).
4. Operacoes criticas com transacao.
5. Webhook com validacao de assinatura e protecao anti-replay.
6. Nenhum texto de interface hardcoded: usar i18n por chave.

## 5. i18n (Obrigatorio)
## Locales
- Primario: pt-BR
- Secundario obrigatorio: en-US
- Adicional requerido no fluxo: es-ES
- Fallback: en-US

## Politica
- Todo texto visivel ao usuario deve vir de chave de traducao.
- Mesma semantica de chave entre frontend e backend quando for mensagem de negocio.

## Novas chaves recomendadas
- digital_menu.welcome.title
- digital_menu.welcome.subtitle
- digital_menu.welcome.language.pt_br
- digital_menu.welcome.language.en_us
- digital_menu.welcome.language.es_es
- digital_menu.home.store_status.open
- digital_menu.home.store_status.closed
- digital_menu.home.cta.build_pizza
- digital_menu.home.tabs.traditional
- digital_menu.home.tabs.sweet
- digital_menu.home.tabs.special
- digital_menu.nav.home
- digital_menu.nav.orders
- digital_menu.nav.promotions
- digital_menu.nav.cart
- digital_menu.builder.max_flavors_reached
- digital_menu.builder.half_pizza_label
- digital_menu.builder.full_pizza_label
- digital_menu.builder.edit_ingredients
- digital_menu.checkout.fulfillment.dine_in
- digital_menu.checkout.fulfillment.delivery
- digital_menu.checkout.fulfillment.pickup
- digital_menu.checkout.table_qr.scan_cta
- digital_menu.checkout.table_qr.manual_code
- digital_menu.payment.mercadopago.title
- digital_menu.status.whatsapp_confirm

## 6. Design e UX
1. Mobile-first como padrao de layout e navegacao.
2. Desktop funcional com adaptacao de colunas e navegacao.
3. Alinhar identidade visual aos tokens do admin.
4. Reutilizar variaveis de design para white-label por tenant.
5. Touch targets minimos de 48x48 para elementos interativos.
6. Estado de loja (aberto/fechado) visivel no topo da Home.
7. Resumo de carrinho sempre acessivel durante checkout.

## 7. Estrutura Tecnica Recomendada
## Frontend (expandir modulo existente)
- resources/js/Pages/CustomerMenu/
  - WelcomeLanguage.jsx
  - Home.jsx
  - PizzaBuilder.jsx
  - Promotions.jsx
  - Orders.jsx
  - components/
    - navigation/BottomNav.jsx
    - store/StoreHeaderStatus.jsx
    - builder/PizzaCanvas3D.jsx
    - builder/FlavorSelector.jsx
    - builder/IngredientEditor.jsx
    - fulfillment/FulfillmentSelector.jsx
    - fulfillment/TableQrScanner.jsx
    - status/WhatsappConfirmButton.jsx

## Backend (reaproveitar e expandir)
- app/Http/Controllers/CustomerMenuController.php
- app/Http/Controllers/Api/OnlinePaymentController.php
- app/Services/PaymentGatewayService.php
- routes/web.php
- routes/api.php

## i18n
- resources/js/i18n/pt-BR.json
- resources/js/i18n/en-US.json
- resources/js/i18n/es-ES.json

## 8. Plano de Implementacao (Step-by-step)
1. Etapa 1 - Entrada e idioma
- Criar tela de boas-vindas com seletor de idioma.
- Persistir locale (localStorage/cookie).
- Garantir fallback en-US.
- Criar dicionario es-ES.

2. Etapa 2 - Home e navegacao
- Construir home com status da loja e horario dinamico.
- Implementar bottom nav: Inicio, Pedidos, Promocoes, Carrinho.
- Integrar secoes de mais pedidos e categorias.

3. Etapa 3 - Pizza Builder
- Implementar regras de sabores por tamanho.
- Criar visual circular/meia-lua com preview.
- Integrar sabores e ingredientes vindos do admin.

4. Etapa 4 - Checkout por tipo de atendimento
- Adicionar fluxo comer no local, entrega, retirada.
- Integrar leitura de QR code (com fallback manual de codigo da mesa).
- Validar campos obrigatorios por tipo.

5. Etapa 5 - Pagamento e status
- Reusar endpoint de online order existente.
- Preparar configuracao Mercado Pago por env.
- Exibir status em tempo real (polling) e CTA WhatsApp.

6. Etapa 6 - Responsividade, acessibilidade e qualidade
- Ajustes de desktop/tablet.
- Garantir foco visivel, labels e navegacao por teclado.
- Revisar desempenho e estados de erro/loading.

## 9. Testes Obrigatorios
## Frontend
- Selecao de idioma + fallback.
- Regra limite de sabores (inteira/meia).
- Edicao de ingredientes refletindo em carrinho.
- Fluxos de checkout por tipo de atendimento.
- Renderizacao de textos via i18n key (sem hardcode).

## Backend
- Criacao de pedido online com itens produto/pizza.
- Validacoes por tipo de atendimento.
- Integracao pagamento Pix/cartao (mockado quando necessario).
- Webhook: assinatura valida/invalida.
- Webhook: protecao contra replay.
- Polling de status pendente ate aprovado.

## E2E
- Fluxo completo: idioma -> home -> builder -> checkout -> pagamento -> status.
- Fluxo comer no local com mesa/QR.
- Fluxo entrega com endereco.
- Fluxo retirada no local.

## 10. Criterios de Pronto
1. Fluxo completo operando em mobile e desktop.
2. Sem string hardcoded visivel ao usuario.
3. Chaves novas presentes em pt-BR, en-US e es-ES.
4. Regras de negocio centralizadas no backend.
5. Mercado Pago configuravel por ambiente e webhook seguro.
6. Testes criticos passando (unitario, integracao e E2E).
