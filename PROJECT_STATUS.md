# 🚀 Status do Projeto: Pedido-Feito 2.0

**Data:** 05/03/2026
**Estado Atual:** Sistema estável e refinado — PDV, KDS, App Garçom, Mapa do Salão, Controle de Caixa.
**Stack:** PHP 8.5, Laravel 12, Filament 3, Flutter (Web/Mobile), MySQL

---

## 📋 Features Implementadas

### Painel Admin (Laravel/Filament)
- **PDV (Caixa)** — Grid de produtos, pizza builder, carrinho multi-modo (balcão, mesa, delivery), pagamentos parciais/múltiplos, impressão de recibo.
- **Controle de Caixa** — Abertura, fechamento com conferência de saldo e resumo por forma de pagamento integrados ao PDV.
- **KDS (Cozinha)** — Gerenciamento de status (Pendente, Preparando, Pronto, Entregue), ticket de cozinha, filtros por categoria.
- **Mapa do Salão** — Interface interativa para gestão de mesas e layout do estabelecimento.
- **Relatórios & Histórico** — Acompanhamento de vendas e fechamentos de caixa.
- **Configurações de Impressora** — Gestão de IPs e portas para impressoras térmicas via banco de dados.

### App Garçom (Flutter)
- **Sincronização em Tempo Real** — Autenticação e consumo de dados via API.
- **Pizza Builder Avançado** — Suporte total a frações, sabores e bordas conforme o backend.
- **Refinação de Código** — Migração para padrões Dart 3 (switch expressions) para melhor performance e legibilidade.

### Backend/API (Arquitetura)
- **Standardized API** — Utilização de `JsonResource` para respostas previsíveis e limpas.
- **Model Accessors** — Atributos automáticos como `image_url` para facilitar consumo pelo Flutter.
- **Services** — `PizzaPriceService` (cálculo complexo) e `PrintService` (ESC/POS via Rede).

---

## ⚠️ Notas Técnicas
- **Iniciar servidor:** `php artisan serve --port=8000`
- **Iniciar app Flutter:** `flutter run -d chrome --web-port=3000` (diretório `waiter_app/`)
- **Banco de Dados:** MySQL 8 (primário/produção, ex: `lucchese_pizza`). O SQLite é usado exclusivamente para os pipelines de testes automatizados.
- **Imagens:** Armazenadas em `storage/app/public/` (disk `public` configurado globalmente).

---

## 📂 Estrutura Principal
- `app/Http/Resources/` — Transformação de dados para API.
- `app/Filament/Pages/` — PDV, KDS, Floor, CashRegisterPage, etc.
- `app/Services/` — PizzaPriceService, PrintService.
- `waiter_app/lib/features/` — Módulos Flutter (auth, menu, order).
