<?php

namespace Modules\Barbershop\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Barbershop\Models\BarbershopService;
use Modules\Barbershop\Models\BarbershopServiceCategory;

class BarbershopServiceController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = BarbershopService::with('category');

        if ($search = $request->input('search')) {
            $query->where('name', 'ilike', "%{$search}%");
        }

        if ($categoryId = $request->input('category_id')) {
            $query->where('category_id', $categoryId);
        }

        if ($request->has('active') && $request->input('active') !== '') {
            $query->where('active', filter_var($request->input('active'), FILTER_VALIDATE_BOOLEAN));
        }

        $services = $query->orderBy('name')->paginate(50)->withQueryString();

        return Inertia::render('Barbershop::Services/Index', [
            'services'   => $services,
            'categories' => BarbershopServiceCategory::active()->orderBy('name')->get(),
            'filters'    => $request->only(['search', 'category_id', 'active']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Barbershop::Services/Form', [
            'service'    => null,
            'categories' => BarbershopServiceCategory::active()->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $request->merge([
            'category_id' => $request->category_id === '__none__' ? null : $request->category_id,
        ]);

        $data = $request->validate([
            'category_id'     => ['nullable', 'exists:barbershop_service_categories,id'],
            'name'            => ['required', 'string', 'max:150'],
            'description'     => ['nullable', 'string', 'max:1000'],
            'duration_minutes' => ['required', 'integer', 'min:5', 'max:480'],
            'price'           => ['required', 'numeric', 'min:0'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'active'          => ['boolean'],
        ]);

        BarbershopService::create($data);

        return redirect()->route('barbershop.services.index')
            ->with('success', 'Servicio creado correctamente.');
    }

    public function edit(Request $request, BarbershopService $service): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Barbershop::Services/Form', [
            'service'    => $service,
            'categories' => BarbershopServiceCategory::active()->orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, BarbershopService $service): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $request->merge([
            'category_id' => $request->category_id === '__none__' ? null : $request->category_id,
        ]);

        $data = $request->validate([
            'category_id'     => ['nullable', 'exists:barbershop_service_categories,id'],
            'name'            => ['required', 'string', 'max:150'],
            'description'     => ['nullable', 'string', 'max:1000'],
            'duration_minutes' => ['required', 'integer', 'min:5', 'max:480'],
            'price'           => ['required', 'numeric', 'min:0'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'active'          => ['boolean'],
        ]);

        $service->update($data);

        return back()->with('success', 'Servicio actualizado correctamente.');
    }

    public function destroy(Request $request, BarbershopService $service): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $name = $service->name;
        $service->delete();

        return redirect()->route('barbershop.services.index')
            ->with('success', "Servicio \"{$name}\" eliminado.");
    }
}
