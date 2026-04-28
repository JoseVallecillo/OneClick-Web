<?php

namespace Modules\Contacts\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Contacts\Models\Contact;
use Modules\Contacts\Models\ContactDuplicateSuspect;

class ContactDuplicateController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin();

        $status = $request->input('status', 'pending');

        $duplicates = ContactDuplicateSuspect::query()
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->with('contact1', 'contact2', 'mergedInto')
            ->orderByDesc('similarity_score')
            ->paginate(20)
            ->through(fn (ContactDuplicateSuspect $d) => [
                'id' => $d->id,
                'contact_1_name' => $d->contact1->name,
                'contact_1_rtn' => $d->contact1->rtn,
                'contact_2_name' => $d->contact2->name,
                'contact_2_rtn' => $d->contact2->rtn,
                'similarity_score' => (float) $d->similarity_score,
                'match_fields' => $d->match_fields,
                'status' => $d->status,
                'merged_into_name' => $d->mergedInto?->name,
            ]);

        return Inertia::render('Contacts::Duplicates/Index', [
            'duplicates' => $duplicates,
            'currentStatus' => $status,
            'statuses' => ['pending' => 'Pendientes', 'merged' => 'Fusionados', 'dismissed' => 'Descartados', 'all' => 'Todos'],
        ]);
    }

    public function scan(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);

        $contacts = Contact::all();
        $duplicates = 0;

        foreach ($contacts as $contact1) {
            foreach ($contacts as $contact2) {
                if ($contact1->id >= $contact2->id) continue;

                $score = $this->calculateSimilarity($contact1, $contact2);

                if ($score >= 75) {
                    ContactDuplicateSuspect::updateOrCreate(
                        ['contact_id_1' => $contact1->id, 'contact_id_2' => $contact2->id],
                        ['similarity_score' => $score, 'status' => 'pending']
                    );
                    $duplicates++;
                }
            }
        }

        return back()->with('success', "Se encontraron {$duplicates} posibles duplicados.");
    }

    public function merge(Request $request, ContactDuplicateSuspect $duplicate): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'keep_id' => ['required', 'in:' . $duplicate->contact_id_1 . ',' . $duplicate->contact_id_2],
            'merge_id' => ['required', 'in:' . $duplicate->contact_id_1 . ',' . $duplicate->contact_id_2],
        ]);

        $keep = Contact::find($validated['keep_id']);
        $merge = Contact::find($validated['merge_id']);

        // Consolidar datos
        $keep->update([
            'total_purchases' => ($keep->total_purchases ?? 0) + ($merge->total_purchases ?? 0),
            'outstanding_balance' => ($keep->outstanding_balance ?? 0) + ($merge->outstanding_balance ?? 0),
        ]);

        // Reasignar relaciones
        $merge->addresses()->update(['contact_id' => $keep->id]);
        $merge->persons()->update(['contact_id' => $keep->id]);
        $merge->paymentTerms()->update(['contact_id' => $keep->id]);
        $merge->bankDetails()->update(['contact_id' => $keep->id]);
        $merge->communications()->update(['contact_id' => $keep->id]);
        $merge->documents()->update(['contact_id' => $keep->id]);
        $merge->tags()->sync($keep->tags()->pluck('id')->merge($merge->tags()->pluck('id'))->unique());

        // Marcar como fusionado y eliminar
        $duplicate->update([
            'status' => 'merged',
            'merged_into_id' => $keep->id,
            'reviewed_at' => now(),
            'reviewed_by' => auth()->id(),
        ]);

        $merge->delete();

        return redirect()->route('contacts.duplicates.index')
            ->with('success', "Contactos fusionados correctamente. {$merge->name} fue eliminado.");
    }

    public function dismiss(Request $request, ContactDuplicateSuspect $duplicate): RedirectResponse
    {
        $this->requireAdmin($request);

        $duplicate->update([
            'status' => 'dismissed',
            'reviewed_at' => now(),
            'reviewed_by' => auth()->id(),
        ]);

        return back()->with('success', 'Duplicado descartado.');
    }

    private function calculateSimilarity(Contact $c1, Contact $c2): float
    {
        $matches = 0;
        $total = 0;

        $fields = ['name', 'rtn', 'dni', 'email', 'phone'];

        foreach ($fields as $field) {
            $total++;
            if ($c1->$field && $c2->$field && strtolower($c1->$field) === strtolower($c2->$field)) {
                $matches++;
            }
        }

        return ($matches / $total) * 100;
    }
}
