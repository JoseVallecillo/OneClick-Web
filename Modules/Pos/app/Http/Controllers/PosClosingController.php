<?php

namespace Modules\Pos\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Pos\Models\PosSession;
use Modules\Pos\Models\PosSale;

class PosClosingController extends Controller
{
    public function show(PosSession $session): Response
    {
        $this->authorize('close', $session);

        $sales = $session->sales()
            ->where('status', 'completed')
            ->get();

        $totalSales = $sales->count();
        $totalAmount = $sales->sum('total');
        $totalDiscounts = $sales->sum('discount_amount');
        $totalTax = $sales->sum('tax_amount');
        $expectedCash = $totalAmount - $totalDiscounts + $totalTax;

        return Inertia::render('Pos::Closing/Show', [
            'session' => [
                'id' => $session->id,
                'reference' => $session->reference,
                'status' => $session->status,
                'opened_at' => $session->opened_at->format('Y-m-d H:i:s'),
                'total_sales' => $totalSales,
                'total_amount' => (float) $totalAmount,
                'total_discounts' => (float) $totalDiscounts,
                'total_tax' => (float) $totalTax,
                'expected_cash' => (float) $expectedCash,
                'actual_cash_counted' => (float) ($session->actual_cash_counted ?? 0),
                'cash_difference' => (float) (($session->actual_cash_counted ?? 0) - $expectedCash),
                'closing_notes' => $session->closing_notes,
                'closed_by' => $session->closed_by,
            ],
            'sales' => $sales->map(fn (PosSale $s) => [
                'id' => $s->id,
                'reference' => $s->reference,
                'total' => (float) $s->total,
                'created_at' => $s->created_at->format('H:i:s'),
            ]),
        ]);
    }

    public function store(Request $request, PosSession $session): RedirectResponse
    {
        $this->authorize('close', $session);

        $validated = $request->validate([
            'actual_cash_counted' => ['required', 'numeric', 'min:0'],
            'closing_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $sales = $session->sales()->where('status', 'completed')->get();
        $expectedCash = $sales->sum('total');

        $session->update([
            'status' => 'closed',
            'expected_cash' => $expectedCash,
            'actual_cash_counted' => $validated['actual_cash_counted'],
            'cash_difference' => $validated['actual_cash_counted'] - $expectedCash,
            'closing_notes' => $validated['closing_notes'],
            'closed_by' => auth()->id(),
            'closed_at' => now(),
        ]);

        // Create accounting entry for the session closing
        $this->createClosingEntry($session, $expectedCash, $validated['actual_cash_counted']);

        return redirect()->route('pos.sessions.index')
            ->with('success', "Sesión {$session->reference} cerrada correctamente.");
    }

    private function createClosingEntry(PosSession $session, float $expectedCash, float $actualCash): void
    {
        try {
            $difference = $actualCash - $expectedCash;

            if (\Module::isEnabled('Accounting')) {
                $accountingService = app('Modules\Accounting\Services\AccountingService');
                $description = "Cierre de caja - Sesión {$session->reference}";

                if ($difference >= 0) {
                    $accountingService->createEntry(
                        $description,
                        1020, // Cash account
                        1520, // Over/short account
                        $difference
                    );
                } else {
                    $accountingService->createEntry(
                        $description,
                        1520, // Over/short account
                        1020, // Cash account
                        abs($difference)
                    );
                }
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to create accounting entry for session closing', [
                'session_id' => $session->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
