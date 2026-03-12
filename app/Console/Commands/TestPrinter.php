<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\PrintService;
use Illuminate\Console\Command;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\Printer;

class TestPrinter extends Command
{
    protected $signature = 'printer:test {--order= : Order ID to print}';
    protected $description = 'Test thermal printer output to file';

    public function handle()
    {
        $outputPath = storage_path('logs/printer_test.txt');
        
        $this->info('Testing printer output...');
        $this->info("Output file: {$outputPath}");

        try {
            $connector = new FilePrintConnector($outputPath);
            $printer = new Printer($connector);
            $paperWidth = 48;

            // Check if testing with real order
            $orderId = $this->option('order');
            
            if ($orderId) {
                $order = Order::with(['table', 'items.product', 'items.pizzaSize', 'items.flavors'])->find($orderId);
                
                if (!$order) {
                    $this->error("Order #{$orderId} not found!");
                    return 1;
                }

                // Print real order comanda
                $printer->setJustification(Printer::JUSTIFY_CENTER);
                $printer->setEmphasis(true);
                $printer->text("================================\n");
                $printer->text("        COMANDA #{$order->id}        \n");
                $printer->text("================================\n");
                $printer->setEmphasis(false);

                $printer->setJustification(Printer::JUSTIFY_LEFT);
                $tableName = $order->table?->name ?? 'Balcao';
                $time = $order->created_at->format('H:i');
                $printer->text("Mesa: {$tableName}");
                $printer->text(str_pad($time, $paperWidth - strlen("Mesa: {$tableName}"), ' ', STR_PAD_LEFT) . "\n");
                $printer->text("--------------------------------\n");

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
                }

                $printer->text("--------------------------------\n");
                $printer->setJustification(Printer::JUSTIFY_CENTER);
                $printer->text(now()->format('d/m/Y H:i:s') . "\n");
                $printer->text("================================\n");

            } else {
                // Print sample comanda
                $printer->setJustification(Printer::JUSTIFY_CENTER);
                $printer->setEmphasis(true);
                $printer->text("================================\n");
                $printer->text("        COMANDA #123          \n");
                $printer->text("================================\n");
                $printer->setEmphasis(false);

                $printer->setJustification(Printer::JUSTIFY_LEFT);
                $printer->text("Mesa: Mesa 5                14:30\n");
                $printer->text("--------------------------------\n");

                $printer->setEmphasis(true);
                $printer->text("2x Pizza Grande\n");
                $printer->setEmphasis(false);
                $printer->text("   Calabresa / Mussarela\n");
                $printer->text("\n");

                $printer->setEmphasis(true);
                $printer->text("1x Pizza Media\n");
                $printer->setEmphasis(false);
                $printer->text("   Portuguesa\n");
                $printer->text("\n");

                $printer->setEmphasis(true);
                $printer->text("2x Coca-Cola 2L\n");
                $printer->setEmphasis(false);
                $printer->text("\n");

                $printer->text("--------------------------------\n");
                $printer->setJustification(Printer::JUSTIFY_CENTER);
                $printer->text("Garcom: Joao\n");
                $printer->text(now()->format('d/m/Y H:i:s') . "\n");
                $printer->text("================================\n");
                $printer->text("\n");

                // Also print customer receipt sample
                $printer->text("\n\n");
                $printer->setEmphasis(true);
                $printer->text("================================\n");
                $printer->text("       PEDIDO FEITO           \n");
                $printer->text("         Pizzaria             \n");
                $printer->text("================================\n");
                $printer->setEmphasis(false);

                $printer->setJustification(Printer::JUSTIFY_LEFT);
                $printer->text("Pedido: #123\n");
                $printer->text("Data: " . now()->format('d/m/Y H:i') . "\n");
                $printer->text("Cliente: Cliente Balcao\n");
                $printer->text("Mesa: Mesa 5\n");
                $printer->text("--------------------------------\n");

                $printer->text("2x Pizza Grande            R$ 90,00\n");
                $printer->text("   (Calabresa/Mussarela)\n");
                $printer->text("1x Pizza Media             R$ 45,00\n");
                $printer->text("   (Portuguesa)\n");
                $printer->text("2x Coca-Cola 2L            R$ 20,00\n");
                $printer->text("--------------------------------\n");

                $printer->setEmphasis(true);
                $printer->text("TOTAL:                    R$ 155,00\n");
                $printer->setEmphasis(false);

                $printer->text("--------------------------------\n");
                $printer->text("Pagamento:\n");
                $printer->text("  Dinheiro: R$ 160,00\n");
                $printer->text("  Troco: R$ 5,00\n");

                $printer->text("================================\n");
                $printer->setJustification(Printer::JUSTIFY_CENTER);
                $printer->text("Obrigado pela preferencia!\n");
                $printer->text("Volte sempre!\n");
                $printer->text("================================\n");
            }

            $printer->cut();
            $printer->close();

            $this->info('');
            $this->info('=== OUTPUT PREVIEW ===');
            $this->line(file_get_contents($outputPath));
            $this->info('======================');
            $this->info('');
            $this->info('Printer test completed successfully!');

            return 0;

        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return 1;
        }
    }
}
