<?php

namespace Modules\Microfinance\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MfCreditGroup extends Model
{
    use SoftDeletes;

    protected $table = 'mf_credit_groups';

    protected $fillable = [
        'group_number','name','advisor_id','meeting_day','meeting_time','meeting_location',
        'latitude','longitude','cycle_number','status','is_blocked','blocked_reason',
        'blocking_threshold_days','blocked_at','notes',
    ];

    protected $casts = [
        'is_blocked'  => 'boolean',
        'blocked_at'  => 'datetime',
        'meeting_time' => 'string',
    ];

    public static function generateNumber(): string
    {
        $year   = now()->year;
        $prefix = "GRP-{$year}-";
        $last   = static::where('group_number', 'like', $prefix . '%')->orderByDesc('group_number')->value('group_number');
        $next   = $last ? ((int) substr($last, -4)) + 1 : 1;
        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Check every active loan in the group; if any has days_overdue >= threshold, block the group.
     */
    public function checkAndUpdateBlockStatus(): void
    {
        $threshold    = $this->blocking_threshold_days;
        $memberIds    = $this->members()->active()->pluck('client_id');
        $overdueExists = MfLoan::whereIn('client_id', $memberIds)
            ->whereIn('status', ['disbursed', 'current', 'delinquent'])
            ->where('days_overdue', '>=', $threshold)
            ->exists();

        if ($overdueExists && !$this->is_blocked) {
            $this->update([
                'is_blocked'      => true,
                'status'          => 'blocked',
                'blocked_reason'  => "Mora ≥ {$threshold} días en miembro del grupo",
                'blocked_at'      => now(),
            ]);
        } elseif (!$overdueExists && $this->is_blocked) {
            $this->update([
                'is_blocked'     => false,
                'status'         => 'active',
                'blocked_reason' => null,
                'blocked_at'     => null,
            ]);
        }
    }

    /**
     * Maximum loan amount for the current cycle based on product's cycle_limits.
     */
    public function getCycleLimitFromProduct(MfLoanProduct $product): ?float
    {
        $limits = $product->cycle_limits;
        if (empty($limits)) return null;
        foreach ($limits as $entry) {
            if ((int) $entry['cycle'] === $this->cycle_number) return (float) $entry['max_amount'];
        }
        // Return last cycle limit if beyond defined cycles
        return (float) end($limits)['max_amount'];
    }

    public function members(): HasMany { return $this->hasMany(MfCreditGroupMember::class, 'group_id'); }
    public function loans(): HasMany   { return $this->hasMany(MfLoan::class, 'group_id'); }
}
