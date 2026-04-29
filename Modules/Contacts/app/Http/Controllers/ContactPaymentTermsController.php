<?php

namespace Modules\Contacts\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Modules\Contacts\Models\Contact;
use Modules\Contacts\Models\ContactPaymentTerm;

class ContactPaymentTermsController extends Controller
{
    public function store(Request $request, Contact $contact): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'term_name' => ['required', 'string', 'max:100'],
            'days_to_pay' => ['required', 'integer', 'min:0'],
            'is_default' => ['boolean'],
            'early_payment_discount' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_days' => ['nullable', 'integer', 'min:0'],
            'late_payment_interest' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        if ($validated['is_default'] ?? false) {
            $contact->paymentTerms()->update(['is_default' => false]);
        }

        $contact->paymentTerms()->create($validated);

        return back()->with('success', 'Término de pago agregado.');
    }

    public function update(Request $request, Contact $contact, ContactPaymentTerm $term): RedirectResponse
    {
        $this->requireAdmin($request);
        abort_unless($term->contact_id === $contact->id, 404);

        $validated = $request->validate([
            'term_name' => ['required', 'string', 'max:100'],
            'days_to_pay' => ['required', 'integer', 'min:0'],
            'is_default' => ['boolean'],
            'early_payment_discount' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_days' => ['nullable', 'integer', 'min:0'],
            'late_payment_interest' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        if ($validated['is_default'] ?? false) {
            $contact->paymentTerms()->where('id', '!=', $term->id)->update(['is_default' => false]);
        }

        $term->update($validated);

        return back()->with('success', 'Término de pago actualizado.');
    }

    public function destroy(Request $request, Contact $contact, ContactPaymentTerm $term): RedirectResponse
    {
        $this->requireAdmin($request);
        abort_unless($term->contact_id === $contact->id, 404);

        $term->delete();

        return back()->with('success', 'Término de pago eliminado.');
    }
}
