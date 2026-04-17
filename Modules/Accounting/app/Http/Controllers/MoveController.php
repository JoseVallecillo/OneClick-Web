<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\Journal;
use Modules\Accounting\Models\Move;
use Modules\Accounting\Models\MoveLine;
use Modules\Contacts\Models\Contact;

class MoveController extends Controller
{
    // -------------------------------------------------------------------------
    // Index — Libro Diario
    // -------------------------------------------------------------------------

    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = Move::with(['journal', 'creator'])
            ->withCount('lines');

        if ($state = $request->input('state')) {
            $query->where('state', $state);
        }

        if ($journalId = $request->input('journal_id')) {
            $query->where('journal_id', $journalId);
        }

        if ($dateFrom = $request->input('date_from')) {
            $query->where('date', '>=', $dateFrom);
        }

        if ($dateTo = $request->input('date_to')) {
            $query->where('date', '<=', $dateTo);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'ilike', "%{$search}%")
                  ->orWhere('narration', 'ilike', "%{$search}%");
            });
        }

        $moves    = $query->orderByDesc('date')->orderByDesc('id')->paginate(50)->withQueryString();
        $journals = Journal::where('active', true)->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Accounting::Moves/Index', [
            'moves'    => $moves,
            'journals' => $journals,
            'filters'  => $request->only(['search', 'state', 'journal_id', 'date_from', 'date_to']),
        ]);
    }

    // -------------------------------------------------------------------------
    // Create / Store
    // -------------------------------------------------------------------------

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::Moves/Form', [
            'journals' => Journal::where('active', true)->orderBy('name')->get(['id', 'name', 'code', 'type']),
            'accounts' => Account::where('active', true)->where('is_leaf', true)->orderBy('code')->get(['id', 'code', 'name', 'type', 'normal_balance']),
            'partners' => Contact::where('active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'journal_id'  => ['required', 'exists:account_journals,id'],
            'date'        => ['required', 'date'],
            'narration'   => ['nullable', 'string', 'max:500'],
            'lines'       => ['required', 'array', 'min:2'],
            'lines.*.account_id' => ['required', 'exists:account_accounts,id'],
            'lines.*.partner_id' => ['nullable', 'exists:contacts,id'],
            'lines.*.name'       => ['nullable', 'string', 'max:500'],
            'lines.*.debit'      => ['required', 'numeric', 'min:0'],
            'lines.*.credit'     => ['required', 'numeric', 'min:0'],
        ]);

        $move = DB::transaction(function () use ($data) {
            $journal = Journal::findOrFail($data['journal_id']);

            $move = Move::create([
                'reference'  => Move::generateReference($journal),
                'journal_id' => $data['journal_id'],
                'date'       => $data['date'],
                'narration'  => $data['narration'] ?? null,
                'state'      => 'draft',
                'created_by' => Auth::id(),
            ]);

            foreach ($data['lines'] as $line) {
                MoveLine::create([
                    'move_id'    => $move->id,
                    'account_id' => $line['account_id'],
                    'partner_id' => $line['partner_id'] ?? null,
                    'name'       => $line['name'] ?? null,
                    'debit'      => $line['debit'],
                    'credit'     => $line['credit'],
                ]);
            }

            return $move;
        });

        return redirect()->route('accounting.moves.show', $move)
            ->with('success', "Asiento {$move->reference} creado en borrador.");
    }

    // -------------------------------------------------------------------------
    // Show
    // -------------------------------------------------------------------------

    public function show(Request $request, Move $move): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $move->load(['journal', 'lines.account', 'lines.partner', 'lines.tax', 'creator', 'poster', 'reverseOf']);

        return Inertia::render('Accounting::Moves/Show', [
            'move' => $move,
        ]);
    }

    // -------------------------------------------------------------------------
    // Edit / Update (draft only)
    // -------------------------------------------------------------------------

    public function edit(Request $request, Move $move): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $move->isDraft(), 403, 'Solo se pueden editar asientos en borrador.');

        $move->load('lines');

        return Inertia::render('Accounting::Moves/Form', [
            'move'     => $move,
            'journals' => Journal::where('active', true)->orderBy('name')->get(['id', 'name', 'code', 'type']),
            'accounts' => Account::where('active', true)->where('is_leaf', true)->orderBy('code')->get(['id', 'code', 'name', 'type', 'normal_balance']),
            'partners' => Contact::where('active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Move $move): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $move->isDraft(), 403, 'Solo se pueden editar asientos en borrador.');

        $data = $request->validate([
            'journal_id'  => ['required', 'exists:account_journals,id'],
            'date'        => ['required', 'date'],
            'narration'   => ['nullable', 'string', 'max:500'],
            'lines'       => ['required', 'array', 'min:2'],
            'lines.*.account_id' => ['required', 'exists:account_accounts,id'],
            'lines.*.partner_id' => ['nullable', 'exists:contacts,id'],
            'lines.*.name'       => ['nullable', 'string', 'max:500'],
            'lines.*.debit'      => ['required', 'numeric', 'min:0'],
            'lines.*.credit'     => ['required', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($move, $data) {
            $move->update([
                'journal_id' => $data['journal_id'],
                'date'       => $data['date'],
                'narration'  => $data['narration'] ?? null,
            ]);

            $move->lines()->delete();

            foreach ($data['lines'] as $line) {
                MoveLine::create([
                    'move_id'    => $move->id,
                    'account_id' => $line['account_id'],
                    'partner_id' => $line['partner_id'] ?? null,
                    'name'       => $line['name'] ?? null,
                    'debit'      => $line['debit'],
                    'credit'     => $line['credit'],
                ]);
            }
        });

        return redirect()->route('accounting.moves.show', $move)
            ->with('success', "Asiento {$move->reference} actualizado.");
    }

    // -------------------------------------------------------------------------
    // Destroy (draft only)
    // -------------------------------------------------------------------------

    public function destroy(Request $request, Move $move): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $move->isDraft(), 403, 'Solo se pueden eliminar asientos en borrador.');

        $ref = $move->reference;
        DB::transaction(function () use ($move) {
            $move->lines()->delete();
            $move->delete();
        });

        return redirect()->route('accounting.moves.index')
            ->with('success', "Asiento {$ref} eliminado.");
    }

    // -------------------------------------------------------------------------
    // Workflow: Draft → Posted
    // -------------------------------------------------------------------------

    public function post(Request $request, Move $move): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        try {
            $move->post(Auth::id());
        } catch (\LogicException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('accounting.moves.show', $move)
            ->with('success', "Asiento {$move->reference} publicado correctamente.");
    }

    // -------------------------------------------------------------------------
    // Reversal: Posted → Reversed (creates a contra-entry)
    // -------------------------------------------------------------------------

    public function reverse(Request $request, Move $move): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'narration' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $reversal = $move->reverse(Auth::id(), $data['narration'] ?? null);
        } catch (\LogicException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('accounting.moves.show', $reversal)
            ->with('success', "Asiento {$move->reference} revertido. Asiento de reversión: {$reversal->reference}.");
    }
}
