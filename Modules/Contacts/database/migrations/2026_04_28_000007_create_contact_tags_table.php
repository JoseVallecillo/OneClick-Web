<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('color', 20)->default('#999999');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('contact_tag_relations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->foreignId('contact_tag_id')->constrained('contact_tags')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['contact_id', 'contact_tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_tag_relations');
        Schema::dropIfExists('contact_tags');
    }
};
