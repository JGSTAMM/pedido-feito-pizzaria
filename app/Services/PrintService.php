<?php

namespace App\Services;

use App\Application\Printing\Exceptions\PrinterHardwareException;
use App\Application\Printing\Exceptions\PrinterNetworkException;
use App\Application\Printing\Formatters\ReceiptFormatter;
use App\Models\Order;
use App\Models\PrinterSetting;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\Printer;
use Illuminate\Support\Facades\Log;

class PrintService
{
    protected int $paperWidth;
    protected ReceiptFormatter $formatter;

    public function __construct(ReceiptFormatter $formatter)
    {
        $this->formatter = $formatter;
        $this->paperWidth = (int) $this->getSetting('paper_width', 48);
        $this->formatter->setPaperWidth($this->paperWidth);
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
            return false;
        }

        try {
            $printer = $this->connectToPrinter('kitchen');
            
            $this->formatter->formatKitchenTicket($printer, $order);

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

            $this->formatter->formatCustomerReceipt($printer, $order);

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

    public function testPrinter(string $printerType): bool
    {
        try {
            $printer = $this->connectToPrinter($printerType);
            if (!$printer) {
                return false;
            }

            $this->formatter->formatTestReceipt($printer, $printerType);
            
            $printer->cut();
            $printer->close();

            return true;

        } catch (\Exception $e) {
            Log::error("Printer test failed: " . $e->getMessage());
            return false;
        }
    }
}
