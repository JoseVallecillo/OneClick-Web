<?php

namespace Modules\CarService\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\CarService\Models\ServiceOrder;
use Modules\CarService\Models\Vehicle;
use Modules\Contacts\Models\Contact;

class VehicleController extends Controller
{
    // -------------------------------------------------------------------------
    // Index
    // -------------------------------------------------------------------------

    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = Vehicle::with('customer')->where('active', true);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('plate', 'ilike', "%{$search}%")
                  ->orWhere('vin', 'ilike', "%{$search}%")
                  ->orWhere('make', 'ilike', "%{$search}%")
                  ->orWhere('model', 'ilike', "%{$search}%")
                  ->orWhereHas('customer', fn ($sq) => $sq->where('name', 'ilike', "%{$search}%"));
            });
        }

        $vehicles = $query->orderByDesc('id')->paginate(50)->withQueryString();

        return Inertia::render('CarService::Vehicles/Index', [
            'vehicles' => $vehicles,
            'filters'  => $request->only(['search']),
        ]);
    }

    // -------------------------------------------------------------------------
    // Lookup by plate (AJAX — for check-in form)
    // -------------------------------------------------------------------------

    public function lookup(Request $request): JsonResponse
    {
        $plate = strtoupper(trim($request->input('plate', '')));
        $query = strtoupper(trim($request->input('query', '')));
        
        if (! $plate && ! $query) {
            return response()->json(['vehicle' => null, 'vehicles' => []]);
        }

        // Si es una búsqueda parcial para sugerencias
        if ($query) {
            $vehicles = Vehicle::where('plate', 'ilike', "%{$query}%")
                ->limit(10)
                ->get(['id', 'plate', 'make', 'model']);
            return response()->json(['vehicles' => $vehicles]);
        }

        // Búsqueda exacta (comportamiento original para el botón buscar o Enter)
        // Primero intentar coincidencia exacta
        $vehicle = Vehicle::with(['customer', 'serviceOrders' => fn ($q) => $q->where('status', 'completed')->latest('completed_at')->limit(1)])
            ->where('plate', $plate)
            ->first();

        // Si no hay coincidencia exacta, intentar una búsqueda más flexible
        if (! $vehicle) {
            $cleanPlate = preg_replace('/[^A-Z0-9]/', '', $plate);
            $vehicle = Vehicle::with(['customer', 'serviceOrders' => fn ($q) => $q->where('status', 'completed')->latest('completed_at')->limit(1)])
                ->whereRaw("REPLACE(REPLACE(plate, '-', ''), ' ', '') ILIKE ?", [$cleanPlate])
                ->first();
        }

        if (! $vehicle) {
            return response()->json(['vehicle' => null]);
        }

        $lastOrder = $vehicle->serviceOrders->first();

        return response()->json([
            'vehicle' => [
                'id'             => $vehicle->id,
                'plate'          => $vehicle->plate,
                'vin'            => $vehicle->vin,
                'make'           => $vehicle->make,
                'model'          => $vehicle->model,
                'year'           => $vehicle->year,
                'color'          => $vehicle->color,
                'engine'         => $vehicle->engine,
                'transmission'   => $vehicle->transmission,
                'last_odometer'  => $vehicle->last_odometer,
                'customer'       => $vehicle->customer ? [
                    'id'   => $vehicle->customer->id,
                    'name' => $vehicle->customer->name,
                ] : null,
                'last_service' => $lastOrder ? [
                    'reference'    => $lastOrder->reference,
                    'oil_type'     => $lastOrder->oil_type,
                    'oil_viscosity' => $lastOrder->oil_viscosity,
                    'odometer_out' => $lastOrder->odometer_out,
                    'completed_at' => $lastOrder->completed_at?->toDateString(),
                    'next_service_km'   => $lastOrder->next_service_km,
                    'next_service_date' => $lastOrder->next_service_date?->toDateString(),
                ] : null,
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // Store (create new vehicle inline from check-in)
    // -------------------------------------------------------------------------

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'plate'        => ['required', 'string', 'max:20', 'unique:vehicles,plate'],
            'vin'          => ['nullable', 'string', 'max:17', 'unique:vehicles,vin'],
            'make'         => ['required', 'string', 'max:80'],
            'model'        => ['required', 'string', 'max:80'],
            'year'         => ['nullable', 'integer', 'min:1900', 'max:' . (now()->year + 2)],
            'color'        => ['nullable', 'string', 'max:50'],
            'engine'       => ['nullable', 'string', 'max:50'],
            'transmission' => ['nullable', 'in:manual,automatic,cvt'],
            'customer_id'  => ['nullable', 'exists:contacts,id'],
            'notes'        => ['nullable', 'string', 'max:1000'],
        ]);

        $vehicle = Vehicle::create($data);

        return redirect()->route('carservice.checkin.create', ['plate' => $vehicle->plate])
            ->with('success', "Vehículo {$vehicle->plate} registrado correctamente.");
    }

    // -------------------------------------------------------------------------
    // Edit
    // -------------------------------------------------------------------------

    public function edit(Request $request, Vehicle $vehicle): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('CarService::Vehicles/Form', [
            'vehicle'   => $vehicle,
            'customers' => Contact::orderBy('name')->get(['id', 'name']),
        ]);
    }

    // -------------------------------------------------------------------------
    // Update
    // -------------------------------------------------------------------------

    public function update(Request $request, Vehicle $vehicle): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'plate'        => ['required', 'string', 'max:20', "unique:vehicles,plate,{$vehicle->id}"],
            'vin'          => ['nullable', 'string', 'max:17', "unique:vehicles,vin,{$vehicle->id}"],
            'make'         => ['required', 'string', 'max:80'],
            'model'        => ['required', 'string', 'max:80'],
            'year'         => ['nullable', 'integer', 'min:1900', 'max:' . (now()->year + 2)],
            'color'        => ['nullable', 'string', 'max:50'],
            'engine'       => ['nullable', 'string', 'max:50'],
            'transmission' => ['nullable', 'in:manual,automatic,cvt'],
            'customer_id'  => ['nullable', 'exists:contacts,id'],
            'notes'        => ['nullable', 'string', 'max:1000'],
            'active'       => ['nullable', 'boolean'],
        ]);

        $vehicle->update($data);

        return redirect()->route('carservice.vehicles.index')
            ->with('success', "Vehículo {$vehicle->plate} actualizado.");
    }
}
