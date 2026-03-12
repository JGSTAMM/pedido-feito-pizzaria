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
];
