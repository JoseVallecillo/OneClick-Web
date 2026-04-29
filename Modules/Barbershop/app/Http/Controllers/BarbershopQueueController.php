<?php

namespace Modules\Barbershop\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Barbershop\Models\Barber;
use Modules\Barbershop\Models\BarbershopQueue;

class BarbershopQueueController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $date = $request->input('date', today()->toDateString());

        $queue = BarbershopQueue::with('barber')
            ->where('queue_date', $date)
            ->orderBy('position')
            ->get();

        return Inertia::render('Barbershop::Queue/Index', [
            'queue'   => $queue,
            'barbers' => Barber::active()->orderBy('name')->get(['id', 'name', 'color']),
            'date'    => $date,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'client_name'  => ['required', 'string', 'max:150'],
            'client_phone' => ['nullable', 'string', 'max:30'],
            'barber_id'    => ['nullable', 'exists:barbers,id'],
            'notes'        => ['nullable', 'string', 'max:500'],
        ]);

        $date = today()->toDateString();

        BarbershopQueue::create([
            'queue_date'   => $date,
            'position'     => BarbershopQueue::nextPosition($date),
            'client_name'  => $data['client_name'],
            'client_phone' => $data['client_phone'] ?? null,
            'barber_id'    => $data['barber_id'] ?? null,
            'status'       => 'waiting',
            'notes'        => $data['notes'] ?? null,
            'arrived_at'   => now(),
        ]);

        return back()->with('success', "{$data['client_name']} agregado a la cola.");
    }

    public function updateStatus(Request $request, BarbershopQueue $entry): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'status' => ['required', 'in:waiting,called,in_service,done,skipped'],
        ]);

        $updates = ['status' => $data['status']];

        if ($data['status'] === 'called') {
            $updates['called_at'] = now();
        }

        if ($data['status'] === 'done') {
            $updates['done_at'] = now();
        }

        $entry->update($updates);

        return back()->with('success', 'Estado de turno actualizado.');
    }

    public function destroy(Request $request, BarbershopQueue $entry): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $entry->delete();

        return back()->with('success', 'Turno eliminado de la cola.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'order'   => ['required', 'array'],
            'order.*' => ['integer'],
        ]);

        foreach ($data['order'] as $position => $id) {
            BarbershopQueue::where('id', $id)->update(['position' => $position + 1]);
        }

        return back()->with('success', 'Cola reorganizada.');
    }
}
