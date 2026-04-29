<?php

namespace Modules\Barbershop\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Barbershop\Models\Appointment;
use Modules\Barbershop\Models\AppointmentProduct;
use Modules\Barbershop\Models\AppointmentService;
use Modules\Barbershop\Models\Barber;
use Modules\Barbershop\Models\BarbershopClientProfile;
use Modules\Barbershop\Models\BarbershopServiceConfig;
use Modules\Contacts\Models\Contact;
use Modules\Inventory\Models\Product;

class AppointmentController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = Appointment::with(['barber', 'client', 'services'])
            ->withCount('services');

        if ($date = $request->input('date')) {
            $query->where('appointment_date', $date);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($barberId = $request->input('barber_id')) {
            $query->where('barber_id', $barberId);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('client_name', 'ilike', "%{$search}%")
                  ->orWhere('reference', 'ilike', "%{$search}%")
                  ->orWhere('client_phone', 'ilike', "%{$search}%");
            });
        }

        $appointments = $query->orderBy('appointment_date', 'desc')
            ->orderBy('start_time')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('Barbershop::Appointments/Index', [
            'appointments' => $appointments,
            'barbers'      => Barber::active()->orderBy('name')->get(['id', 'name', 'color']),
            'filters'      => $request->only(['date', 'status', 'barber_id', 'search']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Barbershop::Appointments/Form', [
            'appointment' => null,
            'barbers'     => Barber::active()->with('schedules')->orderBy('name')->get(),
            'services'    => BarbershopServiceConfig::where('active', true)->with('product:id,name,price')->get()->map(fn ($cfg) => ['id' => $cfg->product_id, 'name' => $cfg->product->name, 'price' => (float) $cfg->product->price, 'duration_minutes' => $cfg->duration_minutes, 'category' => null]),
            'clients'     => Contact::where('is_client', true)->where('active', true)->with('barbershopProfile')->orderBy('name')->get(['id', 'name', 'phone', 'mobile']),
            'products'    => Product::where('active', true)->orderBy('name')->get(['id', 'name', 'price']),
            'defaultDate' => $request->input('date', today()->toDateString()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'client_id'        => ['nullable', 'exists:barbershop_clients,id'],
            'client_name'      => ['required', 'string', 'max:150'],
            'client_phone'     => ['nullable', 'string', 'max:30'],
            'barber_id'        => ['nullable', 'exists:barbers,id'],
            'appointment_date' => ['required', 'date'],
            'start_time'       => ['required', 'date_format:H:i'],
            'end_time'         => ['required', 'date_format:H:i', 'after:start_time'],
            'status'           => ['required', 'in:pending,confirmed,in_progress,completed,cancelled,no_show'],
            'source'           => ['required', 'in:manual,walk_in,online'],
            'notes'            => ['nullable', 'string', 'max:2000'],
            'internal_notes'   => ['nullable', 'string', 'max:2000'],
            'discount'         => ['nullable', 'numeric', 'min:0'],
            'payment_method'   => ['nullable', 'string', 'max:30'],
            'payment_status'   => ['required', 'in:pending,paid,partial,refunded'],
            'services'         => ['nullable', 'array'],
            'services.*.service_id'       => ['nullable', 'exists:products,id'],
            'services.*.service_name'     => ['required_with:services', 'string', 'max:150'],
            'services.*.duration_minutes' => ['required_with:services', 'integer', 'min:1'],
            'services.*.price'            => ['required_with:services', 'numeric', 'min:0'],
            'products'         => ['nullable', 'array'],
            'products.*.product_id'   => ['nullable', 'exists:products,id'],
            'products.*.product_name' => ['required_with:products', 'string', 'max:200'],
            'products.*.quantity'     => ['required_with:products', 'numeric', 'min:0.01'],
            'products.*.unit_price'   => ['required_with:products', 'numeric', 'min:0'],
        ]);

        $appointment = DB::transaction(function () use ($data) {
            $apt = Appointment::create([
                'reference'        => Appointment::generateReference(),
                'client_id'        => $data['client_id'] ?? null,
                'client_name'      => $data['client_name'],
                'client_phone'     => $data['client_phone'] ?? null,
                'barber_id'        => $data['barber_id'] ?? null,
                'appointment_date' => $data['appointment_date'],
                'start_time'       => $data['start_time'],
                'end_time'         => $data['end_time'],
                'status'           => $data['status'],
                'source'           => $data['source'],
                'notes'            => $data['notes'] ?? null,
                'internal_notes'   => $data['internal_notes'] ?? null,
                'discount'         => $data['discount'] ?? 0,
                'payment_method'   => $data['payment_method'] ?? null,
                'payment_status'   => $data['payment_status'],
                'subtotal'         => 0,
                'total'            => 0,
            ]);

            foreach ($data['services'] ?? [] as $svc) {
                AppointmentService::create([
                    'appointment_id'   => $apt->id,
                    'service_id'       => $svc['service_id'] ?? null,
                    'service_name'     => $svc['service_name'],
                    'duration_minutes' => $svc['duration_minutes'],
                    'price'            => $svc['price'],
                ]);
            }

            foreach ($data['products'] ?? [] as $prd) {
                AppointmentProduct::create([
                    'appointment_id' => $apt->id,
                    'product_id'     => $prd['product_id'] ?? null,
                    'product_name'   => $prd['product_name'],
                    'quantity'       => $prd['quantity'],
                    'unit_price'     => $prd['unit_price'],
                    'total'          => $prd['quantity'] * $prd['unit_price'],
                ]);
            }

            $apt->recalculateTotals();

            if ($apt->status === 'completed' && $apt->client_id) {
                BarbershopClientProfile::where('contact_id', $apt->client_id)->first()?->refreshStats();
            }

            if ($apt->status === 'in_progress') {
                $apt->update(['checked_in_at' => now()]);
            }

            if ($apt->status === 'completed') {
                $apt->update(['completed_at' => now()]);
            }

            return $apt;
        });

        return redirect()->route('barbershop.appointments.show', $appointment)
            ->with('success', "Cita {$appointment->reference} creada correctamente.");
    }

    public function show(Request $request, Appointment $appointment): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $appointment->load(['barber', 'client.barbershopProfile', 'services.service', 'products.product']);

        return Inertia::render('Barbershop::Appointments/Show', [
            'appointment' => $appointment,
        ]);
    }

    public function edit(Request $request, Appointment $appointment): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $appointment->isEditable(), 403, 'Solo se pueden editar citas pendientes o confirmadas.');

        $appointment->load(['services', 'products']);

        return Inertia::render('Barbershop::Appointments/Form', [
            'appointment' => $appointment,
            'barbers'     => Barber::active()->with('schedules')->orderBy('name')->get(),
            'services'    => BarbershopServiceConfig::where('active', true)->with('product:id,name,price')->get()->map(fn ($cfg) => ['id' => $cfg->product_id, 'name' => $cfg->product->name, 'price' => (float) $cfg->product->price, 'duration_minutes' => $cfg->duration_minutes, 'category' => null]),
            'clients'     => Contact::where('is_client', true)->where('active', true)->with('barbershopProfile')->orderBy('name')->get(['id', 'name', 'phone', 'mobile']),
            'products'    => Product::where('active', true)->orderBy('name')->get(['id', 'name', 'price']),
            'defaultDate' => $appointment->appointment_date->toDateString(),
        ]);
    }

    public function update(Request $request, Appointment $appointment): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'client_id'        => ['nullable', 'exists:barbershop_clients,id'],
            'client_name'      => ['required', 'string', 'max:150'],
            'client_phone'     => ['nullable', 'string', 'max:30'],
            'barber_id'        => ['nullable', 'exists:barbers,id'],
            'appointment_date' => ['required', 'date'],
            'start_time'       => ['required', 'date_format:H:i'],
            'end_time'         => ['required', 'date_format:H:i', 'after:start_time'],
            'status'           => ['required', 'in:pending,confirmed,in_progress,completed,cancelled,no_show'],
            'source'           => ['required', 'in:manual,walk_in,online'],
            'notes'            => ['nullable', 'string', 'max:2000'],
            'internal_notes'   => ['nullable', 'string', 'max:2000'],
            'discount'         => ['nullable', 'numeric', 'min:0'],
            'payment_method'   => ['nullable', 'string', 'max:30'],
            'payment_status'   => ['required', 'in:pending,paid,partial,refunded'],
            'services'         => ['nullable', 'array'],
            'services.*.service_id'       => ['nullable', 'exists:products,id'],
            'services.*.service_name'     => ['required_with:services', 'string', 'max:150'],
            'services.*.duration_minutes' => ['required_with:services', 'integer', 'min:1'],
            'services.*.price'            => ['required_with:services', 'numeric', 'min:0'],
            'products'         => ['nullable', 'array'],
            'products.*.product_id'   => ['nullable', 'exists:products,id'],
            'products.*.product_name' => ['required_with:products', 'string', 'max:200'],
            'products.*.quantity'     => ['required_with:products', 'numeric', 'min:0.01'],
            'products.*.unit_price'   => ['required_with:products', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($appointment, $data) {
            $wasCompleted = $appointment->isCompleted();

            $appointment->update([
                'client_id'        => $data['client_id'] ?? null,
                'client_name'      => $data['client_name'],
                'client_phone'     => $data['client_phone'] ?? null,
                'barber_id'        => $data['barber_id'] ?? null,
                'appointment_date' => $data['appointment_date'],
                'start_time'       => $data['start_time'],
                'end_time'         => $data['end_time'],
                'status'           => $data['status'],
                'source'           => $data['source'],
                'notes'            => $data['notes'] ?? null,
                'internal_notes'   => $data['internal_notes'] ?? null,
                'discount'         => $data['discount'] ?? 0,
                'payment_method'   => $data['payment_method'] ?? null,
                'payment_status'   => $data['payment_status'],
            ]);

            if (!$wasCompleted && $appointment->isCompleted()) {
                $appointment->update(['completed_at' => now()]);
            }

            if ($data['status'] === 'in_progress' && !$appointment->checked_in_at) {
                $appointment->update(['checked_in_at' => now()]);
            }

            if (in_array($data['status'], ['cancelled', 'no_show']) && !$appointment->cancelled_at) {
                $appointment->update(['cancelled_at' => now()]);
            }

            $appointment->services()->delete();
            foreach ($data['services'] ?? [] as $svc) {
                AppointmentService::create([
                    'appointment_id'   => $appointment->id,
                    'service_id'       => $svc['service_id'] ?? null,
                    'service_name'     => $svc['service_name'],
                    'duration_minutes' => $svc['duration_minutes'],
                    'price'            => $svc['price'],
                ]);
            }

            $appointment->products()->delete();
            foreach ($data['products'] ?? [] as $prd) {
                AppointmentProduct::create([
                    'appointment_id' => $appointment->id,
                    'product_id'     => $prd['product_id'] ?? null,
                    'product_name'   => $prd['product_name'],
                    'quantity'       => $prd['quantity'],
                    'unit_price'     => $prd['unit_price'],
                    'total'          => $prd['quantity'] * $prd['unit_price'],
                ]);
            }

            $appointment->recalculateTotals();

            if ($appointment->client_id) {
                BarbershopClientProfile::where('contact_id', $appointment->client_id)->first()?->refreshStats();
            }
        });

        return redirect()->route('barbershop.appointments.show', $appointment)
            ->with('success', 'Cita actualizada correctamente.');
    }

    public function destroy(Request $request, Appointment $appointment): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $ref = $appointment->reference;
        $appointment->delete();

        return redirect()->route('barbershop.appointments.index')
            ->with('success', "Cita {$ref} eliminada.");
    }

    public function updateStatus(Request $request, Appointment $appointment): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'status'         => ['required', 'in:pending,confirmed,in_progress,completed,cancelled,no_show'],
            'payment_method' => ['nullable', 'string', 'max:30'],
            'payment_status' => ['nullable', 'in:pending,paid,partial,refunded'],
        ]);

        $updates = ['status' => $data['status']];

        if ($data['status'] === 'in_progress' && !$appointment->checked_in_at) {
            $updates['checked_in_at'] = now();
        }

        if ($data['status'] === 'completed') {
            $updates['completed_at']   = now();
            $updates['payment_method'] = $data['payment_method'] ?? $appointment->payment_method;
            $updates['payment_status'] = $data['payment_status'] ?? 'paid';
        }

        if (in_array($data['status'], ['cancelled', 'no_show'])) {
            $updates['cancelled_at'] = now();
        }

        $appointment->update($updates);

        if ($appointment->isCompleted() && $appointment->client_id) {
            BarbershopClientProfile::where('contact_id', $appointment->client_id)->first()?->refreshStats();
        }

        return back()->with('success', 'Estado de cita actualizado.');
    }
}
