<?php

namespace Modules\Governance\Models;

use Illuminate\Database\Eloquent\Model;

class UiGovernanceRule extends Model
{
    protected $fillable = [
        'module_name',
        'element_identifier',
        'action_type',
        'user_role',
        'permission_key',
        'pin_code',
        'max_pin_attempts',
        'active',
    ];

    protected $casts = [
        'active'           => 'boolean',
        'max_pin_attempts' => 'integer',
    ];

    protected $hidden = [
        'pin_code',
    ];
}
