<?php

namespace Modules\CarService\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Modules\CarService\Models\ServiceOrder;
use Modules\CarService\Models\ServiceOrderLine;
use Modules\CarService\Models\ServicePackage;
use Modules\CarService\Models\Vehicle;
use Modules\Contacts\Models\Contact;
use Modules\Inventory\Models\Product;
use Modules\Inventory\Models\Warehouse;

class ServiceOrderController extends Controller
{
    // -------------------------------------------------------------------------
    // Index
    // -------------------------------------------------------------------------

    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = ServiceOrder::with(['vehicle', 'customer', 'servicePackage', 'creator'])
            ->withCount('lines');

        if ($status = $request->input('status')) {
            if (is_array($status)) {
                $query->whereIn('status', $status);
            } else {
                $query->where('status', $status);
            }
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'ilike', "%{$search}%")
                  ->orWhereHas('vehicle', fn ($sq) => $sq->where('plate', 'ilike', "%{$search}%"))
                  ->orWhereHas('customer', fn ($sq) => $sq->where('name', 'ilike', "%{$search}%"));
            });
        }

        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $orders = $query->orderByDesc('id')->paginate(50)->withQueryString();

        return Inertia::render('CarService::ServiceOrders/Index', [
            'orders'  => $orders,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to']),
        ]);
    }

    // -------------------------------------------------------------------------
    // Check-in form (create)
    // -------------------------------------------------------------------------

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('CarService::ServiceOrders/CheckIn', [
            'customers'       => Contact::where('is_client', true)->where('active', true)->orderBy('name')->get(['id', 'name', 'rtn']),
            'initialPlate'    => strtoupper($request->input('plate', '')),
        ]);
    }

    // -------------------------------------------------------------------------
    // Store (check-in)
    // -------------------------------------------------------------------------

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'vehicle_id'         => ['required', 'exists:vehicles,id'],
            'customer_id'        => ['required', 'exists:contacts,id'],
            'odometer_in'        => ['required', 'integer', 'min:0'],
            'photo_front'        => ['nullable', 'image', 'max:4096'],
            'photo_side'         => ['nullable', 'image', 'max:4096'],
            'photo_rear'         => ['nullable', 'image', 'max:4096'],
            'photo_right'        => ['nullable', 'image', 'max:4096'],
            'inspection_notes'   => ['nullable', 'string', 'max:2000'],
            'notes'              => ['nullable', 'string', 'max:2000'],

            // Campones opcionales del vehículo que se pueden actualizar en el check-in
            'vin'                => ['nullable', 'string', 'max:17'],
            'make'               => ['required', 'string', 'max:80'],
            'model'              => ['required', 'string', 'max:80'],
            'year'               => ['nullable', 'integer', 'min:1900'],
            'color'              => ['nullable', 'string', 'max:50'],
            'engine'             => ['nullable', 'string', 'max:50'],
            'transmission'       => ['nullable', 'in:manual,automatic,cvt'],
        ]);

        $vehicle = Vehicle::findOrFail($data['vehicle_id']);

        if ($vehicle->last_odometer > 0 && (int) $data['odometer_in'] < $vehicle->last_odometer) {
            return back()->withErrors([
                'odometer_in' => "El odómetro ({$data['odometer_in']} km) es menor al último registrado ({$vehicle->last_odometer} km). Verifique el valor.",
            ])->withInput();
        }

        $order = DB::transaction(function () use ($request, $data, $vehicle) {
            $photos = [];
            foreach (['photo_front', 'photo_side', 'photo_rear', 'photo_right'] as $field) {
                if ($request->hasFile($field)) {
                    $photos[$field] = $request->file($field)->store('carservice/inspections', 'public');
                }
            }

            $order = ServiceOrder::create([
                'reference'          => ServiceOrder::generateReference(),
                'vehicle_id'         => $data['vehicle_id'],
                'customer_id'        => $data['customer_id'],
                'status'             => 'draft', // Se crea como Check-in inicial (Borrador)
                'odometer_in'        => $data['odometer_in'],
                'photo_front'        => $photos['photo_front'] ?? null,
                'photo_side'         => $photos['photo_side'] ?? null,
                'photo_rear'         => $photos['photo_rear'] ?? null,
                'photo_right'        => $photos['photo_right'] ?? null,
                'inspection_notes'   => $data['inspection_notes'] ?? null,
                'notes'              => $data['notes'] ?? null,
                'checked_in_at'      => now(),
                'created_by'         => Auth::id(),
                'subtotal'           => 0,
                'tax_amount'         => 0,
                'total'              => 0,
            ]);

            $vehicle->update([
                'vin'          => $data['vin'] ?? $vehicle->vin,
                'make'         => $data['make'],
                'model'        => $data['model'],
                'year'         => $data['year'] ?? $vehicle->year,
                'color'        => $data['color'] ?? $vehicle->color,
                'engine'       => $data['engine'] ?? $vehicle->engine,
                'transmission' => $data['transmission'] ?? $vehicle->transmission,
                'last_odometer' => $data['odometer_in'],
                'customer_id'  => $data['customer_id'],
            ]);

            return $order;
        });

        return redirect()->route('carservice.orders.show', $order)
            ->with('success', "Orden {$order->reference} creada. Vehículo en proceso de servicio.");
    }

    // -------------------------------------------------------------------------
    // Show
    // -------------------------------------------------------------------------

    public function show(Request $request, ServiceOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $order->load(['vehicle.customer', 'customer', 'servicePackage', 'creator', 'lines.product.uom']);

        $history = ServiceOrder::where('vehicle_id', $order->vehicle_id)
            ->where('id', '!=', $order->id)
            ->where('status', 'completed')
            ->orderByDesc('completed_at')
            ->limit(5)
            ->get(['id', 'reference', 'oil_type', 'oil_viscosity', 'odometer_out', 'completed_at', 'next_service_km', 'total']);

        return Inertia::render('CarService::ServiceOrders/Show', [
            'order'   => $order,
            'history' => $history,
        ]);
    }

    // -------------------------------------------------------------------------
    // Edit / Update
    // -------------------------------------------------------------------------

    public function edit(Request $request, ServiceOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isEditable(), 403, 'Solo se pueden editar órdenes en borrador o en proceso.');

        $order->load(['vehicle']);

        return Inertia::render('CarService::ServiceOrders/CheckIn', [
            'order'           => $order,
            'customers'       => Contact::where('is_client', true)->where('active', true)->orderBy('name')->get(['id', 'name', 'rtn']),
            'initialPlate'    => $order->vehicle->plate ?? '',
        ]);
    }

    public function update(Request $request, ServiceOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isEditable(), 403, 'Solo se pueden editar órdenes en borrador o en proceso.');

        $data = $request->validate([
            'customer_id'        => ['required', 'exists:contacts,id'],
            'odometer_in'        => ['required', 'integer', 'min:0'],
            'photo_front'        => ['nullable', 'image', 'max:4096'],
            'photo_side'         => ['nullable', 'image', 'max:4096'],
            'photo_rear'         => ['nullable', 'image', 'max:4096'],
            'photo_right'        => ['nullable', 'image', 'max:4096'],
            'notes'              => ['nullable', 'string', 'max:2000'],

            // Campos del vehículo
            'plate'              => ['required', 'string', 'max:20'],
            'vin'                => ['nullable', 'string', 'max:17'],
            'make'               => ['required', 'string', 'max:80'],
            'model'              => ['required', 'string', 'max:80'],
            'year'               => ['nullable', 'integer'],
            'color'              => ['nullable', 'string', 'max:50'],
            'engine'             => ['nullable', 'string', 'max:50'],
            'transmission'       => ['nullable', 'in:manual,automatic,cvt'],
        ]);

        DB::transaction(function () use ($request, $order, $data) {
            $photos = [];
            foreach (['photo_front', 'photo_side', 'photo_rear', 'photo_right'] as $field) {
                if ($request->hasFile($field)) {
                    // Delete old photo
                    if ($order->$field) {
                        Storage::disk('public')->delete($order->$field);
                    }
                    $photos[$field] = $request->file($field)->store('carservice/inspections', 'public');
                }
            }

            $order->update(array_merge([
                'customer_id'        => $data['customer_id'],
                'odometer_in'        => $data['odometer_in'],
                'inspection_notes'   => $data['inspection_notes'] ?? null,
                'notes'              => $data['notes'] ?? null,
            ], $photos));

            $order->vehicle->update([
                'plate'        => $data['plate'],
                'vin'          => $data['vin'] ?? $order->vehicle->vin,
                'make'         => $data['make'],
                'model'        => $data['model'],
                'year'         => $data['year'] ?? $order->vehicle->year,
                'color'        => $data['color'] ?? $order->vehicle->color,
                'engine'       => $data['engine'] ?? $order->vehicle->engine,
                'transmission' => $data['transmission'] ?? $order->vehicle->transmission,
                'last_odometer' => $data['odometer_in'],
                'customer_id'  => $data['customer_id'],
            ]);
        });

        return redirect()->route('carservice.orders.show', $order)
            ->with('success', "Orden {$order->reference} actualizada.");
    }

    // -------------------------------------------------------------------------
    // Order Recipe / Lines Management
    // -------------------------------------------------------------------------

    public function recipe(Request $request, ServiceOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isEditable(), 403, 'Solo se puede gestionar la receta de órdenes activas.');

        $order->load(['vehicle', 'lines.product.uom']);

        return Inertia::render('CarService::ServiceOrders/RecipeForm', [
            'order'           => $order,
             'servicePackages' => ServicePackage::where('active', true)
                 ->with(['items.product:id,sku,name,price,uom_id'])
                 ->orderBy('name')
                 ->get(),
             'warehouses'      => Warehouse::orderBy('name')->get(['id', 'name']),
         ]);
     }

    public function updateRecipe(Request $request, ServiceOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isEditable(), 403, 'Solo se puede gestionar la receta de órdenes activas.');

        $data = $request->validate([
            'service_package_id' => ['nullable', 'exists:service_packages,id'],
            'oil_type'           => ['nullable', 'in:mineral,semi_synthetic,synthetic'],
            'oil_viscosity'      => ['nullable', 'string', 'max:20'],
            'lines'              => ['required', 'array', 'min:1'],
            'lines.*.product_id' => ['nullable', 'exists:products,id'],
            'lines.*.warehouse_id' => ['nullable', 'exists:warehouses,id'],
            'lines.*.description' => ['nullable', 'string', 'max:500'],
            'lines.*.qty'        => ['required', 'numeric', 'min:0.01'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'lines.*.tax_rate'   => ['required', 'numeric', 'min:0', 'max:100'],
            'lines.*.is_upsell'  => ['nullable', 'boolean'],
            'lines.*.upsell_type' => ['nullable', 'in:brake_fluid,air_filter,cabin_filter,battery,other'],
        ]);

        DB::transaction(function () use ($order, $data) {
            $order->update([
                'service_package_id' => $data['service_package_id'] ?? null,
                'oil_type'           => $data['oil_type'] ?? null,
                'oil_viscosity'      => $data['oil_viscosity'] ?? null,
            ]);

            $order->lines()->delete();

            foreach ($data['lines'] as $l) {
                $line = new ServiceOrderLine([
                    'service_order_id' => $order->id,
                    'product_id'       => $l['product_id'] ?? null,
                    'warehouse_id'     => $l['warehouse_id'] ?? null,
                    'description'      => $l['description'] ?? null,
                    'qty'              => $l['qty'],
                    'unit_price'       => $l['unit_price'],
                    'tax_rate'         => $l['tax_rate'],
                    'is_upsell'        => $l['is_upsell'] ?? false,
                    'upsell_type'      => $l['upsell_type'] ?? null,
                ]);
                $line->recalculateTotals();
                $line->save();
            }

            $lines             = $order->lines()->get();
            $order->subtotal   = $lines->sum('subtotal');
            $order->tax_amount = $lines->sum('tax_amount');
            $order->total      = $lines->sum('total');
            $order->save();
        });

        return redirect()->route('carservice.orders.show', $order)
            ->with('success', "Receta de servicio actualizada para la orden {$order->reference}.");
    }

    // -------------------------------------------------------------------------
    // Complete (exit trigger)
    // -------------------------------------------------------------------------

    public function complete(Request $request, ServiceOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isInProgress(), 403, 'La orden debe estar en proceso para completarla.');

        $order->load(['vehicle', 'customer', 'lines.product', 'servicePackage']);

        $history = ServiceOrder::where('vehicle_id', $order->vehicle_id)
            ->where('id', '!=', $order->id)
            ->where('status', 'completed')
            ->orderByDesc('completed_at')
            ->limit(5)
            ->get(['id', 'reference', 'oil_type', 'oil_viscosity', 'odometer_out', 'completed_at', 'next_service_km', 'total']);

        return Inertia::render('CarService::ServiceOrders/Complete', [
            'order'      => $order,
            'history'    => $history,
            'warehouses' => Warehouse::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function storeComplete(Request $request, ServiceOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isInProgress(), 403, 'La orden debe estar en proceso para completarla.');

        $data = $request->validate([
            'odometer_out'        => ['required', 'integer', 'min:0'],
            'brake_fluid_pct'     => ['nullable', 'numeric', 'min:0', 'max:100'],
            'air_filter_status'   => ['nullable', 'in:good,dirty,replace'],
            'cabin_filter_status' => ['nullable', 'in:good,dirty,replace'],
            'battery_voltage'     => ['nullable', 'numeric', 'min:0', 'max:20'],
            'checks_notes'        => ['nullable', 'string', 'max:2000'],
            'notes'               => ['nullable', 'string', 'max:2000'],
            'extra_lines'                  => ['nullable', 'array'],
            'extra_lines.*.product_id'     => ['nullable', 'exists:products,id'],
            'extra_lines.*.warehouse_id'   => ['nullable', 'exists:warehouses,id'],
            'extra_lines.*.description'    => ['nullable', 'string', 'max:500'],
            'extra_lines.*.qty'            => ['required_with:extra_lines', 'numeric', 'min:0.01'],
            'extra_lines.*.unit_price'     => ['required_with:extra_lines', 'numeric', 'min:0'],
            'extra_lines.*.tax_rate'       => ['required_with:extra_lines', 'numeric', 'min:0', 'max:100'],
            'extra_lines.*.upsell_type'    => ['nullable', 'in:brake_fluid,air_filter,cabin_filter,battery,other'],
        ]);

        if ((int) $data['odometer_out'] < $order->odometer_in) {
            return back()->withErrors([
                'odometer_out' => "El odómetro de salida ({$data['odometer_out']} km) debe ser mayor o igual al de entrada ({$order->odometer_in} km).",
            ])->withInput();
        }

        DB::transaction(function () use ($order, $data) {
            $oilType  = $order->oil_type ?? 'mineral';
            $interval = ServiceOrder::nextServiceInterval($oilType);
            $nextKm   = (int) $data['odometer_out'] + $interval;
            $nextDate = now()->addMonths((int) round($interval / 500))->toDateString();
            $qrToken  = ServiceOrder::generateQrToken();

            if (! empty($data['extra_lines'])) {
                foreach ($data['extra_lines'] as $l) {
                    $line = new ServiceOrderLine([
                        'service_order_id' => $order->id,
                        'product_id'       => $l['product_id'] ?? null,
                        'warehouse_id'     => $l['warehouse_id'] ?? null,
                        'description'      => $l['description'] ?? null,
                        'qty'              => $l['qty'],
                        'unit_price'       => $l['unit_price'],
                        'tax_rate'         => $l['tax_rate'],
                        'is_upsell'        => true,
                        'upsell_type'      => $l['upsell_type'] ?? 'other',
                    ]);
                    $line->recalculateTotals();
                    $line->save();
                }
            }

            $order->update([
                'status'              => 'completed',
                'odometer_out'        => $data['odometer_out'],
                'brake_fluid_pct'     => $data['brake_fluid_pct'] ?? null,
                'air_filter_status'   => $data['air_filter_status'] ?? null,
                'cabin_filter_status' => $data['cabin_filter_status'] ?? null,
                'battery_voltage'     => $data['battery_voltage'] ?? null,
                'checks_notes'        => $data['checks_notes'] ?? null,
                'notes'               => $data['notes'] ?? $order->notes,
                'next_service_km'     => $nextKm,
                'next_service_date'   => $nextDate,
                'qr_token'            => $qrToken,
                'completed_at'        => now(),
            ]);

            $lines             = $order->lines()->get();
            $order->subtotal   = $lines->sum('subtotal');
            $order->tax_amount = $lines->sum('tax_amount');
            $order->total      = $lines->sum('total');
            $order->save();

            $order->vehicle()->update(['last_odometer' => $data['odometer_out']]);
        });

        $fresh = $order->fresh();

        return redirect()->route('carservice.orders.show', $order)
            ->with('success', "Servicio completado. Próximo cambio: {$fresh->next_service_km} km. QR generado.");
    }

    // -------------------------------------------------------------------------
    // Cancel
    // -------------------------------------------------------------------------

    public function cancel(Request $request, ServiceOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if($order->isCompleted(), 403, 'No se puede cancelar una orden ya completada.');

        $order->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        return redirect()->route('carservice.orders.show', $order)
            ->with('success', "Orden {$order->reference} cancelada.");
    }

    // -------------------------------------------------------------------------
    // Public QR history page
    // -------------------------------------------------------------------------

    public function publicHistory(string $token): Response
    {
        $order = ServiceOrder::where('qr_token', $token)
            ->where('status', 'completed')
            ->with(['vehicle', 'lines.product'])
            ->firstOrFail();

        $history = ServiceOrder::where('vehicle_id', $order->vehicle_id)
            ->where('status', 'completed')
            ->orderByDesc('completed_at')
            ->limit(10)
            ->get(['id', 'reference', 'oil_type', 'oil_viscosity', 'odometer_out', 'completed_at', 'next_service_km', 'total']);

        return Inertia::render('CarService::ServiceOrders/PublicHistory', [
            'order'   => $order,
            'history' => $history,
        ]);
    }
    // -------------------------------------------------------------------------
    // AJAX: Customer lookup (for check-in form)
    // -------------------------------------------------------------------------

    public function lookupCustomers(Request $request): JsonResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = strtoupper(trim($request->input('query', '')));

        if (! $query || strlen($query) < 2) {
            return response()->json(['customers' => []]);
        }

        $customers = Contact::where('is_client', true)
            ->where('active', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'ilike', "%{$query}%")
                  ->orWhere('rtn', 'ilike', "%{$query}%");
            })
            ->limit(10)
            ->get(['id', 'name', 'rtn']);

        return response()->json(['customers' => $customers]);
    }
    public function convertToOrder(Request $request, ServiceOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isDraft(), 403, 'Solo se pueden convertir a orden las revisiones en estado borrador.');

        $order->update([
            'status' => 'in_progress',
            'checked_in_at' => now(), // El inicio real de la orden técnica
        ]);

        return redirect()->route('carservice.orders.recipe', $order)
            ->with('success', "Check-in convertido a Orden de Servicio. Ahora puedes agregar productos y servicios.");
    }

    public function lookupProducts(Request $request): JsonResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = strtoupper(trim($request->input('query', '')));

        if (! $query || strlen($query) < 2) {
            return response()->json(['products' => []]);
        }

        $products = Product::where('active', true)
            ->whereIn('type', ['storable', 'service', 'consumable'])
            ->where(function ($q) use ($query) {
                $q->where('name', 'ilike', "%{$query}%")
                  ->orWhere('sku', 'ilike', "%{$query}%");
            })
            ->limit(15)
            ->get(['id', 'sku', 'name', 'price', 'uom_id']);

        return response()->json(['products' => $products]);
    }
}
