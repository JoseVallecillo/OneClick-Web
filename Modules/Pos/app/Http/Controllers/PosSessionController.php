<?php

namespace Modules\Pos\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Models\Warehouse;
use Modules\Pos\Models\PosSession;
use Modules\Settings\Models\Currency;

class PosSessionController extends Controller
{
    // -------------------------------------------------------------------------
    // Index — list sessions
    // -------------------------------------------------------------------------

    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = PosSession::with(['warehouse', 'currency', 'creator'])
            ->withCount('sales');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $sessions = $query->orderByDesc('id')->paginate(30)->withQueryString();

        return Inertia::render('Pos::Sessions/Index', [
            'sessions' => $sessions,
            'filters'  => $request->only(['status', 'date_from', 'date_to']),
        ]);
    }

    // -------------------------------------------------------------------------
    // Open — form to start a session
    // -------------------------------------------------------------------------

    public function open(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Pos::Sessions/Open', [
            'warehouses'      => Warehouse::where('active', true)->orderBy('name')->get(['id', 'name']),
            'currencies'      => Currency::where('active', true)->orderBy('name')->get(['id', 'code', 'symbol', 'name']),
            'primaryCurrency' => Currency::where('is_primary', true)->first(['id', 'code', 'symbol']),
            'users'           => \App\Models\User::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'            => ['nullable', 'string', 'max:100'],
            'warehouse_id'    => ['required', 'exists:warehouses,id'],
            'currency_id'     => ['required', 'exists:currencies,id'],
            'opening_balance' => ['required', 'numeric', 'min:0'],
            'notes'           => ['nullable', 'string', 'max:1000'],
            'user_id'         => ['nullable', 'exists:users,id'],
        ]);

        $session = \Illuminate\Support\Facades\DB::transaction(function () use ($data) {
            return PosSession::create([
                'reference'       => PosSession::generateReference(),
                'name'            => $data['name'] ?? null,
                'warehouse_id'    => $data['warehouse_id'],
                'currency_id'     => $data['currency_id'],
                'status'          => 'open',
                'opening_balance' => $data['opening_balance'],
                'opened_at'       => now(),
                'notes'           => $data['notes'] ?? null,
                'created_by'      => $data['user_id'] ?? \Illuminate\Support\Facades\Auth::id(),
            ]);
        });

        return redirect()->route('pos.sell', $session)
            ->with('success', "Sesión {$session->reference} abierta. ¡Listo para vender!");
    }

    // -------------------------------------------------------------------------
    // Show — session detail with sales history
    // -------------------------------------------------------------------------

    public function show(Request $request, PosSession $session): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $session->load(['warehouse', 'currency', 'creator']);

        $sales = $session->sales()
            ->with(['customer', 'creator', 'lines'])
            ->withCount('lines')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('Pos::Sessions/Show', [
            'session' => $session,
            'sales'   => $sales,
        ]);
    }

    // -------------------------------------------------------------------------
    // Close — form to close session
    // -------------------------------------------------------------------------

    public function close(Request $request, PosSession $session): Response|RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if($session->isClosed(), 403, 'Esta sesión ya está cerrada.');

        if ($session->orders()->where('status', 'open')->exists()) {
            return redirect('/pos/sessions/' . $session->id)->with('error', 'No puedes cerrar la caja porque hay mesas o cuentas en espera que aún no se han cobrado.');
        }

        $session->load(['warehouse', 'currency']);
        $session->recalculateTotals();

        return Inertia::render('Pos::Sessions/Close', [
            'session' => $session,
        ]);
    }

    public function storeClose(Request $request, PosSession $session): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if($session->isClosed(), 403, 'Esta sesión ya está cerrada.');

        if ($session->orders()->where('status', 'open')->exists()) {
            return redirect('/pos/sessions/' . $session->id)->with('error', 'No puedes cerrar la caja porque hay mesas o cuentas en espera que aún no se han cobrado.');
        }

        $data = $request->validate([
            'closing_balance' => ['required', 'numeric', 'min:0'],
            'notes'           => ['nullable', 'string', 'max:1000'],
        ]);

        $session->recalculateTotals();

        $session->update([
            'status'          => 'closed',
            'closing_balance' => $data['closing_balance'],
            'closed_at'       => now(),
            'notes'           => $data['notes'] ?? $session->notes,
        ]);

        return redirect()->route('pos.sessions.show', $session)
            ->with('success', "Sesión {$session->reference} cerrada correctamente.");
    }
}
