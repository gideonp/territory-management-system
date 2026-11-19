<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('terriroty', function (Blueprint $table) {
            $table->id();
            $table->integer('service year');
            $table->integer('territory_number');
            $table->date('last_completed');
            $table->text('assigned_to');
            $table->date('date_assigned');
            $table->date('date_completed');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('terriroty');
    }
};
