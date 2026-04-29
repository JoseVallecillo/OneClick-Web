<?php

namespace Modules\Microfinance\app\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Microfinance\app\Models\MfCollectionRoute;
use Modules\Microfinance\app\Models\MfCollectionRouteStop;
use Modules\Microfinance\app\Models\MfLoan;
use Modules\Microfinance\app\Models\MfLoanSchedule;
use Modules\Microfinance\app\Models\MfPaymentPromise;

class MfCollectionController extends Controller
{
    public function route(Request $request)
    {
        $advisorId = $request->advisor_id ?? $request->user()->id;
        $date      = $request->date ?? now()->toDateString();

        // Auto-build route if not exists
        $route = MfCollectionRoute::firstOrCreate(
            ['advisor_id' => $advisorId, 'route_date' => $date, 'zone' => $request->zone ?? 'default'],
            ['status' => 'pending']
        );

        if ($route->total_stops === 0) {
            $this->buildRoute($route, $advisorId, $date);
            $route->refresh();
        }

        $route->load(['stops.client', 'stops.loan.product']);

        return Inertia::render('Microfinance::Collection/Route', [
            'route'    => $route,
            'date'     => $date,
            'advisorId' => $advisorId,
        ]);
    }

    private function buildRoute(MfCollectionRoute $route, int $advisorId, string $date): void
    {
        $dueLoans = MfLoanSchedule::where('due_date', $date)
            ->whereIn('status', ['pending', 'overdue', 'partial'])
            ->whereHas('loan', fn($q) => $q->where('advisor_id', $advisorId)
                ->whereIn('status', ['disbursed','current','delinquent']))
            ->with(['loan.client'])
            ->get();

        // Also add overdue loans not due today
        $overdueLoans = MfLoan::where('advisor_id', $advisorId)
            ->where('days_overdue', '>', 0)
            ->whereIn('status', ['delinquent'])
            ->whereNotIn('id', $dueLoans->pluck('loan_id'))
            ->with('client')
            ->get();

        $stops = [];
        $order = 1;

        foreach ($dueLoans as $row) {
            $stops[] = [
                'route_id'        => $route->id,
                'loan_id'         => $row->loan_id,
                'client_id'       => $row->loan->client_id,
                'sort_order'      => $order++,
                'amount_due'      => $row->total_due,
                'days_overdue'    => $row->loan->days_overdue,
                'latitude'        => $row->loan->client->latitude,
                'longitude'       => $row->loan->client->longitude,
                'status'          => 'pending',
                'created_at'      => now(),
                'updated_at'      => now(),
            ];
        }

        foreach ($overdueLoans as $loan) {
            $stops[] = [
                'route_id'        => $route->id,
                'loan_id'         => $loan->id,
                'client_id'       => $loan->client_id,
                'sort_order'      => $order++,
                'amount_due'      => $loan->total_balance,
                'days_overdue'    => $loan->days_overdue,
                'latitude'        => $loan->client->latitude,
                'longitude'       => $loan->client->longitude,
                'status'          => 'pending',
                'created_at'      => now(),
                'updated_at'      => now(),
            ];
        }

        if (!empty($stops)) {
            MfCollectionRouteStop::insert($stops);
        }

        $route->update([
            'total_stops'     => count($stops),
            'expected_amount' => array_sum(array_column($stops, 'amount_due')),
        ]);
    }

    public function updateStop(Request $request, MfCollectionRouteStop $stop)
    {
        $data = $request->validate([
            'status'           => 'required|in:collected,promise,not_found,partial',
            'collected_amount' => 'nullable|numeric|min:0',
            'notes'            => 'nullable|string',
        ]);

        $stop->update([...$data, 'visited_at' => now()]);

        $route = $stop->route;
        $route->increment('visited_stops');
        $route->increment('collected_amount', $data['collected_amount'] ?? 0);

        if ($route->visited_stops >= $route->total_stops) {
            $route->update(['status' => 'completed']);
        }

        return back();
    }

    public function promises(Request $request)
    {
        $promises = MfPaymentPromise::with(['client', 'loan.product'])
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->orderBy('promise_date')
            ->paginate(25)->withQueryString();

        return Inertia::render('Microfinance::Collection/Promises', [
            'promises' => $promises,
            'filters'  => $request->only('status'),
        ]);
    }

    public function storePromise(Request $request)
    {
        $data = $request->validate([
            'loan_id'          => 'required|exists:mf_loans,id',
            'promise_date'     => 'required|date',
            'promised_amount'  => 'required|numeric|min:1',
            'contact_channel'  => 'in:field,phone,whatsapp',
            'notes'            => 'nullable|string',
        ]);

        $loan = MfLoan::findOrFail($data['loan_id']);
        MfPaymentPromise::create([...$data, 'client_id' => $loan->client_id, 'registered_by' => $request->user()->id]);

        return back();
    }

    public function markPromise(Request $request, MfPaymentPromise $promise)
    {
        $request->validate(['status' => 'required|in:kept,broken,partial', 'paid_amount' => 'nullable|numeric|min:0']);
        $promise->update([
            'status'      => $request->status,
            'paid_amount' => $request->paid_amount ?? 0,
            'paid_date'   => $request->status !== 'broken' ? now()->toDateString() : null,
        ]);
        return back();
    }
}
