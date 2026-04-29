<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mf_aml_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('mf_clients');
            $table->unsignedBigInteger('loan_id')->nullable();
            $table->string('alert_type', 40);
            $table->string('risk_level', 10)->default('medium');
            $table->decimal('amount_hnl', 14, 2)->default(0);
            $table->decimal('amount_usd', 14, 2)->nullable();
            $table->text('description')->nullable();
            $table->date('alert_date');
            $table->string('status', 20)->default('pending');
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->dateTime('reviewed_at')->nullable();
            $table->text('reviewer_notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'risk_level']);
            $table->index('alert_date');
        });

        Schema::create('mf_credit_bureau_snapshots', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('generated_by');
            $table->string('report_type', 20)->default('equifax');
            $table->date('as_of_date');
            $table->integer('record_count')->default(0);
            $table->string('file_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mf_credit_bureau_snapshots');
        Schema::dropIfExists('mf_aml_alerts');
    }
};
