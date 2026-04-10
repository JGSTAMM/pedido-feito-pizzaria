<?php

namespace App\Services;

use App\Application\Printing\Exceptions\PrinterHardwareException;
use App\Application\Printing\Exceptions\PrinterNetworkException;
use App\Models\Order;
use App\Models\PrinterSetting;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\Printer;
use Illuminate\Support\Facades\Log;

class PrintService
{
    protected int $paperWidth;

    public function __construct()
    {
        $this->paperWidth = (int) $this->getSetting('paper_width', 48);
    }

    protected function getSetting($key, $default = null)
    {
        // Simple caching could be added here
        return PrinterSetting::where('key', $key)->value('value') ?? $default;
    }

    /**
     * Print kitchen ticket (comanda)
     */
    public function printKitchenTicket(Order $order): bool
    {
        if ($this->getSetting('kitchen_enabled') !== 'true') {
             // Log::info('Kitchen printer disabled'); 
             // Commented out to avoid spamming logs if disabled is default
            return false;
        }

        try {
            $printer = $this->connectToPrinter('kitchen');

            // ... (rest of the printing logic remains similar, just ensuring paperWidth is used from property)
            
            // Header
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->setEmphasis(true);
            $printer->setTextSize(2, 2);
            $printer->text("COMANDA #{$order->id}\n");
            $printer->setTextSize(1, 1);
            $printer->setEmphasis(false);
            $printer->text(str_repeat("=", $this->paperWidth) . "\n");

            // Table/Time info
            $printer->setJustification(Printer::JUSTIFY_LEFT);
            $tableName = $order->table?->name ?? 'Balcão';
            $time = $order->created_at->format('H:i');
            $printer->text("Mesa: {$tableName}");
            $printer->text(str_pad($time, $this->paperWidth - strlen("Mesa: {$tableName}"), ' ', STR_PAD_LEFT) . "\n");

            // Delivery info block
            if ($order->type === 'delivery') {
                $printer->text(str_repeat("=", $this->paperWidth) . "\n");
                $printer->setJustification(Printer::JUSTIFY_CENTER);
                $printer->setEmphasis(true);
                $printer->text("*** DELIVERY ***\n");
                $printer->setEmphasis(false);
                $printer->setJustification(Printer::JUSTIFY_LEFT);
                
                if ($order->customer_name) {
                    $printer->text("Cliente: {$order->customer_name}\n");
                }
                if ($order->customer_phone) {
                    $printer->text("Fone: {$order->customer_phone}\n");
                }
                if ($order->delivery_address) {
                    $printer->text("End: {$order->delivery_address}\n");
                }
                if ($order->delivery_complement) {
                    $printer->text("Compl: {$order->delivery_complement}\n");
                }
                $order->load('neighborhood');
                if ($order->neighborhood) {
                    $printer->text("Bairro: {$order->neighborhood->name}\n");
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

            $printer->text(str_repeat("-", $this->paperWidth) . "\n");

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

                if (!empty($item->notes)) {
                    $printer->text("   OBS: {$item->notes}\n");
                }
            }

            // Footer
            $printer->text(str_repeat("-", $this->paperWidth) . "\n");
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->text(now()->format('d/m/Y H:i:s') . "\n");
            $printer->text(str_repeat("=", $this->paperWidth) . "\n");

            $printer->cut();
            $printer->close();

            Log::info("Kitchen ticket printed for order #{$order->id}");
            return true;

        } catch (PrinterNetworkException|PrinterHardwareException $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw $this->classifyPrintingException($e, 'kitchen');
        }
    }

    /**
     * Print customer receipt
     */
    public function printCustomerReceipt(Order $order): bool
    {
        if ($this->getSetting('cashier_enabled') !== 'true') {
            return false;
        }

        try {
            $printer = $this->connectToPrinter('cashier');

            // Header
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->setEmphasis(true);
            $printer->setTextSize(2, 1);
            $printer->text("PEDIDO FEITO\n");
            $printer->setTextSize(1, 1);
            $printer->setEmphasis(false);
            $printer->text("Pizzaria\n");
            $printer->text(str_repeat("=", $this->paperWidth) . "\n");

            // Order info
            $printer->setJustification(Printer::JUSTIFY_LEFT);
            $printer->text("Pedido: #{$order->id}\n");
            $printer->text("Data: " . $order->created_at->format('d/m/Y H:i') . "\n");
            
            if ($order->customer_name) {
                $printer->text("Cliente: {$order->customer_name}\n");
            }
            
            $tableName = $order->table?->name ?? 'Balcão';
            $printer->text("Mesa: {$tableName}\n");
            
            if ($order->type === 'delivery') {
                $printer->text("Tipo: DELIVERY\n");
                if ($order->customer_phone) {
                    $printer->text("Fone: {$order->customer_phone}\n");
                }
                if ($order->delivery_address) {
                    $printer->text("End: {$order->delivery_address}\n");
                }
                if ($order->delivery_complement) {
                    $printer->text("Compl: {$order->delivery_complement}\n");
                }
                $order->load('neighborhood');
                if ($order->neighborhood) {
                    $printer->text("Bairro: {$order->neighborhood->name}\n");
                }
            }
            
            $printer->text(str_repeat("-", $this->paperWidth) . "\n");

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
                    $line = substr($line, 0, $this->paperWidth - strlen($priceStr) - 2) . "..";
                }
                
                $printer->text($line . str_pad($priceStr, $this->paperWidth - strlen($line), ' ', STR_PAD_LEFT) . "\n");
            }

            if ($order->type === 'delivery' && $order->delivery_fee > 0) {
                $feeLine = "Taxa Entrega:";
                $feePrice = "R$ " . number_format($order->delivery_fee, 2, ',', '.');
                $printer->text($feeLine . str_pad($feePrice, $this->paperWidth - strlen($feeLine), ' ', STR_PAD_LEFT) . "\n");
            }

            // Total
            $printer->text(str_repeat("-", $this->paperWidth) . "\n");
            $printer->setEmphasis(true);
            $total = number_format($order->total_amount, 2, ',', '.');
            $totalLine = "TOTAL:";
            $totalPrice = "R$ {$total}";
            $printer->text($totalLine . str_pad($totalPrice, $this->paperWidth - strlen($totalLine), ' ', STR_PAD_LEFT) . "\n");
            $printer->setEmphasis(false);

            // Payment
            if ($order->payments->count() > 0) {
                $printer->text(str_repeat("-", $this->paperWidth) . "\n");
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
            $printer->text(str_repeat("=", $this->paperWidth) . "\n");
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->text("Obrigado pela preferencia!\n");
            $printer->text("Volte sempre!\n");
            $printer->feed(3);

            $printer->cut();
            $printer->close();

            Log::info("Customer receipt printed for order #{$order->id}");
            return true;

        } catch (PrinterNetworkException|PrinterHardwareException $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw $this->classifyPrintingException($e, 'cashier');
        }
    }

    /**
     * Connect to printer
     */
    protected function connectToPrinter(string $printerType): Printer
    {
        // $printerType is 'kitchen' or 'cashier'
        $ip = $this->getSetting("{$printerType}_ip");
        $port = $this->getSetting("{$printerType}_port", 9100);
        
        // We can add a setting for 'type' (network/file/windows), but defaulting to network for now as per requirements
        // Or check if IP is set.
        
        if (empty($ip)) {
            throw new PrinterHardwareException(
                "No IP configured for {$printerType} printer.",
                'printer_misconfigured'
            );
        }

        try {
            $connector = new NetworkPrintConnector($ip, $port);
            return new Printer($connector);
        } catch (\Throwable $e) {
            throw $this->classifyConnectionException($e, $printerType, $ip, $port);
        }
    }

    protected function classifyConnectionException(\Throwable $exception, string $printerType, string $ip, mixed $port): PrinterNetworkException|PrinterHardwareException
    {
        $message = "Failed to connect to {$printerType} printer at {$ip}:{$port} - {$exception->getMessage()}";

        Log::error($message);

        if ($this->isHardwareFailure($exception->getMessage())) {
            if ($this->isNoPaperError($exception->getMessage())) {
                return PrinterHardwareException::noPaper($message, $exception);
            }

            return new PrinterHardwareException($message, 'printer_hardware_error', $exception);
        }

        return new PrinterNetworkException($message, 'printer_network_unreachable', $exception);
    }

    protected function classifyPrintingException(\Throwable $exception, string $printerType): PrinterNetworkException|PrinterHardwareException
    {
        $message = "Printing failed for {$printerType}: {$exception->getMessage()}";

        Log::error($message);

        if ($this->isHardwareFailure($exception->getMessage())) {
            if ($this->isNoPaperError($exception->getMessage())) {
                return PrinterHardwareException::noPaper($message, $exception);
            }

            return new PrinterHardwareException($message, 'printer_hardware_error', $exception);
        }

        return new PrinterNetworkException($message, 'printer_network_error', $exception);
    }

    protected function isHardwareFailure(string $message): bool
    {
        $normalized = mb_strtolower($message);

        return str_contains($normalized, 'paper')
            || str_contains($normalized, 'head')
            || str_contains($normalized, 'cover')
            || str_contains($normalized, 'jam')
            || str_contains($normalized, 'offline');
    }

    protected function isNoPaperError(string $message): bool
    {
        $normalized = mb_strtolower($message);

        return str_contains($normalized, 'out of paper')
            || str_contains($normalized, 'paper end')
            || str_contains($normalized, 'sem papel');
    }

    protected function translatePaymentMethod(string $method): string
    {
        return match (strtolower($method)) {
            'dinheiro', 'cash' => 'Dinheiro',
            'pix' => 'PIX',
            'credito', 'credit' => 'Crédito',
            'debito', 'debit' => 'Débito',
            default => ucfirst($method),
        };
    }

    public function testPrinter(string $printerType): bool
    {
        try {
            $printer = $this->connectToPrinter($printerType);
            if (!$printer) {
                return false;
            }

            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->text("=== TESTE DE IMPRESSAO ===\n");
            $printer->text("Impressora: {$printerType}\n");
            $printer->text("Data: " . now()->format('d/m/Y H:i:s') . "\n");
            $printer->text("Status: OK\n");
            $printer->text("==========================\n");
            $printer->feed(2);
            $printer->cut();
            $printer->close();

            return true;

        } catch (\Exception $e) {
            Log::error("Printer test failed: " . $e->getMessage());
            return false;
        }
    }
}
