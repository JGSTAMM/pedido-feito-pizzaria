<?php

namespace App\Application\Printing\Formatters;

use App\Models\Order;
use Mike42\Escpos\Printer;

class ReceiptFormatter
{
    protected int $paperWidth;

    public function __construct(int $paperWidth = 48)
    {
        $this->paperWidth = $paperWidth;
    }

    public function setPaperWidth(int $width): void
    {
        $this->paperWidth = $width;
    }

    protected function sanitizeSingleLine(?string $text, int $maxLength = 200): string
    {
        if ($text === null) {
            return '';
        }

        $cleaned = preg_replace('/[\r\n\t\x00-\x1F\x7F]+/u', ' ', $text) ?? '';
        $cleaned = trim(preg_replace('/\s+/u', ' ', $cleaned) ?? '');

        return mb_substr($cleaned, 0, $maxLength);
    }

    public function formatKitchenTicket(Printer $printer, Order $order): void
    {
        // Header
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->setTextSize(2, 2);
        $printer->text("COMANDA #{$order->id}\n");
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        $printer->text(str_repeat('=', $this->paperWidth)."\n");

        // Table/Time info
        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $tableName = $order->table?->name ?? 'Balcão';
        $time = $order->created_at->format('H:i');
        $printer->text("Mesa: {$tableName}");
        $printer->text(str_pad($time, $this->paperWidth - strlen("Mesa: {$tableName}"), ' ', STR_PAD_LEFT)."\n");

        // Delivery info block
        if ($order->type === 'delivery') {
            $printer->text(str_repeat('=', $this->paperWidth)."\n");
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->setEmphasis(true);
            $printer->text("*** DELIVERY ***\n");
            $printer->setEmphasis(false);
            $printer->setJustification(Printer::JUSTIFY_LEFT);

            if ($order->customer_name) {
                $printer->text('Cliente: '.$this->sanitizeSingleLine($order->customer_name, 80)."\n");
            }
            if ($order->customer_phone) {
                $printer->text('Fone: '.$this->sanitizeSingleLine($order->customer_phone, 40)."\n");
            }
            if ($order->delivery_address) {
                $printer->text('End: '.$this->sanitizeSingleLine($order->delivery_address, 140)."\n");
            }
            if ($order->delivery_complement) {
                $printer->text('Compl: '.$this->sanitizeSingleLine($order->delivery_complement, 100)."\n");
            }
            $order->load('neighborhood');
            if ($order->neighborhood) {
                $printer->text('Bairro: '.$this->sanitizeSingleLine($order->neighborhood->name, 80)."\n");
            }

            $printer->feed(1);

            // Payment Info on Kitchen Ticket
            $printer->setEmphasis(true);
            $printer->text("PAGAMENTO:\n");
            $printer->setEmphasis(false);

            foreach ($order->payments as $payment) {
                $method = $this->translatePaymentMethod($payment->method);
                $amount = number_format($payment->amount, 2, ',', '.');
                $printer->text("  {$method}: R$ {$amount}\n");
            }
            if ($order->change_amount > 0) {
                $change = number_format($order->change_amount, 2, ',', '.');
                $printer->text("  Troco p/: R$ {$change}\n");
            }

            if ($order->delivery_fee > 0) {
                $fee = number_format($order->delivery_fee, 2, ',', '.');
                $printer->text("Taxa Entrega: R$ {$fee}\n");
            }

            $total = number_format($order->total_amount, 2, ',', '.');
            $printer->setEmphasis(true);
            $printer->text("TOTAL: R$ {$total}\n");
            $printer->setEmphasis(false);
        }

        $printer->text(str_repeat('-', $this->paperWidth)."\n");

        // Order items
        $order->load(['items.product', 'items.pizzaSize', 'items.flavors']);

        foreach ($order->items as $item) {
            $printer->setEmphasis(true);

            if ($item->pizzaSize) {
                $printer->text("{$item->quantity}x Pizza {$item->pizzaSize->name}\n");
                $printer->setEmphasis(false);

                $flavors = $item->flavors->pluck('name')->join(' / ');
                if ($flavors) {
                    $printer->text("   {$flavors}\n");
                }
            } else {
                $productName = $item->product?->name ?? 'Item';
                $printer->text("{$item->quantity}x {$productName}\n");
                $printer->setEmphasis(false);
            }

            if (! empty($item->notes)) {
                $printer->setEmphasis(true);
                $printer->text('   OBS: '.$this->sanitizeSingleLine($item->notes, 200)."\n");
                $printer->setEmphasis(false);
            }
        }

        // Footer
        $printer->text(str_repeat('-', $this->paperWidth)."\n");
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->text(now()->format('d/m/Y H:i:s')."\n");
        $printer->text(str_repeat('=', $this->paperWidth)."\n");
    }

    public function formatCustomerReceipt(Printer $printer, Order $order): void
    {
        // Header
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->setTextSize(2, 1);
        $printer->text("PEDIDO FEITO\n");
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        $printer->text("Pizzaria\n");
        $printer->text(str_repeat('=', $this->paperWidth)."\n");

        // Order info
        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->text("Pedido: #{$order->id}\n");
        $printer->text('Data: '.$order->created_at->format('d/m/Y H:i')."\n");

        if ($order->customer_name) {
            $printer->text('Cliente: '.$this->sanitizeSingleLine($order->customer_name, 80)."\n");
        }

        $tableName = $order->table?->name ?? 'Balcão';
        $printer->text("Mesa: {$tableName}\n");

        if ($order->type === 'delivery') {
            $printer->text("Tipo: DELIVERY\n");
            if ($order->customer_phone) {
                $printer->text('Fone: '.$this->sanitizeSingleLine($order->customer_phone, 40)."\n");
            }
            if ($order->delivery_address) {
                $printer->text('End: '.$this->sanitizeSingleLine($order->delivery_address, 140)."\n");
            }
            if ($order->delivery_complement) {
                $printer->text('Compl: '.$this->sanitizeSingleLine($order->delivery_complement, 100)."\n");
            }
            $order->load('neighborhood');
            if ($order->neighborhood) {
                $printer->text('Bairro: '.$this->sanitizeSingleLine($order->neighborhood->name, 80)."\n");
            }
        }

        $printer->text(str_repeat('-', $this->paperWidth)."\n");

        // Items
        $order->load(['items.product', 'items.pizzaSize', 'items.flavors']);

        foreach ($order->items as $item) {
            if ($item->pizzaSize) {
                $name = "Pizza {$item->pizzaSize->name}";
                $flavors = $item->flavors->pluck('name')->join('/');
                if ($flavors) {
                    $name .= " ({$flavors})";
                }
            } else {
                $name = $item->product?->name ?? 'Item';
            }

            $qty = $item->quantity;
            $price = number_format($item->subtotal, 2, ',', '.');

            $line = "{$qty}x {$name}";
            $priceStr = "R$ {$price}";

            if (strlen($line) + strlen($priceStr) > $this->paperWidth) {
                $line = substr($line, 0, $this->paperWidth - strlen($priceStr) - 2).'..';
            }

            $printer->text($line.str_pad($priceStr, $this->paperWidth - strlen($line), ' ', STR_PAD_LEFT)."\n");

            if (! empty($item->notes)) {
                $printer->setEmphasis(true);
                $printer->text('   OBS: '.$this->sanitizeSingleLine($item->notes, 200)."\n");
                $printer->setEmphasis(false);
            }
        }

        if ($order->type === 'delivery' && $order->delivery_fee > 0) {
            $feeLine = 'Taxa Entrega:';
            $feePrice = 'R$ '.number_format($order->delivery_fee, 2, ',', '.');
            $printer->text($feeLine.str_pad($feePrice, $this->paperWidth - strlen($feeLine), ' ', STR_PAD_LEFT)."\n");
        }

        // Total
        $printer->text(str_repeat('-', $this->paperWidth)."\n");
        $printer->setEmphasis(true);
        $total = number_format($order->total_amount, 2, ',', '.');
        $totalLine = 'TOTAL:';
        $totalPrice = "R$ {$total}";
        $printer->text($totalLine.str_pad($totalPrice, $this->paperWidth - strlen($totalLine), ' ', STR_PAD_LEFT)."\n");
        $printer->setEmphasis(false);

        // Payment
        if ($order->payments->count() > 0) {
            $printer->text(str_repeat('-', $this->paperWidth)."\n");
            $printer->text("Pagamento:\n");
            foreach ($order->payments as $payment) {
                $method = $this->translatePaymentMethod($payment->method);
                $amount = number_format($payment->amount, 2, ',', '.');
                $printer->text("  {$method}: R$ {$amount}\n");
            }

            if ($order->change_amount > 0) {
                $change = number_format($order->change_amount, 2, ',', '.');
                $printer->text("  Troco: R$ {$change}\n");
            }
        }

        // Footer
        $printer->text(str_repeat('=', $this->paperWidth)."\n");
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->text("Obrigado pela preferencia!\n");
        $printer->text("Volte sempre!\n");
        $printer->feed(3);
    }

    public function formatTestReceipt(Printer $printer, string $printerType): void
    {
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->text("=== TESTE DE IMPRESSAO ===\n");
        $printer->text("Impressora: {$printerType}\n");
        $printer->text('Data: '.now()->format('d/m/Y H:i:s')."\n");
        $printer->text("Status: OK\n");
        $printer->text("==========================\n");
        $printer->feed(2);
    }

    protected function translatePaymentMethod(string $method): string
    {
        return match (strtolower($method)) {
            'dinheiro', 'cash' => 'Dinheiro',
            'pix', 'pix_online' => 'PIX Online',
            'pix_balcao' => 'PIX (Balcão)',
            'credito', 'credit' => 'Crédito',
            'credito_online' => 'Crédito Online',
            'debito', 'debit' => 'Débito',
            default => ucfirst($method),
        };
    }
}
