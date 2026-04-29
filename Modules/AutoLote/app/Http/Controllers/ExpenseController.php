<?php

namespace Modules\AutoLote\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\AutoLote\Models\Vehicle;
use Modules\AutoLote\Models\VehicleExpense;

class ExpenseController extends Controller
{
    public function store(Request $request, Vehicle $vehicle)
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'tipo'        => 'required|in:mecanica,pintura,lavado,tapiceria,electrico,otro',
            'descripcion' => 'required|string|max:255',
            'monto'       => 'required|numeric|min:0.01',
            'fecha'       => 'required|date',
        ]);

        DB::transaction(function () use ($vehicle, $data) {
            $data['vehicle_id'] = $vehicle->id;
            VehicleExpense::create($data);
            $vehicle->recalculateCosto();
        });

        return back()->with('success', 'Gasto registrado y costo total actualizado.');
    }

    public function destroy(Request $request, Vehicle $vehicle, VehicleExpense $expense)
    {
        $this->requireAdmin($request);

        abort_if($expense->vehicle_id !== $vehicle->id, 404);

        DB::transaction(function () use ($vehicle, $expense) {
            $expense->delete();
            $vehicle->recalculateCosto();
        });

        return back()->with('success', 'Gasto eliminado.');
    }
}
