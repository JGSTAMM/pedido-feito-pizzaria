<?php

return [
    'create' => [
        'success' => 'Order created successfully.',
        'cash_register_closed' => 'Operation blocked: Cash register is closed. Ask the manager to open the cash register.',
        'error' => 'Error creating order.',
    ],
    'cash_register' => [
        'close_blocked_pending' => 'Operation blocked: There are :count open or unpaid order(s). Complete or cancel all tabs before closing the register.',
    ],
    'payment' => [
        'no_active_orders' => 'No active orders.',
        'insufficient_amount' => 'Insufficient paid amount.',
        'success' => 'Table paid and closed successfully.',
        'error' => 'Error processing payment.',
    ],
];
