<?php

namespace Modules\Contacts\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Contacts\Models\Contact;
use Modules\Contacts\Models\ContactAddress;
use Modules\Contacts\Models\ContactPerson;
use Modules\Contacts\Models\ContactTag;

class ContactsController extends Controller
{
    public function lookup(Request $request)
    {
        $this->requireAdmin($request);
        $query = $request->get('query');
        
        if (!$query || mb_strlen($query) < 2) {
            return response()->json(['contacts' => []]);
        }

        $contacts = Contact::where('active', true)
            ->where('is_client', true)
            ->where(function($q) use ($query) {
                $q->where('name', 'ilike', "%{$query}%")
                  ->orWhere('rtn', 'like', "%{$query}%")
                  ->orWhere('legal_name', 'ilike', "%{$query}%");
            })
            ->limit(10)
            ->get(['id', 'name', 'rtn']);

        return response()->json(['contacts' => $contacts]);
    }

    // ── Lista / búsqueda ──────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = Contact::withCount(['addresses', 'persons']);

        if ($search = $request->get('search')) {
            $lower = mb_strtolower($search);
            $query->where(function ($q) use ($lower, $search) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$lower}%"])
                  ->orWhereRaw('LOWER(legal_name) LIKE ?', ["%{$lower}%"])
                  ->orWhere('rtn', 'LIKE', "%{$search}%")
                  ->orWhere('dni', 'LIKE', "%{$search}%")
                  ->orWhereRaw('LOWER(email) LIKE ?', ["%{$lower}%"]);
            });
        }

        if ($type = $request->get('type')) {
            match ($type) {
                'client'   => $query->where('is_client', true),
                'supplier' => $query->where('is_supplier', true),
                'employee' => $query->where('is_employee', true),
                default    => null,
            };
        }

        if ($request->filled('active')) {
            $query->where('active', filter_var($request->get('active'), FILTER_VALIDATE_BOOLEAN));
        }

        $contacts = $query->orderBy('name')->paginate(50)->withQueryString();

        return Inertia::render('Contacts::Index', [
            'contacts' => $contacts,
            'filters'  => $request->only(['search', 'type', 'active']),
        ]);
    }

    // ── Crear ─────────────────────────────────────────────────────────────────

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Contacts::Form', ['contact' => null]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $validated = $this->validateContact($request);
        $contact   = Contact::create($validated);

        return redirect("/contacts/{$contact->id}/edit")
            ->with('success', 'Contacto creado correctamente. Ahora puedes agregar sus direcciones.');
    }

    // ── Editar ────────────────────────────────────────────────────────────────

    public function edit(Request $request, Contact $contact): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $contact->load([
            'addresses',
            'persons',
            'bankDetails',
            'paymentTerms',
            'tags',
            'communications' => fn ($q) => $q->with('user:id,name')->orderByDesc('communication_date')->limit(10),
            'documents'      => fn ($q) => $q->orderByDesc('created_at'),
            'supplierEvaluation',
        ]);

        $allTags = ContactTag::orderBy('name')->get(['id', 'name', 'color']);

        return Inertia::render('Contacts::Form', [
            'contact' => $contact,
            'allTags' => $allTags,
        ]);
    }

    public function update(Request $request, Contact $contact): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $contact->update($this->validateContact($request, $contact->id));

        return back()->with('success', 'Contacto actualizado correctamente.');
    }

    // ── Eliminar ──────────────────────────────────────────────────────────────

    public function destroy(Request $request, Contact $contact): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $contact->delete();

        return redirect('/contacts')->with('success', 'Contacto eliminado correctamente.');
    }

    // ── Direcciones ───────────────────────────────────────────────────────────

    public function storeAddress(Request $request, Contact $contact): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $validated = $this->validateAddress($request);
        $address   = $contact->addresses()->create($validated);

        if (! empty($validated['is_default'])) {
            $address->setDefault();
        }

        return back()->with('success', 'Dirección agregada.');
    }

    public function updateAddress(Request $request, Contact $contact, ContactAddress $address): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();
        abort_unless($address->contact_id === $contact->id, 404);

        $validated = $this->validateAddress($request);
        $address->update($validated);

        if (! empty($validated['is_default'])) {
            $address->setDefault();
        }

        return back()->with('success', 'Dirección actualizada.');
    }

    public function destroyAddress(Request $request, Contact $contact, ContactAddress $address): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();
        abort_unless($address->contact_id === $contact->id, 404);

        $address->delete();

        return back()->with('success', 'Dirección eliminada.');
    }

    // ── Personas de contacto ──────────────────────────────────────────────────

    public function storeContactPerson(Request $request, Contact $contact): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $validated = $this->validateContactPerson($request);
        $contact->persons()->create($validated);

        return back()->with('success', 'Persona de contacto agregada.');
    }

    public function updateContactPerson(Request $request, Contact $contact, ContactPerson $person): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();
        abort_unless($person->contact_id === $contact->id, 404);

        $person->update($this->validateContactPerson($request));

        return back()->with('success', 'Persona de contacto actualizada.');
    }

    public function destroyContactPerson(Request $request, Contact $contact, ContactPerson $person): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();
        abort_unless($person->contact_id === $contact->id, 404);

        $person->delete();

        return back()->with('success', 'Persona de contacto eliminada.');
    }

    // ── Helpers de validación ─────────────────────────────────────────────────

    private function validateContactPerson(Request $request): array
    {
        return $request->validate([
            'name'   => 'required|string|max:200',
            'role'   => 'nullable|string|max:100',
            'email'  => 'nullable|email|max:200',
            'phone'  => 'nullable|string|max:30',
            'mobile' => 'nullable|string|max:30',
            'notes'  => 'nullable|string|max:2000',
        ]);
    }

    private function validateContact(Request $request, ?int $ignoreId = null): array
    {
        $rtnRule = ['nullable', 'string', 'regex:/^\d{14}$/'];
        $dniRule = ['nullable', 'string', 'max:15'];

        if ($ignoreId) {
            $rtnRule[] = "unique:contacts,rtn,{$ignoreId}";
        } else {
            $rtnRule[] = 'unique:contacts,rtn';
        }

        return $request->validate([
            'name'        => 'required|string|max:200',
            'legal_name'  => 'nullable|string|max:200',
            'rtn'         => $rtnRule,
            'dni'         => $dniRule,
            'email'       => 'nullable|email|max:200',
            'phone'       => 'nullable|string|max:30',
            'mobile'      => 'nullable|string|max:30',
            'website'     => 'nullable|url|max:200',
            'is_client'   => 'boolean',
            'is_supplier' => 'boolean',
            'is_employee' => 'boolean',
            'notes'       => 'nullable|string|max:3000',
            'active'      => 'boolean',
        ], [
            'rtn.regex'  => 'El RTN debe tener exactamente 14 dígitos numéricos.',
            'rtn.unique' => 'Ya existe un contacto con este RTN.',
        ]);
    }

    private function validateAddress(Request $request): array
    {
        return $request->validate([
            'type'         => 'required|in:billing,delivery,other',
            'label'        => 'nullable|string|max:100',
            'address_line' => 'required|string|max:300',
            'city'         => 'nullable|string|max:100',
            'state'        => 'nullable|string|max:100',
            'country'      => 'nullable|string|max:100',
            'postal_code'  => 'nullable|string|max:20',
            'is_default'   => 'boolean',
        ]);
    }
}
