<?php

namespace Modules\Contacts\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Contacts\Models\Contact;
use Modules\Contacts\Models\ContactDocument;

class ContactDocumentsController extends Controller
{
    public function index(Contact $contact): Response
    {
        $this->requireAdmin();

        $documents = $contact->documents()
            ->with('uploadedBy')
            ->orderByDesc('created_at')
            ->paginate(20);

        return Inertia::render('Contacts::Documents/Index', [
            'contact' => $contact,
            'documents' => $documents,
        ]);
    }

    public function store(Request $request, Contact $contact): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'document_type' => ['required', 'in:contract,invoice,quote,agreement'],
            'document_name' => ['required', 'string', 'max:300'],
            'document_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date', 'after:document_date'],
            'file' => ['required', 'file', 'max:10240'],
            'notes' => ['nullable', 'string'],
        ]);

        $file = $request->file('file');
        $path = $file->store("contacts/{$contact->id}", 'private');

        $contact->documents()->create([
            'document_type' => $validated['document_type'],
            'document_name' => $validated['document_name'],
            'file_path' => $path,
            'file_type' => $file->getClientOriginalExtension(),
            'file_size' => $file->getSize(),
            'document_date' => $validated['document_date'],
            'expiry_date' => $validated['expiry_date'],
            'notes' => $validated['notes'],
            'uploaded_by' => auth()->id(),
        ]);

        return back()->with('success', 'Documento agregado.');
    }

    public function download(Contact $contact, ContactDocument $document)
    {
        abort_unless($document->contact_id === $contact->id, 404);

        return Storage::disk('private')->download($document->file_path, $document->document_name);
    }

    public function destroy(Request $request, Contact $contact, ContactDocument $document): RedirectResponse
    {
        $this->requireAdmin($request);
        abort_unless($document->contact_id === $contact->id, 404);

        Storage::disk('private')->delete($document->file_path);
        $document->delete();

        return back()->with('success', 'Documento eliminado.');
    }
}
