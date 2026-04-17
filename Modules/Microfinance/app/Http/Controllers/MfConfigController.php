<?php

namespace Modules\Microfinance\app\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Microfinance\app\Models\MfLoanProduct;

class MfConfigController extends Controller
{
    public function products()
    {
        return Inertia::render('Microfinance::Config/Products', [
            'products' => MfLoanProduct::orderBy('name')->get(),
        ]);
    }

    public function storeProduct(Request $request)
    {
        $data = $request->validate([
            'name'                  => 'required|string|max:100',
            'code'                  => 'required|string|max:20|unique:mf_loan_products,code',
            'loan_type'             => 'in:individual,group',
            'currency'              => 'in:HNL,USD',
            'annual_rate'           => 'required|numeric|min:0',
            'rate_calculation'      => 'in:flat,declining',
            'origination_fee_type'  => 'in:flat,pct',
            'origination_fee_value' => 'required|numeric|min:0',
            'insurance_pct'         => 'nullable|numeric|min:0',
            'late_fee_type'         => 'in:fixed_daily,daily_pct',
            'late_fee_value'        => 'required|numeric|min:0',
            'payment_frequency'     => 'in:weekly,biweekly,monthly',
            'min_term_payments'     => 'required|integer|min:1',
            'max_term_payments'     => 'required|integer|min:1',
            'min_amount'            => 'required|numeric|min:0',
            'max_amount'            => 'required|numeric|min:0',
            'cycle_limits'          => 'nullable|array',
            'group_block_days'      => 'integer|min:1',
            'notes'                 => 'nullable|string',
        ]);

        MfLoanProduct::create($data);
        return back();
    }

    public function updateProduct(Request $request, MfLoanProduct $product)
    {
        $data = $request->validate([
            'name'                  => 'required|string|max:100',
            'loan_type'             => 'in:individual,solidary_group',
            'annual_rate'           => 'required|numeric|min:0',
            'rate_calculation'      => 'in:flat,declining',
            'payment_frequency'     => 'in:weekly,biweekly,monthly',
            'origination_fee_type'  => 'in:flat,pct',
            'origination_fee_value' => 'required|numeric|min:0',
            'insurance_pct'         => 'nullable|numeric|min:0',
            'late_fee_type'         => 'in:fixed_daily,daily_pct',
            'late_fee_value'        => 'required|numeric|min:0',
            'min_amount'            => 'required|numeric|min:0',
            'max_amount'            => 'required|numeric|min:0',
            'min_term_payments'     => 'required|integer|min:1',
            'max_term_payments'     => 'required|integer|min:1',
            'cycle_limits'          => 'nullable|array',
        ]);

        $product->update($data);
        return back();
    }

    public function toggleProduct(MfLoanProduct $product)
    {
        $product->update(['is_active' => !$product->is_active]);
        return back();
    }
}
