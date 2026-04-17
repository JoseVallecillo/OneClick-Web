<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\CaiConfig;
use Modules\Accounting\Models\Journal;

class CaiConfigController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $configs = CaiConfig::with('journal')
            ->orderByDesc('expires_at')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('Accounting::CaiConfig/Index', [
            'configs' => $configs,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::CaiConfig/Form', [
            'journals' => Journal::where('active', true)->where('type', 'sales')->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'cai'                => ['required', 'string', 'max:50', 'unique:account_cai_configs,cai'],
            'range_from'         => ['required', 'string', 'max:20'],
            'range_to'           => ['required', 'string', 'max:20'],
            'expires_at'         => ['required', 'date', 'after:today'],
            'journal_id'         => ['required', 'exists:account_journals,id'],
            'establishment_code' => ['nullable', 'string', 'max:10'],
            'terminal_code'      => ['nullable', 'string', 'max:10'],
            'active'             => ['boolean'],
        ]);

        $config = CaiConfig::create($data);

        return redirect()->route('accounting.cai.index')
            ->with('success', "CAI {$config->cai} registrado correctamente.");
    }

    public function show(Request $request, CaiConfig $caiConfig): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $caiConfig->load('journal');

        return Inertia::render('Accounting::CaiConfig/Show', [
            'config' => $caiConfig,
        ]);
    }

    public function edit(Request $request, CaiConfig $caiConfig): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::CaiConfig/Form', [
            'config'   => $caiConfig->load('journal'),
            'journals' => Journal::where('active', true)->where('type', 'sales')->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function update(Request $request, CaiConfig $caiConfig): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'cai'                => ['required', 'string', 'max:50', "unique:account_cai_configs,cai,{$caiConfig->id}"],
            'range_from'         => ['required', 'string', 'max:20'],
            'range_to'           => ['required', 'string', 'max:20'],
            'expires_at'         => ['required', 'date'],
            'journal_id'         => ['required', 'exists:account_journals,id'],
            'establishment_code' => ['nullable', 'string', 'max:10'],
            'terminal_code'      => ['nullable', 'string', 'max:10'],
            'active'             => ['boolean'],
        ]);

        $caiConfig->update($data);

        return redirect()->route('accounting.cai.index')
            ->with('success', "CAI actualizado correctamente.");
    }
}
