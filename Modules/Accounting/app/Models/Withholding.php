<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;

class Withholding extends Model
{
    protected $table = 'account_withholdings';

    protected $fillable = [
        'code',
        'name',
        'description',
        'type',
        'scope',
        'rate',
        'account_id',
        'payable_account_id',
        'active',
    ];

    protected $casts = [
        'rate'   => 'decimal:2',
        'active' => 'boolean',
    ];
}
