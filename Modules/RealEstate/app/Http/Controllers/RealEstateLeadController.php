<?php

namespace Modules\RealEstate\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Contacts\Models\Contact;
use Modules\RealEstate\Models\LeadInteraction;
use Modules\RealEstate\Models\RealEstateLead;

class RealEstateLeadController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = RealEstateLead::with(['agent', 'creator'])->withCount('interactions');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($dealType = $request->input('deal_type')) {
            $query->where('deal_type', $dealType);
        }
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('reference', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
                  ->orWhere('phone', 'ilike', "%{$search}%");
            });
        }

        $leads = $query->orderByDesc('id')->paginate(40)->withQueryString();

        return Inertia::render('RealEstate::Leads/Index', [
            'leads'   => $leads,
            'filters' => $request->only(['search', 'status', 'deal_type']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('RealEstate::Leads/Form', [
            'contacts' => Contact::where('active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $this->validateLead($request);

        $lead = RealEstateLead::create(array_merge($data, [
            'reference'  => RealEstateLead::generateReference(),
            'created_by' => Auth::id(),
            'assigned_at'=> $data['agent_id'] ? now() : null,
        ]));

        return redirect()->route('realestate.leads.show', $lead)
            ->with('success', "Lead {$lead->reference} creado correctamente.");
    }

    public function show(Request $request, RealEstateLead $lead): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $lead->load(['contact', 'agent', 'creator', 'interactions.user', 'deals.property']);

        return Inertia::render('RealEstate::Leads/Show', [
            'lead'    => $lead,
            'matches' => $lead->matchingProperties(),
        ]);
    }

    public function edit(Request $request, RealEstateLead $lead): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('RealEstate::Leads/Form', [
            'lead'     => $lead,
            'contacts' => Contact::where('active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, RealEstateLead $lead): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $this->validateLead($request);

        if ($data['agent_id'] && ! $lead->agent_id) {
            $data['assigned_at'] = now();
        }

        $lead->update($data);

        return redirect()->route('realestate.leads.show', $lead)
            ->with('success', "Lead {$lead->reference} actualizado.");
    }

    public function destroy(Request $request, RealEstateLead $lead): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $lead->interactions()->delete();
        $lead->delete();

        return redirect()->route('realestate.leads.index')
            ->with('success', "Lead eliminado.");
    }

    public function storeInteraction(Request $request, RealEstateLead $lead): RedirectResponse
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'type'           => ['required', 'in:call,email,visit,whatsapp,meeting,other'],
            'subject'        => ['nullable', 'string', 'max:255'],
            'notes'          => ['nullable', 'string'],
            'interaction_at' => ['required', 'date'],
        ]);

        LeadInteraction::create(array_merge($data, [
            'lead_id' => $lead->id,
            'user_id' => Auth::id(),
        ]));

        return back()->with('success', 'Interacción registrada.');
    }

    public function matches(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $leads = RealEstateLead::whereIn('status', ['new', 'contacted', 'qualified', 'proposal', 'negotiating'])
            ->with('agent')
            ->orderByDesc('id')
            ->get();

        $matchData = $leads->map(fn($lead) => [
            'lead'       => $lead,
            'properties' => $lead->matchingProperties(),
        ]);

        return Inertia::render('RealEstate::Leads/Matches', [
            'matches' => $matchData,
        ]);
    }

    private function validateLead(Request $request): array
    {
        return $request->validate([
            'contact_id'    => ['nullable', 'exists:contacts,id'],
            'name'          => ['required', 'string', 'max:255'],
            'phone'         => ['nullable', 'string', 'max:50'],
            'email'         => ['nullable', 'email', 'max:255'],
            'deal_type'     => ['required', 'in:sale,rent,both'],
            'property_type' => ['required', 'in:apartment,house,land,commercial,office,warehouse,any'],
            'budget_min'    => ['nullable', 'numeric', 'min:0'],
            'budget_max'    => ['nullable', 'numeric', 'min:0'],
            'preferred_zone'=> ['nullable', 'string', 'max:255'],
            'bedrooms_min'  => ['nullable', 'integer', 'min:0'],
            'bathrooms_min' => ['nullable', 'integer', 'min:0'],
            'status'        => ['required', 'in:new,contacted,qualified,proposal,negotiating,won,lost'],
            'source'        => ['required', 'in:referral,web,social,direct,portal,other'],
            'notes'         => ['nullable', 'string', 'max:2000'],
            'agent_id'      => ['nullable', 'exists:users,id'],
        ]);
    }
}
