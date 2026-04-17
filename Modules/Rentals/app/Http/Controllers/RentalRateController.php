<?php

namespace Modules\Rentals\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Models\Product;
use Modules\Rentals\Models\RentalRate;

class RentalRateController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $search = $request->input('search', '');

        $rates = RentalRate::with('product')
            ->when($search, fn($q) => $q->whereHas('product', fn($sq) =>
                $sq->where('name', 'ilike', "%{$search}%")->orWhere('sku', 'ilike', "%{$search}%")
            ))
            ->orderBy('id')
            ->paginate(50)
            ->withQueryString();

        $productsWithoutRate = Product::where('active', true)
            ->whereNotIn('id', RentalRate::pluck('product_id'))
            ->orderBy('name')
            ->get(['id', 'sku', 'name']);

        return Inertia::render('Rentals::Rates/Index', [
            'rates'               => $rates,
            'productsWithoutRate' => $productsWithoutRate,
            'filters'             => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'product_id'             => ['required', 'exists:products,id', 'unique:rental_rates,product_id'],
            'hourly_price'           => ['required', 'numeric', 'min:0'],
            'daily_price'            => ['required', 'numeric', 'min:0'],
            'weekly_price'           => ['required', 'numeric', 'min:0'],
            'monthly_price'          => ['required', 'numeric', 'min:0'],
            'deposit_amount'         => ['required', 'numeric', 'min:0'],
            'buffer_hours_before'    => ['required', 'integer', 'min:0'],
            'buffer_hours_after'     => ['required', 'integer', 'min:0'],
            'maintenance_limit_days' => ['nullable', 'integer', 'min:1'],
            'notes'                  => ['nullable', 'string', 'max:500'],
        ]);

        RentalRate::create($data);

        return redirect()->route('rentals.rates.index')
            ->with('success', 'Tarifa de alquiler creada.');
    }

    public function update(Request $request, RentalRate $rate): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'hourly_price'           => ['required', 'numeric', 'min:0'],
            'daily_price'            => ['required', 'numeric', 'min:0'],
            'weekly_price'           => ['required', 'numeric', 'min:0'],
            'monthly_price'          => ['required', 'numeric', 'min:0'],
            'deposit_amount'         => ['required', 'numeric', 'min:0'],
            'buffer_hours_before'    => ['required', 'integer', 'min:0'],
            'buffer_hours_after'     => ['required', 'integer', 'min:0'],
            'maintenance_limit_days' => ['nullable', 'integer', 'min:1'],
            'notes'                  => ['nullable', 'string', 'max:500'],
        ]);

        $rate->update($data);

        return redirect()->route('rentals.rates.index')
            ->with('success', 'Tarifa actualizada.');
    }

    public function destroy(Request $request, RentalRate $rate): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $rate->delete();

        return redirect()->route('rentals.rates.index')
            ->with('success', 'Tarifa eliminada.');
    }
}
