<?php

return [
    'catalog' => [
        'loaded' => 'Catalogo digital carregado com sucesso.',
        'load_failed' => 'Falha ao carregar o catalogo digital.',
    ],
    'checkout' => [
        'order_created' => 'Pedido online criado com sucesso.',
        'payment_creation_failed' => 'Falha ao criar pagamento online.',
        'payment_status_loaded' => 'Status do pagamento carregado com sucesso.',
    ],
    'availability' => [
        'store_closed' => 'A loja está fechada no momento e não está recebendo pedidos online.',
        'cash_register_closed' => 'O caixa ainda está fechado no momento. Aguarde a abertura para fazer seu pedido online.',
        'outside_hours' => 'Estamos fora do horário de atendimento no momento.',
        'outside_hours_with_schedule' => 'Estamos fora do horário de atendimento no momento (hoje: :hours).',
    ],
    'webhook' => [
        'invalid_signature' => 'Assinatura invalida do webhook.',
        'missing_notification_id' => 'Notificacao sem identificador.',
        'duplicate_notification' => 'Notificacao ja processada.',
        'processing_failed' => 'Falha ao processar notificacao.',
    ],
    'errors' => [
        'catalog_load_failed' => 'Falha ao carregar o catalogo digital.',
        'checkout_process_failed' => 'Erro ao criar pedido. Tente novamente.',
        'order_not_found' => 'Pedido nao encontrado.',
        'unauthorized_order_access' => 'Voce nao tem permissao para consultar este pedido.',
    ],
];
