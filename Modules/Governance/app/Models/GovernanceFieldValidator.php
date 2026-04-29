<?php

namespace Modules\Governance\Models;

use Illuminate\Database\Eloquent\Model;

class GovernanceFieldValidator extends Model
{
    protected $fillable = [
        'module_name',
        'field_identifier',
        'validation_type',
        'user_role',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];
}
