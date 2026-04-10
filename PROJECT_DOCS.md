# 📖 Pedido-Feito 2.0 — Documentação Técnica Completa

> **Versão:** 2.0 (Edição Lucchese)
> **Última atualização:** Março/2026
> **Autor:** João Gabriel — Pixirica Produções
> **Status:** Sistema estável em produção/desenvolvimento ativo

---

## Índice

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Estrutura de Diretórios](#4-estrutura-de-diretórios)
5. [Modelagem do Banco de Dados](#5-modelagem-do-banco-de-dados)
6. [Regras de Negócio Críticas](#6-regras-de-negócio-críticas)
7. [Fluxo de Status dos Pedidos](#7-fluxo-de-status-dos-pedidos)
8. [API — Referência Completa](#8-api--referência-completa)
9. [Painel Administrativo (Filament)](#9-painel-administrativo-filament)
10. [App Garçom (Flutter)](#10-app-garçom-flutter)
11. [Cardápio Digital](#11-cardápio-digital)
12. [Integração de Pagamento (Mercado Pago)](#12-integração-de-pagamento-mercado-pago)
13. [Impressão Térmica (ESC/POS)](#13-impressão-térmica-escpos)
14. [Histórico de Versões e Evoluções](#14-histórico-de-versões-e-evoluções)
15. [Dívidas Técnicas e Issues Conhecidas](#15-dívidas-técnicas-e-issues-conhecidas)
16. [Backlog e Roadmap](#16-backlog-e-roadmap)
17. [Guia de Setup Local](#17-guia-de-setup-local)

---

## 1. Visão Geral do Produto

**Pedido-Feito 2.0** é um sistema de gestão operacional ponta-a-ponta desenvolvido especificamente para a **Pizzaria Sr. & Sra. Lucchese**. O sistema substitui fluxos manuais de comanda por uma stack digital integrada, cobrindo desde o pedido na mesa até o fechamento de caixa auditado.

### Módulos do Sistema

| Módulo | Interface | Usuário |
|---|---|---|
| **PDV (Ponto de Venda)** | Web (Filament/Livewire) | Caixa/Gerente |
| **KDS (Kitchen Display System)** | Web (Filament/Livewire) | Cozinha |
| **Mapa do Salão** | Web (Filament/Livewire) | Caixa/Garçom |
| **Controle de Caixa** | Web (Filament/Livewire) | Gerente |
| **Relatórios** | Web (Filament/Livewire) | Gerente |
| **App do Garçom** | Flutter (Web/Mobile) | Garçom |
| **Cardápio Digital** | Flutter (Web) | Cliente |
| **Painel de Config** | Web (Filament) | Admin |

---

## 2. Stack Tecnológica

### Backend

| Componente | Versão / Tecnologia |
|---|---|
| **PHP** | 8.5 (mínimo ^8.2) |
| **Laravel** | 12.x |
| **Filament** | 3.2.x (painel admin + Livewire) |
| **Banco de Dados** | MySQL 8 (`lucchese_pizza`) |
| **Autenticação API** | Laravel Sanctum 4.2 (tokens Bearer) |
| **Impressão Térmica** | `mike42/escpos-php` ^4.0 (ESC/POS via TCP/IP) |
| **Pagamento Online** | `mercadopago/dx-php` ^3.8 |
| **Build Frontend** | Vite |
| **Locale** | `pt_BR` |

### App Flutter

| Componente | Versão / Tecnologia |
|---|---|
| **Flutter / Dart SDK** | ^3.10.3 |
| **State (Garçom)** | `provider` ^6.1.1 (ChangeNotifier) |
| **State (Digital Menu)** | `flutter_riverpod` ^3.2.1 (Notifier) |
| **Roteamento** | `go_router` ^17.1.0 |
| **HTTP Client** | `dio` ^5.4.0 |
| **Armazenamento Seguro** | `flutter_secure_storage` ^9.0.0 |
| **Outros** | `google_fonts`, `intl`, `equatable`, `url_launcher` |

---

## 3. Arquitetura do Sistema

O sistema é dividido em **3 camadas** que se comunicam de forma assíncrona:

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA 1 — ADMIN WEB                      │
│  Laravel 12 + Filament 3 + Livewire                         │
│  PDV · KDS · Mapa do Salão · Caixa · Relatórios            │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / Livewire Events
┌──────────────────────────▼──────────────────────────────────┐
│                    CAMADA 2 — API REST                       │
│  Laravel Sanctum · JsonResource · Services                  │
│  /api/sync · /api/orders · /api/digital-menu               │
└──────────┬───────────────────────────────────┬──────────────┘
           │                                   │
┌──────────▼───────────┐         ┌─────────────▼──────────────┐
│  APP GARÇOM          │         │  CARDÁPIO DIGITAL           │
│  Flutter (Riverpod   │         │  Flutter (Riverpod)         │
│  + Provider)         │         │  Web — cliente final        │
│  Port :8001          │         │  Port :8002 (planejado)     │
└──────────────────────┘         └────────────────────────────┘
```

### Padrão de Arquitetura

- **Backend:** MVC com Services Layer — `app/Services/` para lógica de negócio isolada
- **Frontend Flutter:** Feature-based — cada feature = `data/` + `domain/` + `presentation/`
- **Admin Web:** Padrão Filament (Resources + Pages + Widgets)

---

## 4. Estrutura de Diretórios

```
Pedido-Feito 2.0/
├── app/
│   ├── Filament/
│   │   ├── Pages/
│   │   │   ├── Pos.php                 # PDV (caixa, ~812 linhas)
│   │   │   ├── KDS.php                 # Kitchen Display System
│   │   │   ├── Floor.php               # Mapa do Salão interativo
│   │   │   ├── CashRegisterPage.php    # Controle de Caixa
│   │   │   ├── PrinterSettings.php     # Config de impressoras via DB
│   │   │   ├── Reports.php             # Relatórios de vendas
│   │   │   └── SalesHistory.php        # Histórico de vendas
│   │   ├── Resources/                  # CRUD Filament
│   │   │   ├── OrderResource.php
│   │   │   ├── ProductResource.php
│   │   │   ├── PizzaFlavorResource.php
│   │   │   ├── PizzaSizeResource.php
│   │   │   ├── TableResource.php
│   │   │   └── NeighborhoodResource.php
│   │   └── Widgets/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── AuthController.php           # Login Sanctum
│   │   │   ├── DataController.php           # GET /sync (catálogo completo)
│   │   │   ├── OrderController.php          # CRUD pedidos (garçom)
│   │   │   ├── DigitalMenuController.php    # Cardápio digital público
│   │   │   └── OnlinePaymentController.php  # PIX/Cartão + Webhook MP
│   │   └── Resources/                       # JsonResource (API responses)
│   │       ├── ProductResource.php
│   │       ├── PizzaFlavorResource.php
│   │       ├── PizzaSizeResource.php
│   │       └── NeighborhoodResource.php
│   ├── Models/                         # 12 Eloquent Models
│   │   ├── Order.php
│   │   ├── OrderItem.php
│   │   ├── Product.php
│   │   ├── Payment.php
│   │   ├── Table.php
│   │   ├── PizzaFlavor.php
│   │   ├── PizzaSize.php
│   │   ├── CashRegister.php
│   │   ├── FloorElement.php
│   │   ├── Neighborhood.php
│   │   ├── PrinterSetting.php
│   │   └── User.php
│   └── Services/
│       ├── PizzaPriceService.php         # Cálculo de preço (regra broto/grande)
│       ├── PrintService.php              # Impressão ESC/POS via rede TCP
│       └── PaymentGatewayService.php     # Integração Mercado Pago
├── database/
│   ├── migrations/                       # 23 migrations
│   └── seeders/
│       └── DatabaseSeeder.php            # 2 users, 2 tamanhos, 49 sabores, 15 produtos, 10 mesas, 48 bairros
├── routes/
│   ├── api.php                           # Rotas da API REST
│   └── web.php                           # Rotas web / Filament
├── waiter_app/                           # Flutter App (garçom + digital menu)
│   ├── lib/
│   │   ├── core/
│   │   │   ├── constants/api_constants.dart  # Base URL (Web/Android)
│   │   │   ├── services/api_service.dart     # Dio + interceptor Sanctum
│   │   │   └── widgets/
│   │   ├── features/
│   │   │   ├── auth/         # Login garçom
│   │   │   ├── menu/         # Sync de catálogo (mesas, produtos, sabores)
│   │   │   ├── order/        # Carrinho do garçom
│   │   │   ├── cart/         # Carrinho digital menu (Riverpod)
│   │   │   ├── pizza_builder/# Montador de pizza (Riverpod)
│   │   │   └── digital_menu/ # Cardápio para o cliente
│   │   ├── main.dart         # Entry point digital menu (GoRouter + ProviderScope)
│   │   └── main_waiter.dart  # Entry point garçom
│   └── pubspec.yaml
├── PROJECT_DOCS.md            # ← Este arquivo
├── PROJECT_STATUS.md
├── BACKLOG.md
├── gemini_context.md
└── composer.json
```

---

## 5. Modelagem do Banco de Dados

### Diagrama de Relacionamentos

```
User (1) ──── (N) Order
User (1) ──── (N) CashRegister

Table (1) ──── (N) Order

Neighborhood (1) ──── (N) Order

Order (1) ──── (N) OrderItem
Order (1) ──── (N) Payment

OrderItem (N) ──── (1) Product       [nullable — produto avulso]
OrderItem (N) ──── (1) PizzaSize     [nullable — pizza]
OrderItem (N) ──── (N) PizzaFlavor   [pivot: order_item_flavors, campo 'fraction']

CashRegister (1) ──── (N) Order      [via cash_register_id]
```

### Detalhamento dos Models

#### `Order`

| Campo | Tipo | Descrição |
|---|---|---|
| `table_id` | FK nullable | Mesa do pedido |
| `user_id` | FK | Garçom/operador |
| `status` | enum | Ver lista de status abaixo |
| `type` | enum | `salon` / `delivery` |
| `customer_name` | string | Nome do cliente (delivery/online) |
| `customer_phone` | string | Telefone |
| `total_amount` | decimal:2 | Total do pedido |
| `delivery_address` | string | Endereço de entrega |
| `neighborhood_id` | FK nullable | Bairro (taxa automática) |
| `delivery_fee` | decimal:2 | Taxa de entrega |
| `change_amount` | decimal:2 | Troco |
| `cash_register_id` | FK nullable | Caixa vinculado |
| `paid_at` | datetime | Marcado ao pagar |
| `ready_at` | datetime | Marcado pelo KDS quando pronto |
| `payment_gateway_id` | string | ID do gateway (MP) |
| `online_payment_status` | string | Status no gateway |
| `pix_qr_code` | text | QR Code PIX (base64) |
| `accepted_at` | datetime | Aceite do pedido online |
| `rejected_at` | datetime | Rejeição |
| `rejection_reason` | string | Motivo da rejeição |

**Statuses válidos:** `awaiting_payment` · `paid_online` · `accepted` · `rejected` · `pending` · `preparing` · `ready` · `delivered` · `paid` · `completed`

#### `OrderItem`

| Campo | Tipo | Descrição |
|---|---|---|
| `order_id` | FK | Pedido pai |
| `pizza_size_id` | FK nullable | Tamanho da pizza |
| `product_id` | FK nullable | Produto avulso |
| `quantity` | int | Quantidade |
| `unit_price` | decimal | Preço unitário |
| `subtotal` | decimal | quantity × unit_price |
| `type` | enum | `pizza` / `product` |
| `notes` | text | Observações / borda recheada |

**Pivot `order_item_flavors`:** `order_item_id`, `pizza_flavor_id`, `fraction` (string: "1/1", "1/2", "1/3")

#### `Product`

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | string | Nome |
| `price` | decimal | Preço fixo |
| `category` | string | `Extras`, `Bebidas`, etc. |
| `show_on_digital_menu` | bool | Exibir no cardápio digital |
| `image` | string | Caminho relativo em `storage/app/public/` |

Accessor `image_url` → `asset('storage/' . $image)`

#### `PizzaFlavor`

**Seed:** 36 sabores salgados (R$70–R$105) + 13 doces (R$75–R$80) = **49 sabores totais**

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | string | Nome do sabor |
| `description` | string | Ingredientes |
| `base_price` | decimal | Preço base para cálculo |
| `is_active` | bool | Disponível |
| `show_on_digital_menu` | bool | Exibir no cardápio digital |
| `image` | string | Foto do sabor |

#### `PizzaSize`

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | string | Ex: "Broto", "Grande" |
| `slices` | int | Número de fatias |
| `max_flavors` | int | Máximo de sabores |
| `is_special_broto_rule` | bool | Ativa regra de precificação do broto |

**Seed:** Broto (6 fatias, 1 sabor, `broto_rule = true`), Grande (12 fatias, 3 sabores, `broto_rule = false`)

#### `CashRegister`

| Campo | Tipo | Descrição |
|---|---|---|
| `user_id` | FK | Operador |
| `status` | enum | `open` / `closed` |
| `opened_at` / `closed_at` | datetime | Horários |
| `opening_balance` | decimal | Fundo de caixa |
| `closing_balance` | decimal | Valor contado no fechamento |
| `calculated_balance` | decimal | Calculado pelo sistema |
| `difference` | decimal | Diferença (quebra de caixa) |
| `total_sales` | decimal | Total de vendas no período |
| `payment_summary` | json | Resumo por forma de pagamento |

#### `Table`

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | string | Número/nome da mesa |
| `status` | enum | `available` / `occupied` / `payment_pending` |
| `position_x/y` | int | Coordenadas no mapa do salão |
| `width/height` | int | Dimensões no mapa |

#### `Neighborhood`

- **48 bairros** configurados com taxas de entrega automáticas
- Taxa aplicada automaticamente ao criar pedido delivery no PDV

#### `PrinterSetting`

Modelo key-value para configuração de impressoras:

| Chave | Descrição |
|---|---|
| `paper_width` | Largura em colunas (default: 48) |
| `kitchen_enabled` | Habilitar impressora da cozinha |
| `kitchen_ip` / `kitchen_port` | Endereço TCP (default port: 9100) |
| `cashier_enabled` | Habilitar impressora do caixa |
| `cashier_ip` / `cashier_port` | Endereço TCP |

---

## 6. Regras de Negócio Críticas

### 6.1 Precificação de Pizza (`PizzaPriceService`)

| Tamanho | Regra | Fórmula |
|---|---|---|
| **Broto** (`is_special_broto_rule = true`) | Meio preço + taxa fixa | `(base_price do 1º sabor / 2) + R$ 5,00` |
| **Grande** (`is_special_broto_rule = false`) | Maior valor entre sabores | `max(base_price de todos os sabores)` |

**Bordas recheadas (Cheddar, Catupiry, Chocolate c/ Avelã):**
- São produtos da categoria `Extras` com preço fixo de **R$ 20,00**
- No **PDV:** adicionadas como item separado no carrinho
- No **App Garçom (Flutter):** somadas ao preço da pizza + registradas no campo `notes`
- ⚠️ Divergência conhecida — ver seção de dívidas técnicas

### 6.2 Frações de Sabor

- Pizza pode ter até `max_flavors` sabores (1 para Broto, 3 para Grande)
- Fração calculada automaticamente: `'1/' . count($flavorIds)`
- Preço **não é proporcional** à fração — sempre prevalece o sabor mais caro

### 6.3 Blindagem Financeira do Caixa

O sistema **bloqueia o fechamento de caixa** caso existam pedidos com status ativo (pending, preparing, ready, delivered) sem pagamento confirmado. Isso garante:
- Impossibilidade de "pedidos fantasmas"
- Auditoria histórica via date picker no relatório

### 6.4 Múltiplas Formas de Pagamento

Um pedido pode ter N registros de `Payment` — permitindo pagamento parcial em diferentes métodos:
- `dinheiro` · `pix` · `pix_online` · `credito` · `credito_online` · `debito`

---

## 7. Fluxo de Status dos Pedidos

### 7.1 Por Origem

```
App Garçom ──────────► preparing ──────► ready ──► delivered ──► paid ──► completed
                                                  ↑ KDS marca ready_at

PDV Salão ───► pending ──► preparing ──► ready ──► delivered ──► paid ──► completed

PDV Delivery ─► pending ──► preparing ──► ready ──► delivered ──► (pago na criação)

Online ──► awaiting_payment
               │ (webhook MP: approved)
               ▼
           paid_online ──► accepted* ──► pending ──► preparing ──► ready ──► delivered
                       └── rejected* ──► (refund automático)

* Aceite/rejeição acontece no PDV do operador
```

### 7.2 Tabela de Transições

| Status | Quem define | Próximo status | Quem avança |
|---|---|---|---|
| `preparing` | App Garçom (na criação) | `ready` | KDS |
| `pending` | PDV (na criação) | `preparing` | KDS |
| `awaiting_payment` | Sistema (pedido online) | `paid_online` | Webhook MP |
| `paid_online` | Webhook MP | `accepted` ou `rejected` | Operador no PDV |
| `accepted` | Operador PDV | `pending` | Automático |
| `ready` | KDS | `delivered` | KDS |
| `delivered` | KDS | `paid` | PDV ou App |
| `paid` | PDV/App | `completed` | PDV (mesa fechada) |

### 7.3 KDS — Lógica Especial

- **Filtro de categorias:** Exclui `Bebidas`, `bebida`, `drinks`, `Arquivo` — servidos direto pelo garçom
- **Polling:** `wire:poll` no Livewire via `checkNewOrders()` comparando `lastOrderId`
- **Ações disponíveis:** `startPreparing` · `markReady` · `markDelivered` · `reprintOrder`

---

## 8. API — Referência Completa

### Rotas Públicas (sem autenticação)

| Método | Rota | Controller | Descrição |
|---|---|---|---|
| `POST` | `/api/login` | `AuthController@login` | Login Sanctum → retorna token |
| `GET` | `/api/digital-menu` | `DigitalMenuController@index` | Cardápio público (JsonResource) |
| `POST` | `/api/online-orders` | `OnlinePaymentController@store` | Cria pedido online + inicia pagamento |
| `POST` | `/api/payments/webhook` | `OnlinePaymentController@webhook` | Webhook Mercado Pago |
| `GET` | `/api/orders/{order}/payment-status` | `OnlinePaymentController@paymentStatus` | Polling de status (cliente) |

### Rotas Protegidas (Sanctum Bearer Token)

| Método | Rota | Controller | Descrição |
|---|---|---|---|
| `GET` | `/api/user` | Closure | Usuário autenticado |
| `GET` | `/api/sync` | `DataController@index` | Catálogo completo (mesas, produtos, tamanhos, sabores) |
| `POST` | `/api/orders` | `OrderController@store` | Cria pedido (app garçom) |
| `GET` | `/api/tables/{table}/orders` | `OrderController@getByTable` | Pedidos ativos de uma mesa |
| `GET` | `/api/orders/active` | `OrderController@getAllActive` | Todos pedidos ativos do dia |
| `GET` | `/api/orders/ready` | `OrderController@getReady` | Pedidos prontos (para notificação futura) |
| `POST` | `/api/tables/{table}/close` | `OrderController@closeTable` | Fecha mesa (status → completed) |
| `POST` | `/api/tables/{table}/pay` | `OrderController@payAndCloseTable` | Paga e fecha mesa |

### Payload de Criação de Pedido (`POST /api/orders`)

```json
{
  "table_id": 3,
  "items": [
    {
      "type": "pizza",
      "size_id": 2,
      "flavor_ids": [5, 12],
      "quantity": 1,
      "notes": "Borda de Cheddar"
    },
    {
      "type": "product",
      "product_id": 8,
      "quantity": 2,
      "notes": ""
    }
  ]
}
```

---

## 9. Painel Administrativo (Filament)

### PDV (`Pos.php` — ~812 linhas)

O maior arquivo do projeto. Gerencia:
- Grid de produtos/sabores clicável
- Carrinho multi-modo (balcão sem mesa, mesa específica, delivery)
- Validação de tamanho/sabores de pizza
- Adição de observações por item
- Múltiplos métodos de pagamento simultâneos
- Cálculo automático de troco
- Impressão de recibo no fechamento
- Aceite/rejeição de pedidos online com PIX
- Integração com caixa aberto (vincula `cash_register_id`)

### KDS (`KDS.php`)

- Cards de pedidos com timer desde a criação
- Filtro de categorias (exclui bebidas)
- Destaque visual para pedidos urgentes
- Polling em tempo real via `wire:poll`
- Reimpressão de comanda de cozinha

### Mapa do Salão (`Floor.php`)

- Grade interativa de mesas com posicionamento livre (drag & drop)
- Indicação visual de status (disponível/ocupada/aguardando pagamento)
- Clique na mesa → abre pedidos ativos
- Suporte a elementos decorativos: `caixa`, `entrada`, `cozinha`, `banheiro`, `custom`

### Controle de Caixa (`CashRegisterPage.php`)

- Abertura com fundo inicial
- Fechamento com balanço automaticamente calculado
- Conferência item a item por forma de pagamento
- Trava que impede fechamento com pedidos em aberto
- Diferença (quebra) calculada em destaque

### Relatórios / Histórico (`Reports.php` + `SalesHistory.php`)

- Filtro por período via Date Picker
- Totais por forma de pagamento
- Listagem de fechamentos históricos

---

## 10. App Garçom (Flutter)

### Gerenciamento de Estado

O app usa **dois** sistemas de estado por razões históricas:

| Sistema | Features | Padrão |
|---|---|---|
| `provider` (ChangeNotifier) | `auth`, `menu`, `order` | `MultiProvider` no `main.dart` |
| `flutter_riverpod` (Notifier) | `pizza_builder`, `cart`, `digital_menu` | `ProviderScope` envolvendo `MyApp` |

> **Por quê dois sistemas?** O fluxo do garçom foi construído primeiro com Provider. O digital menu foi adicionado depois com Riverpod. Uma migração completa para Riverpod está planejada.

### URL da API (Dinâmica)

```dart
// api_constants.dart
if (kIsWeb) {
  baseUrl = 'http://127.0.0.1:8000/api';
} else if (Platform.isAndroid) {
  baseUrl = 'http://10.0.2.2:8000/api';  // Android emulator
}
```

### Rotas (GoRouter)

| Rota | Tela | Módulo |
|---|---|---|
| `/` | `WelcomeScreen` | Digital Menu |
| `/menu` | `MenuScreen` | Digital Menu |
| `/pizza-builder` | `PizzaBuilderScreen` | Digital Menu |
| `/identify` | `CustomerIdentificationScreen` | Digital Menu |
| `/checkout` | `CheckoutScreen` | Digital Menu |
| `/login` | `LoginScreen` | Garçom |
| `/waiter/home` | `TablesScreen` | Garçom |

### Fluxo do Garçom

1. Login → token salvo em `FlutterSecureStorage`
2. `TablesScreen` → `MenuProvider.loadData()` (GET /sync)
3. Seleciona mesa → `OrderScreen` com 3 tabs: **Pizza**, **Produto**, **Carrinho**
4. **Tab Pizza:** Tamanho → Sabores (respeitando `max_flavors`) → Borda (opcional) → Adiciona
5. **Tab Produto:** Lista produtos (exclui `Extras` e `arquivo`)
6. **Tab Carrinho:** Revisa → Envia via `POST /api/orders`
7. Pedido criado com `status = preparing`, mesa → `occupied`

### Cálculo de Preço (Espelhado no Flutter)

```dart
// OrderProvider.addPizza()
if (size.isSpecialBrotoRule) {
  estimatedPrice = (flavors.first.basePrice / 2) + 5.00;
} else {
  estimatedPrice = flavors.map((f) => f.basePrice).reduce((a, b) => a > b ? a : b);
}
if (border != null && border.isNotEmpty) {
  estimatedPrice += 20.00;
}
```

---

## 11. Cardápio Digital

### Stack

O cardápio digital roda como uma **segunda entrada Flutter** (`main.dart`), acessível em porta separada, e é uma SPA destinada ao **cliente final**.

### Fluxo de Pedido Online

```
Welcome (idioma) → Home (categorias) → PizzaBuilder (frações)
  → Identificação (nome/fone) → Tipo (salão/delivery/retirada)
    → Checkout → Pagamento (PIX ou Cartão MP)
      → Polling de status → Confirmação
```

### Internacionalização (i18n)

Suporte a **pt-BR** (primário), **en-US** e **es-ES** (planejado).
Toda string visível ao usuário deve vir de chave de tradução — sem textos hardcoded.

### Endpoint de Criação

`POST /api/online-orders` — Cria pedido + inicia cobrança no Mercado Pago em uma operação transacional.

---

## 12. Integração de Pagamento (Mercado Pago)

### `PaymentGatewayService.php`

| Método | Função |
|---|---|
| `createPixPayment(Order, email)` | Cria cobrança PIX, armazena QR code no `Order` |
| `createCardPayment(Order, token, email, installments)` | Processa cartão via token MercadoPago.js |
| `handleWebhook(payload)` | Recebe IPN, atualiza status (`approved` → `paid_online`, `rejected` → rejeita + refund) |
| `markOrderAsPaidOnline(Order, gatewayId)` | Seta `status = paid_online`, cria `Payment` local |
| `refundPayment(Order)` | Estorno via API |
| `checkPaymentStatus(Order)` | Polling direto no gateway |

### Status de Pagamento Online

```
pending → approved → (aceite do operador) → pedido entra na cozinha
       └──────────► rejected → refund automático
```

> ⚠️ **Atenção:** As credenciais do `.env` são tokens de teste (`TEST-...`). Trocar por credenciais de produção antes do go-live.

---

## 13. Impressão Térmica (ESC/POS)

### `PrintService.php` (~357 linhas)

Conecta via `NetworkPrintConnector` (TCP/IP). Dois tipos de impressão:

#### Comanda de Cozinha (`printKitchenTicket`)

```
COMANDA #42
Mesa: 5    14:32
━━━━━━━━━━━━━━━━━
1x Pizza Grande
  - Calabresa (1/2)
  - Frango C/ Catupiry (1/2)
  OBS: Borda de Cheddar
1x Coca-Cola 600ml
━━━━━━━━━━━━━━━━━
[Data/hora] [Corte]
```

Se delivery: cabeçalho especial `*** DELIVERY ***` com dados completos do cliente, endereço, bairro, forma de pagamento e troco.

#### Recibo do Cliente (`printCustomerReceipt`)

Recibo formatado com logo, itens, totais, formas de pagamento e troco. Nomes longos são truncados para caber na largura do papel (configurável).

---

## 14. Histórico de Versões e Evoluções

### v1.0 — Scaffold Inicial (antes de Fev/2026)
- Estrutura base Laravel + Filament
- PDV básico (sem múltiplas formas de pagamento)
- App Flutter com `provider` apenas
- Banco SQLite para desenvolvimento

### v1.5 — Junho/2025 (estimado)
- Adição do KDS
- Mapa do Salão interativo
- Início da integração com MySQL

### v2.0 — Fevereiro/2026 ✅
- **PDV Completo:** Carrinho multi-modo (balcão, mesa específica, delivery)
- **Controle de Caixa:** Abertura/fechamento com blindagem financeira
- **App Garçom Modernizado:** Migração para Dart 3 (switch expressions, super.key)
- **API Padronizada:** `JsonResource` em todos os endpoints públicos
- **Model Accessors:** `image_url` automático em `Product` e `PizzaFlavor`
- **PrintService Completo:** Impressão via rede, configurável por banco de dados
- **Bairros:** 48 bairros seed com taxas de entrega automáticas
- **Riverpod:** Adicionado para features de digital menu e pizza builder
- **Cardápio Digital:** Fluxo de pedido online com Mercado Pago (PIX + Cartão)
- **Múltiplos Pagamentos:** N pagamentos por pedido com diferentes métodos
- **`PaymentGatewayService`:** Integração MercadoPago com webhook, refund, polling

### v2.1 — Março/2026 (em andamento)
- Refinamentos de UX no PDV
- Ajustes de configuração de portas
- Documentação técnica da equipe (este arquivo)

### Roadmap (v2.2+)
- Notificações Push para garçom (FCM ou WebSocket)
- PIX dinâmico com QR Code gerado diretamente no PDV
- Validação de estoque (produto esgotado)
- Relatórios avançados com gráficos
- Testes automatizados (PHPUnit + Flutter Test)

---

## 15. Dívidas Técnicas e Issues Conhecidas

### 🔴 Críticas

| # | Problema | Localização | Impacto |
|---|---|---|---|
| TD-01 | **`DataController` não usa `JsonResource`** | `DataController@index` (GET /sync) | `image_url` pode não retornar via sync no app garçom |
| TD-02 | **Bordas recheadas tratadas de forma diferente** | PDV vs App Flutter | PDV cria item separado; Flutter usa `notes` — divergência nos totais |
| TD-03 | **`config/printing.php` inexistente** | `OrderController@store` | Auto-impressão nunca será trigger; config nunca é `true` |
| TD-04 | **Credenciais Mercado Pago são placeholder** | `.env` | Sistema não irá para produção sem credenciais reais |

### 🟡 Médias

| # | Problema | Localização | Impacto |
|---|---|---|---|
| TD-05 | **Dualidade Provider + Riverpod** | `waiter_app/lib/features/` | Complexidade de manutenção; dois paradigmas no mesmo app |
| TD-06 | **Quantidade fixa (1) para pizzas** | `OrderController@store` + Flutter | Impossível pedir 2 pizzas idênticas em uma operação |
| TD-07 | **`$guarded = []`** em `Order` e `CashRegister` | `app/Models/` | Mass-assignment totalmente aberto — risco de segurança |
| TD-08 | **SQLite residual** | `database/database.sqlite` + `composer.json` | Confusão sobre qual banco usar (MySQL é a fonte de verdade) |

### 🟢 Baixas

| # | Problema | Localização | Impacto |
|---|---|---|---|
| TD-09 | **23 migrations não consolidadas** | `database/migrations/` | Deploy inicial lento; difícil de auditar |
| TD-10 | **Testes automatizados mínimos** | `tests/` | Regressões podem passar despercebidas |

---

## 16. Backlog e Roadmap

### ✅ Concluído (Fev/2026)

- [x] PDV completo (balcão, mesa, delivery, múltiplos pagamentos)
- [x] Controle de Caixa com blindagem financeira
- [x] KDS com polling e filtros de categoria
- [x] Mapa do Salão interativo
- [x] API padronizada com `JsonResource`
- [x] App Flutter modernizado (Dart 3)
- [x] Impressão térmica via rede (configurável por banco)
- [x] 48 bairros com taxas de entrega automáticas
- [x] Cardápio digital com pedido online + Mercado Pago

### 🔴 Alta Prioridade (Próximas Sprints)

- [ ] **TD-01 Corrigir:** `DataController` usar `JsonResource` com `image_url`
- [ ] **TD-02 Corrigir:** Unificar tratamento de bordas recheadas (campo dedicado no `OrderItem`)
- [ ] **TD-03 Corrigir:** Criar `config/printing.php` para auto-impressão funcionar
- [ ] **Notificações Push:** Garçom alertado quando KDS marcar pedido como "Pronto"
- [ ] **PIX no PDV:** QR Code gerado direto na tela do caixa

### 🟡 Prioridade Média

- [ ] Relatórios Avançados: gráficos de vendas mensais, ticket médio
- [ ] Dashboard Marketplace (visão para delivery externo)
- [ ] Feedback visual de impressora offline no PDV

### 🟢 Prioridade Baixa

- [ ] Testes automatizados PHPUnit (rotas API + `PizzaPriceService`)
- [ ] Testes Flutter (`flutter test`)
- [ ] Consolidar 23 migrations em schema único
- [ ] Migrar `provider` para `riverpod` completamente
- [ ] Estudo de multi-tenancy (SaaS)

---

## 17. Guia de Setup Local

### Pré-requisitos

- PHP 8.2+ com extensões: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`
- Composer
- MySQL 8.0+
- Node.js 18+ / npm
- Flutter SDK 3.10+
- (Opcional) Impressora ESC/POS acessível via rede local

### 1. Backend (Laravel)

```bash
# Na raiz do projeto
composer install
cp .env.example .env
php artisan key:generate

# Configurar MySQL no .env
# DB_CONNECTION=mysql
# DB_DATABASE=lucchese_pizza
# DB_USERNAME=root
# DB_PASSWORD=sua_senha

php artisan migrate --seed
php artisan storage:link
php artisan serve --port=8000
```

### 2. Frontend Admin (Vite)

```bash
npm install
npm run dev
# Painel acessível em http://localhost:8000/admin
```

**Credenciais padrão (seed):**
- Admin: `admin@lucchese.com` / `admin123`
- Garçom: `waiter@lucchese.com` / `password`

### 3. App Flutter — Garçom

```bash
cd waiter_app
flutter pub get
flutter run -d web-server --web-port=8001 -t lib/main_waiter.dart
# Acessa: http://localhost:8001
```

### 4. App Flutter — Cardápio Digital

```bash
cd waiter_app
flutter run -d web-server --web-port=8002 -t lib/main.dart
# Acessa: http://localhost:8002
```

### Portas de Referência

| Porta | Serviço |
|---|---|
| `:8000` | Laravel API + Painel Admin |
| `:8001` | App Garçom (Flutter web) |
| `:8002` | Cardápio Digital (Flutter web) |
| `:9100` | Impressora térmica (padrão TCP) |

### Variáveis de Ambiente Importantes

```env
# Mercado Pago (trocar por credenciais reais em produção)
MERCADOPAGO_ACCESS_TOKEN=TEST-your-access-token-here

# Configuração de assets
FILAMENT_FILESYSTEM_DISK=public

# App URL
APP_URL=http://127.0.0.1:8000
```

---

## Contato e Autoria

**João Gabriel (Pixirica Produções)**
Sistema desenvolvido com 13 anos de vivência operacional em pizzarias de alto movimento.

> *"Software com Alma"* — Pixirica Produções © 2026
