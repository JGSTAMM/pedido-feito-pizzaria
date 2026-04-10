# Clean Code Standards

## Objetivo
Padronizar decisões técnicas do Pedido Feito 2.0 para garantir previsibilidade, escalabilidade e segurança operacional em ambiente SaaS White Label.

## 1) Arquitetura e Isolamento de Domínio
- A regra de negócio deve viver em Application e Domain, nunca em Controllers, Views ou componentes de UI.
- Controllers são orquestradores finos: validar entrada, chamar Action ou Service, retornar resposta.
- É proibido duplicar regra crítica em múltiplos pontos. Deve existir uma única fonte de verdade por regra.
- Dependências devem apontar para dentro: Interface e Infraestrutura dependem do núcleo de domínio.
- Toda operação crítica com múltiplas gravações deve usar transação.

## 2) Regras Críticas do Produto
- Precificação Híbrida de pizza deve ser centralizada em serviço de domínio único, reutilizado por Web, API e Checkout Online.
- Box Lock do Caixa deve ser aplicado por política de domínio central, reutilizada em todos os fluxos de criação e fechamento.
- Nenhum fluxo pode calcular preço ou validar caixa por atalhos locais fora da camada de domínio.

## 3) Event-Driven para Impressão
- Impressão não pode bloquear requisição principal.
- Disparo deve ocorrer por evento de domínio emitido apos commit da transação.
- Impressão deve rodar em Job de fila com retry, backoff, timeout e idempotência.
- Falhas de impressão devem ser observáveis e auditáveis, sem quebrar o fluxo principal de pedido.

## 4) Frontend White Label (Web)
- Padrão visual oficial: Vanilla CSS modular orientado a tokens globais.
- Evitar acoplamento estrutural a utilitários de framework CSS para regras de branding por tenant.
- Tokens globais obrigatórios: cor, tipografia, raio, sombra, espaçamento e estados semânticos.
- Qualquer tela nova deve suportar rebranding por substituição de variáveis CSS, sem reescrever componente.

## 5) Performance
- Carregamento inicial deve privilegiar code splitting por página.
- Renderizações custosas devem ser memorizadas apenas quando houver ganho mensurável.
- Evitar waterfall de requisições; usar paralelismo quando não houver dependência.
- Operações pesadas e integrações externas devem ser assíncronas por fila.

## 6) Segurança e Consistência
- Autenticação e autorização devem usar mecanismos nativos do framework e policies explícitas.
- Mensagens de erro para API devem ser estruturadas e consistentes.
- Webhooks e integrações externas devem ter validação de assinatura e proteção contra replay.

## 7) Qualidade e Testes
- Toda regra de negócio crítica exige testes de unidade e integração.
- Testes obrigatórios: precificação híbrida, box lock, fluxo de fechamento de caixa, jobs de impressão.
- Qualquer regressão em regra crítica bloqueia merge.

## 8) Convenções de Implementação
- Nomes devem revelar intenção do domínio, sem abreviações opacas.
- Funções pequenas, coesas e com responsabilidade única.
- Comentários apenas quando explicarem contexto de negócio, não obviedades de código.
- Evitar estado global implícito e dependências ocultas.

## 9) Definição de Pronto
Uma entrega só é considerada pronta quando:
- Regra está centralizada na camada correta.
- Não existe duplicação de regra crítica.
- Existem testes cobrindo caminho feliz e cenários de bloqueio.
- Logs e observabilidade permitem diagnosticar falhas de produção.
