<?php

namespace Modules\Barbershop\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Barbershop\Models\BarbershopServiceConfig;
use Modules\Inventory\Models\Product;

class BarbershopServiceController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = BarbershopServiceConfig::with('product:id,name,price')
            ->when($request->input('search'), fn ($q, $s) =>
                $q->whereHas('product', fn ($p) => $p->where('name', 'ilike', "%{$s}%"))
            )
            ->when($request->input('active') !== null && $request->input('active') !== '', fn ($q) =>
                $q->where('active', (bool) $request->input('active'))
            );

        $services = $query->paginate(50)->withQueryString();

        return Inertia::render('Barbershop::Services/Index', [
            'services' => $services,
            'filters'  => $request->only(['search', 'active']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $usedIds = BarbershopServiceConfig::pluck('product_id');

        $products = Product::where('active', true)
            ->whereNotIn('id', $usedIds)
            ->orderBy('name')
            ->get(['id', 'name', 'price']);

        return Inertia::render('Barbershop::Services/Form', [
            'config'   => null,
            'products' => $products,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'product_id'       => ['required', 'exists:products,id', 'unique:barbershop_service_configs,product_id'],
            'duration_minutes' => ['required', 'integer', 'min:5', 'max:480'],
            'commission_rate'  => ['required', 'numeric', 'min:0', 'max:100'],
            'active'           => ['boolean'],
        ]);

        BarbershopServiceConfig::create($data);

        return redirect()->route('barbershop.services.index')
            ->with('success', 'Servicio configurado correctamente.');
    }

    public function edit(Request $request, BarbershopServiceConfig $service): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $service->load('product:id,name,price');

        return Inertia::render('Barbershop::Services/Form', [
            'config'   => $service,
            'products' => [],
        ]);
    }

    public function update(Request $request, BarbershopServiceConfig $service): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'duration_minutes' => ['required', 'integer', 'min:5', 'max:480'],
            'commission_rate'  => ['required', 'numeric', 'min:0', 'max:100'],
            'active'           => ['boolean'],
        ]);

        $service->update($data);

        return redirect()->route('barbershop.services.index')
            ->with('success', 'Servicio actualizado correctamente.');
    }

    public function destroy(Request $request, BarbershopServiceConfig $service): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $name = $service->product?->name ?? 'Servicio';
        $service->delete();

        return back()->with('success', "Configuración de \"{$name}\" eliminada.");
    }
}
