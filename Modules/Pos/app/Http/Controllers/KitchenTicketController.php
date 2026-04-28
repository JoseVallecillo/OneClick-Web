<?php

namespace Modules\Pos\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Pos\Models\KitchenTicket;
use Modules\Pos\Models\PosOrder;

class KitchenTicketController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->input('status', 'pending');

        $tickets = KitchenTicket::query()
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->with(['order', 'items.product'])
            ->orderByDesc('printed_at')
            ->paginate(20)
            ->through(fn (KitchenTicket $t) => [
                'id' => $t->id,
                'order_reference' => $t->order?->reference,
                'status' => $t->status,
                'special_notes' => $t->special_notes,
                'printed_at' => $t->printed_at?->format('H:i:s'),
                'started_at' => $t->started_at?->format('H:i'),
                'completed_at' => $t->completed_at?->format('H:i'),
                'time_to_complete' => $t->completed_at && $t->started_at
                    ? $t->started_at->diffInMinutes($t->completed_at) . ' min'
                    : null,
                'items' => $t->items->map(fn ($item) => [
                    'id' => $item->id,
                    'product_name' => $item->product?->name,
                    'qty' => (float) $item->qty,
                    'special_instructions' => $item->special_instructions,
                ]),
            ]);

        $statuses = [
            'pending' => 'Pendientes',
            'in_progress' => 'En Preparación',
            'completed' => 'Completados',
        ];

        return Inertia::render('Pos::Kitchen/Index', [
            'tickets' => $tickets,
            'currentStatus' => $status,
            'statuses' => $statuses,
        ]);
    }

    public function show(KitchenTicket $ticket): Response
    {
        return Inertia::render('Pos::Kitchen/Show', [
            'ticket' => [
                'id' => $ticket->id,
                'order_reference' => $ticket->order?->reference,
                'status' => $ticket->status,
                'special_notes' => $ticket->special_notes,
                'printed_at' => $ticket->printed_at?->format('Y-m-d H:i:s'),
                'started_at' => $ticket->started_at?->format('Y-m-d H:i:s'),
                'completed_at' => $ticket->completed_at?->format('Y-m-d H:i:s'),
                'items' => $ticket->items->map(fn ($item) => [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product?->name,
                    'qty' => (float) $item->qty,
                    'special_instructions' => $item->special_instructions,
                ]),
            ],
        ]);
    }

    public function start(KitchenTicket $ticket): RedirectResponse
    {
        if ($ticket->status === 'pending') {
            $ticket->start();
        }

        return back()->with('success', 'Ticket iniciado.');
    }

    public function complete(KitchenTicket $ticket): RedirectResponse
    {
        if ($ticket->status === 'in_progress') {
            $ticket->complete();
        }

        return back()->with('success', 'Ticket completado.');
    }

    public function cancel(KitchenTicket $ticket): RedirectResponse
    {
        if (in_array($ticket->status, ['pending', 'in_progress'])) {
            $ticket->cancel();
        }

        return back()->with('success', 'Ticket cancelado.');
    }

    public function print(KitchenTicket $ticket): Response
    {
        return Inertia::render('Pos::Kitchen/Print', [
            'ticket' => [
                'id' => $ticket->id,
                'order_reference' => $ticket->order?->reference,
                'special_notes' => $ticket->special_notes,
                'printed_at' => $ticket->printed_at?->format('Y-m-d H:i:s'),
                'items' => $ticket->items->map(fn ($item) => [
                    'product_name' => $item->product?->name,
                    'qty' => (float) $item->qty,
                    'special_instructions' => $item->special_instructions,
                ]),
            ],
        ]);
    }

    public function reprint(KitchenTicket $ticket): RedirectResponse
    {
        $ticket->update(['printed_at' => now()]);
        return back()->with('success', 'Ticket reimpreso.');
    }
}
