<?php

namespace Modules\Rentals\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Contacts\Models\Contact;
use Modules\Inventory\Models\Product;
use Modules\Inventory\Models\StockLot;
use Modules\Rentals\Models\RentalChecklist;
use Modules\Rentals\Models\RentalChecklistItem;
use Modules\Rentals\Models\RentalMaintenance;
use Modules\Rentals\Models\RentalOrder;
use Modules\Rentals\Models\RentalOrderLine;
use Modules\Rentals\Models\RentalRate;

class RentalOrderController extends Controller
{
    // -------------------------------------------------------------------------
    // Index
    // -------------------------------------------------------------------------

    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = RentalOrder::with(['customer', 'creator'])->withCount('lines');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'ilike', "%{$search}%")
                  ->orWhereHas('customer', fn($sq) => $sq->where('name', 'ilike', "%{$search}%"));
            });
        }

        if ($customerId = $request->input('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('start_date', '>=', $dateFrom);
        }

        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('start_date', '<=', $dateTo);
        }

        $orders    = $query->orderByDesc('id')->paginate(50)->withQueryString();
        $customers = Contact::where('is_client', true)->where('active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Rentals::Orders/Index', [
            'orders'    => $orders,
            'customers' => $customers,
            'filters'   => $request->only(['search', 'status', 'customer_id', 'date_from', 'date_to']),
        ]);
    }

    // -------------------------------------------------------------------------
    // Calendar
    // -------------------------------------------------------------------------

    public function calendar(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $from = $request->input('from', now()->startOfMonth()->toDateString());
        $to   = $request->input('to',   now()->endOfMonth()->toDateString());

        $orders = RentalOrder::with(['customer', 'lines.product'])
            ->whereIn('status', ['confirmed', 'active'])
            ->where('start_date', '<=', $to)
            ->where('end_date',   '>=', $from)
            ->orderBy('start_date')
            ->get();

        return Inertia::render('Rentals::Orders/Calendar', [
            'orders' => $orders,
            'from'   => $from,
            'to'     => $to,
        ]);
    }

    // -------------------------------------------------------------------------
    // Create / Store
    // -------------------------------------------------------------------------

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Rentals::Orders/Form', [
            'customers' => Contact::where('is_client', true)->where('active', true)->orderBy('name')->get(['id', 'name']),
            'products'  => Product::where('active', true)
                ->with(['rentalRate', 'stockLots' => fn($q) => $q->where('qty_available', '>', 0)])
                ->orderBy('name')
                ->get(['id', 'sku', 'name', 'tracking']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'customer_id'      => ['required', 'exists:contacts,id'],
            'start_date'       => ['required', 'date'],
            'end_date'         => ['required', 'date', 'after_or_equal:start_date'],
            'pickup_type'      => ['required', 'in:local,delivery'],
            'delivery_address' => ['nullable', 'string', 'max:500'],
            'notes'            => ['nullable', 'string', 'max:2000'],
            'internal_notes'   => ['nullable', 'string', 'max:2000'],
            'lines'            => ['required', 'array', 'min:1'],
            'lines.*.product_id'   => ['required', 'exists:products,id'],
            'lines.*.lot_id'       => ['nullable', 'exists:stock_lots,id'],
            'lines.*.description'  => ['nullable', 'string', 'max:500'],
            'lines.*.qty'          => ['required', 'numeric', 'min:0.01'],
            'lines.*.rate_type'    => ['required', 'in:hourly,daily,weekly,monthly'],
            'lines.*.unit_price'   => ['required', 'numeric', 'min:0'],
            'lines.*.duration'     => ['required', 'numeric', 'min:0.01'],
            'lines.*.discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.tax_rate'     => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $order = DB::transaction(function () use ($data) {
            $totalDeposit = 0;

            $order = RentalOrder::create([
                'reference'        => RentalOrder::generateReference(),
                'customer_id'      => $data['customer_id'],
                'status'           => 'draft',
                'start_date'       => $data['start_date'],
                'end_date'         => $data['end_date'],
                'pickup_type'      => $data['pickup_type'],
                'delivery_address' => $data['delivery_address'] ?? null,
                'notes'            => $data['notes'] ?? null,
                'internal_notes'   => $data['internal_notes'] ?? null,
                'deposit_status'   => 'none',
                'created_by'       => Auth::id(),
            ]);

            foreach ($data['lines'] as $l) {
                $line = new RentalOrderLine([
                    'rental_order_id' => $order->id,
                    'product_id'      => $l['product_id'],
                    'lot_id'          => $l['lot_id'] ?? null,
                    'description'     => $l['description'] ?? null,
                    'qty'             => $l['qty'],
                    'rate_type'       => $l['rate_type'],
                    'unit_price'      => $l['unit_price'],
                    'duration'        => $l['duration'],
                    'discount_pct'    => $l['discount_pct'] ?? 0,
                    'tax_rate'        => $l['tax_rate'],
                ]);
                $line->recalculateTotals();
                $line->save();

                $rate = RentalRate::where('product_id', $l['product_id'])->first();
                if ($rate) {
                    $totalDeposit += (float) $rate->deposit_amount * (float) $l['qty'];
                }
            }

            $lines            = $order->lines()->get();
            $order->subtotal  = $lines->sum('subtotal');
            $order->tax_amount = $lines->sum('tax_amount');
            $order->total     = $lines->sum('total');
            $order->deposit_amount = $totalDeposit;
            $order->save();

            return $order;
        });

        return redirect()->route('rentals.show', $order)
            ->with('success', "Reserva {$order->reference} creada correctamente.");
    }

    // -------------------------------------------------------------------------
    // Show
    // -------------------------------------------------------------------------

    public function show(Request $request, RentalOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $order->load([
            'customer',
            'creator',
            'lines.product',
            'lines.lot',
            'deliveryChecklist.items.orderLine.product',
            'deliveryChecklist.technician',
            'returnChecklist.items.orderLine.product',
            'returnChecklist.technician',
        ]);

        return Inertia::render('Rentals::Orders/Show', [
            'order' => $order,
        ]);
    }

    // -------------------------------------------------------------------------
    // Edit / Update
    // -------------------------------------------------------------------------

    public function edit(Request $request, RentalOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isEditable(), 403, 'Solo se pueden editar reservas en borrador o confirmadas.');

        $order->load('lines.product');

        return Inertia::render('Rentals::Orders/Form', [
            'order'     => $order,
            'customers' => Contact::where('is_client', true)->where('active', true)->orderBy('name')->get(['id', 'name']),
            'products'  => Product::where('active', true)
                ->with(['rentalRate', 'stockLots' => fn($q) => $q->where('qty_available', '>', 0)])
                ->orderBy('name')
                ->get(['id', 'sku', 'name', 'tracking']),
        ]);
    }

    public function update(Request $request, RentalOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isEditable(), 403, 'Solo se pueden editar reservas en borrador o confirmadas.');

        $data = $request->validate([
            'customer_id'      => ['required', 'exists:contacts,id'],
            'start_date'       => ['required', 'date'],
            'end_date'         => ['required', 'date', 'after_or_equal:start_date'],
            'pickup_type'      => ['required', 'in:local,delivery'],
            'delivery_address' => ['nullable', 'string', 'max:500'],
            'notes'            => ['nullable', 'string', 'max:2000'],
            'internal_notes'   => ['nullable', 'string', 'max:2000'],
            'lines'            => ['required', 'array', 'min:1'],
            'lines.*.product_id'   => ['required', 'exists:products,id'],
            'lines.*.lot_id'       => ['nullable', 'exists:stock_lots,id'],
            'lines.*.description'  => ['nullable', 'string', 'max:500'],
            'lines.*.qty'          => ['required', 'numeric', 'min:0.01'],
            'lines.*.rate_type'    => ['required', 'in:hourly,daily,weekly,monthly'],
            'lines.*.unit_price'   => ['required', 'numeric', 'min:0'],
            'lines.*.duration'     => ['required', 'numeric', 'min:0.01'],
            'lines.*.discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.tax_rate'     => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        DB::transaction(function () use ($order, $data) {
            $order->lines()->delete();

            $totalDeposit = 0;

            foreach ($data['lines'] as $l) {
                $line = new RentalOrderLine([
                    'rental_order_id' => $order->id,
                    'product_id'      => $l['product_id'],
                    'lot_id'          => $l['lot_id'] ?? null,
                    'description'     => $l['description'] ?? null,
                    'qty'             => $l['qty'],
                    'rate_type'       => $l['rate_type'],
                    'unit_price'      => $l['unit_price'],
                    'duration'        => $l['duration'],
                    'discount_pct'    => $l['discount_pct'] ?? 0,
                    'tax_rate'        => $l['tax_rate'],
                ]);
                $line->recalculateTotals();
                $line->save();

                $rate = RentalRate::where('product_id', $l['product_id'])->first();
                if ($rate) {
                    $totalDeposit += (float) $rate->deposit_amount * (float) $l['qty'];
                }
            }

            $lines = $order->lines()->get();

            $order->update([
                'customer_id'      => $data['customer_id'],
                'start_date'       => $data['start_date'],
                'end_date'         => $data['end_date'],
                'pickup_type'      => $data['pickup_type'],
                'delivery_address' => $data['delivery_address'] ?? null,
                'notes'            => $data['notes'] ?? null,
                'internal_notes'   => $data['internal_notes'] ?? null,
                'subtotal'         => $lines->sum('subtotal'),
                'tax_amount'       => $lines->sum('tax_amount'),
                'total'            => $lines->sum('total'),
                'deposit_amount'   => $totalDeposit,
            ]);
        });

        return redirect()->route('rentals.show', $order)
            ->with('success', "Reserva {$order->reference} actualizada.");
    }

    // -------------------------------------------------------------------------
    // Destroy (draft only)
    // -------------------------------------------------------------------------

    public function destroy(Request $request, RentalOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isDraft(), 403, 'Solo se pueden eliminar reservas en borrador.');

        $ref = $order->reference;
        DB::transaction(function () use ($order) {
            $order->lines()->delete();
            $order->delete();
        });

        return redirect()->route('rentals.index')
            ->with('success', "Reserva {$ref} eliminada.");
    }

    // -------------------------------------------------------------------------
    // Workflow: Draft → Confirmed
    // -------------------------------------------------------------------------

    public function confirm(Request $request, RentalOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isDraft(), 403, 'La reserva debe estar en borrador para confirmarse.');

        $order->update([
            'status'       => 'confirmed',
            'confirmed_at' => now(),
            'deposit_status' => $order->deposit_amount > 0 ? 'pending' : 'none',
        ]);

        return redirect()->route('rentals.show', $order)
            ->with('success', "Reserva {$order->reference} confirmada.");
    }

    // -------------------------------------------------------------------------
    // Workflow: Confirmed → Active (Delivery + Checklist)
    // -------------------------------------------------------------------------

    public function deliver(Request $request, RentalOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isConfirmed(), 403, 'La reserva debe estar confirmada para registrar la entrega.');

        $order->load('lines.product');

        return Inertia::render('Rentals::Orders/Deliver', [
            'order' => $order,
        ]);
    }

    public function storeDeliver(Request $request, RentalOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isConfirmed(), 403, 'La reserva debe estar confirmada para registrar la entrega.');

        $data = $request->validate([
            'delivered_at'      => ['required', 'date'],
            'contract_signed'   => ['required', 'boolean'],
            'deposit_status'    => ['required', 'in:none,pending,held'],
            'overall_condition' => ['required', 'in:excellent,good,fair,poor'],
            'notes'             => ['nullable', 'string', 'max:2000'],
            'items'             => ['required', 'array', 'min:1'],
            'items.*.rental_order_line_id' => ['required', 'exists:rental_order_lines,id'],
            'items.*.label'     => ['required', 'string', 'max:255'],
            'items.*.condition' => ['required', 'in:ok,damaged,missing'],
            'items.*.notes'     => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($order, $data) {
            $checklist = RentalChecklist::create([
                'rental_order_id'   => $order->id,
                'type'              => 'delivery',
                'technician_id'     => Auth::id(),
                'overall_condition' => $data['overall_condition'],
                'notes'             => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $checklistItem = RentalChecklistItem::create([
                    'rental_checklist_id'  => $checklist->id,
                    'rental_order_line_id' => $item['rental_order_line_id'],
                    'label'                => $item['label'],
                    'condition'            => $item['condition'],
                    'notes'                => $item['notes'] ?? null,
                ]);

                if ($request->hasFile("photos.{$item['rental_order_line_id']}")) {
                    $path = $request->file("photos.{$item['rental_order_line_id']}")->store('rentals/checklists', 'public');
                    $checklistItem->update(['photo_path' => $path]);
                }
            }

            $order->update([
                'status'          => 'active',
                'delivered_at'    => $data['delivered_at'],
                'contract_signed' => $data['contract_signed'],
                'signed_at'       => $data['contract_signed'] ? now() : null,
                'deposit_status'  => $data['deposit_status'],
            ]);
        });

        return redirect()->route('rentals.show', $order)
            ->with('success', "Entrega registrada. Reserva {$order->reference} activa.");
    }

    // -------------------------------------------------------------------------
    // Workflow: Extend (active → active, new end_date)
    // -------------------------------------------------------------------------

    public function extend(Request $request, RentalOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isActive(), 403, 'Solo se pueden extender alquileres activos.');

        $data = $request->validate([
            'new_end_date' => ['required', 'date', 'after:' . $order->end_date->toDateString()],
            'notes'        => ['nullable', 'string', 'max:500'],
        ]);

        // Check no conflict with other confirmed/active rentals for same serial lots
        $conflictingLots = RentalOrderLine::whereIn(
            'rental_order_id',
            RentalOrder::whereIn('status', ['confirmed', 'active'])
                ->where('id', '!=', $order->id)
                ->where('start_date', '<=', $data['new_end_date'])
                ->where('end_date',   '>=', $order->end_date->toDateString())
                ->pluck('id')
        )->whereIn('lot_id', $order->lines()->whereNotNull('lot_id')->pluck('lot_id'))
         ->exists();

        abort_if($conflictingLots, 422, 'Uno o más equipos ya están reservados en ese período extendido.');

        $order->update([
            'end_date' => $data['new_end_date'],
            'internal_notes' => trim(($order->internal_notes ?? '') . "\n[Extensión hasta {$data['new_end_date']}]: " . ($data['notes'] ?? '')),
        ]);

        return redirect()->route('rentals.show', $order)
            ->with('success', "Reserva extendida hasta {$data['new_end_date']}.");
    }

    // -------------------------------------------------------------------------
    // Workflow: Active → Returned (Return + Checklist + Damage charges)
    // -------------------------------------------------------------------------

    public function return(Request $request, RentalOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isActive(), 403, 'La reserva debe estar activa para registrar la devolución.');

        $order->load([
            'lines.product',
            'deliveryChecklist.items',
        ]);

        return Inertia::render('Rentals::Orders/Return', [
            'order' => $order,
        ]);
    }

    public function storeReturn(Request $request, RentalOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isActive(), 403, 'La reserva debe estar activa para registrar la devolución.');

        $data = $request->validate([
            'returned_at'       => ['required', 'date'],
            'overall_condition' => ['required', 'in:excellent,good,fair,poor'],
            'deposit_status'    => ['required', 'in:released,applied'],
            'damage_charges'    => ['nullable', 'numeric', 'min:0'],
            'notes'             => ['nullable', 'string', 'max:2000'],
            'items'             => ['required', 'array', 'min:1'],
            'items.*.rental_order_line_id' => ['required', 'exists:rental_order_lines,id'],
            'items.*.label'     => ['required', 'string', 'max:255'],
            'items.*.condition' => ['required', 'in:ok,damaged,missing'],
            'items.*.notes'     => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($order, $data) {
            $checklist = RentalChecklist::create([
                'rental_order_id'   => $order->id,
                'type'              => 'return',
                'technician_id'     => Auth::id(),
                'overall_condition' => $data['overall_condition'],
                'notes'             => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $checklistItem = RentalChecklistItem::create([
                    'rental_checklist_id'  => $checklist->id,
                    'rental_order_line_id' => $item['rental_order_line_id'],
                    'label'                => $item['label'],
                    'condition'            => $item['condition'],
                    'notes'                => $item['notes'] ?? null,
                ]);

                if (request()->hasFile("photos.{$item['rental_order_line_id']}")) {
                    $path = request()->file("photos.{$item['rental_order_line_id']}")->store('rentals/checklists', 'public');
                    $checklistItem->update(['photo_path' => $path]);
                }
            }

            // Accumulate usage days per product/lot for maintenance tracking
            $usageDays = $order->actualDays();
            foreach ($order->lines as $line) {
                $rate = RentalRate::where('product_id', $line->product_id)->first();
                if (! $rate || ! $rate->maintenance_limit_days) {
                    continue;
                }

                $totalUsed = RentalOrderLine::whereHas('rentalOrder', fn($q) =>
                    $q->where('status', 'returned')->orWhere('status', 'closed')
                      ->where('id', '!=', $order->id)
                )->where('product_id', $line->product_id)
                 ->when($line->lot_id, fn($q) => $q->where('lot_id', $line->lot_id))
                 ->count() + $usageDays;

                if ($totalUsed >= $rate->maintenance_limit_days) {
                    RentalMaintenance::firstOrCreate(
                        ['product_id' => $line->product_id, 'lot_id' => $line->lot_id, 'status' => 'scheduled'],
                        [
                            'maintenance_type'      => 'preventive',
                            'usage_days_at_trigger' => $totalUsed,
                            'description'           => "Mantenimiento preventivo automático tras {$totalUsed} días de uso.",
                            'created_by'            => Auth::id(),
                        ]
                    );
                }
            }

            $order->update([
                'status'         => 'returned',
                'returned_at'    => $data['returned_at'],
                'deposit_status' => $data['deposit_status'],
                'damage_charges' => $data['damage_charges'] ?? 0,
            ]);
        });

        return redirect()->route('rentals.show', $order)
            ->with('success', "Devolución registrada. Reserva {$order->reference} en revisión.");
    }

    // -------------------------------------------------------------------------
    // Workflow: Returned → Invoiced
    // -------------------------------------------------------------------------

    public function invoice(Request $request, RentalOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isReturned(), 403, 'La reserva debe estar devuelta para facturarse.');

        $data = $request->validate([
            'invoice_number' => ['required', 'string', 'max:100'],
        ]);

        $order->update([
            'status'         => 'invoiced',
            'invoiced_at'    => now(),
            'invoice_number' => $data['invoice_number'],
        ]);

        return redirect()->route('rentals.show', $order)
            ->with('success', "Factura {$data['invoice_number']} emitida.");
    }

    // -------------------------------------------------------------------------
    // Workflow: Invoiced → Closed
    // -------------------------------------------------------------------------

    public function close(Request $request, RentalOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isInvoiced(), 403, 'La reserva debe estar facturada para cerrarse.');

        $order->update([
            'status'    => 'closed',
            'closed_at' => now(),
        ]);

        return redirect()->route('rentals.show', $order)
            ->with('success', "Reserva {$order->reference} cerrada.");
    }

    // -------------------------------------------------------------------------
    // Lookups (AJAX)
    // -------------------------------------------------------------------------

    public function lookupProducts(Request $request)
    {
        $search = $request->input('q', '');

        return Product::where('active', true)
            ->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('sku', 'ilike', "%{$search}%");
            })
            ->with('rentalRate')
            ->limit(20)
            ->get(['id', 'sku', 'name', 'tracking']);
    }

    public function lookupCustomers(Request $request)
    {
        $search = $request->input('q', '');

        return Contact::where('is_client', true)
            ->where('active', true)
            ->where('name', 'ilike', "%{$search}%")
            ->limit(20)
            ->get(['id', 'name']);
    }

    public function checkAvailability(Request $request)
    {
        $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after_or_equal:start_date'],
            'exclude_id' => ['nullable', 'exists:rental_orders,id'],
        ]);

        $conflicts = RentalOrder::whereIn('status', ['confirmed', 'active'])
            ->when($request->exclude_id, fn($q) => $q->where('id', '!=', $request->exclude_id))
            ->where('start_date', '<=', $request->end_date)
            ->where('end_date',   '>=', $request->start_date)
            ->whereHas('lines', fn($q) => $q->where('product_id', $request->product_id))
            ->with('customer:id,name')
            ->get(['id', 'reference', 'start_date', 'end_date', 'customer_id']);

        return response()->json([
            'available' => $conflicts->isEmpty(),
            'conflicts' => $conflicts,
        ]);
    }
}
