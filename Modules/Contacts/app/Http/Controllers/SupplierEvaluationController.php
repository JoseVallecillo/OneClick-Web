<?php

namespace Modules\Contacts\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Contacts\Models\Contact;
use Modules\Contacts\Models\SupplierEvaluation;

class SupplierEvaluationController extends Controller
{
    public function create(Contact $contact): Response
    {
        $this->requireAdmin();
        abort_unless($contact->is_supplier, 403);

        $evaluation = $contact->supplierEvaluation;

        return Inertia::render('Contacts::Suppliers/Evaluation', [
            'contact' => $contact,
            'evaluation' => $evaluation ? [
                'id' => $evaluation->id,
                'quality_rating' => $evaluation->quality_rating,
                'delivery_rating' => $evaluation->delivery_rating,
                'communication_rating' => $evaluation->communication_rating,
                'price_rating' => $evaluation->price_rating,
                'on_time_delivery_percent' => (float) $evaluation->on_time_delivery_percent,
                'defect_rate' => (float) $evaluation->defect_rate,
                'average_delivery_days' => $evaluation->average_delivery_days,
                'last_evaluation_date' => $evaluation->last_evaluation_date?->format('Y-m-d'),
                'notes' => $evaluation->notes,
                'overall_rating' => $evaluation->overallRating(),
            ] : null,
        ]);
    }

    public function store(Request $request, Contact $contact): RedirectResponse
    {
        $this->requireAdmin($request);
        abort_unless($contact->is_supplier, 403);

        $validated = $request->validate([
            'quality_rating' => ['required', 'integer', 'min:1', 'max:5'],
            'delivery_rating' => ['required', 'integer', 'min:1', 'max:5'],
            'communication_rating' => ['required', 'integer', 'min:1', 'max:5'],
            'price_rating' => ['required', 'integer', 'min:1', 'max:5'],
            'on_time_delivery_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'defect_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'average_delivery_days' => ['nullable', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['last_evaluation_date'] = now();

        $contact->supplierEvaluation()->updateOrCreate(
            ['contact_id' => $contact->id],
            $validated
        );

        return redirect()->route('contacts.edit', $contact)
            ->with('success', 'Evaluación del proveedor guardada.');
    }
}
