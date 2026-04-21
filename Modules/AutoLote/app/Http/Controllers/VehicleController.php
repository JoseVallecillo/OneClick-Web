<?php

namespace Modules\AutoLote\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Modules\AutoLote\Models\Vehicle;
use Modules\Contacts\Models\Contact;

class VehicleController extends Controller
{
    public function index(Request $request)
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = Vehicle::with('vendedor')
            ->when($request->search, function ($q, $s) {
                $q->where(function ($q2) use ($s) {
                    $q2->where('vin', 'like', "%{$s}%")
                       ->orWhere('placa', 'like', "%{$s}%")
                       ->orWhere('marca', 'like', "%{$s}%")
                       ->orWhere('modelo', 'like', "%{$s}%");
                });
            })
            ->when($request->estado, fn ($q, $e) => $q->where('estado', $e))
            ->orderByDesc('id');

        return Inertia::render('AutoLote::Vehicles/Index', [
            'vehicles' => $query->paginate(50)->withQueryString(),
            'filters'  => $request->only('search', 'estado'),
        ]);
    }

    public function create(Request $request)
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('AutoLote::Vehicles/Form', [
            'contacts' => Contact::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'vin'                   => 'nullable|string|max:50|unique:autolote_vehicles,vin',
            'placa'                 => 'nullable|string|max:20|unique:autolote_vehicles,placa',
            'motor'                 => 'nullable|string|max:50',
            'marca'                 => 'required|string|max:80',
            'modelo'                => 'required|string|max:80',
            'anio'                  => 'required|integer|min:1900|max:' . (now()->year + 2),
            'color'                 => 'nullable|string|max:50',
            'transmision'           => 'required|in:manual,automatica,cvt,otro',
            'kilometraje'           => 'required|integer|min:0',
            'num_duenos_anteriores' => 'required|integer|min:0',
            'gravamen'              => 'boolean',
            'estado_aduana'         => 'required|in:nacional,en_tramite,importado,exonerado',
            'precio_compra'         => 'required|numeric|min:0',
            'vendedor_id'           => 'nullable|exists:contacts,id',
            'notas'                 => 'nullable|string',
            'received_at'           => 'required|date',
        ]);

        $data['costo_total'] = $data['precio_compra'];
        $data['estado']      = 'recepcion';

        $vehicle = Vehicle::create($data);

        return redirect()->route('autolote.vehicles.show', $vehicle)
            ->with('success', 'Vehículo registrado correctamente.');
    }

    public function show(Request $request, Vehicle $vehicle)
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $vehicle->load('vendedor', 'expenses', 'sale.buyer', 'sale.loan.payments', 'sale.vehiclePermuta');

        return Inertia::render('AutoLote::Vehicles/Show', [
            'vehicle' => $vehicle,
        ]);
    }

    public function edit(Request $request, Vehicle $vehicle)
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('AutoLote::Vehicles/Form', [
            'vehicle'  => $vehicle,
            'contacts' => Contact::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Vehicle $vehicle)
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'vin'                   => "nullable|string|max:50|unique:autolote_vehicles,vin,{$vehicle->id}",
            'placa'                 => "nullable|string|max:20|unique:autolote_vehicles,placa,{$vehicle->id}",
            'motor'                 => 'nullable|string|max:50',
            'marca'                 => 'required|string|max:80',
            'modelo'                => 'required|string|max:80',
            'anio'                  => 'required|integer|min:1900|max:' . (now()->year + 2),
            'color'                 => 'nullable|string|max:50',
            'transmision'           => 'required|in:manual,automatica,cvt,otro',
            'kilometraje'           => 'required|integer|min:0',
            'num_duenos_anteriores' => 'required|integer|min:0',
            'gravamen'              => 'boolean',
            'estado_aduana'         => 'required|in:nacional,en_tramite,importado,exonerado',
            'precio_compra'         => 'required|numeric|min:0',
            'vendedor_id'           => 'nullable|exists:contacts,id',
            'notas'                 => 'nullable|string',
            'received_at'           => 'required|date',
        ]);

        DB::transaction(function () use ($vehicle, $data) {
            $vehicle->update($data);
            $vehicle->recalculateCosto();
        });

        return redirect()->route('autolote.vehicles.show', $vehicle)
            ->with('success', 'Vehículo actualizado correctamente.');
    }

    public function destroy(Request $request, Vehicle $vehicle)
    {
        $this->requireAdmin($request);

        if (! $vehicle->isRecepcion()) {
            return back()->with('error', 'Solo se pueden eliminar vehículos en estado de Recepción.');
        }

        $vehicle->delete();

        return redirect()->route('autolote.vehicles.index')
            ->with('success', 'Vehículo eliminado.');
    }

    public function transition(Request $request, Vehicle $vehicle)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'estado' => 'required|in:recepcion,preparacion,exhibicion,apartado,vendido',
        ]);

        if ($vehicle->isVendido()) {
            return back()->with('error', 'No se puede cambiar el estado de un vehículo vendido.');
        }

        $vehicle->update(['estado' => $data['estado']]);

        $labels = [
            'recepcion'   => 'Recepción',
            'preparacion' => 'Preparación',
            'exhibicion'  => 'Exhibición',
            'apartado'    => 'Apartado',
            'vendido'     => 'Vendido',
        ];

        return back()->with('success', 'Estado actualizado a "' . ($labels[$data['estado']] ?? $data['estado']) . '".');
    }
}
