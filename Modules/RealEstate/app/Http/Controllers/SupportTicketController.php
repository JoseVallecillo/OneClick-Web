<?php

namespace Modules\RealEstate\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Contacts\Models\Contact;
use Modules\RealEstate\Models\Property;
use Modules\RealEstate\Models\RealEstateDeal;
use Modules\RealEstate\Models\SupportTicket;

class SupportTicketController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = SupportTicket::with(['property', 'contact', 'assignee', 'creator']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($priority = $request->input('priority')) {
            $query->where('priority', $priority);
        }
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                  ->orWhere('reference', 'ilike', "%{$search}%");
            });
        }

        $tickets   = $query->orderByDesc('id')->paginate(30)->withQueryString();
        $agents    = User::orderBy('name')->get(['id', 'name']);
        $contacts  = Contact::where('active', true)->orderBy('name')->get(['id', 'name']);
        $properties = Property::orderBy('title')->get(['id', 'reference', 'title']);

        return Inertia::render('RealEstate::Support/Index', [
            'tickets'    => $tickets,
            'agents'     => $agents,
            'contacts'   => $contacts,
            'properties' => $properties,
            'filters'    => $request->only(['status', 'priority', 'search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'deal_id'     => ['nullable', 'exists:re_deals,id'],
            'property_id' => ['nullable', 'exists:re_properties,id'],
            'contact_id'  => ['required', 'exists:contacts,id'],
            'type'        => ['required', 'in:warranty,repair,hidden_defect,maintenance,complaint,other'],
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'priority'    => ['required', 'in:low,medium,high,urgent'],
            'assigned_to' => ['nullable', 'exists:users,id'],
        ]);

        SupportTicket::create(array_merge($data, [
            'reference'  => SupportTicket::generateReference(),
            'status'     => 'open',
            'created_by' => Auth::id(),
        ]));

        return back()->with('success', 'Ticket de soporte creado correctamente.');
    }

    public function update(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'priority'    => ['required', 'in:low,medium,high,urgent'],
            'status'      => ['required', 'in:open,in_progress,resolved,closed'],
            'assigned_to' => ['nullable', 'exists:users,id'],
        ]);

        if ($data['status'] === 'in_progress' && $ticket->status === 'open') {
            $data['assigned_to'] = $data['assigned_to'] ?? Auth::id();
        }

        $ticket->update($data);

        return back()->with('success', "Ticket {$ticket->reference} actualizado.");
    }

    public function resolve(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $this->requireAdmin($request);

        abort_if($ticket->status === 'closed', 422, 'El ticket ya está cerrado.');

        $data = $request->validate([
            'resolution_notes' => ['required', 'string'],
        ]);

        $ticket->update(array_merge($data, [
            'status'      => 'resolved',
            'resolved_at' => now(),
        ]));

        return back()->with('success', "Ticket {$ticket->reference} resuelto.");
    }
}
