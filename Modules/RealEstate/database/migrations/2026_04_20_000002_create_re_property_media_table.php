<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('re_property_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained('re_properties')->cascadeOnDelete();
            $table->enum('type', ['photo', 'video', 'tour360', 'document'])->default('photo');
            $table->string('path', 500);
            $table->string('caption', 255)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_main')->default(false);
            $table->foreignId('uploaded_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('re_property_media');
    }
};
