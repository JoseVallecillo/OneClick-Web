<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ui_governance_rules', function (Blueprint $table) {
            $table->id();
            $table->string('module_name');
            $table->string('element_identifier');
            $table->enum('action_type', ['hide', 'pin', 'authorize']);
            $table->string('user_role')->nullable()->comment('null = applies to all roles');
            $table->string('pin_code')->nullable()->comment('required when action_type = pin');
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['module_name', 'element_identifier'], 'governance_rules_unique');
            $table->index(['module_name', 'active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ui_governance_rules');
    }
};
