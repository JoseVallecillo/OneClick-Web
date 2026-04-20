<?php

namespace Modules\RealEstate\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\RealEstate\Models\PaymentInstallment;
use Modules\RealEstate\Models\PaymentPlan;
use Modules\RealEstate\Models\RealEstateDeal;

class PaymentPlanController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = PaymentPlan::with(['deal.property', 'deal.contact', 'creator'])
            ->withCount(['installments as paid_count' => fn($q) => $q->where('status', 'paid')])
            ->withCount('installments');

        if ($search = $request->input('search')) {
            $query->whereHas('deal', function ($q) use ($search) {
                $q->where('reference', 'ilike', "%{$search}%")
                  ->orWhereHas('contact', fn($sq) => $sq->where('name', 'ilike', "%{$search}%"));
            });
        }

        $plans = $query->orderByDesc('id')->paginate(30)->withQueryString();

        return Inertia::render('RealEstate::PaymentPlans/Index', [
            'plans'   => $plans,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request, RealEstateDeal $deal): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if($deal->paymentPlan()->exists(), 422, 'Este negocio ya tiene un plan de pagos.');

        $data = $request->validate([
            'type'               => ['required', 'in:cash,installments,financing,mixed'],
            'total_amount'       => ['required', 'numeric', 'min:0'],
            'down_payment'       => ['nullable', 'numeric', 'min:0'],
            'installment_count'  => ['required', 'integer', 'min:1', 'max:360'],
            'first_due_date'     => ['required', 'date'],
            'notes'              => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($deal, $data) {
            $financed   = (float) $data['total_amount'] - ((float) ($data['down_payment'] ?? 0));
            $perInstall = $data['installment_count'] > 0
                ? $financed / $data['installment_count']
                : $financed;

            $plan = PaymentPlan::create([
                'deal_id'            => $deal->id,
                'type'               => $data['type'],
                'total_amount'       => $data['total_amount'],
                'down_payment'       => $data['down_payment'] ?? 0,
                'financed_amount'    => $financed,
                'installment_count'  => $data['installment_count'],
                'installment_amount' => $perInstall,
                'first_due_date'     => $data['first_due_date'],
                'notes'              => $data['notes'] ?? null,
                'created_by'         => Auth::id(),
            ]);

            $dueDate = \Carbon\Carbon::parse($data['first_due_date']);
            for ($i = 1; $i <= $data['installment_count']; $i++) {
                PaymentInstallment::create([
                    'payment_plan_id'  => $plan->id,
                    'number'           => $i,
                    'amount'           => $perInstall,
                    'due_date'         => $dueDate->copy(),
                    'status'           => 'pending',
                ]);
                $dueDate->addMonth();
            }
        });

        return redirect()->route('realestate.deals.show', $deal)
            ->with('success', "Plan de pagos creado con {$data['installment_count']} cuotas.");
    }

    public function payInstallment(Request $request, PaymentPlan $plan, PaymentInstallment $installment): RedirectResponse
    {
        $this->requireAdmin($request);

        abort_if($installment->payment_plan_id !== $plan->id, 404);
        abort_if($installment->status === 'paid', 422, 'Esta cuota ya fue pagada.');

        $data = $request->validate([
            'payment_reference' => ['required', 'string', 'max:100'],
            'invoice_number'    => ['nullable', 'string', 'max:100'],
            'notes'             => ['nullable', 'string', 'max:500'],
        ]);

        $installment->update(array_merge($data, [
            'status'      => 'paid',
            'paid_at'     => now(),
            'recorded_by' => Auth::id(),
        ]));

        // Mark overdue installments if missed
        PaymentInstallment::where('payment_plan_id', $plan->id)
            ->where('status', 'pending')
            ->where('due_date', '<', now()->toDateString())
            ->update(['status' => 'overdue']);

        return back()->with('success', "Cuota #{$installment->number} pagada.");
    }
}
