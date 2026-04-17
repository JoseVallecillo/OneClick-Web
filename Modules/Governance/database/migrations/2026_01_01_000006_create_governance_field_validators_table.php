<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('governance_field_validators', function (Blueprint $table) {
            $table->id();
            $table->string('module_name');
            $table->string('field_identifier')->comment('Matches the fieldId prop on ValidatedInput');
            $table->enum('validation_type', ['numeric', 'alpha', 'alpha-dash', 'alphanumeric']);
            $table->string('user_role')->nullable()->comment('null = applies to all roles');
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['module_name', 'field_identifier'], 'field_validators_unique');
            $table->index(['module_name', 'active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('governance_field_validators');
    }
};
