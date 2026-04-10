<?php

namespace Tests\Unit;

use App\Application\Printing\Exceptions\PrinterHardwareException;
use App\Application\Printing\Exceptions\PrinterNetworkException;
use App\Application\Printing\PrinterAlertService;
use App\Application\Printing\PrintingTelemetryService;
use App\Jobs\PrintKitchenTicketJob;
use App\Models\Order;
use App\Services\PrintService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class PrintKitchenTicketJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_network_failure_is_rethrown_for_retry(): void
    {
        $order = Order::query()->create([
            'status' => 'preparing',
            'type' => 'salon',
            'total_amount' => 10,
        ]);

        $printService = Mockery::mock(PrintService::class);
        $printService->shouldReceive('printKitchenTicket')
            ->once()
            ->andThrow(new PrinterNetworkException('Network unavailable'));

        $telemetry = Mockery::mock(PrintingTelemetryService::class);
        $telemetry->shouldReceive('recordFailure')
            ->once()
            ->with(
                Mockery::on(fn ($value) => $value instanceof Order && $value->id === $order->id),
                'kitchen',
                'network',
                Mockery::type('string')
            );

        $alerts = Mockery::mock(PrinterAlertService::class);
        $alerts->shouldNotReceive('raiseHardwareAlert');

        $job = new PrintKitchenTicketJob($order->id);

        $this->expectException(PrinterNetworkException::class);
        $job->handle($printService, $telemetry, $alerts);
    }

    public function test_hardware_failure_generates_alert_without_retry_throw(): void
    {
        $order = Order::query()->create([
            'status' => 'preparing',
            'type' => 'salon',
            'total_amount' => 10,
        ]);

        $hardwareException = new PrinterHardwareException('No paper in kitchen printer', 'NO_PAPER');

        $printService = Mockery::mock(PrintService::class);
        $printService->shouldReceive('printKitchenTicket')
            ->once()
            ->andThrow($hardwareException);

        $telemetry = Mockery::mock(PrintingTelemetryService::class);
        $telemetry->shouldReceive('recordFailure')
            ->once()
            ->with(
                Mockery::on(fn ($value) => $value instanceof Order && $value->id === $order->id),
                'kitchen',
                'hardware',
                Mockery::type('string')
            );

        $alerts = Mockery::mock(PrinterAlertService::class);
        $alerts->shouldReceive('raiseHardwareAlert')
            ->once()
            ->with(
                Mockery::on(fn ($value) => $value instanceof Order && $value->id === $order->id),
                'kitchen',
                'NO_PAPER',
                Mockery::type('string')
            );

        $job = new PrintKitchenTicketJob($order->id);
        $job->handle($printService, $telemetry, $alerts);

        $this->assertTrue(true);
    }
}
