<?php

namespace Modules\RealEstate\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\RealEstate\Models\Commission;
use Modules\RealEstate\Models\RealEstateDeal;

class CommissionController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = Commission::with(['deal.property', 'deal.contact', 'agent', 'approver']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($agentId = $request->input('agent_id')) {
            $query->where('agent_id', $agentId);
        }

        $commissions = $query->orderByDesc('id')->paginate(30)->withQueryString();
        $agents      = User::where('active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('RealEstate::Commissions/Index', [
            'commissions' => $commissions,
            'agents'      => $agents,
            'filters'     => $request->only(['status', 'agent_id']),
        ]);
    }

    public function store(Request $request, RealEstateDeal $deal): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'agent_id'       => ['required', 'exists:users,id'],
            'commission_pct' => ['required', 'numeric', 'min:0', 'max:100'],
            'base_amount'    => ['required', 'numeric', 'min:0'],
            'notes'          => ['nullable', 'string', 'max:1000'],
        ]);

        $commissionAmount = (float) $data['base_amount'] * ((float) $data['commission_pct'] / 100);

        Commission::create([
            'deal_id'           => $deal->id,
            'agent_id'          => $data['agent_id'],
            'commission_pct'    => $data['commission_pct'],
            'base_amount'       => $data['base_amount'],
            'commission_amount' => $commissionAmount,
            'status'            => 'pending',
            'notes'             => $data['notes'] ?? null,
            'created_by'        => Auth::id(),
        ]);

        return redirect()->route('realestate.deals.show', $deal)
            ->with('success', "Comisión registrada: " . number_format($commissionAmount, 2));
    }

    public function approve(Request $request, Commission $commission): RedirectResponse
    {
        $this->requireAdmin($request);

        abort_if($commission->status !== 'pending', 422, 'Solo se pueden aprobar comisiones pendientes.');

        $commission->update([
            'status'      => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', "Comisión aprobada.");
    }

    public function pay(Request $request, Commission $commission): RedirectResponse
    {
        $this->requireAdmin($request);

        abort_if($commission->status !== 'approved', 422, 'Solo se pueden pagar comisiones aprobadas.');

        $data = $request->validate([
            'payment_reference' => ['required', 'string', 'max:100'],
        ]);

        $commission->update(array_merge($data, [
            'status'  => 'paid',
            'paid_at' => now(),
        ]));

        return back()->with('success', "Comisión pagada a {$commission->agent->name}.");
    }
}
