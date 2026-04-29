<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mf_payment_promises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('mf_loans')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('mf_clients');
            $table->unsignedBigInteger('registered_by'); // advisor user_id
            $table->date('promise_date');
            $table->decimal('promised_amount', 12, 2);
            $table->string('status', 20)->default('pending'); // pending, kept, broken, partial
            $table->string('contact_channel', 20)->default('field'); // field, phone, whatsapp
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->date('paid_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'promise_date']);
        });

        Schema::create('mf_collection_routes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('advisor_id');
            $table->date('route_date');
            $table->string('zone', 80)->nullable();
            $table->string('status', 20)->default('pending'); // pending, in_progress, completed
            $table->integer('total_stops')->default(0);
            $table->integer('visited_stops')->default(0);
            $table->decimal('expected_amount', 14, 2)->default(0);
            $table->decimal('collected_amount', 14, 2)->default(0);
            $table->timestamps();

            $table->unique(['advisor_id', 'route_date', 'zone']);
        });

        Schema::create('mf_collection_route_stops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_id')->constrained('mf_collection_routes')->cascadeOnDelete();
            $table->foreignId('loan_id')->constrained('mf_loans');
            $table->foreignId('client_id')->constrained('mf_clients');
            $table->integer('sort_order')->default(0);
            $table->decimal('amount_due', 12, 2);
            $table->integer('days_overdue')->default(0);
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('status', 20)->default('pending'); // pending, collected, promise, not_found
            $table->decimal('collected_amount', 12, 2)->default(0);
            $table->dateTime('visited_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mf_collection_route_stops');
        Schema::dropIfExists('mf_collection_routes');
        Schema::dropIfExists('mf_payment_promises');
    }
};
