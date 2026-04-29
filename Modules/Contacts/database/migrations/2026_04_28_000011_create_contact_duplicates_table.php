<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_duplicate_suspects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id_1')->constrained('contacts')->cascadeOnDelete();
            $table->foreignId('contact_id_2')->constrained('contacts')->cascadeOnDelete();
            $table->decimal('similarity_score', 5, 2)->comment('0-100 match percentage');
            $table->string('match_fields')->comment('campos que coinciden: name, rtn, email, etc');
            $table->string('status')->default('pending')->comment('pending, merged, dismissed');
            $table->foreignId('merged_into_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->dateTime('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_duplicate_suspects');
    }
};
