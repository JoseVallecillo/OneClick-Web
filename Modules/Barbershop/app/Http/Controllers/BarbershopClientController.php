<?php

namespace Modules\Barbershop\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Barbershop\Models\Barber;
use Modules\Barbershop\Models\BarbershopClient;

class BarbershopClientController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = BarbershopClient::with('preferredBarber');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('phone', 'ilike', "%{$search}%")
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
            'birthdate'           => ['nullable', 'date'],
            'preferred_style'     => ['nullable', 'string', 'max:200'],
            'notes'               => ['nullable', 'string', 'max:2000'],
            'preferred_barber_id' => ['nullable', 'exists:barbers,id'],
            'active'              => ['boolean'],
        ]);

        $client = BarbershopClient::create($data);

        return redirect()->route('barbershop.clients.show', $client)
            ->with('success', "Cliente {$client->name} creado correctamente.");
    }

    public function show(Request $request, BarbershopClient $client): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $client->load(['preferredBarber', 'appointments' => fn ($q) =>
            $q->with(['barber', 'services'])->orderByDesc('appointment_date')->limit(20)
        ]);

        return Inertia::render('Barbershop::Clients/Show', [
            'client' => $client,
        ]);
    }

    public function edit(Request $request, BarbershopClient $client): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Barbershop::Clients/Form', [
            'client'  => $client,
            'barbers' => Barber::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, BarbershopClient $client): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'                => ['required', 'string', 'max:150'],
            'phone'               => ['nullable', 'string', 'max:30'],
            'email'               => ['nullable', 'email', 'max:150'],
            'birthdate'           => ['nullable', 'date'],
            'preferred_style'     => ['nullable', 'string', 'max:200'],
            'notes'               => ['nullable', 'string', 'max:2000'],
            'preferred_barber_id' => ['nullable', 'exists:barbers,id'],
            'active'              => ['boolean'],
        ]);

        $client->update($data);

        return back()->with('success', 'Cliente actualizado correctamente.');
    }

    public function destroy(Request $request, BarbershopClient $client): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $name = $client->name;
        $client->delete();

        return redirect()->route('barbershop.clients.index')
            ->with('success', "Cliente {$name} eliminado.");
    }
}
