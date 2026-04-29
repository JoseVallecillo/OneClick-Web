<?php

namespace Modules\Microfinance\app\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Microfinance\app\Models\MfCreditGroup;
use Modules\Microfinance\app\Models\MfCreditGroupMember;

class MfGroupController extends Controller
{
    public function index(Request $request)
    {
        $groups = MfCreditGroup::withCount('members')
            ->with('members.client')
            ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('group_number', 'like', "%{$s}%"))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->orderByDesc('updated_at')
            ->paginate(20)->withQueryString();

        return Inertia::render('Microfinance::Groups/Index', [
            'groups'  => $groups,
            'filters' => $request->only('search', 'status'),
        ]);
    }

    public function show(MfCreditGroup $group)
    {
        $group->load(['members.client.loans' => fn($q) => $q->whereIn('status', ['disbursed','current','delinquent'])]);

        return Inertia::render('Microfinance::Groups/Show', ['group' => $group]);
    }

    public function create()
    {
        return Inertia::render('Microfinance::Groups/Form');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'             => 'required|string|max:100',
            'meeting_day'      => 'nullable|string|max:10',
            'meeting_time'     => 'nullable|string',
            'meeting_location' => 'nullable|string|max:200',
            'advisor_id'       => 'nullable|exists:users,id',
            'blocking_threshold_days' => 'integer|min:1',
            'member_ids'       => 'required|array|min:3|max:7',
            'member_ids.*'     => 'exists:mf_clients,id',
        ]);

        $group = MfCreditGroup::create([
            'group_number'            => MfCreditGroup::generateNumber(),
            'name'                    => $data['name'],
            'meeting_day'             => $data['meeting_day'] ?? null,
            'meeting_time'            => $data['meeting_time'] ?? null,
            'meeting_location'        => $data['meeting_location'] ?? null,
            'advisor_id'              => $data['advisor_id'] ?? null,
            'blocking_threshold_days' => $data['blocking_threshold_days'] ?? 3,
            'status'                  => 'active',
        ]);

        foreach ($data['member_ids'] as $i => $clientId) {
            MfCreditGroupMember::create([
                'group_id'  => $group->id,
                'client_id' => $clientId,
                'role'      => $i === 0 ? 'president' : 'member',
                'joined_at' => now()->toDateString(),
            ]);
        }

        return redirect()->route('microfinance.groups.show', $group);
    }

    public function addMember(Request $request, MfCreditGroup $group)
    {
        $request->validate(['client_id' => 'required|exists:mf_clients,id']);

        $count = $group->members()->active()->count();
        abort_if($count >= 7, 422, 'El grupo no puede tener más de 7 miembros.');

        MfCreditGroupMember::updateOrCreate(
            ['group_id' => $group->id, 'client_id' => $request->client_id],
            ['status' => 'active', 'joined_at' => now()->toDateString(), 'left_at' => null]
        );

        return back();
    }

    public function removeMember(Request $request, MfCreditGroup $group)
    {
        $request->validate(['client_id' => 'required|exists:mf_clients,id']);

        MfCreditGroupMember::where('group_id', $group->id)
            ->where('client_id', $request->client_id)
            ->update(['status' => 'inactive', 'left_at' => now()->toDateString()]);

        $group->checkAndUpdateBlockStatus();

        return back();
    }
}
