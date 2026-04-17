<?php

namespace Modules\Pos\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Pos\Models\PosSession;
use Modules\Pos\Models\PosTable;

class PosTableController extends Controller
{
    public function index(Request $request): Response
    {
        $section = $request->input('section', 'all');

        $tables = PosTable::query()
            ->when($section !== 'all', fn ($q) => $q->where('section', $section))
            ->orderBy('section')
            ->orderBy('number')
            ->get()
            ->map(fn (PosTable $t) => [
                'id'              => $t->id,
                'number'          => $t->number,
                'section'         => $t->section,
                'shape'           => $t->shape,
                'capacity'        => $t->capacity,
                'status'          => $t->status,
                'server_name'     => $t->server_name,
                'time_open'       => $t->timeOpen(),
                'total'           => $t->total ? 'L. ' . number_format((float) $t->total, 2) : 'L. 0.00',
                'current_sale_id' => $t->current_sale_id,
            ]);

        $sections = PosTable::distinct()
            ->orderBy('section')
            ->pluck('section');

        $activeSession = PosSession::where('status', 'open')
            ->orderByDesc('id')
            ->first();

        return Inertia::render('Pos::Tables/Index', [
            'tables'        => $tables,
            'sections'      => $sections,
            'activeSection' => $section,
            'activeSession' => $activeSession ? [
                'id'        => $activeSession->id,
                'reference' => $activeSession->reference,
            ] : null,
        ]);
    }

    public function openTable(Request $request, PosTable $table): RedirectResponse
    {
        $session = PosSession::where('status', 'open')->orderByDesc('id')->first();

        if (!$session) {
            return redirect()->route('pos.sessions.open')
                ->with('warning', 'Debes abrir una caja antes de atender mesas.');
        }

        $table->update([
            'status'         => 'occupied',
            'server_name'    => $request->input('server_name', auth()->user()->name),
            'opened_at'      => now(),
            'total'          => 0,
            'pos_session_id' => $session->id,
        ]);

        return redirect()->route('pos.sell', $session->id);
    }

    public function updateStatus(Request $request, PosTable $table): RedirectResponse
    {
        $validated = $request->validate([
            'status'      => ['required', 'in:available,occupied,pending_food'],
            'server_name' => ['nullable', 'string', 'max:100'],
        ]);

        $table->update($validated);

        return back();
    }

    public function closeTable(PosTable $table): RedirectResponse
    {
        $table->update([
            'status'          => 'available',
            'server_name'     => null,
            'opened_at'       => null,
            'total'           => 0,
            'pos_session_id'  => null,
            'current_sale_id' => null,
        ]);

        return redirect()->route('pos.tables.index');
    }
}
