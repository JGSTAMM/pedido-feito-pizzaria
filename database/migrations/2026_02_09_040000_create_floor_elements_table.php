<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('floor_elements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('type'); // caixa, entrada, cozinha, banheiro, custom
            $table->string('icon')->default('📍');
            $table->integer('position_x')->default(0);
            $table->integer('position_y')->default(0);
            $table->integer('width')->default(100);
            $table->integer('height')->default(80);
            $table->boolean('visible')->default(true);
            $table->timestamps();
        });

        // Insert default elements
        DB::table('floor_elements')->insert([
            ['id' => \Illuminate\Support\Str::uuid()->toString(), 'name' => 'CAIXA', 'type' => 'caixa', 'icon' => '💰', 'position_x' => 700, 'position_y' => 20, 'width' => 100, 'height' => 80, 'visible' => true, 'created_at' => now(), 'updated_at' => now()],
            ['id' => \Illuminate\Support\Str::uuid()->toString(), 'name' => 'ENTRADA', 'type' => 'entrada', 'icon' => '🚪', 'position_x' => 350, 'position_y' => 520, 'width' => 120, 'height' => 60, 'visible' => false, 'created_at' => now(), 'updated_at' => now()],
            ['id' => \Illuminate\Support\Str::uuid()->toString(), 'name' => 'COZINHA', 'type' => 'cozinha', 'icon' => '👨‍🍳', 'position_x' => 700, 'position_y' => 500, 'width' => 120, 'height' => 80, 'visible' => false, 'created_at' => now(), 'updated_at' => now()],
            ['id' => \Illuminate\Support\Str::uuid()->toString(), 'name' => 'WC', 'type' => 'banheiro', 'icon' => '🚻', 'position_x' => 20, 'position_y' => 520, 'width' => 100, 'height' => 60, 'visible' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('floor_elements');
    }
};
