<?php

namespace Modules\Contacts\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Contacts\Models\Contact;
use Modules\Contacts\Models\ContactTag;

class ContactTagsController extends Controller
{
    public function index(): Response
    {
        $this->requireAdmin();

        $tags = ContactTag::orderBy('name')->get();

        return Inertia::render('Contacts::Tags/Index', [
            'tags' => $tags,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:contact_tags,name'],
            'color' => ['required', 'regex:/^#[0-9A-F]{6}$/i'],
            'description' => ['nullable', 'string'],
        ]);

        ContactTag::create($validated);

        return back()->with('success', 'Etiqueta creada.');
    }

    public function update(Request $request, ContactTag $tag): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', "unique:contact_tags,name,{$tag->id}"],
            'color' => ['required', 'regex:/^#[0-9A-F]{6}$/i'],
            'description' => ['nullable', 'string'],
        ]);

        $tag->update($validated);

        return back()->with('success', 'Etiqueta actualizada.');
    }

    public function destroy(Request $request, ContactTag $tag): RedirectResponse
    {
        $this->requireAdmin($request);

        $tag->delete();

        return back()->with('success', 'Etiqueta eliminada.');
    }

    public function attachToContact(Request $request, Contact $contact): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'tag_ids' => ['required', 'array'],
            'tag_ids.*' => ['integer', 'exists:contact_tags,id'],
        ]);

        $contact->tags()->sync($validated['tag_ids']);

        return back()->with('success', 'Etiquetas actualizadas.');
    }
}
