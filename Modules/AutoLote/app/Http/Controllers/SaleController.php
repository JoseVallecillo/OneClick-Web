<?php

namespace Modules\AutoLote\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Modules\AutoLote\Models\LoanPayment;
use Modules\AutoLote\Models\Vehicle;
use Modules\AutoLote\Models\VehicleLoan;
use Modules\AutoLote\Models\VehicleSale;
use Modules\Contacts\Models\Contact;

class SaleController extends Controller
{
    public function create(Request $request, Vehicle $vehicle)
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        if ($vehicle->isRecepcion() || $vehicle->isPreparacion() || $vehicle->isVendido()) {
            abort(403, 'El vehículo no está disponible para la venta.');
        }

        return Inertia::render('AutoLote::Sales/Form', [
            'vehicle'              => $vehicle->load('expenses'),
            'contacts'             => Contact::orderBy('name')->get(['id', 'name']),
            'disponibles_permuta'  => Vehicle::where('id', '!=', $vehicle->id)
                ->whereNotIn('estado', ['vendido'])
                ->orderBy('marca')
                ->get(['id', 'marca', 'modelo', 'anio', 'placa']),
        ]);
    }

    public function store(Request $request, Vehicle $vehicle)
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        if ($vehicle->isRecepcion() || $vehicle->isPreparacion() || $vehicle->isVendido()) {
            abort(403, 'El vehículo no está disponible para la venta.');
        }

        $data = $request->validate([
            'buyer_id'            => 'required|exists:contacts,id',
            'precio_venta'        => 'required|numeric|min:0',
            'descuento'           => 'nullable|numeric|min:0',
            'tipo_pago'           => 'required|in:contado,credito_propio,financiamiento_externo',
            'vehicle_permuta_id'  => 'nullable|exists:autolote_vehicles,id',
            'valor_permuta'       => 'nullable|numeric|min:0',
            'fecha_venta'         => 'required|date',
            'notas'               => 'nullable|string',
            'loan.monto_prestamo' => 'required_if:tipo_pago,credito_propio|nullable|numeric|min:1',
            'loan.tasa_interes'   => 'required_if:tipo_pago,credito_propio|nullable|numeric|min:0|max:100',
            'loan.plazo_meses'    => 'required_if:tipo_pago,credito_propio|nullable|integer|min:1|max:360',
            'loan.fecha_inicio'   => 'required_if:tipo_pago,credito_propio|nullable|date',
        ]);

        DB::transaction(function () use ($vehicle, $data, $request) {
            $sale = VehicleSale::create([
                'vehicle_id'         => $vehicle->id,
                'buyer_id'           => $data['buyer_id'],
                'precio_venta'       => $data['precio_venta'],
                'descuento'          => $data['descuento'] ?? 0,
                'tipo_pago'          => $data['tipo_pago'],
                'vehicle_permuta_id' => $data['vehicle_permuta_id'] ?? null,
                'valor_permuta'      => $data['valor_permuta'] ?? 0,
                'fecha_venta'        => $data['fecha_venta'],
                'notas'              => $data['notas'] ?? null,
            ]);

            $vehicle->update(['estado' => 'vendido']);

            if ($data['vehicle_permuta_id'] ?? null) {
                Vehicle::where('id', $data['vehicle_permuta_id'])
                    ->update(['estado' => 'recepcion']);
            }

            if ($data['tipo_pago'] === 'credito_propio' && $request->loan) {
                $loan = VehicleLoan::create([
                    'sale_id'        => $sale->id,
                    'monto_prestamo' => $request->loan['monto_prestamo'],
                    'tasa_interes'   => $request->loan['tasa_interes'],
                    'plazo_meses'    => $request->loan['plazo_meses'],
                    'fecha_inicio'   => $request->loan['fecha_inicio'],
                    'estado'         => 'activo',
                ]);
                $loan->generateSchedule();
            }
        });

        return redirect()->route('autolote.vehicles.show', $vehicle)
            ->with('success', 'Venta registrada exitosamente.');
    }

    public function registerPayment(Request $request, VehicleLoan $loan, LoanPayment $payment)
    {
        $this->requireAdmin($request);

        abort_if($payment->loan_id !== $loan->id, 404);

        if ($payment->pagado) {
            return back()->with('error', 'Esta cuota ya fue registrada como pagada.');
        }

        $data = $request->validate([
            'fecha_pago' => 'required|date',
        ]);

        DB::transaction(function () use ($loan, $payment, $data) {
            $payment->update([
                'pagado'     => true,
                'fecha_pago' => $data['fecha_pago'],
            ]);

            if ($loan->payments()->where('pagado', false)->doesntExist()) {
                $loan->update(['estado' => 'pagado']);
            }
        });

        return back()->with('success', "Cuota #{$payment->numero_cuota} registrada como pagada.");
    }
}
