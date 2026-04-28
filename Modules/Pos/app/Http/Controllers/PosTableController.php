<?php

namespace Modules\Pos\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Pos\Models\PosOrder;
use Modules\Pos\Models\PosSession;
use Modules\Pos\Models\PosTable;
use Modules\Pos\Models\PosWaiter;

class PosTableController extends Controller
{
    // -------------------------------------------------------------------------
    // Index — table board
    // -------------------------------------------------------------------------

    public function index(Request $request): Response
    {
        $section = $request->input('section', 'all');

        $tables = PosTable::query()
            ->when($section !== 'all', fn ($q) => $q->where('section', $section))
            ->with(['waiter'])
            ->orderBy('section')
            ->orderBy('number')
            ->get()
            ->map(fn (PosTable $t) => [
                'id'               => $t->id,
                'number'           => $t->number,
                'section'          => $t->section,
                'shape'            => $t->shape,
                'capacity'         => $t->capacity,
                'status'           => $t->status,
                'server_name'      => $t->server_name,
                'waiter_name'      => $t->waiter?->name,
                'time_open'        => $t->timeOpen(),
                'total'            => (float) ($t->total ?? 0),
                'current_sale_id'  => $t->current_sale_id,
                'current_order_id' => $t->current_order_id,
            ]);

        $sections = PosTable::distinct()->orderBy('section')->pluck('section');

        $activeSession = PosSession::where('status', 'open')
            ->orderByDesc('id')
            ->first();

        $waiters = PosWaiter::where('active', true)->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Pos::Tables/Index', [
            'tables'        => $tables,
            'sections'      => $sections,
            'activeSection' => $section,
            'activeView'    => $request->input('view', 'all'),
            'activeSession' => $activeSession ? [
                'id'        => $activeSession->id,
                'reference' => $activeSession->reference,
            ] : null,
            'waiters' => $waiters,
        ]);
    }

    // -------------------------------------------------------------------------
    // CRUD — create / store / edit / update / destroy
    // -------------------------------------------------------------------------

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $sections = PosTable::distinct()->orderBy('section')->pluck('section');

        return Inertia::render('Pos::Tables/Create', [
            'sections' => $sections,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'number'   => ['required', 'integer', 'min:1'],
            'section'  => ['required', 'string', 'max:60'],
            'shape'    => ['required', 'in:square,circle'],
            'capacity' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        PosTable::create($data);

        return redirect()->route('pos.tables.index')
            ->with('success', "Mesa {$data['number']} creada correctamente.");
    }

    public function edit(Request $request, PosTable $table): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $sections = PosTable::distinct()->orderBy('section')->pluck('section');

        return Inertia::render('Pos::Tables/Edit', [
            'table'    => $table,
            'sections' => $sections,
        ]);
    }

    public function update(Request $request, PosTable $table): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'number'   => ['required', 'integer', 'min:1'],
            'section'  => ['required', 'string', 'max:60'],
            'shape'    => ['required', 'in:square,circle'],
            'capacity' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        $table->update($data);

        return redirect()->route('pos.tables.index')
            ->with('success', "Mesa {$table->number} actualizada.");
    }

    public function destroy(Request $request, PosTable $table): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        if ($table->current_order_id) {
            return back()->with('error', 'No se puede eliminar una mesa con una orden activa.');
        }

        $table->delete();

        return redirect()->route('pos.tables.index')
            ->with('success', 'Mesa eliminada.');
    }

    // -------------------------------------------------------------------------
    // Open table — create order and redirect to order terminal
    // -------------------------------------------------------------------------

    public function openTable(Request $request, PosTable $table): RedirectResponse
    {
        $session = PosSession::where('status', 'open')
            ->when($table->pos_session_id, fn ($q) => $q->where('id', $table->pos_session_id))
            ->orderByDesc('id')
            ->first();

        if (!$session) {
            return redirect()->route('pos.sessions.open')
                ->with('warning', 'Debes abrir una caja antes de atender mesas.');
        }

        // Reuse existing open order or create a new one inside a transaction to prevent race conditions
        $order = \Illuminate\Support\Facades\DB::transaction(function () use ($table, $session, $request) {
            $existingOrder = PosOrder::where('pos_table_id', $table->id)
                ->where('status', 'open')
                ->first();

            if ($existingOrder) {
                return $existingOrder;
            }

            return PosOrder::create([
                'reference'      => PosOrder::generateReference(),
                'pos_session_id' => $session->id,
                'pos_table_id'   => $table->id,
                'pos_waiter_id'  => $request->input('waiter_id') ?: null,
                'status'         => 'open',
                'opened_at'      => now(),
                'created_by'     => \Illuminate\Support\Facades\Auth::id(),
            ]);
        });

        $waiterName = null;
        if ($order->pos_waiter_id) {
            $waiterName = PosWaiter::find($order->pos_waiter_id)?->name;
        }

        $table->update([
            'status'           => 'occupied',
            'server_name'      => $waiterName ?? $request->input('server_name', auth()->user()->name),
            'opened_at'        => $table->opened_at ?? now(),
            'pos_session_id'   => $session->id,
            'current_order_id' => $order->id,
            'pos_waiter_id'    => $order->pos_waiter_id,
        ]);

        return redirect()->route('pos.orders.show', $order);
    }

    // -------------------------------------------------------------------------
    // Update status
    // -------------------------------------------------------------------------

    public function updateStatus(Request $request, PosTable $table): RedirectResponse
    {
        $validated = $request->validate([
            'status'      => ['required', 'in:available,occupied,pending_food'],
            'server_name' => ['nullable', 'string', 'max:100'],
        ]);

        $table->update($validated);

        return back();
    }

    // -------------------------------------------------------------------------
    // Close table — only when no active order
    // -------------------------------------------------------------------------

    public function closeTable(PosTable $table): RedirectResponse
    {
        if ($table->current_order_id) {
            $order = \Modules\Pos\Models\PosOrder::find($table->current_order_id);
            if ($order && $order->isOpen()) {
                $order->update(['status' => 'cancelled']);
            }
        }

        $table->update([
            'status'           => 'available',
            'server_name'      => null,
            'opened_at'        => null,
            'total'            => 0,
            'pos_session_id'   => null,
            'current_sale_id'  => null,
            'current_order_id' => null,
            'pos_waiter_id'    => null,
        ]);

        return redirect()->route('pos.tables.index');
    }
}
