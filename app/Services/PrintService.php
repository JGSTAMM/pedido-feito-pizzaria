<?php

namespace App\Services;

use App\Application\Printing\Exceptions\PrinterHardwareException;
use App\Application\Printing\Exceptions\PrinterNetworkException;
use App\Application\Printing\Formatters\ReceiptFormatter;
use App\Models\Order;
use App\Models\Printer as PrinterModel;
use App\Models\PrinterSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\Printer;

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

    public static function isAllowedPrinterIp(string $ip): bool
    {
        $clean = trim($ip);
        if (! filter_var($clean, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return false;
        }

        $long = ip2long($clean);
        if ($long === false) {
            return false;
        }

        // Only allow RFC1918 LAN printer addresses (192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12),
        // blocking 0.0.0.0/8, 127.0.0.0/8, 169.254.0.0/16, 100.64.0.0/10, multicast, and arbitrary public IPs.
        $allowedCidrs = [
            ['192.168.0.0', '255.255.0.0'],
            ['10.0.0.0', '255.0.0.0'],
            ['172.16.0.0', '255.240.0.0'],
        ];

        foreach ($allowedCidrs as [$subnet, $mask]) {
            if (($long & ip2long($mask)) === (ip2long($subnet) & ip2long($mask))) {
                return true;
            }
        }

        return false;
    }

    protected function getSetting($key, $default = null)
    {
        $settings = Cache::remember('printer_settings', 86400, function () {
            return PrinterSetting::pluck('value', 'key')->toArray();
        });

        return $settings[$key] ?? $default;
    }

    protected function isPrinterEnabled(string $printerType): bool
    {
        $settingKey = $printerType === 'kitchen' ? 'kitchen_enabled' : 'cashier_enabled';
        $settingValue = $this->getSetting($settingKey);

        if ($settingValue === 'true') {
            return true;
        }

        if ($settingValue === 'false') {
            return false;
        }

        return $this->resolvePrinterIp($printerType) !== null;
    }

    protected function resolvePrinterIp(string $printerType): ?string
    {
        $ip = $this->getSetting("{$printerType}_ip");
        if (! empty($ip)) {
            return (string) $ip;
        }

        $target = $printerType === 'kitchen' ? 'kitchen' : 'cash_register';
        $printerRecord = PrinterModel::query()
            ->where('target', $target)
            ->where('is_online', true)
            ->whereNotNull('ip_address')
            ->where('ip_address', '!=', '')
            ->first();

        return $printerRecord?->ip_address ? (string) $printerRecord->ip_address : null;
    }

    /**
     * Print kitchen ticket (comanda)
     */
    public function printKitchenTicket(Order $order): bool
    {
        if (! $this->isPrinterEnabled('kitchen')) {
            return false;
        }

        $printer = null;

        try {
            $printer = $this->connectToPrinter('kitchen');

            $this->formatter->formatKitchenTicket($printer, $order);

            $printer->cut();

            Log::info("Kitchen ticket printed for order #{$order->id}");

            return true;

        } catch (PrinterNetworkException|PrinterHardwareException $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw $this->classifyPrintingException($e, 'kitchen');
        } finally {
            if ($printer instanceof Printer) {
                try {
                    $printer->close();
                } catch (\Throwable) {
                }
            }
        }
    }

    /**
     * Print customer receipt
     */
    public function printCustomerReceipt(Order $order): bool
    {
        if (! $this->isPrinterEnabled('cashier')) {
            return false;
        }

        $printer = null;

        try {
            $printer = $this->connectToPrinter('cashier');

            $this->formatter->formatCustomerReceipt($printer, $order);

            $printer->cut();

            Log::info("Customer receipt printed for order #{$order->id}");

            return true;

        } catch (PrinterNetworkException|PrinterHardwareException $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw $this->classifyPrintingException($e, 'cashier');
        } finally {
            if ($printer instanceof Printer) {
                try {
                    $printer->close();
                } catch (\Throwable) {
                }
            }
        }
    }

    /**
     * Connect to printer
     */
    protected function connectToPrinter(string $printerType): Printer
    {
        // $printerType is 'kitchen' or 'cashier'
        $ip = $this->resolvePrinterIp($printerType);
        $port = $this->getSetting("{$printerType}_port", 9100);

        if (empty($ip)) {
            throw new PrinterHardwareException(
                "No IP configured for {$printerType} printer.",
                'printer_misconfigured'
            );
        }

        if (! self::isAllowedPrinterIp((string) $ip)) {
            throw new PrinterHardwareException(
                "Invalid or forbidden IP configured for {$printerType} printer.",
                'printer_misconfigured'
            );
        }

        try {
            $connector = new NetworkPrintConnector($ip, (int) $port, 3);

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
            if (! $printer) {
                return false;
            }

            $this->formatter->formatTestReceipt($printer, $printerType);

            $printer->cut();
            $printer->close();

            return true;

        } catch (\Exception $e) {
            Log::error('Printer test failed: '.$e->getMessage());

            return false;
        }
    }
}
