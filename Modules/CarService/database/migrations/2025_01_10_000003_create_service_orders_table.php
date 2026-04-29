<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_orders', function (Blueprint $table) {
            $table->id();

            // Auto-generated reference: CS-2025-0001
            $table->string('reference', 20)->unique();

            // Vehicle & Customer
            $table->foreignId('vehicle_id')->constrained('vehicles');
            $table->foreignId('customer_id')->constrained('contacts');

            // Workflow: draft → in_progress → completed → cancelled
            $table->enum('status', ['draft', 'in_progress', 'completed', 'cancelled'])->default('draft');

            // ── Check-in data ────────────────────────────────────────────────────
            $table->integer('odometer_in');                      // Required: km at entry
            $table->integer('odometer_out')->nullable();         // km at exit

            // Inspección visual — 3 fotos del vehículo al ingreso
            $table->string('photo_front')->nullable();   // Foto frontal
            $table->string('photo_side')->nullable();    // Foto lateral
            $table->string('photo_rear')->nullable();    // Foto trasera
            $table->text('inspection_notes')->nullable();

            // ── Service type ─────────────────────────────────────────────────────
            $table->foreignId('service_package_id')->nullable()->constrained('service_packages')->nullOnDelete();
            $table->enum('oil_type', ['mineral', 'semi_synthetic', 'synthetic'])->nullable();
            $table->string('oil_viscosity', 20)->nullable();     // e.g. 5W-30

            // ── Next service calculation (filled on completion) ───────────────────
            $table->integer('next_service_km')->nullable();      // odometer_out + interval
            $table->date('next_service_date')->nullable();       // Estimated date
            $table->string('qr_token', 64)->nullable()->unique(); // Token for public QR page

            // ── Additional checks (upselling) ────────────────────────────────────
            $table->decimal('brake_fluid_pct', 5, 2)->nullable();  // Humidity %
            $table->enum('air_filter_status', ['good', 'dirty', 'replace'])->nullable();
            $table->enum('cabin_filter_status', ['good', 'dirty', 'replace'])->nullable();
            $table->decimal('battery_voltage', 5, 2)->nullable();   // Volts
            $table->text('checks_notes')->nullable();

            // ── Totals ────────────────────────────────────────────────────────────
            $table->decimal('subtotal', 14, 4)->default(0);
            $table->decimal('tax_amount', 14, 4)->default(0);
            $table->decimal('total', 14, 4)->default(0);

            // ── Timestamps per workflow step ──────────────────────────────────────
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_orders');
    }
};
