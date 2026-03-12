<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->integer('position_x')->default(0)->after('status');
            $table->integer('position_y')->default(0)->after('position_x');
            $table->integer('width')->default(100)->after('position_y');
            $table->integer('height')->default(100)->after('width');
        });
    }

    public function down(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->dropColumn(['position_x', 'position_y', 'width', 'height']);
        });
    }
};
