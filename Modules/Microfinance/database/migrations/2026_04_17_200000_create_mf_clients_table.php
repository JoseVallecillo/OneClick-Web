<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mf_clients', function (Blueprint $table) {
            $table->id();
            $table->string('client_number', 20)->unique();
            $table->string('first_name', 80);
            $table->string('last_name', 80);
            $table->string('identity_number', 20)->unique();
            $table->date('birth_date')->nullable();
            $table->string('gender', 1)->default('M');
            $table->string('phone_mobile', 20)->nullable();
            $table->string('phone_whatsapp', 20)->nullable();
            $table->string('email', 120)->nullable();
            $table->text('address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            // Business profile
            $table->string('business_name', 120)->nullable();
            $table->string('business_type', 60)->nullable(); // pulperia, taller, venta, servicios, etc.
            $table->integer('business_years')->default(0);
            $table->decimal('monthly_revenue', 12, 2)->default(0);
            $table->decimal('monthly_expenses', 12, 2)->default(0);
            $table->decimal('monthly_net_income', 12, 2)->default(0);
            $table->decimal('monthly_payment_capacity', 12, 2)->default(0);

            // Internal credit score (0-100)
            $table->integer('internal_score')->default(0);
            $table->json('score_breakdown')->nullable(); // { activity: 15, capacity: 18, references: 8, ... }
            $table->dateTime('score_calculated_at')->nullable();

            // References
            $table->integer('commercial_references_count')->default(0);
            $table->integer('personal_references_count')->default(0);

            // Assigned advisor
            $table->unsignedBigInteger('advisor_id')->nullable();

            $table->string('status', 20)->default('prospect'); // prospect, active, blacklisted, inactive
            $table->integer('completed_cycles')->default(0);
            $table->text('notes')->nullable();
            $table->string('profile_photo_path')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'advisor_id']);
            $table->index('identity_number');
        });
    }

    public function down(): void { Schema::dropIfExists('mf_clients'); }
};
