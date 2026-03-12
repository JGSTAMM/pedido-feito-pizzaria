# Pedido-Feito 2.0 — Contexto Completo do Projeto

## 1. Visão Geral e Stack Tecnológico

| Componente | Versão / Tecnologia |
|---|---|
| **PHP** | ^8.2 (runtime 8.5) |
| **Laravel** | 12.x |
| **Filament** | 3.2.x (painel admin) |
| **Banco de Dados** | MySQL 8 (DB: `lucchese_pizza`). SQLite presente como fallback de dev (`database/database.sqlite`) |
| **Autenticação API** | Laravel Sanctum 4.2 (tokens Bearer) |
| **Impressão Térmica** | `mike42/escpos-php` ^4.0 (ESC/POS via rede TCP) |
| **Pagamento Online** | `mercadopago/dx-php` ^3.8 (PIX dinâmico + Cartão de Crédito) |
| **Flutter (Dart SDK)** | ^3.10.3 |
| **State Management (Flutter)** | Híbrido: `provider` ^6.1.1 (fluxo garçom) + `flutter_riverpod` ^3.2.1 (digital menu / pizza builder) |
| **Roteamento (Flutter)** | `go_router` ^17.1.0 |
| **HTTP Client (Flutter)** | `dio` ^5.4.0 |
| **Armazenamento Seguro** | `flutter_secure_storage` ^9.0.0 (token Sanctum) |
| **Outros Flutter** | `google_fonts`, `intl`, `equatable`, `url_launcher` |
| **Assets/Imagens** | Disk `public` do Laravel (`storage/app/public/`), config global `FILAMENT_FILESYSTEM_DISK=public` |
| **Locale** | `pt_BR` |
| **Frontend Admin** | Blade + Livewire (via Filament) |
| **Build Tools** | Vite (frontend admin) |
| **Arquitetura Backend** | MVC com Services Layer (`app/Services/`) |
| **Arquitetura Frontend** | Feature-based (cada feature = `data/` + `domain/` + `presentation/`) |

---

## 2. Estrutura de Diretórios

```
Pedido-Feito 2.0/
├── app/
│   ├── Console/
│   ├── Filament/
│   │   ├── Pages/            # Páginas Livewire customizadas
│   │   │   ├── Pos.php                 # PDV (812 linhas — o maior arquivo do projeto)
│   │   │   ├── KDS.php                 # Kitchen Display System
│   │   │   ├── Floor.php               # Mapa do Salão interativo
│   │   │   ├── CashRegisterPage.php    # Controle de Caixa (abertura/fechamento)
│   │   │   ├── PrinterSettings.php     # Config de impressoras via DB
│   │   │   ├── Reports.php             # Relatórios de vendas
│   │   │   └── SalesHistory.php        # Histórico de vendas
│   │   ├── Resources/        # CRUD Resources do Filament
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
│   │   │   ├── OrderController.php          # CRUD de pedidos via app garçom
│   │   │   ├── DigitalMenuController.php    # Cardápio digital público
│   │   │   └── OnlinePaymentController.php  # PIX/Cartão + Webhook Mercado Pago
│   │   └── Resources/        # JsonResource (API responses)
│   │       ├── ProductResource.php
│   │       ├── PizzaFlavorResource.php
│   │       ├── PizzaSizeResource.php
│   │       └── NeighborhoodResource.php
│   ├── Models/               # 12 Eloquent Models
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
│   ├── Providers/
│   └── Services/
│       ├── PizzaPriceService.php         # Cálculo de preço de pizza
│       ├── PrintService.php              # Impressão ESC/POS via rede
│       └── PaymentGatewayService.php     # Integração Mercado Pago
├── database/
│   ├── migrations/           # 23 migrations
│   ├── seeders/
│   │   └── DatabaseSeeder.php  # Seeds: 2 users, 2 tamanhos, 49 sabores, 15 produtos, 10 mesas
│   └── database.sqlite
├── routes/
│   ├── api.php               # Rotas da API (públicas + Sanctum)
│   └── web.php
├── waiter_app/               # Flutter App
│   ├── lib/
│   │   ├── core/
│   │   │   ├── constants/api_constants.dart  # Base URL dinâmica (Web/Android)
│   │   │   ├── services/api_service.dart     # Dio + interceptor Sanctum
│   │   │   ├── l10n/                         # Localizações
│   │   │   └── widgets/
│   │   ├── features/
│   │   │   ├── auth/         # Login garçom
│   │   │   ├── menu/         # Sincronização de dados (mesas, produtos, sabores)
│   │   │   ├── order/        # Fluxo de pedido do garçom (carrinho, tabs pizza/produto)
│   │   │   ├── cart/         # Carrinho do cardápio digital (Riverpod)
│   │   │   ├── pizza_builder/# Montador visual de pizza (Riverpod)
│   │   │   └── digital_menu/ # Cardápio digital para o cliente
│   │   ├── main.dart         # Entry point (GoRouter + providers)
│   │   └── main_waiter.dart  # Entry point alternativo (garçom)
│   └── pubspec.yaml
├── PROJECT_STATUS.md
├── BACKLOG.md
└── composer.json
```

---

## 3. Modelagem de Dados Core

### Diagrama de Relacionamentos

```
User (1) ──── (N) Order
User (1) ──── (N) CashRegister

Table (1) ──── (N) Order

Neighborhood (1) ──── (N) Order

Order (1) ──── (N) OrderItem
Order (1) ──── (N) Payment

OrderItem (N) ──── (1) Product        [nullable — se for produto avulso]
OrderItem (N) ──── (1) PizzaSize      [nullable — se for pizza]
OrderItem (N) ──── (N) PizzaFlavor    [pivot: order_item_flavors, com campo 'fraction']

CashRegister (1) ──── (N) Order       [via cash_register_id no Order]
```

### Detalhamento dos Models

#### `Order`
- **Campos principais:** `table_id`, `user_id`, `status`, `type` (salon/delivery), `customer_name`, `customer_phone`, `total_amount`, `delivery_address`, `delivery_complement`, `neighborhood_id`, `delivery_fee`, `change_amount`, `cash_register_id`, `paid_at`, `ready_at`.
- **Campos de pagamento online:** `payment_gateway_id`, `payment_method_online`, `online_payment_status`, `pix_qr_code`, `pix_qr_code_base64`, `accepted_at`, `rejected_at`, `rejection_reason`.
- **Statuses do pedido:** `awaiting_payment`, `paid_online`, `accepted`, `rejected`, `pending`, `preparing`, `ready`, `delivered`, `paid`, `completed`.
- **Statuses de pagamento online:** `pending`, `approved`, `rejected`, `refunded`.
- **Scopes:** `onlinePending()`, `awaitingPayment()`, `activeKitchen()`.
- **Helpers:** `isOnlineOrder()`, `isPaidOnline()`, `canBeAccepted()`, `canBeRejected()`.
- **Boot:** Se `type === 'delivery'` e sem `status`, seta como `pending`.
- **Cast:** `total_amount`, `delivery_fee`, `change_amount` como `decimal:2`; timestamps como `datetime`.

#### `OrderItem`
- **Campos:** `order_id`, `pizza_size_id` (nullable), `product_id` (nullable), `quantity`, `unit_price`, `subtotal`, `type` (pizza/product), `notes`.
- **Relacionamentos:** `order()`, `product()`, `pizzaSize()`, `flavors()` (belongsToMany via `order_item_flavors` com pivot `fraction`).

#### `Product`
- **Campos:** `name`, `price`, `category`, `show_on_digital_menu`, `image`.
- **Accessor:** `image_url` (retorna `asset('storage/' . $this->image)` ou `null`).
- **Categorias no seed:** `Extras` (bordas + pizza do dia), `Bebidas`.

#### `Payment`
- **Campos:** `order_id`, `method`, `amount`, `notes`, `gateway_id`, `gateway_status`, `paid_at`.
- **Métodos disponíveis:** `dinheiro`, `pix`, `pix_online`, `credito`, `credito_online`, `debito`.
- **Helper:** `isOnline()`.

#### `Table`
- **Campos:** `name`, `status` (available/occupied/payment_pending), `position_x`, `position_y`, `width`, `height`.
- **Relacionamentos:** `orders()`, `activeOrders()` (exclui completed/cancelled).

#### `PizzaFlavor`
- **Campos:** `name`, `description`, `base_price`, `is_active`, `show_on_digital_menu`, `image`.
- **Accessor:** `image_url`.
- **Seed:** 36 sabores salgados (R$70–R$105) + 13 sabores doces (R$75–R$80) = 49 sabores totais.

#### `PizzaSize`
- **Campos:** `name`, `slices`, `max_flavors`, `is_special_broto_rule`.
- **Seed:** Broto (6 fatias, 1 sabor, `is_special_broto_rule = true`), Grande (12 fatias, 3 sabores, `is_special_broto_rule = false`).

#### `CashRegister`
- **Campos:** `user_id`, `status`, `opened_at`, `closed_at`, `opening_balance`, `closing_balance`, `calculated_balance`, `difference`, `total_sales`, `payment_summary` (cast `array`).
- **Relacionamentos:** `user()`, `orders()`.

#### `FloorElement`
- **Campos:** `name`, `type`, `icon`, `position_x`, `position_y`, `width`, `height`, `visible`.
- **Tipos com cores:** `caixa`, `entrada`, `cozinha`, `banheiro`, `custom`.

#### `Neighborhood`
- **Campos:** `name`, `delivery_fee`.
- **Seed:** 48 bairros com taxas de entrega configuradas.

#### `PrinterSetting`
- **Campos:** `key`, `value` (modelo key-value genérico).
- **Chaves usadas no PrintService:** `paper_width`, `kitchen_enabled`, `kitchen_ip`, `kitchen_port`, `cashier_enabled`, `cashier_ip`, `cashier_port`.

#### `User`
- **Traits:** `HasApiTokens` (Sanctum), `HasFactory`, `Notifiable`.
- **Seed:** `waiter@lucchese.com` / `password` (garçom), `admin@lucchese.com` / `admin123` (admin).

---

## 4. Regras de Negócio e Lógica Específica

### 4.1 PizzaPriceService — Cálculo de Preço de Pizza

**Localização:** `app/Services/PizzaPriceService.php`

O serviço recebe `sizeId` e `flavorIds[]` e aplica duas regras de precificação:

| Tamanho | Regra de Preço | Fórmula |
|---|---|---|
| **Broto** (`is_special_broto_rule = true`) | Meio preço + taxa fixa | `(basePrice do 1º sabor / 2) + R$ 5,00` |
| **Grande** (`is_special_broto_rule = false`) | Maior valor entre os sabores | `max(basePrice de todos os sabores selecionados)` |

**Observações críticas:**
- Broto aceita apenas **1 sabor** (`max_flavors = 1`). Se múltiplos forem passados, usa `$flavors->first()`.
- Grande aceita até **3 sabores**. O preço é sempre o do sabor **mais caro**.
- **Bordas recheadas** (Cheddar, Catupiry, Chocolate com Avelã) são tratadas como `Product` da categoria `Extras` com preço fixo de **R$ 20,00**. A borda é adicionada ao pedido como item separado no PDV, mas no app Flutter é adicionada ao preço da pizza e registrada no campo `notes`.

### 4.2 Frações de Sabor

O sistema suporta pizzas com múltiplos sabores via tabela pivot `order_item_flavors`:
- Campo `fraction` armazena a fração como string (`"1/1"`, `"1/2"`, `"1/3"`).
- No `OrderController.store()`, a fração é calculada automaticamente: `'1/' . count($flavorIds)`.
- O preço não é proporcional à fração — **o preço é sempre o do sabor mais caro** (regra da Grande).

### 4.3 PrintService — Impressão Térmica

**Localização:** `app/Services/PrintService.php` (357 linhas)

**Conexão:** `NetworkPrintConnector` via TCP/IP. Configurações lidas do model `PrinterSetting` (banco de dados).

**Dois tipos de impressão:**

#### `printKitchenTicket(Order $order)` — Comanda de Cozinha
- Cabeçalho: `COMANDA #{id}` (tamanho 2x2), mesa e horário.
- Se **delivery**: bloco com `*** DELIVERY ***`, dados do cliente (nome, fone, endereço, complemento, bairro), info de pagamento (método + valor para cada `Payment`), troco, taxa de entrega, total.
- Itens: Para cada `OrderItem`, imprime `{qty}x Pizza {size}` com sabores abaixo, ou `{qty}x {product}`. Se `notes` preenchido, imprime `OBS:`.
- Rodapé com data/hora e corte.

#### `printCustomerReceipt(Order $order)` — Recibo do Cliente
- Cabeçalho com nome do sistema `PEDIDO FEITO / Pizzaria`.
- Info do pedido, itens com preço alinhado à direita (trunca nomes longos para caber na largura do papel).
- Total em destaque, pagamentos, troco. Rodapé com mensagem de agradecimento.

#### `testPrinter(string $printerType)` — Teste de Conexão
- Imprime ticket de teste com tipo, data e status.

**Configurações via `PrinterSetting`:**
- `paper_width` (default: 48 colunas)
- `{kitchen|cashier}_enabled` (true/false)
- `{kitchen|cashier}_ip` e `{kitchen|cashier}_port` (default: 9100)

### 4.4 PaymentGatewayService — Integração Mercado Pago

**Localização:** `app/Services/PaymentGatewayService.php`

| Método | Função |
|---|---|
| `createPixPayment(Order, email)` | Cria cobrança PIX, armazena QR code e status no `Order` |
| `createCardPayment(Order, token, email, installments)` | Processa cartão de crédito via token do MercadoPago.js |
| `handleWebhook(payload)` | Recebe notificações IPN, atualiza status (approved → `paid_online`, rejected/cancelled → `rejected`, refunded) |
| `markOrderAsPaidOnline(Order, gatewayId)` | Seta `status = paid_online`, cria registro `Payment` local |
| `refundPayment(Order)` | Estorna pagamento via API Mercado Pago |
| `checkPaymentStatus(Order)` | Consulta status direto no gateway |

---

## 5. Fluxo de Status (PDV → KDS)

### 5.1 Origem do Pedido

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  App Garçom  │     │  PDV (Caixa) │     │  Pedido Online   │
│  (Flutter)   │     │  (Filament)  │     │  (Digital Menu)  │
└──────┬───────┘     └──────┬───────┘     └────────┬─────────┘
       │                    │                      │
       │ POST /orders       │ Livewire             │ POST /online-orders
       │ status=preparing   │ confirmPayment()     │ status=awaiting_payment
       │ type=salon         │ type=salon|delivery   │ type=delivery
       ▼                    ▼                      ▼
                     ┌─────────────┐        ┌──────────────┐
                     │   ORDER DB  │        │ MERCADO PAGO │
                     └──────┬──────┘        └──────┬───────┘
                            │                      │
                            │               Webhook: approved
                            │                      │
                            ▼                      ▼
                     status = pending        status = paid_online
                     (ou preparing)          (aguarda aceite no PDV)
```

### 5.2 Fluxo de Status Completo

```
                    ┌──── PEDIDO ONLINE ────┐
                    │                       │
             awaiting_payment          paid_online
                    │                    │      │
                    │              ┌─────┘      └──────┐
                    │              ▼                    ▼
                    │          accepted              rejected
                    │              │               (+ refund)
                    │              ▼
                    │           pending ◄──── Criado pelo PDV (delivery)
                    │              │
                    │              ▼
  preparing ◄──── App Garçom cria direto
      │
      ▼
    ready ──── (KDS seta ready_at)
      │
      ▼
  delivered ──── (KDS seta paid_at se não tinha)
      │
      ▼
    paid ──── (PDV ou App → registro de Payment)
      │
      ▼
  completed ──── (Mesa fechada)
```

### 5.3 Detalhamento por Origem

| Origem | Status Inicial | Próximo Status | Quem Avança |
|---|---|---|---|
| **App Garçom** | `preparing` (direto) | `ready` → `delivered` → `paid` → `completed` | KDS (preparing→ready→delivered), PDV/App (paid→completed) |
| **PDV (Salão)** | `pending` → `preparing` | `ready` → `delivered` → `paid` → `completed` | PDV cria com pagamento, KDS avança |
| **PDV (Delivery)** | `pending` | `preparing` → `ready` → `delivered` | KDS avança, PDV registra pagamento junto na criação |
| **Online (Delivery)** | `awaiting_payment` → `paid_online` → `accepted` → `pending` | `preparing` → `ready` → `delivered` | Gateway webhook → PDV aceita → KDS avança |

### 5.4 KDS: Filtros e Lógica

- **Filtro de categorias:** O KDS exclui itens de categorias `Bebidas`/`bebida`/`drinks`/`Arquivo` — são servidos direto pelo garçom.
- **Polling:** O componente Livewire usa `checkNewOrders()` com `wire:poll` para detectar novos pedidos comparando `lastOrderId`.
- **Ações do KDS:**
  - `startPreparing(orderId)`: `pending` → `preparing`
  - `markReady(orderId)`: `preparing` → `ready` (+ `ready_at = now()`)
  - `markDelivered(orderId)`: `ready` → `delivered` (+ `paid_at` se não tinha)
  - `reprintOrder(orderId)`: Reimprime comanda via `PrintService`

---

## 6. Frontend App Garçom (Flutter)

### 6.1 Arquitetura

O app Flutter é **feature-based** com 6 features:

| Feature | Responsabilidade | State Management |
|---|---|---|
| `auth` | Login Sanctum, armazena token em `FlutterSecureStorage` | `ChangeNotifier` (Provider) |
| `menu` | Sincroniza catálogo via `GET /sync` (mesas, produtos, tamanhos, sabores) | `ChangeNotifier` (Provider) |
| `order` | Carrinho do garçom, tabs (pizza/produto), envio de pedido | `ChangeNotifier` (Provider) |
| `pizza_builder` | Montador visual de pizza para o cardápio digital | `Notifier` (Riverpod) |
| `cart` | Carrinho do cardápio digital com checkout | `Notifier` (Riverpod) |
| `digital_menu` | Tela de boas-vindas + cardápio digital para o cliente | `Notifier` (Riverpod) |

### 6.2 Gerenciamento de Estado — Detalhe

**Padrão híbrido:** O projeto usa **duas** bibliotecas de estado:

1. **`provider` (ChangeNotifier):** Para o fluxo do **garçom** — `AuthProvider`, `MenuProvider`, `OrderProvider`. São injetados via `MultiProvider` no `main.dart`.
2. **`flutter_riverpod` (Notifier):** Para o fluxo do **cardápio digital** e **pizza builder** — `PizzaBuilderNotifier`, `CartNotifier`, `DigitalMenuProvider`. O `ProviderScope` envolve o `MyApp` inteiro.

> **Nota técnica:** Essa dualidade existe porque o fluxo do garçom foi construído primeiro com Provider e posteriormente o digital menu foi adicionado usando Riverpod. Uma migração completa para Riverpod está nos planos futuros.

### 6.3 Consumo da API

- **`ApiService`** (`core/services/api_service.dart`): Singleton Dio com interceptor que injeta token Bearer do `FlutterSecureStorage` em toda request.
- **Base URL dinâmica** (`core/constants/api_constants.dart`):
  - Web: `http://127.0.0.1:8000/api`
  - Android emulator: `http://10.0.2.2:8000/api`
  - Fallback: `http://127.0.0.1:8000/api`
- **Rota de Sync:** `GET /sync` retorna catálogo completo (tables, pizza_sizes, pizza_flavors, products) em um único request.
- **Envio de Pedido:** `POST /orders` com payload `{ table_id, items: [{type, size_id, flavor_ids[], quantity, notes}] }`.

### 6.4 Fluxo do Garçom

1. Login → token salvo em `FlutterSecureStorage`.
2. Tela de Mesas (`TablesScreen`) → carrega dados via `MenuProvider.loadData()`.
3. Seleciona mesa → abre `OrderScreen` com tabs: Pizza, Produto, Carrinho.
4. **Pizza Tab:** Seleciona tamanho → seleciona sabores (respeitando `max_flavors`) → opcionalmente seleciona borda e adiciona obs → adiciona ao carrinho.
5. **Produto Tab:** Lista produtos filtrados (exclui `Extras` e `arquivo`).
6. **Carrinho Tab:** Revisa itens, envia via `OrderProvider.sendOrder(tableId)`.
7. O pedido é criado com `status = preparing` e `type = salon`, mesa vira `occupied`.

### 6.5 Cálculo de Preço no Flutter (espelhado)

O `OrderProvider.addPizza()` replica a lógica do `PizzaPriceService` no lado cliente:
```dart
if (size.isSpecialBrotoRule) {
  estimatedPrice = (flavors.first.basePrice / 2) + 5.00;
} else {
  estimatedPrice = flavors.map((f) => f.basePrice).reduce((a, b) => a > b ? a : b);
}
if (border != null && border.isNotEmpty) {
  estimatedPrice += 20.00; // OrderItem.borderPrice
}
```

### 6.6 Roteamento (GoRouter)

| Rota | Tela | Contexto |
|---|---|---|
| `/` | `WelcomeScreen` | Digital Menu — boas-vindas |
| `/menu` | `MenuScreen` | Digital Menu — cardápio |
| `/pizza-builder` | `PizzaBuilderScreen` | Digital Menu — montador |
| `/identify` | `CustomerIdentificationScreen` | Digital Menu — dados cliente |
| `/checkout` | `CheckoutScreen` | Digital Menu — checkout |
| `/login` | `LoginScreen` | Garçom — login |
| `/waiter/home` | `TablesScreen` | Garçom — mapa de mesas |

---

## 7. Padrões de Código

### 7.1 API — JsonResource

Todas as respostas da API usam `Illuminate\Http\Resources\Json\JsonResource`. Exemplo (`ProductResource`):

```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'price' => $this->price,
        'category' => $this->category,
        'image_url' => $this->image_url, // Accessor do Model
    ];
}
```

**Resources existentes:** `ProductResource`, `PizzaFlavorResource`, `PizzaSizeResource`, `NeighborhoodResource`.

> **Nota:** O `DataController` (`GET /sync`) e `OrderController` **não usam** JsonResource — retornam query direto ou mapeamento manual via closures. Isso é uma inconsistência a ser corrigida.

### 7.2 Model Accessors

Models com imagens (`Product`, `PizzaFlavor`) possuem accessor `image_url` usando a nova sintaxe do Laravel:

```php
protected $appends = ['image_url'];

protected function imageUrl(): \Illuminate\Database\Eloquent\Casts\Attribute
{
    return \Illuminate\Database\Eloquent\Casts\Attribute::get(fn () =>
        $this->image ? asset('storage/' . $this->image) : null
    );
}
```

### 7.3 Padrões Dart 3 Adotados

- **Switch expressions** usados em lógica de UI (seletores, formatação condicional).
- **`super.key`** nos construtores de widgets (Dart 3 style — `const Widget({super.key})`).
- **Curly braces** obrigatórias em todos os `if/else/for` (enforced via `analysis_options.yaml`).
- **Notifier pattern** (Riverpod 3): `class CartNotifier extends Notifier<CartState>` com `build()` retornando estado inicial.
- **Imutabilidade via `copyWith`:** `CartState`, `PizzaModel` usam padrão `copyWith()`.
- **Models com `equatable`:** Para comparação de igualdade eficiente.

### 7.4 Backend — Padrões

- **`$guarded = []`** nos Models `Order` e `CashRegister` (mass-assignment totalmente aberto).
- **`$fillable`** explícito nos demais Models.
- **Transactions:** `OrderController.store()` e `payAndCloseTable()` usam `DB::beginTransaction()` / `commit()` / `rollBack()`.
- **Scopes nomeados** no `Order` para queries recorrentes: `onlinePending()`, `awaitingPayment()`, `activeKitchen()`.
- **Match expressions (PHP 8.1+):** Usadas no `PrintService.translatePaymentMethod()`.

---

## 8. Problemas Atuais, TODOs e Dívidas Técnicas

### 8.1 Inconsistência SQLite vs MySQL

O `.env` está configurado para **MySQL** (`DB_CONNECTION=mysql`, database `lucchese_pizza`), mas o projeto possui `database/database.sqlite` e o `composer.json` tem script de criação do SQLite no `post-create-project-cmd`. O `PROJECT_STATUS.md` menciona SQLite. **O `.env` é a fonte de verdade** — o sistema opera em MySQL. O SQLite é resíduo do scaffold inicial.

### 8.2 `DataController` Não Usa JsonResource

O endpoint `GET /sync` retorna dados brutos via `select()` direto no Model, sem passar pelas `JsonResource`. Isso significa que o `image_url` accessor **não é incluído** no sync para o app do garçom (ele é incluído via `$appends` quando serializado via Model, mas o `select()` limita os campos). Já o `DigitalMenuController` **usa** os Resources corretamente.

### 8.3 Dualidade Provider / Riverpod

O app Flutter usa **duas** bibliotecas de state management simultaneamente. O fluxo do garçom (auth, menu, order) está em `ChangeNotifier` (Provider), enquanto digital menu e pizza builder estão em `Notifier` (Riverpod). Migrar tudo para Riverpod é um TODO.

### 8.4 Bordas Recheadas — Tratamento Inconsistente

No **PDV (Pos.php)**, bordas são adicionadas ao carrinho como item `Product` separado (da categoria `Extras`). No **app garçom (Flutter)**, bordas são embutidas no preço da pizza e descritas no campo `notes` do `OrderItem`. Isso gera **divergência** entre como o PDV e o app registram bordas. O backend não possui campo dedicado para borda no `OrderItem`.

### 8.5 Mercado Pago em Sandbox

As credenciais no `.env` são tokens de teste (`TEST-your-access-token-here`). A integração está funcional mas com **credenciais placeholder**. Para produção, precisam ser trocadas por credenciais reais.

### 8.6 Auto-print com Config Inexistente

O `OrderController.store()` verifica `config('printing.auto_print_kitchen')` para auto-impressão, mas **não existe** o arquivo `config/printing.php`. Essa config nunca será `true` sem criar o arquivo de configuração.

### 8.7 Quantidade Fixa em Pizza

No `OrderController.store()`, pizzas são sempre criadas com `quantity = 1`. O app Flutter também hardcoda `'quantity': 1` para pizzas no payload. Se o cliente quiser 2 pizzas idênticas, precisa adicioná-las separadamente ao carrinho.

### 8.8 Backlog de Features Pendentes

| Prioridade | Feature | Status |
|---|---|---|
| 🔴 Alta | Notificações Push (garçom alertado quando pedido "Pronto") | Não iniciado |
| 🔴 Alta | PIX dinâmico no PDV (QR Code) | Parcialmente implementado (PaymentGateway existe, falta UI no PDV) |
| 🔴 Alta | Validação de Estoque (produto esgotado) | Não iniciado |
| 🟡 Média | Relatórios Avançados (gráficos, ticket médio) | Parcial (Reports.php existe mas básico) |
| 🟡 Média | Feedback de Impressão (logs visuais no PDV) | Parcial |
| 🟢 Baixa | Testes Automatizados (API + PizzaPriceService) | Mínimos |
| 🟢 Baixa | Consolidação de Migrations | Não iniciado |
| 🟢 Baixa | Multi-tenancy (SaaS) | Estudo futuro |

### 8.9 Rotas da API — Referência Rápida

**Públicas:**
| Método | Rota | Controller | Descrição |
|---|---|---|---|
| GET | `/api/digital-menu` | `DigitalMenuController@index` | Cardápio digital (usa JsonResource) |
| POST | `/api/login` | `AuthController@login` | Login Sanctum → retorna token |
| POST | `/api/online-orders` | `OnlinePaymentController@store` | Cria pedido online + inicia pagamento |
| POST | `/api/payments/webhook` | `OnlinePaymentController@webhook` | Webhook Mercado Pago |
| GET | `/api/orders/{order}/payment-status` | `OnlinePaymentController@paymentStatus` | Consulta status de pagamento |

**Protegidas (Sanctum):**
| Método | Rota | Controller | Descrição |
|---|---|---|---|
| GET | `/api/user` | Closure | Retorna usuário autenticado |
| GET | `/api/sync` | `DataController@index` | Sincroniza catálogo completo |
| POST | `/api/orders` | `OrderController@store` | Cria pedido (garçom) |
| GET | `/api/tables/{table}/orders` | `OrderController@getByTable` | Pedidos ativos da mesa |
| GET | `/api/orders/active` | `OrderController@getAllActive` | Todos os pedidos ativos do dia |
| GET | `/api/orders/ready` | `OrderController@getReady` | Pedidos prontos (para notificação) |
| POST | `/api/tables/{table}/close` | `OrderController@closeTable` | Fecha mesa (status → completed) |
| POST | `/api/tables/{table}/pay` | `OrderController@payAndCloseTable` | Paga e fecha mesa (distribui pagamentos) |
