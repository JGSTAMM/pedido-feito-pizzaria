# 📸 Pedido-Feito 2.0 — Guia Visual de Telas

> Screenshots reais capturadas em **22/03/2026**
> Todas as instâncias operando em ambiente de desenvolvimento local.

---

## Índice

- [Instância 1 — Painel Administrativo (porta 8000)](#instância-1--painel-administrativo-porta-8000)
- [Instância 2 — App do Garçom (porta 8001)](#instância-2--app-do-garçom-porta-8001)
- [Instância 3 — Cardápio Digital (porta 8002)](#instância-3--cardápio-digital-porta-8002)
- [Fluxo Operacional Completo](#fluxo-operacional-completo)

---

## Instância 1 — Painel Administrativo (porta 8000)

**Acesso:** http://localhost:8000/admin
**Usuário:** admin@pedidofeito.com / admin123
**Perfil:** Administrador / Caixa / Gerente

Esta instância centraliza toda a operação: PDV, cozinha, mesas, caixa e configurações.

---

### Tela 1 — Login

![Login do sistema Pedido Feito](screens/admin_01_login.png)

**Descrição:**
- Tela de autenticação unificada para admin e garçom
- Design dark premium com logo centralizada
- Campos: E-mail + Senha
- Botão **ENTRAR** roxo de destaque
- Footer com copyright © 2026 Pedido Feito

**Acesso:**
- Admin: `admin@pedidofeito.com` / `admin123`
- Garçom: `waiter@pedidofeito.com` / `password`

---

### Tela 2 — Dashboard (Painel de Controle)

![Dashboard - Painel de Controle](screens/admin_02_dashboard.png)

**Descrição:**
- Visão geral em tempo real do estabelecimento
- 4 cards de métricas: **Receita Hoje**, **Pedidos Hoje**, **Em Andamento**, **Produtos Ativos**
- Atalhos rápidos: Abrir PDV, Ver Pedidos, Cozinha (KDS), Mapa do Salão
- Seção **Pedidos Recentes** na parte inferior
- Indicador de status do caixa no topo direito (verde = Caixa Aberto)

**Menu lateral:**
- PDV · Painel de Controle · Pedidos · Cozinha (KDS) · Mapa do Salão · Caixa
- Seção CONFIGURAÇÕES: Produtos · Sabores · etc.

---

### Tela 3 — PDV (Ponto de Venda)

![PDV - Ponto de Venda](screens/admin_03_pdv.png)

**Descrição:**
- Layout em 3 colunas: **Menu lateral** | **Catálogo** | **Carrinho**
- Barra superior: Status do caixa, Saldo Inicial, Vendas, Gaveta, botão Fechar Caixa
- **Catálogo central** com filtros por aba: Todos, Pizzas, Promoções, Bebidas
- Cards de produtos com foto, nome, categoria e preço. Botão **+** para adicionar
- Pizzas têm badge **"Personalizar"** — abre o pizza builder
- **Carrinho direito**: lista de itens, subtotal, total e botão **Finalizar Venda →**
- Campo de busca **"Buscar item..."** no topo do catálogo

**Fluxo:** Selecionar produto → Adicionar ao carrinho → Finalizar Venda → Registrar pagamento → Imprimir recibo

---

### Tela 4 — KDS (Cozinha)

![KDS - Kitchen Display System](screens/admin_04_kds.png)

**Descrição:**
- Sistema de display da cozinha em tempo real
- 3 colunas kanban: **Pendentes** | **Em Preparo** | **Prontos para Servir**
- Cada card de pedido exibe: código do pedido, mesa, itens com quantidade, timer cronômetro
- Badge de status: `PREPARANDO` (roxo), `PRONTO` (verde)
- Botão **PRONTO** verde para avançar o status
- Botões de ação: 🖨️ reimprimir comanda, 🔍 ver detalhes
- Atualização automática a cada 10 segundos (polling Livewire)
- Contadores no topo: PENDENTES · PREPARANDO · PRONTOS

**Fluxo:** Pendente → [Clicar Preparando] → Em Preparo → [Clicar Pronto] → Prontos para Servir → Entregue

---

### Tela 5 — Mapa do Salão

![Mapa do Salão](screens/admin_05_floor.png)

**Descrição:**
- Grid visual de todas as mesas do restaurante
- 3 cards de sumário: **Total de Mesas** (10) · **Livres** (verde, 8) · **Ocupadas** (laranja, 2)
- Campo de busca de mesa
- Cards de mesa com: nome, status (badge colorido), capacidade, pedido ativo e valor
- **Mesa livre** (borda verde): botão "Clique para Abrir Mesa"
- **Mesa ocupada** (borda laranja): exibe nº do pedido, tempo e valor atual
- Botão **Editar Layout** no topo direito para modo de edição

**Status de cores:**
- 🟢 Verde = Livre
- 🟠 Laranja = Ocupada
- 🟡 Amarelo = Aguardando Pagamento

---

### Tela 6 — Controle de Caixa

![Controle de Caixa](screens/admin_06_caixa.png)

**Descrição:**
- Gestão financeira completa do turno
- Badge de status: **CAIXA ABERTO** (verde)
- 4 cards financeiros: **Saldo Inicial** · **Vendas Dinheiro** · **Trocos Entregues** · **Total em Gaveta**
- Seção **Vendas Totais** com **Resumo por Pagamento** (Dinheiro, Cartão de Débito, etc.)
- Seção **Fechar Caixa**: campo "Saldo em Caixa (Contado)" + campo de Observações
- Sistema calcula automaticamente a diferença (quebra de caixa)
- **Bloqueio automático**: não permite fechar com pedidos pendentes

**Fluxo de abertura:** Abrir Caixa → informar Saldo Inicial → confirmar
**Fluxo de fechamento:** Contar gaveta → lançar valor → Sistema calcula diferença → fechar

---

### Tela 7 — Relatórios Analíticos

![Relatórios Analíticos](screens/admin_07_relatorios.png)

**Descrição:**
- Dashboard analítico com consolidação de dados
- 3 cards de KPIs: **Receita Total** · **Total de Pedidos** · **Ticket Médio**
- Gráfico **"Top Produtos Mais Vendidos"** com barras de progresso
- Gráfico **"Tipo de Pedido"** (salão vs delivery)
- Botão **Exportar Dados** no topo direito

---

### Tela 8 — Configurações de Impressora

![Configurações de Impressora](screens/admin_08_impressora.png)

**Descrição:**
- Seção: Configurações → Impressoras
- Menu interno: Perfil do Negócio · Impressão e Recibos · **Impressoras** · Integrações
- Área central: Impressoras Configuradas
- Botão **+ Nova Impressora** (roxo)
- Conexão via rede TCP/IP (IP + Porta)
- Suporte a 2 impressoras: Cozinha e Caixa

---

## Instância 2 — App do Garçom (porta 8001)

**Acesso:** http://localhost:8001
**Usuário:** waiter@pedidofeito.com / password
**Perfil:** Garçom em campo

Interface mobile-first para o garçom, mostrando mesas e permitindo lançar pedidos diretamente da mesa.

> **Nota técnica:** A interface do garçom também está acessível em http://localhost:8000 com login do garçom, como uma SPA embutida no sistema principal.

---

### Tela 1 — Mapa de Mesas (Garçom)

![App Garçom - Mesas](screens/waiter_02_mesas.png)

**Descrição:**
- Saudação personalizada: "BOA TARDE — Garçom 👋"
- Sumário horizontal: **Total (10)** · **Livres (verde, 8)** · **Ocupadas (laranja, 2)**
- Grid de mesas em 2 colunas (mobile-first)
- **Mesa livre**: borda verde sutil, status "Disponível" em verde
- **Mesa ocupada**: fundo avermelhado, exibe valor e tempo ativo
- Navbar inferior com 3 abas: **MESAS** (ativo) · **COMANDAS** · **PERFIL**

---

### Tela 2 — Pizza Builder (Modal)

![App Garçom - Montar Pizza](screens/waiter_03_pizza_tab.png)

**Descrição:**
- Modal **"Montar Pizza"** com paginação por dots (3 passos)
- **Passo 1 — Escolha o tamanho:**
  - Card **Broto**: 6 fatias • Até 1 sabor → [SELECIONAR →]
  - Card **Grande**: 12 fatias • Até 3 sabores → [SELECIONAR →]
- Rodapé: **TOTAL DA PIZZA** em tempo real

**Passos do wizard:**
1. Escolha o tamanho (Broto / Grande)
2. Selecione os sabores (respeitando max_flavors)
3. Confirme e adicione ao pedido

---

### Tela 3 — Adicionar Itens (Drawer)

![App Garçom - Adicionar Itens](screens/waiter_04_produto_tab.png)

**Descrição:**
- Drawer deslizante over the mesa selecionada
- Header: nome da mesa + status + capacidade
- Abas: **Conta Atual** | **Adicionar Itens** (ativo)
- Seção ADICIONAR ITENS:
  - Campo **Buscar produto...**
  - Filtros por categoria: Todos · Pizzas · Promoções · Bebidas
  - Item especial: **Montar Pizza Personalizada** (roxo destacado, com seta →)
  - Lista de produtos com nome, categoria e preço
  - Botão **+** para adicionar rapidamente

---

### Tela 4 — Conta Atual (Carrinho)

![App Garçom - Conta Atual](screens/waiter_05_carrinho.png)

**Descrição:**
- Aba **Conta Atual** da mesa selecionada
- Header da mesa: status **OCUPADA** · 4 LUGARES
- Código interno do pedido: **#HGMKB**
- Total do pedido em destaque: **R$ 80,00**
- Lista de itens com quantidade e frações de sabor:
  - `1x Pizza Grande` — 1/3 Champignon, 1/3 Chocolate Branco com Abacaxi, 1/3 Brócolis — R$ 80,00
- Botão vermelho **Encerrar Conta** na base

---

## Instância 3 — Cardápio Digital (porta 8002)

**Acesso:** http://localhost:8002 (Flutter Web — main.dart)
**Usuário:** Sem autenticação — acesso público para o cliente
**Perfil:** Cliente do restaurante

> **Status:** Instância planejada / em desenvolvimento. A tela Flutter de boas-vindas (`/`) com seletor de idioma e o pizza builder visual estão implementados no código mas requerem inicialização separada com `flutter run -d web-server --web-port=8002 -t lib/main.dart`.

**Telas mapeadas no código (GoRouter):**

| Rota | Tela | Descrição |
|---|---|---|
| `/` | Welcome Screen | Seleção de idioma (pt-BR, en-US, es-ES) |
| `/menu` | Menu Screen | Cardápio por categorias + busca |
| `/pizza-builder` | Pizza Builder Screen | Montador visual circular com preview |
| `/identify` | Customer Identification | Nome + telefone do cliente |
| `/checkout` | Checkout Screen | Tipo de atendimento + pagamento |

---

## Fluxo Operacional Completo

### 🔵 Fluxo 1 — Venda pelo App Garçom (Mesa no Salão)

```
[1] Garçom faz login no App (porta 8001)
         ↓
[2] Tela de MESAS → seleciona uma mesa livre
         ↓
[3] Drawer abre → aba "Adicionar Itens"
         ↓
[4a] Adiciona PIZZA:
     Clica "Montar Pizza Personalizada"
     → Escolhe tamanho (Broto / Grande)
     → Seleciona sabores (1 a 3)
     → Preço calculado automaticamente
         ↓
[4b] Adiciona PRODUTO:
     Busca ou seleciona da lista
     → Toca "+" para adicionar
         ↓
[5] Aba "Conta Atual" → revisa pedido
         ↓
[6] Confirma envio → POST /api/orders
         ↓
[7] Mesa fica OCUPADA
         ↓
[8] ADMIN/KDS recebe pedido como "Em Preparo"
         ↓
[9] KDS cozinha → clica PRONTO → status "Pronto"
         ↓
[10] Garçom entrega → Mesa vai para "Entregue"
         ↓
[11] Admin: PDV → Finalizar Venda → registra pagamento
         ↓
[12] Mesa volta para LIVRE | Caixa registra venda
```

---

### 🟣 Fluxo 2 — Venda pelo PDV do Admin (Balcão ou Delivery)

```
[1] Admin faz login no Painel (porta 8000)
         ↓
[2] Abre o CAIXA (se não aberto)
     → Informa saldo inicial
         ↓
[3] Menu → PDV
         ↓
[4] Seleciona modo: Balcão / Mesa Específica / Delivery
         ↓
[5] Catálogo: clica nos produtos/pizzas
     → Pizzas: clica "Personalizar" → pizza builder abre
         ↓
[6] Carrinho direito atualiza em tempo real
         ↓
[7] Clica "Finalizar Venda →"
         ↓
[8] Modal de pagamento → seleciona método(s)
     Dinheiro → informa valor → calcula troco
     Cartão → seleciona Débito/Crédito
     PIX → gera QR Code
         ↓
[9] Impressora térmica → Comanda de cozinha (automático)
[9] KDS recebe pedido
         ↓
[10] KDS avança: Pendente → Preparando → Pronto → Entregue
         ↓
[11] PDV: imprimir recibo do cliente
         ↓
[12] Fim do turno: Admin → Caixa → Fechar Caixa
     → Informa valor contado
     → Sistema calcula diferença
     → Relatório de fechamento
```

---

### 🟢 Fluxo 3 — Pedido Online (Cardápio Digital para Delivery)

```
[1] Cliente acessa Cardápio Digital (porta 8002)
         ↓
[2] Seleciona idioma na Welcome Screen
         ↓
[3] Navega pelo Menu (categorias, busca)
         ↓
[4] Monta pizza no Pizza Builder visual
     ou adiciona produtos ao carrinho
         ↓
[5] Checkout → Identifica-se (nome, telefone)
         ↓
[6] Seleciona tipo: Delivery (endereço) / Retirada
         ↓
[7] Pagamento: PIX (QR Code) ou Cartão
     → Mercado Pago processa
     → Webhook retorna: approved
         ↓
[8] Pedido entra no sistema com status "paid_online"
         ↓
[9] Admin (PDV) recebe notificação → Aceita pedido
         ↓
[10] KDS cozinha → prepara → marca Pronto
         ↓
[11] Cliente acompanha status em tempo real (polling)
[11] Notificação WhatsApp disponível
```

---

## Resumo das Instâncias

| Instância | URL | Porta | Usuário | Tecnologia |
|---|---|---|---|---|
| **Painel Admin** | http://localhost:8000/admin | 8000 | admin@pedidofeito.com | Laravel + Filament + Livewire |
| **App Garçom** | http://localhost:8001 | 8001 | waiter@pedidofeito.com | Flutter Web (main_waiter.dart) |
| **Cardápio Digital** | http://localhost:8002 | 8002 | Público (cliente) | Flutter Web (main.dart) |

---

## Paleta de Cores do Sistema

| Cor | Uso | Significado |
|---|---|---|
| 🟣 Roxo (`#7C3AED`) | Ações principais, botões, menu ativo | Identidade da marca |
| 🟢 Verde | Mesa livre, caixa aberto, status OK | Disponível |
| 🟠 Laranja/Âmbar | Mesa ocupada, alertas | Atenção |
| 🔴 Vermelho | Encerrar conta, fechar caixa, erros | Ação destrutiva / urgente |
| ⚫ Dark (`#1a1a2e`) | Background geral | Dark mode premium |

---

*Documento gerado automaticamente • Pedido-Feito 2.0 • © Pixirica Produções 2026*
