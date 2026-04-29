<?php

namespace Modules\Microfinance\app\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Modules\Microfinance\app\Models\MfClient;
use Modules\Microfinance\app\Models\MfClientBusinessSnapshot;

class MfClientController extends Controller
{
    public function index(Request $request)
    {
        $query = MfClient::query()
            ->with(['groupMemberships.group'])
            ->when($request->search, fn($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%{$s}%")
                  ->orWhere('last_name', 'like', "%{$s}%")
                  ->orWhere('identity_number', 'like', "%{$s}%")
                  ->orWhere('client_number', 'like', "%{$s}%");
            }))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->advisor_id, fn($q, $id) => $q->where('advisor_id', $id))
            ->orderByDesc('updated_at');

        return Inertia::render('Microfinance::Clients/Index', [
            'clients' => $query->paginate(25)->withQueryString(),
            'filters' => $request->only('search', 'status', 'advisor_id'),
            'summary' => [
                'total'      => MfClient::count(),
                'active'     => MfClient::where('status', 'active')->count(),
                'prospect'   => MfClient::where('status', 'prospect')->count(),
                'blacklisted' => MfClient::where('status', 'blacklisted')->count(),
            ],
        ]);
    }

    public function show(MfClient $client)
    {
        $client->load([
            'documents', 'references', 'snapshots',
            'groupMemberships.group',
            'loans.product',
            'loans' => fn($q) => $q->orderByDesc('created_at'),
        ]);

        return Inertia::render('Microfinance::Clients/Show', [
            'client' => $client,
        ]);
    }

    public function create()
    {
        return Inertia::render('Microfinance::Clients/Form');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name'             => 'required|string|max:80',
            'last_name'              => 'required|string|max:80',
            'identity_number'        => 'required|string|max:20|unique:mf_clients,identity_number',
            'birth_date'             => 'nullable|date',
            'gender'                 => 'in:M,F',
            'phone_mobile'           => 'nullable|string|max:20',
            'phone_whatsapp'         => 'nullable|string|max:20',
            'email'                  => 'nullable|email|max:120',
            'address'                => 'nullable|string',
            'latitude'               => 'nullable|numeric',
            'longitude'              => 'nullable|numeric',
            'business_name'          => 'nullable|string|max:120',
            'business_type'          => 'nullable|string|max:60',
            'business_years'         => 'nullable|integer|min:0',
            'monthly_revenue'        => 'nullable|numeric|min:0',
            'monthly_expenses'       => 'nullable|numeric|min:0',
            'monthly_payment_capacity' => 'nullable|numeric|min:0',
            'advisor_id'             => 'nullable|exists:users,id',
            'notes'                  => 'nullable|string',
        ]);

        $data['client_number']      = MfClient::generateNumber();
        $data['monthly_net_income'] = ($data['monthly_revenue'] ?? 0) - ($data['monthly_expenses'] ?? 0);

        $client = MfClient::create($data);
        $client->recalculateScore();

        return redirect()->route('microfinance.clients.show', $client);
    }

    public function edit(MfClient $client)
    {
        return Inertia::render('Microfinance::Clients/Form', ['client' => $client, 'isEdit' => true]);
    }

    public function update(Request $request, MfClient $client)
    {
        $data = $request->validate([
            'first_name'        => 'required|string|max:80',
            'last_name'         => 'required|string|max:80',
            'phone_mobile'      => 'nullable|string|max:20',
            'phone_whatsapp'    => 'nullable|string|max:20',
            'email'             => 'nullable|email',
            'address'           => 'nullable|string',
            'latitude'          => 'nullable|numeric',
            'longitude'         => 'nullable|numeric',
            'business_name'     => 'nullable|string|max:120',
            'business_type'     => 'nullable|string|max:60',
            'business_years'    => 'nullable|integer|min:0',
            'monthly_revenue'   => 'nullable|numeric|min:0',
            'monthly_expenses'  => 'nullable|numeric|min:0',
            'monthly_payment_capacity' => 'nullable|numeric|min:0',
            'advisor_id'        => 'nullable|exists:users,id',
            'notes'             => 'nullable|string',
        ]);

        $data['monthly_net_income'] = ($data['monthly_revenue'] ?? 0) - ($data['monthly_expenses'] ?? 0);
        $client->update($data);
        $client->recalculateScore();

        return redirect()->route('microfinance.clients.show', $client);
    }

    public function storeSnapshot(Request $request, MfClient $client)
    {
        $data = $request->validate([
            'latitude'                   => 'nullable|numeric',
            'longitude'                  => 'nullable|numeric',
            'inventory_value'            => 'nullable|numeric|min:0',
            'daily_sales_estimated'      => 'nullable|numeric|min:0',
            'monthly_expenses_verified'  => 'nullable|numeric|min:0',
            'monthly_net_estimated'      => 'nullable|numeric|min:0',
            'observations'               => 'nullable|string',
            'photos'                     => 'nullable|array',
        ]);

        $data['client_id']    = $client->id;
        $data['captured_by']  = $request->user()->id;
        MfClientBusinessSnapshot::create($data);

        // Update client with latest verified figures
        $client->update([
            'monthly_net_income'       => $data['monthly_net_estimated'] ?? $client->monthly_net_income,
            'monthly_expenses'         => $data['monthly_expenses_verified'] ?? $client->monthly_expenses,
            'latitude'                 => $data['latitude'] ?? $client->latitude,
            'longitude'                => $data['longitude'] ?? $client->longitude,
        ]);

        $client->recalculateScore();

        return back();
    }

    public function lookup(Request $request)
    {
        $term = $request->q;
        return response()->json(
            MfClient::where('status', 'active')
                ->where(function ($q) use ($term) {
                    $q->where('first_name', 'like', "%{$term}%")
                      ->orWhere('last_name', 'like', "%{$term}%")
                      ->orWhere('identity_number', 'like', "%{$term}%")
                      ->orWhere('client_number', 'like', "%{$term}%");
                })
                ->select('id', 'client_number', 'first_name', 'last_name', 'internal_score', 'monthly_payment_capacity', 'completed_cycles')
                ->limit(10)
                ->get()
        );
    }
}
