<?php

namespace Modules\Contacts\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Contacts\Models\Contact;
use Modules\Contacts\Models\ContactCommunication;

class ContactCommunicationsController extends Controller
{
    public function index(Contact $contact): Response
    {
        $this->requireAdmin();

        $communications = $contact->communications()
            ->with('user')
            ->paginate(20);

        return Inertia::render('Contacts::Communications/Index', [
            'contact' => $contact,
            'communications' => $communications,
        ]);
    }

    public function create(Contact $contact): Response
    {
        $this->requireAdmin();

        return Inertia::render('Contacts::Communications/Create', [
            'contact' => $contact,
            'types' => ['call' => 'Llamada', 'email' => 'Email', 'meeting' => 'Reunión', 'note' => 'Nota'],
            'outcomes' => ['positive' => 'Positivo', 'negative' => 'Negativo', 'neutral' => 'Neutral', 'follow_up_needed' => 'Seguimiento requerido'],
        ]);
    }

    public function store(Request $request, Contact $contact): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'type' => ['required', 'in:call,email,meeting,note'],
            'subject' => ['nullable', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'communication_date' => ['required', 'datetime'],
            'outcome' => ['nullable', 'in:positive,negative,neutral,follow_up_needed'],
            'follow_up_date' => ['nullable', 'datetime', 'after:communication_date'],
            'follow_up_type' => ['nullable', 'in:call,email,meeting'],
        ]);

        $validated['user_id'] = auth()->id();

        $contact->communications()->create($validated);

        return redirect()->route('contacts.edit', $contact)
            ->with('success', 'Comunicación registrada.');
    }

    public function edit(Contact $contact, ContactCommunication $communication): Response
    {
        $this->requireAdmin();
        abort_unless($communication->contact_id === $contact->id, 404);

        return Inertia::render('Contacts::Communications/Edit', [
            'contact' => $contact,
            'communication' => $communication,
            'types' => ['call' => 'Llamada', 'email' => 'Email', 'meeting' => 'Reunión', 'note' => 'Nota'],
            'outcomes' => ['positive' => 'Positivo', 'negative' => 'Negativo', 'neutral' => 'Neutral', 'follow_up_needed' => 'Seguimiento requerido'],
        ]);
    }

    public function update(Request $request, Contact $contact, ContactCommunication $communication): RedirectResponse
    {
        $this->requireAdmin($request);
        abort_unless($communication->contact_id === $contact->id, 404);

        $validated = $request->validate([
            'type' => ['required', 'in:call,email,meeting,note'],
            'subject' => ['nullable', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'communication_date' => ['required', 'datetime'],
            'outcome' => ['nullable', 'in:positive,negative,neutral,follow_up_needed'],
            'follow_up_date' => ['nullable', 'datetime', 'after:communication_date'],
            'follow_up_type' => ['nullable', 'in:call,email,meeting'],
        ]);

        $communication->update($validated);

        return back()->with('success', 'Comunicación actualizada.');
    }

    public function destroy(Request $request, Contact $contact, ContactCommunication $communication): RedirectResponse
    {
        $this->requireAdmin($request);
        abort_unless($communication->contact_id === $contact->id, 404);

        $communication->delete();

        return back()->with('success', 'Comunicación eliminada.');
    }
}
