<?php

namespace Modules\RealEstate\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Contacts\Models\Contact;
use Modules\RealEstate\Models\Commission;
use Modules\RealEstate\Models\DealDocument;
use Modules\RealEstate\Models\Property;
use Modules\RealEstate\Models\RealEstateDeal;
use Modules\RealEstate\Models\RealEstateLead;

class RealEstateDealController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = RealEstateDeal::with(['property', 'contact', 'agent']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($dealType = $request->input('deal_type')) {
            $query->where('deal_type', $dealType);
        }
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'ilike', "%{$search}%")
                  ->orWhereHas('contact', fn($sq) => $sq->where('name', 'ilike', "%{$search}%"))
                  ->orWhereHas('property', fn($sq) => $sq->where('title', 'ilike', "%{$search}%"));
            });
        }

        $deals = $query->orderByDesc('id')->paginate(30)->withQueryString();

        return Inertia::render('RealEstate::Deals/Index', [
            'deals'   => $deals,
            'filters' => $request->only(['search', 'status', 'deal_type']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('RealEstate::Deals/Form', [
            'properties' => Property::where('status', 'available')->orderBy('title')->get(['id', 'reference', 'title', 'type', 'sale_price', 'rent_price', 'currency']),
            'contacts'   => Contact::where('is_client', true)->where('active', true)->orderBy('name')->get(['id', 'name']),
            'leads'      => RealEstateLead::whereIn('status', ['qualified', 'proposal', 'negotiating'])->orderBy('name')->get(['id', 'reference', 'name']),
            'agents'     => User::where('active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $this->validateDeal($request);

        $deal = DB::transaction(function () use ($data) {
            $deal = RealEstateDeal::create(array_merge($data, [
                'reference'  => RealEstateDeal::generateReference(),
                'status'     => 'draft',
                'created_by' => Auth::id(),
            ]));

            // Reserve property
            $deal->property->update(['status' => 'reserved']);

            // Update lead status if linked
            if ($deal->lead_id) {
                $deal->lead->update(['status' => 'proposal']);
            }

            return $deal;
        });

        return redirect()->route('realestate.deals.show', $deal)
            ->with('success', "Negocio {$deal->reference} creado correctamente.");
    }

    public function show(Request $request, RealEstateDeal $deal): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $deal->load([
            'property.media',
            'lead',
            'contact',
            'agent',
            'creator',
            'documents.uploader',
            'documents.reviewer',
            'paymentPlan.installments',
            'commissions.agent',
        ]);

        return Inertia::render('RealEstate::Deals/Show', [
            'deal' => $deal,
        ]);
    }

    public function edit(Request $request, RealEstateDeal $deal): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $deal->isEditable(), 403, 'Este negocio no puede editarse en su estado actual.');

        return Inertia::render('RealEstate::Deals/Form', [
            'deal'       => $deal,
            'properties' => Property::whereIn('status', ['available', 'reserved'])->orderBy('title')->get(['id', 'reference', 'title', 'type', 'sale_price', 'rent_price', 'currency']),
            'contacts'   => Contact::where('is_client', true)->where('active', true)->orderBy('name')->get(['id', 'name']),
            'leads'      => RealEstateLead::whereIn('status', ['qualified', 'proposal', 'negotiating'])->orderBy('name')->get(['id', 'reference', 'name']),
            'agents'     => User::where('active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, RealEstateDeal $deal): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $deal->isEditable(), 403, 'Este negocio no puede editarse en su estado actual.');

        $data = $this->validateDeal($request);
        $deal->update($data);

        return redirect()->route('realestate.deals.show', $deal)
            ->with('success', "Negocio {$deal->reference} actualizado.");
    }

    public function destroy(Request $request, RealEstateDeal $deal): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $deal->isDraft(), 403, 'Solo se pueden eliminar negocios en borrador.');

        DB::transaction(function () use ($deal) {
            $deal->property->update(['status' => 'available']);
            $deal->documents()->each(fn($d) => Storage::disk('public')->delete($d->path));
            $deal->documents()->delete();
            $deal->delete();
        });

        return redirect()->route('realestate.deals.index')
            ->with('success', "Negocio eliminado.");
    }

    // ── Workflow ──────────────────────────────────────────────────────────────

    public function reserve(Request $request, RealEstateDeal $deal): RedirectResponse
    {
        $this->requireAdmin($request);

        abort_if(! $deal->isDraft(), 403, 'El negocio debe estar en borrador para reservarse.');

        $data = $request->validate([
            'reservation_amount' => ['required', 'numeric', 'min:0'],
            'reservation_date'   => ['required', 'date'],
            'reservation_paid'   => ['required', 'boolean'],
        ]);

        $deal->update(array_merge($data, ['status' => 'reserved']));

        return redirect()->route('realestate.deals.show', $deal)
            ->with('success', "Reserva registrada para {$deal->reference}.");
    }

    public function uploadDoc(Request $request, RealEstateDeal $deal): RedirectResponse
    {
        $this->requireAdmin($request);

        $request->validate([
            'file'  => ['required', 'file', 'mimes:pdf,jpeg,jpg,png,docx', 'max:20480'],
            'type'  => ['required', 'in:dni,income_proof,tax_id,bank_statement,contract,other'],
            'name'  => ['required', 'string', 'max:255'],
        ]);

        $path = $request->file('file')->store("realestate/deals/{$deal->id}/docs", 'public');

        DealDocument::create([
            'deal_id'     => $deal->id,
            'type'        => $request->input('type'),
            'name'        => $request->input('name'),
            'path'        => $path,
            'status'      => 'pending',
            'uploaded_by' => Auth::id(),
        ]);

        if ($deal->isDraft() || $deal->isReserved()) {
            $deal->update(['status' => 'documents']);
        }

        return back()->with('success', 'Documento subido correctamente.');
    }

    public function reviewDoc(Request $request, RealEstateDeal $deal, DealDocument $doc): RedirectResponse
    {
        $this->requireAdmin($request);

        abort_if($doc->deal_id !== $deal->id, 404);

        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'notes'  => ['nullable', 'string', 'max:500'],
        ]);

        $doc->update(array_merge($data, [
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]));

        return back()->with('success', 'Documento revisado.');
    }

    public function generateContract(Request $request, RealEstateDeal $deal): RedirectResponse
    {
        $this->requireAdmin($request);

        abort_if(! in_array($deal->status, ['documents', 'contract']), 403, 'Estado incorrecto para generar contrato.');

        $data = $request->validate([
            'contract_signed' => ['required', 'boolean'],
        ]);

        $deal->update([
            'status'                 => 'contract',
            'contract_generated'     => true,
            'contract_generated_at'  => now(),
            'contract_signed'        => $data['contract_signed'],
            'contract_signed_at'     => $data['contract_signed'] ? now() : null,
        ]);

        if ($data['contract_signed']) {
            $deal->update(['status' => 'closing']);
        }

        return redirect()->route('realestate.deals.show', $deal)
            ->with('success', "Contrato generado para {$deal->reference}.");
    }

    public function complete(Request $request, RealEstateDeal $deal): RedirectResponse
    {
        $this->requireAdmin($request);

        abort_if(! $deal->isClosing(), 403, 'El negocio debe estar en cierre para completarse.');

        DB::transaction(function () use ($deal) {
            $newStatus = $deal->deal_type === 'sale' ? 'sold' : 'rented';
            $deal->property->update(['status' => $newStatus]);
            $deal->update(['status' => 'completed', 'completed_at' => now()]);

            if ($deal->lead_id) {
                $deal->lead->update(['status' => 'won', 'closed_at' => now()]);
            }
        });

        return redirect()->route('realestate.deals.show', $deal)
            ->with('success', "Negocio {$deal->reference} completado.");
    }

    public function cancel(Request $request, RealEstateDeal $deal): RedirectResponse
    {
        $this->requireAdmin($request);

        abort_if($deal->isCompleted(), 403, 'No se puede cancelar un negocio completado.');

        $data = $request->validate([
            'cancellation_reason' => ['required', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($deal, $data) {
            $deal->property->update(['status' => 'available']);
            $deal->update(array_merge($data, [
                'status'       => 'cancelled',
                'cancelled_at' => now(),
            ]));

            if ($deal->lead_id) {
                $deal->lead->update(['status' => 'lost', 'closed_at' => now()]);
            }
        });

        return redirect()->route('realestate.deals.show', $deal)
            ->with('success', "Negocio {$deal->reference} cancelado.");
    }

    public function lookupAgents(Request $request)
    {
        return User::where('active', true)
            ->where('name', 'ilike', '%' . $request->input('q', '') . '%')
            ->limit(20)
            ->get(['id', 'name']);
    }

    private function validateDeal(Request $request): array
    {
        return $request->validate([
            'property_id'        => ['required', 'exists:re_properties,id'],
            'lead_id'            => ['nullable', 'exists:re_leads,id'],
            'contact_id'         => ['required', 'exists:contacts,id'],
            'deal_type'          => ['required', 'in:sale,rent'],
            'agreed_price'       => ['nullable', 'numeric', 'min:0'],
            'currency'           => ['required', 'string', 'size:3'],
            'rent_period'        => ['nullable', 'in:monthly,quarterly,yearly'],
            'start_date'         => ['nullable', 'date'],
            'end_date'           => ['nullable', 'date', 'after_or_equal:start_date'],
            'agent_id'           => ['nullable', 'exists:users,id'],
            'notes'              => ['nullable', 'string', 'max:2000'],
            'internal_notes'     => ['nullable', 'string', 'max:2000'],
        ]);
    }
}
