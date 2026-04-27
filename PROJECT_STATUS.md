# 🚀 Status do Projeto: Pedido-Feito 2.0

**Data:** 27/04/2026
**Estado Atual:** Sistema robusto, seguro e performático — PDV, KDS, Menu Digital (Checkout Online), App Garçom, Mapa do Salão.
**Stack:** PHP 8.5, Laravel 12, Filament 3, React (Inertia.js), Flutter, MySQL

---

## 📋 Features Implementadas

### Painel Admin (Laravel/Filament)
- **PDV (Caixa)** — Grid de produtos, pizza builder, carrinho multi-modo, pagamentos parciais/múltiplos, integração com caixa.
- **Controle de Caixa** — Abertura, fechamento e resumo de vendas integrado ao PDV.
- **KDS (Cozinha)** — Dashboard em tempo real, filtros por categoria e suporte a impressão de tickets.
- **Mapa do Salão** — Layout interativo para gestão de ocupação e pedidos de mesa.

### Menu Digital & Checkout (React/Inertia)
- **Catálogo Online** — Interface premium para clientes, Pizza Builder customizado.
- **Checkout Integrado** — Suporte a Delivery, Balcão e Mesa (via QR Code).
- **Pagamentos Online** — Integração com Mercado Pago (PIX) e sincronização via Webhooks.
- **Status em Tempo Real** — Acompanhamento do pedido pelo cliente via polling otimizado.

### App Garçom (Flutter)
- **Sincronização em Tempo Real** — Autenticação e consumo de dados via API.
- **Pizza Builder Avançado** — Suporte total a frações, sabores e bordas.

---

## 🛡️ Segurança & Estabilidade (Sprint Zero-Bug)
- **Proteção Anti-DDoS** — Rate limiting (Throttle) em rotas públicas de checkout e webhooks.
- **Integridade de Dados** — Tratamento rigoroso de Mass Assignment e validação de estoque (`findOrFail` em checkout).
- **Concorrência (Race Conditions)** — Implementação de `lockForUpdate` em pagamentos e adição de itens para evitar cobranças duplicadas.
- **Otimização de Performance** — Queries de relatórios com escopo temporal (30 dias) e eager loading para evitar N+1.
- **Frontend Health** — Correção de memory leaks em componentes React através de cleanup de timeouts.

---

## ⚠️ Notas Técnicas
- **Iniciar servidor:** `php artisan serve`
- **Iniciar Vite:** `npm run dev`
- **Iniciar app Flutter:** `flutter run -d chrome` (diretório `waiter_app/`)
- **Webhooks:** Mercado Pago configurado via `APP_URL` para processamento assíncrono.

---

## 📂 Estrutura Principal
- `app/Http/Resources/` — Transformação de dados para API.
- `app/Filament/Pages/` — PDV, KDS, Floor, CashRegisterPage.
- `resources/js/Pages/` — Componentes React do Menu Digital.
- `app/Services/` — PizzaPriceService, PrintService.
- `waiter_app/` — Código fonte do aplicativo mobile/tablet.
