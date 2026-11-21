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
    'availability' => [
        'store_closed' => 'The store is currently closed and not accepting online orders.',
        'cash_register_closed' => 'The cash register is currently closed. Please wait until it opens to place an online order.',
        'outside_hours' => 'We are currently outside our opening hours.',
        'outside_hours_with_schedule' => 'We are currently outside our opening hours (today: :hours).',
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
        'unauthorized_order_access' => 'You do not have permission to view this order status.',
    ],
];
