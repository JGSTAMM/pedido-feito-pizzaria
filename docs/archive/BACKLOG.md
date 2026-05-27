# 📌 Backlog & Próximos Passos — Pedido-Feito 2.0

**Atualizado:** 28/02/2026

## ✅ Concluído (Fevereiro/2026)

- [x] **PDV (Caixa)**: Fluxo completo de venda com suporte a Delivery e Salão.
- [x] **Controle de Caixa**: Gestão de abertura/fechamento integrada ao PDV.
- [x] **KDS (Cozinha)**: Fluxo de status (Preparando -> Pronto -> Entregue) com ticket de impressão.
- [x] **Mapa do Salão**: Gestão interativa de mesas e fechamento de conta por mesa.
- [x] **API Refinada**: Padronização com `JsonResource` e novos accessors nos Models.
- [x] **Flutter Modernizado**: Migração para padrões Dart 3 no App Garçom.
- [x] **Impressão Térmica**: Configurações via banco de dados e suporte a rede (IP/Porta).
- [x] **Bairros**: 48 bairros configurados com taxas de entrega automáticas no PDV.

## 🔴 Próximos — Prioridade Alta

- [ ] **Notificações Push**: Alertar o Garçom (no app) quando o pedido for marcado como "Pronto" no KDS.
- [ ] **Integração de Pagamento Online**: Suporte inicial para PIX dinâmico (com QR Code gerado no PDV).
- [ ] **Validação de Estoque**: Alerta de "Produto Esgotado" baseado no cadastro.

## 🟡 Próximos — Prioridade Média

- [ ] **Relatórios Avançados**: Gráficos de vendas mensais e ticket médio por dia.
- [ ] **Dashboard Marketplace**: Visão geral para futura integração com apps de entrega terceiros.
- [ ] **Feedback de Impressão**: Melhorar logs e alertas visuais no PDV quando uma impressora estiver offline.

## 🟢 Próximos — Prioridade Baixa

- [ ] **Testes Automatizados**: Cobertura das rotas de API e cálculos do `PizzaPriceService`.
- [ ] **Limpeza de Migrations**: Consolidar estrutura do banco de dados para produção.
- [ ] **Multi-tenancy**: Estudo para migração para arquitetura SaaS.
