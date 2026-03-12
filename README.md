<div align="center">
  <img src="public/build/assets/logo-sr-sra-lucchese.png" alt="Logo Sr. & Sra. Lucchese" width="200"/>
  <h1>Sr. & Sra. Lucchese - Pizzaria Gourmet</h1>
  <p><strong>Um Sistema PDV de Alta Performance Feito no "Calor do Salão"</strong></p>
  
  <p>
    <a href="#sobre-o-projeto">Sobre</a> •
    <a href="#features-complexas">Features Híbridas</a> •
    <a href="#stack-tecnológica">Tecnologias</a> •
    <a href="#sobre-o-desenvolvedor">O Desenvolvedor</a>
  </p>
</div>

---

## 🍕 Sobre o Projeto

**"Pedido Feito 2.0 - Edição Lucchese"** não é um PDV de gaveta ou um projeto genérico de portfólio. É um sistema de gestão ponta-a-ponta desenhado para aguentar o *tranco e a velocidade* de uma operação de restaurante real, especificamente moldado para a alta gastronomia da pizzaria **Sr. & Sra. Lucchese**.

A maior dor do mercado de softwares para restaurantes é que eles são construídos por engenheiros que nunca serviram uma mesa na sexta-feira à noite. Este projeto, por outro lado, une arquitetura de software de ponta com o fluxo verdadeiro, caótico e implacável do salão de um restaurante cheio.

---

## 🚀 Features Complexas Reais (Battle-Tested)

Diferente de sistemas comuns de CRUD, o **Sr. & Sra. Lucchese** resolve dores matemáticas e operacionais em tempo real:

### 1. Precificação Inteligente de Pizzas (Motor Híbrido)
Restaurantes sofrem ao precificar pizzas "meio a meio", frequentemente dependendo do maior valor ou de cálculos manuais lentos. Nosso motor backend de pedidos calcula dinamicamente com base em **taxa fixa interligada**. 
Se uma pizza de dois sabores possui proporções díspares e extras atrelados a apenas uma de suas metades, o sistema isola o custo do sabor mais caro, aplica as deduções de custo fracionado e atualiza a Web App do Garçom e o Display da Cozinha instantaneamente via API.

### 2. Blindagem Financeira de Caixa (Box Lock)
O momento do fechamento de caixa é onde acontecem 90% das perdas fiscais de um restaurante. Implementamos uma arquitetura de segurança nível servidor no `CashRegisterController` que torna o sistema **à prova de desculpas**:
- **Trava Paralisante:** É matematicamente impossível para o gerente ou operador fechar o caixa no sistema se existirem comandas esquecidas (Pedidos pendentes, em preparo, concluídos, porém sem a flag de pagamento final atestada no Banco de Dados). Não existem "pedidos fantasmas". O PDV se recusa a fechar sem a correta conciliação.
- **Auditoria Histórica Intocável:** Com apenas dois toques no Date Picker do Web Panel da matriz, donos puxam o relatório retroativo.
- **Flash Summary Instantâneo:** Resumo em Dashboard com cores indicativas (Verde/Vermelho) apontando discrepâncias (Quebras de Caixa) calculando a diferença automática entre (Abertura + Vendas Físicas - Troco) vs (Dinheiro real da Gaveta).

---

## 💻 Stack Tecnológica

Sistema dividido em 3 camadas assíncronas projetadas para resiliência:

- **Painel Administrativo & Gestão de Loja:** 
  - `PHP 8.3` | `Laravel 11` | `React 18`
  - Renderização via **Inertia.js** (Zero page refresh SPA)
  - Layout e Interface desenhados do *Zero* em Vanilla CSS com classes focadas em performance visual.
- **App Nuvem do Garçom & Gestão Móvel:** 
  - `Flutter 3.` | `Dart` 
  - Consumo via APIs JSON nativas autenticadas por Sanctum.
- **Storage & Cloud Database:**
  - Banco de Dados Relacional otimizado para leituras pesadas (`MySQL/MariaDB`).
  - Event-Driven Architecture para fila de impressoras de comanda IP.

---

## 👨‍🍳 Sobre o Desenvolvedor

### **João Gabriel (Fundador - Pixirica Produções)**
O projeto transborda arquitetura de ponta e fluidez de tela, e isso não é por acaso. João Gabriel não é apenas um desenvolvedor; ele possui **13 anos de vivência ininterrupta atuando em salões e sistemas de pizzaria reais**.

Essa combinação única de **Engenharia de Software Moderna + Background de 13 Anos Operando Pizzarias de Alto Movimento** provou ser um diferencial de ouro. João sabe exatamente onde a interface precisa de um botão gigante para um garçom suado clicar com pressa, por que um *Toast* verde precisa saltar na tela após o sucesso num sábado à noite ensurdecedor, e domina intelectualmente os gargalos lógicos de fluxo de mesa, cozinha e quebra de caixa.

**Pixirica Produções** traduz a poeira e o estresse da realidade do restaurante numa experiência digital lisa, estável e lucrativa.

---

<div align="center">
  <p>Software com Alma • Desenvolvido por Pixirica Produções © 2026</p>
</div>
