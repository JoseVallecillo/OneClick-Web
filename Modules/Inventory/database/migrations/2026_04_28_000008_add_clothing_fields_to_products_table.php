<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_clothing')->default(false)->after('has_recipe');
            $table->string('material')->nullable()->after('is_clothing');
            $table->text('care_instructions')->nullable()->after('material');
            $table->json('size_guide')->nullable()->after('care_instructions');

            $table->index('is_clothing');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['is_clothing']);
            $table->dropColumn(['is_clothing', 'material', 'care_instructions', 'size_guide']);
        });
    }
};
