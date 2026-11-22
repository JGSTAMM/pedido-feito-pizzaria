<?php

namespace Tests\Feature;

use App\Application\Printing\PrintQueueService;
use App\Models\Printer;
use App\Models\PrintJob;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;
use ZipArchive;

class PrintAgentSettingsTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    public function test_admin_settings_includes_print_agent_config_server_url_and_queue_stats(): void
    {
        $this->withoutVite();
        $admin = $this->createUser('admin');
        Printer::create([
            'name' => 'pos-58',
            'type' => 'production',
            'target' => 'kitchen',
            'is_online' => true,
        ]);

        PrintJob::create([
            'type' => 'test',
            'target' => 'kitchen',
            'status' => 'pending',
            'payload' => ['title' => 'Teste'],
        ]);

        $response = $this->actingAs($admin)->get('/settings');

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Settings/Index')
                ->where('printAgent.config.mode', 'auto')
                ->where('printAgent.config.kitchen_printer', 'pos-58')
                ->where('printAgent.queueStats.pending', 1)
                ->has('printAgent.token')
                ->has('printAgent.serverUrl')
            );
    }

    public function test_admin_can_save_agent_config_and_tcp_requires_ip(): void
    {
        $admin = $this->createUser('admin');

        $this->actingAs($admin)
            ->post('/settings/printers/agent-config', [
                'mode' => 'tcp',
                'kitchen_printer' => 'EPSON-TM-T20',
                'kitchen_paper_width' => '80mm',
                'cashier_printer' => 'POS-58',
                'cashier_paper_width' => '58mm',
                'default_printer' => 'POS-58',
                'tcp_ip' => '',
            ])
            ->assertSessionHasErrors('tcp_ip');

        $this->actingAs($admin)
            ->post('/settings/printers/agent-config', [
                'mode' => 'tcp',
                'kitchen_printer' => 'EPSON-TM-T20',
                'kitchen_paper_width' => '80mm',
                'cashier_printer' => 'POS-58',
                'cashier_paper_width' => '58mm',
                'default_printer' => 'POS-58',
                'fallback_printer' => '/dev/usb/lp0',
                'tcp_ip' => '192.168.1.250',
                'tcp_port' => 9100,
                'poll_interval_ms' => 2000,
            ])
            ->assertRedirect();

        $this->actingAs($admin)
            ->getJson('/settings/printers/download-config')
            ->assertOk()
            ->assertJson([
                'mode' => 'tcp',
                'kitchen_printer' => 'EPSON-TM-T20',
                'kitchen_paper_width' => '80mm',
                'cashier_printer' => 'POS-58',
                'cashier_paper_width' => '58mm',
                'default_printer' => 'POS-58',
                'fallback_printer' => '/dev/usb/lp0',
                'tcp_ip' => '192.168.1.250',
                'tcp_port' => 9100,
                'poll_interval_ms' => 2000,
            ]);
    }

    public function test_admin_can_download_cross_platform_print_agent_zip_with_unix_permissions(): void
    {
        $admin = $this->createUser('admin');
        $token = app(PrintQueueService::class)->getOrCreateAgentToken();

        $this->actingAs($admin)
            ->post('/settings/printers/agent-config', [
                'mode' => 'auto',
                'kitchen_printer' => 'COZINHA-TERMICA',
                'kitchen_paper_width' => '80mm',
                'cashier_printer' => 'CAIXA-TERMICA',
                'cashier_paper_width' => '58mm',
                'default_printer' => 'CAIXA-TERMICA',
                'fallback_printer' => 'COZINHA-TERMICA',
            ])
            ->assertRedirect();

        config(['app.url' => 'https://sresralucchesepizzaria.pedidofeito.tech']);

        $response = $this->actingAs($admin)
            ->get('https://sresralucchesepizzaria.pedidofeito.tech/settings/printers/download-agent');

        $response->assertOk();
        $this->assertStringContainsString('application/zip', (string) $response->headers->get('Content-Type'));

        $downloadedPath = $response->getFile()->getPathname();
        $zip = new ZipArchive;
        $this->assertTrue($zip->open($downloadedPath) === true);

        $prefix = 'PedidoFeito-Agente-Impressao/';
        $expectedEntries = [
            'agent.mjs',
            'escpos-formatter.mjs',
            'raw-printer.ps1',
            'config.json',
            'iniciar-agente-impressao.bat',
            'instalar-inicializacao-windows.bat',
            'listar-impressoras-windows.bat',
            'iniciar-agente-impressao.sh',
            'instalar-inicializacao-linux.sh',
            'listar-impressoras-linux.sh',
            'LEIA-ME.txt',
        ];

        foreach ($expectedEntries as $entry) {
            $index = $zip->locateName($prefix.$entry);
            $this->assertNotFalse($index, "Expected ZIP entry [{$entry}] to exist.");
        }

        $configRaw = $zip->getFromName($prefix.'config.json');
        $config = json_decode((string) $configRaw, true);
        $this->assertSame('https://sresralucchesepizzaria.pedidofeito.tech', $config['server_url']);
        $this->assertSame($token, $config['token']);
        $this->assertSame('auto', $config['mode']);
        $this->assertSame('COZINHA-TERMICA', $config['kitchen_printer']);
        $this->assertSame('80mm', $config['kitchen_paper_width']);

        foreach (['iniciar-agente-impressao.sh', 'instalar-inicializacao-linux.sh', 'listar-impressoras-linux.sh'] as $shFile) {
            $content = (string) $zip->getFromName($prefix.$shFile);
            $this->assertStringNotContainsString("\r\n", $content, "Script [{$shFile}] must use LF line endings.");
            $opsys = 0;
            $attr = 0;
            $zip->getExternalAttributesName($prefix.$shFile, $opsys, $attr);
            $this->assertSame(ZipArchive::OPSYS_UNIX, $opsys);
            $this->assertSame(0100755, ($attr >> 16) & 0100777);
        }

        $zip->close();
        @unlink($downloadedPath);
    }

    public function test_non_admin_users_cannot_access_print_agent_download_or_config_routes(): void
    {
        $waiter = $this->createUser('waiter');
        $cashier = $this->createUser('cashier');

        foreach ([$waiter, $cashier] as $user) {
            $this->actingAs($user)->get('/settings/printers/download-agent')->assertStatus(403);
            $this->actingAs($user)->get('/settings/printers/download-config')->assertStatus(403);
            $this->actingAs($user)->post('/settings/printers/agent-config', ['mode' => 'auto'])->assertStatus(403);
            $this->actingAs($user)->post('/settings/printers/clear-queue')->assertStatus(403);
            $this->actingAs($user)->post('/settings/printers/retry-failed')->assertStatus(403);
        }
    }

    public function test_poll_records_platform_and_queue_management_actions_work(): void
    {
        $admin = $this->createUser('admin');
        $token = app(PrintQueueService::class)->getOrCreateAgentToken();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/print-agent/poll', [
                'version' => '2.1.0',
                'platform' => 'linux',
                'printers' => ['EPSON-TM-T20', '/dev/usb/lp0'],
                'active_printer' => 'EPSON-TM-T20',
            ])
            ->assertOk();

        $status = app(PrintQueueService::class)->getAgentStatus();
        $this->assertTrue($status['is_online']);
        $this->assertSame('linux', $status['platform']);
        $this->assertSame(['EPSON-TM-T20', '/dev/usb/lp0'], $status['printers']);

        $failedJob = PrintJob::create([
            'type' => 'kitchen',
            'target' => 'kitchen',
            'status' => 'failed',
            'attempts' => 3,
            'error_message' => 'Paper out',
            'payload' => ['items' => []],
        ]);

        $this->actingAs($admin)->post('/settings/printers/retry-failed')->assertRedirect();
        $this->assertSame('pending', $failedJob->fresh()->status);
        $this->assertSame(0, $failedJob->fresh()->attempts);

        $this->actingAs($admin)->post('/settings/printers/clear-queue')->assertRedirect();
        $this->assertDatabaseCount('print_jobs', 0);
    }
}
