<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        // For Phase 3.5, this is just a static visual shell that loads successfully
        return Inertia::render('Settings/Index', [
            'tenant' => [
                'name' => 'Pedido Feito',
                'cnpj' => '00.000.000/0001-00',
            ],
            'printers' => [
                ['id' => 1, 'name' => 'Caixa (Epson T20)', 'type' => 'receipt', 'target' => 'cash_register', 'status' => 'online'],
                ['id' => 2, 'name' => 'Cozinha Principal', 'type' => 'production', 'target' => 'kitchen', 'status' => 'online'],
            ]
        ]);
    }
}
