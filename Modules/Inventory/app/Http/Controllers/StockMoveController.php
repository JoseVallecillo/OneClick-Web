<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Models\Product;
use Modules\Inventory\Models\StockLot;
use Modules\Inventory\Models\StockMove;
use Modules\Inventory\Models\StockMoveLine;
use Modules\Inventory\Models\Warehouse;

class StockMoveController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = StockMove::with([
            'warehouse',
            'destWarehouse',
            'creator',
        ])->withCount('lines');

        if ($type = $request->input('type')) {
            if ($type !== '__all__') {
                $query->where('type', $type);
            }
        }

        if ($status = $request->input('status', 'confirmed')) {
            if ($status !== '__all__') {
                $query->where('status', $status);
            }
        }

        if ($warehouseId = $request->input('warehouse_id')) {
            $query->where('warehouse_id', $warehouseId);
        }

        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('moved_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('moved_at', '<=', $dateTo);
        }

        $moves = $query->orderByDesc('moved_at')->orderByDesc('id')->paginate(50)->withQueryString();

        return Inertia::render('Inventory::Movements/Index', [
            'moves'      => $moves,
            'warehouses' => Warehouse::where('active', true)->orderBy('name')->get(),
            'filters'    => $request->only(['type', 'status', 'warehouse_id', 'date_from', 'date_to']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $type      = $request->get('type', 'in');
        $isInbound = in_array($type, ['in', 'initial', 'transfer_in']);

        return Inertia::render('Inventory::Movements/Form', [
            'warehouses' => Warehouse::where('active', true)->orderBy('name')->get(),
            'products'   => Product::where('type', 'storable')
                ->where('active', true)
                ->with(['category', 'uom'])
                ->orderBy('name')
                ->get(),
            'type' => $type,
            'lots' => $isInbound
                ? collect()
                : StockLot::where('qty_available', '>', 0)
                    ->orderBy('product_id')
                    ->orderBy('lot_number')
                    ->get(['id', 'product_id', 'warehouse_id', 'lot_number', 'qty_available', 'unit_cost']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $request->validate([
            'type'              => ['required', 'in:initial,in,out,adjust,transfer_in,transfer_out'],
            'status'            => ['required', 'in:draft,confirmed'],
            'warehouse_id'      => ['required', 'exists:warehouses,id'],
            'dest_warehouse_id' => ['required_if:type,transfer_in,transfer_out', 'nullable', 'exists:warehouses,id'],
            'reference'         => ['nullable', 'string', 'max:100'],
            'notes'             => ['nullable', 'string', 'max:2000'],
            'moved_at'          => ['required', 'date'],
            'lines'              => ['required', 'array', 'min:1'],
            'lines.*.product_id' => ['required', 'exists:products,id'],
            'lines.*.lot_number' => ['nullable', 'string', 'max:100'],
            'lines.*.lot_id'     => ['nullable'],
            'lines.*.qty'        => ['required', 'numeric'],
            'lines.*.unit_cost'  => ['required', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($request) {
            /** @var StockMove $move */
            $move = StockMove::create([
                'type'              => $request->input('type'),
                'status'            => $request->input('status', 'draft'),
                'warehouse_id'      => $request->input('warehouse_id'),
                'dest_warehouse_id' => $request->input('dest_warehouse_id'),
                'reference'         => $request->input('reference'),
                'notes'             => $request->input('notes'),
                'moved_at'          => $request->input('moved_at'),
                'created_by'        => Auth::id(),
                'accounting_pending' => true,
            ]);

            foreach ($request->input('lines') as $line) {
                $product = Product::find($line['product_id']);
                $lotId   = null;

                if ($product && $product->tracking !== 'none') {
                    if (in_array($move->type, ['in', 'initial', 'transfer_in'])) {
                        $lotNumber = trim($line['lot_number'] ?? '');
                        if ($lotNumber !== '') {
                            $lot = StockLot::firstOrCreate(
                                [
                                    'product_id'   => $product->id,
                                    'warehouse_id' => $move->warehouse_id,
                                    'lot_number'   => $lotNumber,
                                ],
                                [
                                    'qty_available' => 0,
                                    'unit_cost'     => $line['unit_cost'],
                                    'received_at'   => $move->moved_at,
                                ]
                            );
                            $lotId = $lot->id;
                        }
                    } else {
                        $lotId = !empty($line['lot_id']) ? (int) $line['lot_id'] : null;
                    }
                }

                StockMoveLine::create([
                    'stock_move_id' => $move->id,
                    'product_id'    => $line['product_id'],
                    'lot_id'        => $lotId,
                    'qty'           => $line['qty'],
                    'unit_cost'     => $line['unit_cost'],
                ]);
            }

            if ($move->status === 'confirmed') {
                $move->process();
            }
        });

        return redirect()->route('inventory.movements.index')
            ->with('success', 'Stock movement recorded successfully.');
    }

    public function show(Request $request, StockMove $move): Response
    {
        $this->requireAdmin($request);

        $move->load([
            'lines.product',
            'lines.lot',
            'warehouse',
            'destWarehouse',
            'creator',
        ]);

        return Inertia::render('Inventory::Movements/Show', [
            'move' => $move,
        ]);
    }
    public function confirm(Request $request, StockMove $move): RedirectResponse
    {
        $this->requireAdmin($request);

        if ($move->status === 'confirmed') {
            return back()->with('error', 'El movimiento ya ha sido confirmado.');
        }

        $move->process();

        return back()->with('success', 'El movimiento ha sido confirmado y procesado correctamente.');
    }
}
