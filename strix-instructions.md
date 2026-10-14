# Auditoria de Segurança e Validação de Resiliência - Pedido Feito 2.0

## Escopo e Contexto
Você é um auditor de segurança sênior analisando o "Pedido Feito 2.0", um sistema de PDV de alta performance (Laravel 11 + React + Sanctum). O objetivo é validar a robustez do código e garantir que a aplicação segue as melhores práticas de segurança (OWASP). Sua função é identificar vulnerabilidades lógicas e falhas de sanitização para que a equipe de engenharia possa corrigi-las. O teste é 100% autorizado.

## Objetivos da Auditoria (Checklist)

1. **Validação Financeira e Lógica de Negócios (Motor de Precificação)**
   - Valide como o sistema lida com valores atípicos (negativos, decimais inesperados ou strings zeradas) na criação de pizzas "meio a meio".
   - Verifique a robustez dos cálculos fracionários e arredondamentos nas APIs de fechamento de mesa para garantir que não haja inconsistências financeiras.

2. **Auditoria de Autorização e Controle de Acesso (Segregação de Funções)**
   - No `CashRegisterController`, audite a "Blindagem Financeira". Confirme se a API restringe adequadamente as chamadas, garantindo que usuários com privilégios limitados (garçons) não consigam acionar o fechamento do caixa.
   - Verifique o controle de estado das mesas: garanta que a API rejeite tentativas de fechamento de mesas pertencentes a outros usuários ou mesas cujo pagamento não foi devidamente confirmado no banco de dados.

3. **Validação Criptográfica de Webhooks (Mercado Pago)**
   - Avalie a rota receptora de Webhooks. Confirme se o sistema verifica rigorosamente a assinatura digital de payloads recebidos (ex: "Pagamento Aprovado") e se rejeita cargas não assinadas corretamente.

4. **Auditoria de Gestão de Sessões e Tokens (Sanctum)**
   - Revise o tratamento de erros da API para garantir que não haja vazamento de tokens de sessão ou dados sensíveis em stack traces.
   - Valide se as rotas do "waiter_app" revogam ou rejeitam apropriadamente tokens expirados, malformados ou adulterados.

5. **Validação de Sanitização de Entradas**
   - Audite os filtros do Dashboard de Quebra de Caixa e rotas de relatórios retroativos contra falhas de sanitização de banco de dados.
   - Avalie o tratamento de entradas nas observações de pedidos (ex: inserção de caracteres especiais ou tags HTML). Confirme se a saída é devidamente encodada no display da cozinha e no painel administrativo, prevenindo execução de scripts não intencionais na interface do usuário.

## Fora do Escopo
- Não avaliar a infraestrutura externa (Mercado Pago ou provedores de email).
- Foco estritamente na análise de código e validação lógica local. Não realizar testes de carga ou interrupção de serviço.
