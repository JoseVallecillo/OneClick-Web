<?php

namespace Modules\Barbershop\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Barbershop\Models\Barber;
use Modules\Barbershop\Models\BarbershopClientProfile;
use Modules\Contacts\Models\Contact;

class BarbershopClientController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = Contact::where('is_client', true)
            ->with(['barbershopProfile.preferredBarber']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('phone', 'ilike', "%{$search}%")
                  ->orWhere('mobile', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        if ($request->has('active') && $request->input('active') !== '') {
            $query->where('active', filter_var($request->input('active'), FILTER_VALIDATE_BOOLEAN));
        }

        $clients = $query->orderBy('name')->paginate(50)->withQueryString();

        return Inertia::render('Barbershop::Clients/Index', [
            'clients' => $clients,
            'filters' => $request->only(['search', 'active']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Barbershop::Clients/Form', [
            'client'  => null,
            'profile' => null,
            'barbers' => Barber::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'                => ['required', 'string', 'max:150'],
            'phone'               => ['nullable', 'string', 'max:30'],
            'email'               => ['nullable', 'email', 'max:150'],
            'notes'               => ['nullable', 'string', 'max:2000'],
            'active'              => ['boolean'],
            'preferred_style'     => ['nullable', 'string', 'max:200'],
            'preferred_barber_id' => ['nullable', 'exists:barbers,id'],
        ]);

        $client = DB::transaction(function () use ($data) {
            $contact = Contact::create([
                'name'      => $data['name'],
                'phone'     => $data['phone'] ?? null,
                'email'     => $data['email'] ?? null,
                'notes'     => $data['notes'] ?? null,
                'is_client' => true,
                'active'    => $data['active'] ?? true,
            ]);

            BarbershopClientProfile::create([
                'contact_id'          => $contact->id,
                'preferred_barber_id' => $data['preferred_barber_id'] ?? null,
                'preferred_style'     => $data['preferred_style'] ?? null,
            ]);

            return $contact;
        });

        return redirect()->route('barbershop.clients.show', $client)
            ->with('success', "Cliente {$client->name} creado correctamente.");
    }

    public function show(Request $request, Contact $client): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $client->load('barbershopProfile.preferredBarber');

        $appointments = \Modules\Barbershop\Models\Appointment::with(['barber', 'services'])
            ->where('client_id', $client->id)
            ->orderByDesc('appointment_date')
            ->limit(20)
            ->get();

        return Inertia::render('Barbershop::Clients/Show', [
            'client'       => $client,
            'appointments' => $appointments,
        ]);
    }

    public function edit(Request $request, Contact $client): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $client->load('barbershopProfile');

        return Inertia::render('Barbershop::Clients/Form', [
            'client'  => $client,
            'profile' => $client->barbershopProfile,
            'barbers' => Barber::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Contact $client): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'                => ['required', 'string', 'max:150'],
            'phone'               => ['nullable', 'string', 'max:30'],
            'email'               => ['nullable', 'email', 'max:150'],
            'notes'               => ['nullable', 'string', 'max:2000'],
            'active'              => ['boolean'],
            'preferred_style'     => ['nullable', 'string', 'max:200'],
            'preferred_barber_id' => ['nullable', 'exists:barbers,id'],
        ]);

        DB::transaction(function () use ($client, $data) {
            $client->update([
                'name'   => $data['name'],
                'phone'  => $data['phone'] ?? null,
                'email'  => $data['email'] ?? null,
                'notes'  => $data['notes'] ?? null,
                'active' => $data['active'] ?? true,
            ]);

            BarbershopClientProfile::updateOrCreate(
                ['contact_id' => $client->id],
                [
                    'preferred_barber_id' => $data['preferred_barber_id'] ?? null,
                    'preferred_style'     => $data['preferred_style'] ?? null,
                ]
            );
        });

        return back()->with('success', 'Cliente actualizado correctamente.');
    }

    public function destroy(Request $request, Contact $client): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $name = $client->name;
        // Only remove barbershop profile; Contact stays in system for other modules
        $client->barbershopProfile?->delete();

        return redirect()->route('barbershop.clients.index')
            ->with('success', "Perfil de barbería de {$name} eliminado.");
    }
}
