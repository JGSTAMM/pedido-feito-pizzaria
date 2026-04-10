<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Printer Settings
    |--------------------------------------------------------------------------
    |
    | Configure your thermal printers here. You can have separate printers
    | for kitchen (comandas) and cashier (receipts).
    |
    */

    'kitchen' => [
        'enabled' => env('PRINTER_KITCHEN_ENABLED', false),
        'type' => env('PRINTER_KITCHEN_TYPE', 'network'), // network, usb, file
        'ip' => env('PRINTER_KITCHEN_IP', '192.168.1.100'),
        'port' => env('PRINTER_KITCHEN_PORT', 9100),
    ],

    'cashier' => [
        'enabled' => env('PRINTER_CASHIER_ENABLED', false),
        'type' => env('PRINTER_CASHIER_TYPE', 'network'),
        'ip' => env('PRINTER_CASHIER_IP', '192.168.1.101'),
        'port' => env('PRINTER_CASHIER_PORT', 9100),
    ],

    /*
    |--------------------------------------------------------------------------
    | Print Settings
    |--------------------------------------------------------------------------
    */

    'auto_print_kitchen' => env('PRINTER_AUTO_KITCHEN', true),
    'auto_print_receipt' => env('PRINTER_AUTO_RECEIPT', false),
    'paper_width' => env('PRINTER_PAPER_WIDTH', 48), // characters per line (58mm=32, 80mm=48)

    'idempotency' => [
        'completion_ttl_seconds' => (int) env('PRINTER_IDEMPOTENCY_TTL_SECONDS', 86400),
        'job_unique_for_seconds' => (int) env('PRINTER_JOB_UNIQUE_FOR_SECONDS', 3600),
    ],

    'retries' => [
        'network_backoff_seconds' => [10, 30, 60],
        'job_timeout_seconds' => (int) env('PRINTER_JOB_TIMEOUT_SECONDS', 30),
        'max_attempts' => (int) env('PRINTER_JOB_MAX_ATTEMPTS', 3),
    ],
];
