<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_periods', function (Blueprint $table) {
            $table->id();

            $table->string('name', 100);
            $table->date('date_from');
            $table->date('date_to');

            $table->enum('state', ['open', 'locked', 'closed'])->default('open');

            $table->text('closing_notes')->nullable();
            $table->dateTime('closed_at')->nullable();
            $table->unsignedBigInteger('closed_by')->nullable();

            $table->boolean('is_current')->default(false);
            $table->timestamps();

            $table->unique(['date_from', 'date_to']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_periods');
    }
};
