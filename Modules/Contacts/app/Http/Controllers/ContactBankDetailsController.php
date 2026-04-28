<?php

namespace Modules\Contacts\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Modules\Contacts\Models\Contact;
use Modules\Contacts\Models\ContactBankDetail;

class ContactBankDetailsController extends Controller
{
    public function store(Request $request, Contact $contact): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'bank_name' => ['required', 'string', 'max:200'],
            'account_type' => ['required', 'in:checking,savings,credit_line'],
            'account_number' => ['required', 'string', 'max:100'],
            'account_holder' => ['nullable', 'string', 'max:200'],
            'swift_code' => ['nullable', 'string', 'max:20'],
            'iban' => ['nullable', 'string', 'max:50'],
            'routing_number' => ['nullable', 'string', 'max:50'],
            'is_default' => ['boolean'],
            'active' => ['boolean'],
        ]);

        if ($validated['is_default'] ?? false) {
            $contact->bankDetails()->update(['is_default' => false]);
        }

        $contact->bankDetails()->create($validated);

        return back()->with('success', 'Información bancaria agregada.');
    }

    public function update(Request $request, Contact $contact, ContactBankDetail $bank): RedirectResponse
    {
        $this->requireAdmin($request);
        abort_unless($bank->contact_id === $contact->id, 404);

        $validated = $request->validate([
            'bank_name' => ['required', 'string', 'max:200'],
            'account_type' => ['required', 'in:checking,savings,credit_line'],
            'account_number' => ['required', 'string', 'max:100'],
            'account_holder' => ['nullable', 'string', 'max:200'],
            'swift_code' => ['nullable', 'string', 'max:20'],
            'iban' => ['nullable', 'string', 'max:50'],
            'routing_number' => ['nullable', 'string', 'max:50'],
            'is_default' => ['boolean'],
            'active' => ['boolean'],
        ]);

        if ($validated['is_default'] ?? false) {
            $contact->bankDetails()->where('id', '!=', $bank->id)->update(['is_default' => false]);
        }

        $bank->update($validated);

        return back()->with('success', 'Información bancaria actualizada.');
    }

    public function destroy(Request $request, Contact $contact, ContactBankDetail $bank): RedirectResponse
    {
        $this->requireAdmin($request);
        abort_unless($bank->contact_id === $contact->id, 404);

        $bank->delete();

        return back()->with('success', 'Información bancaria eliminada.');
    }
}
