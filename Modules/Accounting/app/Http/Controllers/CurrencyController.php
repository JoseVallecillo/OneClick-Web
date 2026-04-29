<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Settings\Models\Currency;

class CurrencyController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $currencies = Currency::orderBy('is_primary', 'desc')->orderBy('code')->get();

        return Inertia::render('Accounting::Currencies/Index', [
            'currencies' => $currencies,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::Currencies/Form');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'code'          => ['required', 'string', 'max:10', 'unique:currencies,code'],
            'name'          => ['required', 'string', 'max:100'],
            'symbol'        => ['required', 'string', 'max:10'],
            'exchange_rate' => ['required', 'numeric', 'min:0.000001'],
            'is_primary'    => ['boolean'],
            'active'        => ['boolean'],
        ]);

        $currency = Currency::create($data);

        if (! empty($data['is_primary'])) {
            $currency->setPrimary();
        }

        return redirect()->route('accounting.currencies.index')
            ->with('success', "Moneda {$currency->name} creada.");
    }

    public function edit(Request $request, Currency $currency): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::Currencies/Form', [
            'currency' => $currency,
        ]);
    }

    public function update(Request $request, Currency $currency): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'code'          => ['required', 'string', 'max:10', "unique:currencies,code,{$currency->id}"],
            'name'          => ['required', 'string', 'max:100'],
            'symbol'        => ['required', 'string', 'max:10'],
            'exchange_rate' => ['required', 'numeric', 'min:0.000001'],
            'is_primary'    => ['boolean'],
            'active'        => ['boolean'],
        ]);

        $currency->update($data);

        if (! empty($data['is_primary'])) {
            $currency->setPrimary();
        }

        return redirect()->route('accounting.currencies.index')
            ->with('success', "Moneda {$currency->name} actualizada.");
    }

    public function destroy(Request $request, Currency $currency): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        if ($currency->is_primary) {
            return back()->withErrors(['currency' => 'No puedes eliminar la moneda principal.']);
        }

        $currency->delete();

        return redirect()->route('accounting.currencies.index')
            ->with('success', "Moneda eliminada.");
    }
}
