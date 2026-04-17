<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Subscriptions\Models\SubscriptionPlan;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');                          // Básico, Pro, Enterprise
            $table->unsignedInteger('user_limit')->nullable(); // null = ilimitado (Enterprise)
            $table->unsignedInteger('duration_days');        // 30, 365, etc.
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // Planes semilla por defecto
        SubscriptionPlan::insert([
            ['name' => 'Básico',      'user_limit' => 2,    'duration_days' => 30,  'active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Pro',         'user_limit' => 5,    'duration_days' => 365, 'active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Enterprise',  'user_limit' => null, 'duration_days' => 365, 'active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};
