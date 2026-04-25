<?php

namespace Modules\Barbershop\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Barbershop\Models\BarbershopServiceCategory;

class BarbershopConfigController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Barbershop::Config/Index', [
            'categories' => BarbershopServiceCategory::orderBy('name')->get(),
        ]);
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'  => ['required', 'string', 'max:100'],
            'color' => ['required', 'string', 'size:7'],
        ]);

        BarbershopServiceCategory::create($data);

        return back()->with('success', "Categoría \"{$data['name']}\" creada.");
    }

    public function updateCategory(Request $request, BarbershopServiceCategory $category): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'   => ['required', 'string', 'max:100'],
            'color'  => ['required', 'string', 'size:7'],
            'active' => ['boolean'],
        ]);

        $category->update($data);

        return back()->with('success', 'Categoría actualizada.');
    }

    public function destroyCategory(Request $request, BarbershopServiceCategory $category): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $name = $category->name;
        $category->delete();

        return back()->with('success', "Categoría \"{$name}\" eliminada.");
    }
}
