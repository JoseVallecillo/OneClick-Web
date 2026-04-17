<?php

namespace Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Settings\Models\Branch;
use Modules\Settings\Models\Company;
use Modules\Settings\Models\Currency;
use Modules\Settings\Models\Setting;
use Modules\Settings\Models\TaxRate;

class SettingsController extends Controller
{
    // ── Dashboard ─────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $this->requireAdmin($request);

        $company = Company::with(['branches' => fn ($q) => $q->withCount('users')->orderBy('name')])
            ->first();

        $users = User::orderBy('name')->get(['id', 'name', 'email']);

        $currencies = Currency::orderBy('is_primary', 'desc')->orderBy('code')->get();
        $taxRates   = TaxRate::orderBy('rate')->orderBy('name')->get();

        return Inertia::render('Settings::Index', [
            'company'        => $company,
            'users'          => $users,
            'currencies'     => $currencies,
            'tax_rates'      => $taxRates,
            'operation'      => [],
            'smtp'           => [
                'host'         => Setting::get('smtp_host', ''),
                'port'         => (int) Setting::get('smtp_port', 587),
                'username'     => Setting::get('smtp_username', ''),
                'encryption'   => Setting::get('smtp_encryption', 'tls'),
                'from_address' => Setting::get('smtp_from_address', ''),
                'from_name'    => Setting::get('smtp_from_name', ''),
                // Password never sent to frontend
            ],
            'smtp_configured' => (bool) Setting::get('smtp_host'),
        ]);
    }

    // ── Branch selector ───────────────────────────────────────────────────────

    public function selectBranch(Request $request): Response
    {
        $branches = $request->user()
            ->branches()
            ->where('active', true)
            ->with('company:id,commercial_name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Settings::BranchSelector', [
            'branches' => $branches,
        ]);
    }

    public function setActiveBranch(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
        ]);

        // Verify the user actually belongs to this branch
        $belongs = $request->user()
            ->branches()
            ->where('branches.id', $validated['branch_id'])
            ->where('active', true)
            ->exists();

        abort_unless($belongs, 403, 'No tienes acceso a esta sucursal.');

        session(['active_branch_id' => $validated['branch_id']]);

        return redirect()->intended(route('dashboard'));
    }

    // ── Company ───────────────────────────────────────────────────────────────

    public function updateCompany(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'commercial_name'    => 'required|string|max:200',
            'legal_name'         => 'nullable|string|max:200',
            'tax_id'             => 'nullable|string|max:50',
            'legal_representative' => 'nullable|string|max:200',
            'currency'           => 'required|string|max:10',
            'timezone'           => 'required|string|max:60',
            'date_format'        => 'required|string|max:20',
            'logo_light'         => 'nullable|file|mimes:png,jpg,jpeg,svg|max:2048',
            'logo_dark'          => 'nullable|file|mimes:png,jpg,jpeg,svg|max:2048',
            'logo_pdf'           => 'nullable|file|mimes:png,jpg,jpeg|max:4096',
        ]);

        $company = Company::firstOrNew([]);
        $company->fill(collect($validated)->except(['logo_light', 'logo_dark', 'logo_pdf'])->toArray());

        foreach (['logo_light', 'logo_dark', 'logo_pdf'] as $field) {
            if ($request->hasFile($field)) {
                // Delete old file if exists
                if ($company->{$field}) {
                    Storage::disk('public')->delete($company->{$field});
                }
                $company->{$field} = $request->file($field)->store('logos', 'public');
            }
        }

        $company->save();

        return back()->with('success', 'Información de la empresa guardada.');
    }

    // ── Branches ──────────────────────────────────────────────────────────────

    public function storeBranch(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'name'    => 'required|string|max:150',
            'address' => 'nullable|string|max:300',
            'phone'   => 'nullable|string|max:30',
            'email'   => 'nullable|email|max:150',
            'active'  => 'boolean',
        ]);

        $company = Company::firstOrFail();
        $company->branches()->create($validated);

        return back()->with('success', 'Sucursal creada correctamente.');
    }

    public function updateBranch(Request $request, Branch $branch): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'name'    => 'required|string|max:150',
            'address' => 'nullable|string|max:300',
            'phone'   => 'nullable|string|max:30',
            'email'   => 'nullable|email|max:150',
            'active'  => 'boolean',
        ]);

        $branch->update($validated);

        return back()->with('success', 'Sucursal actualizada.');
    }

    public function deleteBranch(Request $request, Branch $branch): RedirectResponse
    {
        $this->requireAdmin($request);
        $branch->delete();

        return back()->with('success', 'Sucursal eliminada.');
    }

    public function syncBranchUsers(Request $request, Branch $branch): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'user_ids'   => 'nullable|array',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        $branch->users()->sync($validated['user_ids'] ?? []);

        return back()->with('success', 'Usuarios de la sucursal actualizados.');
    }

    // ── Operation params (legacy — kept for compatibility) ────────────────────

    public function updateOperation(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return back()->with('success', 'Parámetros guardados.');
    }

    // ── Tax rates ─────────────────────────────────────────────────────────────

    public function storeTaxRate(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $validated = $request->validate([
            'name'       => 'required|string|max:100',
            'rate'       => 'required|numeric|min:0|max:100',
            'is_default' => 'boolean',
            'active'     => 'boolean',
        ]);

        $taxRate = TaxRate::create($validated);

        if (! empty($validated['is_default'])) {
            $taxRate->setDefault();
        }

        return back()->with('success', 'Tasa de impuesto agregada.');
    }

    public function updateTaxRate(Request $request, TaxRate $taxRate): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $validated = $request->validate([
            'name'       => 'required|string|max:100',
            'rate'       => 'required|numeric|min:0|max:100',
            'is_default' => 'boolean',
            'active'     => 'boolean',
        ]);

        $taxRate->update($validated);

        if (! empty($validated['is_default'])) {
            $taxRate->setDefault();
        }

        return back()->with('success', 'Tasa de impuesto actualizada.');
    }

    public function deleteTaxRate(Request $request, TaxRate $taxRate): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        if ($taxRate->is_default) {
            return back()->withErrors(['tax_rate' => 'No puedes eliminar la tasa predeterminada.']);
        }

        $taxRate->delete();

        return back()->with('success', 'Tasa de impuesto eliminada.');
    }

    // ── Currencies ────────────────────────────────────────────────────────────

    public function storeCurrency(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $validated = $request->validate([
            'code'          => 'required|string|max:10|unique:currencies,code',
            'name'          => 'required|string|max:100',
            'symbol'        => 'required|string|max:10',
            'exchange_rate' => 'required|numeric|min:0.000001',
            'is_primary'    => 'boolean',
            'active'        => 'boolean',
        ]);

        $currency = Currency::create($validated);

        if (! empty($validated['is_primary'])) {
            $currency->setPrimary();
        }

        return back()->with('success', 'Moneda agregada correctamente.');
    }

    public function updateCurrency(Request $request, Currency $currency): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $validated = $request->validate([
            'code'          => 'required|string|max:10|unique:currencies,code,' . $currency->id,
            'name'          => 'required|string|max:100',
            'symbol'        => 'required|string|max:10',
            'exchange_rate' => 'required|numeric|min:0.000001',
            'is_primary'    => 'boolean',
            'active'        => 'boolean',
        ]);

        $currency->update($validated);

        if (! empty($validated['is_primary'])) {
            $currency->setPrimary();
        }

        return back()->with('success', 'Moneda actualizada correctamente.');
    }

    public function deleteCurrency(Request $request, Currency $currency): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        if ($currency->is_primary) {
            return back()->withErrors(['currency' => 'No puedes eliminar la moneda principal.']);
        }

        $currency->delete();

        return back()->with('success', 'Moneda eliminada.');
    }

    // ── SMTP ──────────────────────────────────────────────────────────────────

    public function updateSmtp(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $validated = $request->validate([
            'host'         => 'required|string|max:200',
            'port'         => 'required|integer|min:1|max:65535',
            'username'     => 'required|string|max:200',
            'password'     => 'nullable|string|max:500',
            'encryption'   => 'required|in:tls,ssl,none',
            'from_address' => 'required|email|max:200',
            'from_name'    => 'required|string|max:100',
        ]);

        Setting::set('smtp_host',         $validated['host'],         'smtp', 'string');
        Setting::set('smtp_port',         $validated['port'],         'smtp', 'integer');
        Setting::set('smtp_username',     $validated['username'],     'smtp', 'string');
        Setting::set('smtp_encryption',   $validated['encryption'],   'smtp', 'string');
        Setting::set('smtp_from_address', $validated['from_address'], 'smtp', 'string');
        Setting::set('smtp_from_name',    $validated['from_name'],    'smtp', 'string');

        // Only update password if a new one was provided
        if (! empty($validated['password'])) {
            Setting::set('smtp_password', $validated['password'], 'smtp', 'encrypted');
        }

        return back()->with('success', 'Configuración SMTP guardada.');
    }

    public function testSmtp(Request $request): JsonResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        if (! Setting::get('smtp_host')) {
            return response()->json(['success' => false, 'error' => 'No hay configuración SMTP guardada.']);
        }

        // Override mail config temporarily with saved settings
        config([
            'mail.default'                   => 'smtp',
            'mail.mailers.smtp.host'         => Setting::get('smtp_host'),
            'mail.mailers.smtp.port'         => Setting::get('smtp_port', 587),
            'mail.mailers.smtp.username'     => Setting::get('smtp_username'),
            'mail.mailers.smtp.password'     => Setting::get('smtp_password'),
            'mail.mailers.smtp.encryption'   => Setting::get('smtp_encryption', 'tls'),
            'mail.from.address'              => Setting::get('smtp_from_address'),
            'mail.from.name'                 => Setting::get('smtp_from_name'),
        ]);

        try {
            Mail::raw('Correo de prueba enviado desde OneClick. Si recibes este mensaje, la configuración SMTP es correcta.', function ($message) use ($request) {
                $message->to($request->user()->email, $request->user()->name)
                    ->subject('Correo de prueba — OneClick');
            });

            return response()->json(['success' => true]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()]);
        }
    }

}
