<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_custom_fields', function (Blueprint $table) {
            $table->id();
            $table->string('field_name', 100);
            $table->string('field_type')->comment('text, number, date, select, checkbox');
            $table->string('contact_type')->comment('client, supplier, employee');
            $table->boolean('is_required')->default(false);
            $table->json('options')->nullable()->comment('Para campos select');
            $table->timestamps();
        });

        Schema::create('contact_custom_field_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->foreignId('contact_custom_field_id')->constrained('contact_custom_fields')->cascadeOnDelete();
            $table->text('value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_custom_field_values');
        Schema::dropIfExists('contact_custom_fields');
    }
};
