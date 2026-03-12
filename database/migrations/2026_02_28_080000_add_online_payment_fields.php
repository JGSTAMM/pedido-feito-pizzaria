<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_gateway_id')->nullable()->after('status');
            $table->string('payment_method_online')->nullable()->after('payment_gateway_id');
            $table->string('online_payment_status')->nullable()->after('payment_method_online');
            $table->text('pix_qr_code')->nullable()->after('online_payment_status');
            $table->string('pix_qr_code_base64')->nullable()->after('pix_qr_code');
            $table->timestamp('accepted_at')->nullable()->after('ready_at');
            $table->timestamp('rejected_at')->nullable()->after('accepted_at');
            $table->string('rejection_reason')->nullable()->after('rejected_at');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('gateway_id')->nullable()->after('amount');
            $table->string('gateway_status')->nullable()->after('gateway_id');
            $table->timestamp('paid_at')->nullable()->after('gateway_status');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'payment_gateway_id',
                'payment_method_online',
                'online_payment_status',
                'pix_qr_code',
                'pix_qr_code_base64',
                'accepted_at',
                'rejected_at',
                'rejection_reason',
            ]);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['gateway_id', 'gateway_status', 'paid_at']);
        });
    }
};
