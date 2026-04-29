<?php

namespace Modules\Contacts\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Contacts\Models\Contact;

class ContactReportsController extends Controller
{
    public function debtorsReport(Request $request): Response
    {
        $this->requireAdmin();

        $debtors = Contact::where('is_client', true)
            ->where('outstanding_balance', '>', 0)
            ->orderByDesc('outstanding_balance')
            ->paginate(50)
            ->through(fn (Contact $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'rtn' => $c->rtn,
                'outstanding_balance' => (float) $c->outstanding_balance,
                'credit_limit' => (float) $c->credit_limit,
                'last_payment_date' => $c->last_payment_date?->format('Y-m-d'),
                'days_overdue' => $c->last_payment_date
                    ? now()->diffInDays($c->last_payment_date)
                    : null,
            ]);

        $totalDebt = Contact::where('is_client', true)->sum('outstanding_balance');

        return Inertia::render('Contacts::Reports/Debtors', [
            'debtors' => $debtors,
            'summary' => [
                'total_debtors' => $debtors->total(),
                'total_debt' => (float) $totalDebt,
            ],
        ]);
    }

    public function supplierAnalysis(Request $request): Response
    {
        $this->requireAdmin();

        $suppliers = Contact::where('is_supplier', true)
            ->with('supplierEvaluation')
            ->get()
            ->map(fn (Contact $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'rtn' => $s->rtn,
                'total_purchases' => (float) $s->total_purchases,
                'last_purchase_date' => $s->last_purchase_date?->format('Y-m-d'),
                'quality_rating' => $s->supplierEvaluation?->quality_rating,
                'delivery_rating' => $s->supplierEvaluation?->delivery_rating,
                'communication_rating' => $s->supplierEvaluation?->communication_rating,
                'price_rating' => $s->supplierEvaluation?->price_rating,
                'overall_rating' => $s->supplierEvaluation?->overallRating(),
                'on_time_delivery_percent' => (float) ($s->supplierEvaluation?->on_time_delivery_percent ?? 0),
            ])
            ->sortByDesc('overall_rating')
            ->values();

        return Inertia::render('Contacts::Reports/SupplierAnalysis', [
            'suppliers' => $suppliers,
            'summary' => [
                'total_suppliers' => $suppliers->count(),
                'avg_rating' => $suppliers->avg('overall_rating'),
            ],
        ]);
    }

    public function clientClassification(Request $request): Response
    {
        $this->requireAdmin();

        $clients = Contact::where('is_client', true)
            ->with('classifications')
            ->get()
            ->map(fn (Contact $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'rtn' => $c->rtn,
                'total_purchases' => (float) $c->total_purchases,
                'outstanding_balance' => (float) $c->outstanding_balance,
                'last_purchase_date' => $c->last_purchase_date?->format('Y-m-d'),
                'days_since_purchase' => $c->last_purchase_date
                    ? now()->diffInDays($c->last_purchase_date)
                    : null,
                'classification' => $c->classifications()->where('type', 'client_category')->first()?->classification,
            ])
            ->sortByDesc('total_purchases')
            ->values();

        return Inertia::render('Contacts::Reports/ClientClassification', [
            'clients' => $clients,
            'summary' => [
                'total_clients' => $clients->count(),
                'total_sales' => $clients->sum('total_purchases'),
                'avg_sale_value' => $clients->count() > 0
                    ? $clients->sum('total_purchases') / $clients->count()
                    : 0,
            ],
        ]);
    }

    public function communicationActivity(Request $request): Response
    {
        $this->requireAdmin();

        $from = $request->input('from')
            ? Carbon::createFromFormat('Y-m-d', $request->input('from'))->startOfDay()
            : now()->subDays(30)->startOfDay();

        $to = $request->input('to')
            ? Carbon::createFromFormat('Y-m-d', $request->input('to'))->endOfDay()
            : now()->endOfDay();

        $contacts = Contact::whereHas('communications', function ($q) use ($from, $to) {
            $q->whereBetween('communication_date', [$from, $to]);
        })
        ->with(['communications' => function ($q) use ($from, $to) {
            $q->whereBetween('communication_date', [$from, $to]);
        }])
        ->get()
        ->map(fn (Contact $c) => [
            'id' => $c->id,
            'name' => $c->name,
            'communication_count' => $c->communications->count(),
            'last_communication' => $c->communications->first()?->communication_date?->format('Y-m-d H:i'),
            'communication_types' => $c->communications->groupBy('type')->map->count(),
        ])
        ->sortByDesc('communication_count')
        ->values();

        return Inertia::render('Contacts::Reports/CommunicationActivity', [
            'contacts' => $contacts,
            'filters' => [
                'from' => $from->format('Y-m-d'),
                'to' => $to->format('Y-m-d'),
            ],
        ]);
    }
}
