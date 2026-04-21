<?php

namespace Modules\RealEstate\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Contacts\Models\Contact;
use Modules\RealEstate\Models\CondoFee;
use Modules\RealEstate\Models\Property;

class CondoFeeController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = CondoFee::with(['property', 'contact', 'creator']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($propertyId = $request->input('property_id')) {
            $query->where('property_id', $propertyId);
        }
        if ($year = $request->input('year')) {
            $query->where('period_year', $year);
        }
        if ($month = $request->input('month')) {
            $query->where('period_month', $month);
        }

        // Auto-mark overdue
        CondoFee::where('status', 'pending')
            ->where('due_date', '<', now()->toDateString())
            ->update(['status' => 'overdue']);

        $fees       = $query->orderByDesc('id')->paginate(40)->withQueryString();
        $properties = Property::orderBy('title')->get(['id', 'reference', 'title']);
        $contacts   = Contact::where('active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('RealEstate::CondoFees/Index', [
            'fees'       => $fees,
            'properties' => $properties,
            'contacts'   => $contacts,
            'filters'    => $request->only(['status', 'property_id', 'year', 'month']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'property_id'  => ['required', 'exists:re_properties,id'],
            'contact_id'   => ['required', 'exists:contacts,id'],
            'period_year'  => ['required', 'integer', 'min:2000', 'max:2100'],
            'period_month' => ['required', 'integer', 'min:1', 'max:12'],
            'amount'       => ['required', 'numeric', 'min:0'],
            'due_date'     => ['required', 'date'],
            'notes'        => ['nullable', 'string', 'max:500'],
        ]);

        $exists = CondoFee::where('property_id', $data['property_id'])
            ->where('period_year', $data['period_year'])
            ->where('period_month', $data['period_month'])
            ->exists();

        abort_if($exists, 422, 'Ya existe una cuota para este período y propiedad.');

        CondoFee::create(array_merge($data, [
            'reference'  => CondoFee::generateReference(),
            'status'     => 'pending',
            'created_by' => Auth::id(),
        ]));

        return back()->with('success', 'Cuota de mantenimiento creada.');
    }

    public function pay(Request $request, CondoFee $fee): RedirectResponse
    {
        $this->requireAdmin($request);

        abort_if($fee->status === 'paid', 422, 'Esta cuota ya fue pagada.');

        $data = $request->validate([
            'payment_reference' => ['required', 'string', 'max:100'],
            'invoice_number'    => ['nullable', 'string', 'max:100'],
        ]);

        $fee->update(array_merge($data, [
            'status'      => 'paid',
            'paid_at'     => now(),
            'recorded_by' => Auth::id(),
        ]));

        return back()->with('success', "Cuota {$fee->reference} pagada.");
    }
}
