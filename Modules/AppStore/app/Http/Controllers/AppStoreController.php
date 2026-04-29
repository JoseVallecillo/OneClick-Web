<?php

namespace Modules\AppStore\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Inertia\Response;
use Nwidart\Modules\Facades\Module;

class AppStoreController extends Controller
{
    /**
     * Módulos que forman el núcleo del sistema.
     * Siempre aparecen instalados y no pueden desinstalarse.
     */
    private const CORE_MODULES = [
        'AppStore',
        'Governance',
        'Settings',
        'Users',
        'Subscriptions',
    ];

    public function index(): Response
    {
        $modules = collect(Module::all())->map(function ($module) {
            return [
                'name'        => $module->getName(),
                'alias'       => $module->get('alias', $module->getLowerName()),
                'description' => $module->getDescription(),
                'isEnabled'   => $module->isEnabled(),
                'isCore'      => in_array($module->getName(), self::CORE_MODULES, true),
            ];
        })->values();

        return Inertia::render('AppStore::Index', [
            'modules' => $modules,
        ]);
    }

    public function install(string $module): RedirectResponse
    {
        $mod = Module::findOrFail($module);
        $mod->enable();

        Artisan::call('module:migrate', [
            'module'  => $module,
            '--force' => true,
        ]);

        return back()->with('success', "Módulo {$module} instalado correctamente.");
    }

    public function uninstall(Request $request, string $module): RedirectResponse
    {
        if (in_array($module, self::CORE_MODULES, true)) {
            return back()->with('error', "El módulo {$module} es parte del núcleo del sistema y no puede desinstalarse.");
        }

        $mod = Module::findOrFail($module);

        if ($request->boolean('rollback')) {
            Artisan::call('module:migrate-rollback', [
                'module'  => $module,
                '--force' => true,
            ]);
        }

        $mod->disable();

        return back()->with('success', "Módulo {$module} desinstalado correctamente.");
    }
}
