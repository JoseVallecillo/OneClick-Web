<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // CAI = Clave de Autorización de Impresión (Honduras SAR)
        Schema::create('account_cai_configs', function (Blueprint $table) {
            $table->id();

            // The CAI string issued by SAR — format: XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XX
            $table->string('cai', 50)->unique();

            // Authorized invoice number range
            $table->string('range_from', 20);
            $table->string('range_to', 20);

            // Current consecutive number (auto-incremented on each invoice)
            $table->string('current_number', 20)->nullable();

            // SAR expiry date for this CAI
            $table->date('expires_at');

            // Journal this CAI is linked to (usually the sales journal)
            $table->foreignId('journal_id')->constrained('account_journals');

            // Establishment data (required on Honduran invoices)
            $table->string('establishment_code', 10)->nullable();  // código de establecimiento SAR
            $table->string('terminal_code', 10)->nullable();       // punto de emisión SAR

            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_cai_configs');
    }
};
