<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mf_credit_groups', function (Blueprint $table) {
            $table->id();
            $table->string('group_number', 20)->unique();
            $table->string('name', 100);
            $table->unsignedBigInteger('advisor_id')->nullable();
            $table->string('meeting_day', 10)->nullable(); // lunes, martes, etc.
            $table->time('meeting_time')->nullable();
            $table->string('meeting_location')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->integer('cycle_number')->default(1);
            $table->string('status', 20)->default('forming'); // forming, active, blocked, dissolved
            $table->boolean('is_blocked')->default(false);
            $table->string('blocked_reason')->nullable();
            $table->integer('blocking_threshold_days')->default(3); // days overdue before blocking group
            $table->dateTime('blocked_at')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'advisor_id']);
        });

        Schema::create('mf_credit_group_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('mf_credit_groups')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('mf_clients')->cascadeOnDelete();
            $table->string('role', 20)->default('member'); // president, secretary, treasurer, member
            $table->string('status', 20)->default('active'); // active, inactive, expelled
            $table->date('joined_at');
            $table->date('left_at')->nullable();
            $table->timestamps();

            $table->unique(['group_id', 'client_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mf_credit_group_members');
        Schema::dropIfExists('mf_credit_groups');
    }
};
