# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.0.0] - 2026-05-27

### 🛡️ Segurança
- **Vazamento de Dados Resolvido:** Adicionadas restrições rigorosas (`$hidden`) no modelo `StoreSetting` e escopo explícito no `HandleInertiaRequests` para evitar a exposição global de tokens sensíveis (como os do Mercado Pago e Google Maps).
- **Vetor de Injeção Eliminado:** O sistema parou de escrever chaves de API diretamente no arquivo `.env`, o que apresentava riscos de injeção. As chaves agora são armazenadas de forma segura apenas no banco de dados.
- **Prevenção de XSS:** Removido o uso de `dangerouslySetInnerHTML` na renderização de botões de paginação, substituído por uma função segura de tratamento de HTML entities.
- **Remoção de Dados de Teste:** Excluído o CPF hardcoded (19119119100) usado em ambiente de sandbox do Mercado Pago, garantindo a viabilidade dos pagamentos via PIX em produção.

### ⚡ Performance
- **Otimização do Dashboard (Cache):** Consultas pesadas de consolidação de estatísticas no dashboard agora estão cacheadas, resolvendo gargalos críticos de N+1 queries gerados quando múltiplas instâncias da página ficam abertas.
- **Paginação de Pedidos:** A interface de listagem de pedidos agora utiliza paginação assíncrona ao invés de carregar o limite fixo de 100 registros.
- **Otimização do Repositório:** Excluído o `.phar` do Composer do rastreamento do Git e removidos arquivos legados e diretórios não utilizados.

### 🎨 UI / UX
- **Correção da Paginação React:** Interceptadas as chaves de tradução brutas vindas do backend (`pagination.previous` / `pagination.next`), exibindo em seu lugar ícones modernos em conformidade com o design system *Glassmorphism*.
- **Pagamentos e Modal:** Ajuste fino na visualização de pagamentos múltiplos ("split") e correções na passagem de eventos sintéticos para prevenir crashes na interface.
- **Responsividade do Checkout:** Redução tática da fonte do botão "Ampliar QR Code" no PIX para melhorar a experiência em dispositivos mobile compactos.
- **Saneamento de Payload:** Garantia de que envios de itens de pagamento incorretos sejam sanitizados antes do disparo, evitando exceções no frontend.
