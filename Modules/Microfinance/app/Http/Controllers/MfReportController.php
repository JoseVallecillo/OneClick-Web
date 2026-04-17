<?php

namespace Modules\Microfinance\app\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Modules\Microfinance\app\Models\MfAmlAlert;
use Modules\Microfinance\app\Models\MfClient;
use Modules\Microfinance\app\Models\MfCreditBureauSnapshot;
use Modules\Microfinance\app\Models\MfLoan;

class MfReportController extends Controller
{
    public function dashboard()
    {
        $active = MfLoan::whereIn('status', ['disbursed','current','delinquent','judicial']);

        $portfolio      = (float) $active->sum('principal_balance');
        $par1Amount     = (float) MfLoan::whereIn('status', ['disbursed','current','delinquent'])->where('days_overdue', '>=', 1)->sum('principal_balance');
        $par30Amount    = (float) MfLoan::whereIn('status', ['disbursed','current','delinquent'])->where('days_overdue', '>=', 30)->sum('principal_balance');
        $par60Amount    = (float) MfLoan::whereIn('status', ['disbursed','current','delinquent'])->where('days_overdue', '>=', 60)->sum('principal_balance');
        $par90Amount    = (float) MfLoan::whereIn('status', ['disbursed','current','delinquent'])->where('days_overdue', '>=', 90)->sum('principal_balance');

        return Inertia::render('Microfinance::Dashboard/Index', [
            'stats' => [
                'total_clients'     => MfClient::count(),
                'active_clients'    => MfClient::where('status', 'active')->count(),
                'total_portfolio'   => $portfolio,
                'active_loans'      => MfLoan::whereIn('status', ['disbursed','current','delinquent'])->count(),
                'delinquent_loans'  => MfLoan::where('days_overdue', '>', 0)->count(),
                'pending_approval'  => MfLoan::whereIn('status', ['pending','committee_review'])->count(),
                'open_aml'          => MfAmlAlert::where('status', 'pending')->count(),
            ],
            'par_indicators' => [
                ['label' => 'PaR > 1 día',   'amount' => $par1Amount,  'rate' => $portfolio > 0 ? round($par1Amount  / $portfolio * 100, 2) : 0],
                ['label' => 'PaR > 30 días',  'amount' => $par30Amount, 'rate' => $portfolio > 0 ? round($par30Amount / $portfolio * 100, 2) : 0],
                ['label' => 'PaR > 60 días',  'amount' => $par60Amount, 'rate' => $portfolio > 0 ? round($par60Amount / $portfolio * 100, 2) : 0],
                ['label' => 'PaR > 90 días',  'amount' => $par90Amount, 'rate' => $portfolio > 0 ? round($par90Amount / $portfolio * 100, 2) : 0],
            ],
        ]);
    }

    public function par(Request $request)
    {
        $portfolio = (float) MfLoan::whereIn('status', ['disbursed','current','delinquent','judicial'])->sum('principal_balance');

        $tierDefs = [
            'current' => ['label' => 'Al día (0 días)',   'provision_rate' => 0.01, 'min' => 0,  'max' => 0],
            'par1'    => ['label' => 'PaR 1-29 días',     'provision_rate' => 0.05, 'min' => 1,  'max' => 29],
            'par30'   => ['label' => 'PaR 30-59 días',    'provision_rate' => 0.20, 'min' => 30, 'max' => 59],
            'par60'   => ['label' => 'PaR 60-89 días',    'provision_rate' => 0.50, 'min' => 60, 'max' => 89],
            'par90'   => ['label' => 'PaR 90+ días',      'provision_rate' => 1.00, 'min' => 90, 'max' => 99999],
        ];

        $tiers = [];
        foreach ($tierDefs as $cat => $def) {
            $q = MfLoan::whereIn('status', ['disbursed','current','delinquent','judicial'])
                ->with('client')
                ->whereBetween('days_overdue', [$def['min'], $def['max']])
                ->orderByDesc('days_overdue')
                ->limit(20)
                ->get();

            $bal = (float) MfLoan::whereIn('status', ['disbursed','current','delinquent','judicial'])
                ->whereBetween('days_overdue', [$def['min'], $def['max']])->sum('principal_balance');

            $tiers[] = [
                'category'         => $cat,
                'label'            => $def['label'],
                'loan_count'       => MfLoan::whereIn('status', ['disbursed','current','delinquent','judicial'])->whereBetween('days_overdue', [$def['min'], $def['max']])->count(),
                'portfolio_at_risk' => $bal,
                'provision_rate'   => $def['provision_rate'],
                'provision_required' => $bal * $def['provision_rate'],
                'loans'            => $q->map(fn($l) => [
                    'loan_number'     => $l->loan_number,
                    'days_overdue'    => $l->days_overdue,
                    'principal_balance' => $l->principal_balance,
                    'client'          => ['first_name' => $l->client->first_name, 'last_name' => $l->client->last_name],
                ])->values(),
            ];
        }

        return Inertia::render('Microfinance::Reports/Par', [
            'tiers'      => $tiers,
            'totals'     => [
                'total_portfolio' => $portfolio,
                'total_par'       => (float) MfLoan::whereIn('status', ['disbursed','current','delinquent','judicial'])->where('days_overdue', '>', 0)->sum('principal_balance'),
                'total_provision' => collect($tiers)->sum('provision_required'),
            ],
            'as_of_date' => now()->toDateString(),
        ]);
    }

    public function amlAlerts(Request $request)
    {
        $alerts = MfAmlAlert::with(['client', 'loan'])
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->level, fn($q, $l) => $q->where('risk_level', $l))
            ->orderByDesc('created_at')
            ->paginate(25)->withQueryString();

        return Inertia::render('Microfinance::Reports/AmlAlerts', [
            'alerts'  => $alerts,
            'filters' => $request->only('status', 'level'),
            'summary' => [
                'open_count'      => MfAmlAlert::where('status', 'pending')->count(),
                'high_risk_count' => MfAmlAlert::where('risk_level', 'high')->where('status', 'pending')->count(),
            ],
        ]);
    }

    public function reviewAmlAlert(Request $request, MfAmlAlert $alert)
    {
        $data = $request->validate(['status' => 'required|in:reviewed,reported', 'reviewer_notes' => 'nullable|string']);
        $alert->update(['status' => $data['status'], 'reviewer_notes' => $data['reviewer_notes'] ?? null, 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);
        return back();
    }

    public function creditBureau(Request $request)
    {
        $snapshots = MfCreditBureauSnapshot::with('generatedByUser')->orderByDesc('created_at')->get();

        return Inertia::render('Microfinance::Reports/CreditBureau', [
            'snapshots' => $snapshots,
        ]);
    }

    public function downloadCreditBureau(MfCreditBureauSnapshot $snapshot)
    {
        $path = \Illuminate\Support\Facades\Storage::path($snapshot->file_path);
        return response()->download($path, basename($snapshot->file_path));
    }

    public function generateCreditBureau(Request $request)
    {
        $data = $request->validate(['report_type' => 'required|in:equifax,transunion', 'as_of_date' => 'required|date']);

        // Collect all active/paid loans for the period
        $loans = MfLoan::with(['client'])
            ->whereIn('status', ['disbursed','current','delinquent','judicial','paid_off'])
            ->get();

        $rows = $loans->map(fn($l) => implode('|', [
            $l->client->identity_number,
            strtoupper($l->client->last_name),
            strtoupper($l->client->first_name),
            $l->loan_number,
            number_format($l->disbursed_amount ?? $l->amount_requested, 2, '.', ''),
            number_format($l->principal_balance, 2, '.', ''),
            $l->days_overdue,
            $l->status,
            $l->disbursed_at?->format('Y-m-d') ?? '',
            $l->maturity_date?->format('Y-m-d') ?? '',
        ]));

        $content   = $rows->implode("\n");
        $path = "credit_bureau/{$data['report_type']}_{$data['as_of_date']}_" . now()->format('Ymd_His') . '.txt';
        \Illuminate\Support\Facades\Storage::put($path, $content);

        MfCreditBureauSnapshot::create([
            'generated_by'  => $request->user()->id,
            'report_type'   => $data['report_type'],
            'as_of_date'    => $data['as_of_date'],
            'record_count'  => $loans->count(),
            'file_path'     => $path,
        ]);

        return back();
    }
}
