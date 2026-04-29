<?php

namespace Modules\Pos\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Pos\Models\FiscalDocument;
use Modules\Pos\Models\PosSale;

class FiscalIntegrationController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->input('status', 'all');

        $documents = FiscalDocument::query()
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->with('sale')
            ->orderByDesc('created_at')
            ->paginate(20)
            ->through(fn (FiscalDocument $d) => [
                'id' => $d->id,
                'pos_sale_id' => $d->pos_sale_id,
                'sale_reference' => $d->sale?->reference,
                'fiscal_number' => $d->fiscal_number,
                'authorization_code' => $d->authorization_code,
                'status' => $d->status,
                'authorized_at' => $d->authorized_at?->format('Y-m-d H:i:s'),
                'error_message' => $d->error_message,
                'created_at' => $d->created_at->format('Y-m-d H:i:s'),
            ]);

        return Inertia::render('Pos::FiscalIntegration/Index', [
            'documents' => $documents,
            'currentStatus' => $status,
            'statuses' => [
                'pending' => 'Pendientes',
                'authorized' => 'Autorizados',
                'failed' => 'Fallidos',
                'cancelled' => 'Cancelados',
            ],
        ]);
    }

    public function show(FiscalDocument $document): Response
    {
        $response = $document->sar_response ? json_decode($document->sar_response, true) : [];

        return Inertia::render('Pos::FiscalIntegration/Show', [
            'document' => [
                'id' => $document->id,
                'sale_reference' => $document->sale?->reference,
                'fiscal_number' => $document->fiscal_number,
                'authorization_code' => $document->authorization_code,
                'status' => $document->status,
                'authorized_at' => $document->authorized_at?->format('Y-m-d H:i:s'),
                'error_message' => $document->error_message,
                'created_at' => $document->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $document->updated_at->format('Y-m-d H:i:s'),
            ],
            'sarResponse' => $response,
        ]);
    }

    public function authorize(FiscalDocument $document): RedirectResponse
    {
        if ($document->status !== 'pending') {
            return back()->with('error', 'Este documento ya ha sido procesado.');
        }

        try {
            $sarService = app('Modules\Pos\Services\SarService');
            $result = $sarService->authorize($document->sale);

            if ($result['success']) {
                $document->authorize(
                    $result['fiscal_number'],
                    $result['authorization_code'],
                    $result['response'] ?? []
                );

                return back()->with('success', 'Documento autorizado correctamente.');
            } else {
                $document->fail($result['error'] ?? 'Error desconocido');
                return back()->with('error', 'No se pudo autorizar el documento: ' . $result['error']);
            }
        } catch (\Exception $e) {
            $document->fail($e->getMessage());
            return back()->with('error', 'Error al autorizar: ' . $e->getMessage());
        }
    }

    public function retry(FiscalDocument $document): RedirectResponse
    {
        $document->update(['status' => 'pending']);

        return redirect()->route('pos.fiscal.authorize', $document)
            ->with('success', 'Intento de autorización iniciado.');
    }

    public function cancel(FiscalDocument $document): RedirectResponse
    {
        if ($document->status === 'authorized') {
            return back()->with('error', 'No se puede cancelar un documento autorizado.');
        }

        $document->update(['status' => 'cancelled']);

        return back()->with('success', 'Documento cancelado.');
    }

    public function status(PosSale $sale): Response
    {
        $document = FiscalDocument::where('pos_sale_id', $sale->id)->first();

        return Inertia::render('Pos::FiscalIntegration/Status', [
            'sale_reference' => $sale->reference,
            'document' => $document ? [
                'id' => $document->id,
                'fiscal_number' => $document->fiscal_number,
                'authorization_code' => $document->authorization_code,
                'status' => $document->status,
                'authorized_at' => $document->authorized_at?->format('Y-m-d H:i:s'),
                'error_message' => $document->error_message,
            ] : null,
        ]);
    }

    public function validateCai(Request $request): Response
    {
        $validated = $request->validate([
            'cai' => ['required', 'string', 'regex:/^[A-Z0-9]{8}$/'],
        ]);

        try {
            $sarService = app('Modules\Pos\Services\SarService');
            $isValid = $sarService->validateCai($validated['cai']);

            return Inertia::render('Pos::FiscalIntegration/CaiValidation', [
                'cai' => $validated['cai'],
                'is_valid' => $isValid,
                'message' => $isValid
                    ? 'CAI válido'
                    : 'CAI inválido o expirado',
            ]);
        } catch (\Exception $e) {
            return back()->with('error', 'Error al validar CAI: ' . $e->getMessage());
        }
    }
}
