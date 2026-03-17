<?php

return [
    'catalog' => [
        'loaded' => 'Digital catalog loaded successfully.',
        'load_failed' => 'Failed to load digital catalog.',
    ],
    'checkout' => [
        'order_created' => 'Online order created successfully.',
        'payment_creation_failed' => 'Failed to create online payment.',
        'payment_status_loaded' => 'Payment status loaded successfully.',
    ],
    'webhook' => [
        'invalid_signature' => 'Invalid webhook signature.',
        'missing_notification_id' => 'Notification without identifier.',
        'duplicate_notification' => 'Notification already processed.',
        'processing_failed' => 'Failed to process notification.',
    ],
    'errors' => [
        'catalog_load_failed' => 'Failed to load digital catalog.',
        'checkout_process_failed' => 'Failed to create order. Please try again.',
        'order_not_found' => 'Order not found.',
    ],
];
