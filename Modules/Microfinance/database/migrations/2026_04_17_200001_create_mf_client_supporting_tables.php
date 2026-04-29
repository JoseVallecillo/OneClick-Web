<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Documents
        Schema::create('mf_client_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('mf_clients')->cascadeOnDelete();
            $table->string('document_type', 40); // dni, rtn, utility_bill, commercial_ref
            $table->string('document_number', 60)->nullable();
            $table->string('file_path')->nullable();
            $table->date('expires_at')->nullable();
            $table->boolean('verified')->default(false);
            $table->timestamps();
        });

        // Business snapshots (field visit data)
        Schema::create('mf_client_business_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('mf_clients')->cascadeOnDelete();
            $table->unsignedBigInteger('captured_by'); // user_id of advisor
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            // Inventory assessment (for pulperia/store)
            $table->decimal('inventory_value', 12, 2)->default(0);
            $table->decimal('daily_sales_estimated', 10, 2)->default(0);
            $table->decimal('monthly_expenses_verified', 12, 2)->default(0);
            $table->decimal('monthly_net_estimated', 12, 2)->default(0);

            $table->text('observations')->nullable();
            $table->json('photos')->nullable(); // array of file paths
            $table->timestamps();
        });

        // Commercial references
        Schema::create('mf_client_references', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('mf_clients')->cascadeOnDelete();
            $table->string('reference_type', 20); // commercial, personal
            $table->string('name', 120);
            $table->string('phone', 20)->nullable();
            $table->string('relationship', 60)->nullable(); // supplier, neighbor, employer, etc.
            $table->boolean('verified')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mf_client_references');
        Schema::dropIfExists('mf_client_business_snapshots');
        Schema::dropIfExists('mf_client_documents');
    }
};
