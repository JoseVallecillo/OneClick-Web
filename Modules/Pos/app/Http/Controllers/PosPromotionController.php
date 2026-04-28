<?php

namespace Modules\Pos\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Pos\Models\PosPromotion;
use Modules\Inventory\Models\Product;

class PosPromotionController extends Controller
{
    public function index(Request $request): Response
    {
        $promotions = PosPromotion::query()
            ->orderByDesc('valid_from')
            ->paginate(15)
            ->through(fn (PosPromotion $p) => [
                'id' => $p->id,
                'code' => $p->code,
                'name' => $p->name,
                'type' => $p->type,
                'discount_value' => (float) $p->discount_value,
                'valid_from' => $p->valid_from->format('Y-m-d'),
                'valid_to' => $p->valid_to?->format('Y-m-d'),
                'max_uses' => $p->max_uses,
                'current_uses' => $p->current_uses,
                'active' => $p->active,
                'is_active' => $p->isActive(),
                'can_use' => $p->canUse(),
            ]);

        return Inertia::render('Pos::Promotions/Index', [
            'promotions' => $promotions,
        ]);
    }

    public function create(): Response
    {
        $this->requireAdmin();
        $this->requireSubscription();

        $products = Product::where('active', true)
            ->orderBy('name')
            ->get(['id', 'sku', 'name'])
            ->toArray();

        return Inertia::render('Pos::Promotions/Create', [
            'products' => $products,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin();
        $this->requireSubscription();

        $data = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:pos_promotions,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'in:fixed,percentage,bogo'],
            'discount_value' => ['required', 'numeric', 'min:0'],
            'valid_from' => ['required', 'date'],
            'valid_to' => ['nullable', 'date', 'after:valid_from'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'active' => ['boolean'],
            'products' => ['array'],
            'products.*' => ['integer', 'exists:products,id'],
        ]);

        $products = $data['products'] ?? [];
        unset($data['products']);

        $promotion = PosPromotion::create($data);
        $promotion->products()->sync($products);

        return redirect()->route('pos.promotions.index')
            ->with('success', "Promoción {$promotion->code} creada.");
    }

    public function edit(PosPromotion $promotion): Response
    {
        $this->requireAdmin();
        $this->requireSubscription();

        $products = Product::where('active', true)
            ->orderBy('name')
            ->get(['id', 'sku', 'name'])
            ->toArray();

        $selectedProducts = $promotion->products()->pluck('id')->toArray();

        return Inertia::render('Pos::Promotions/Edit', [
            'promotion' => [
                'id' => $promotion->id,
                'code' => $promotion->code,
                'name' => $promotion->name,
                'description' => $promotion->description,
                'type' => $promotion->type,
                'discount_value' => (float) $promotion->discount_value,
                'valid_from' => $promotion->valid_from->format('Y-m-d'),
                'valid_to' => $promotion->valid_to?->format('Y-m-d'),
                'max_uses' => $promotion->max_uses,
                'current_uses' => $promotion->current_uses,
                'active' => $promotion->active,
            ],
            'products' => $products,
            'selectedProducts' => $selectedProducts,
        ]);
    }

    public function update(Request $request, PosPromotion $promotion): RedirectResponse
    {
        $this->requireAdmin();
        $this->requireSubscription();

        $data = $request->validate([
            'code' => ['required', 'string', 'max:50', "unique:pos_promotions,code,{$promotion->id}"],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'in:fixed,percentage,bogo'],
            'discount_value' => ['required', 'numeric', 'min:0'],
            'valid_from' => ['required', 'date'],
            'valid_to' => ['nullable', 'date', 'after:valid_from'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'active' => ['boolean'],
            'products' => ['array'],
            'products.*' => ['integer', 'exists:products,id'],
        ]);

        $products = $data['products'] ?? [];
        unset($data['products']);

        $promotion->update($data);
        $promotion->products()->sync($products);

        return redirect()->route('pos.promotions.index')
            ->with('success', "Promoción {$promotion->code} actualizada.");
    }

    public function destroy(PosPromotion $promotion): RedirectResponse
    {
        $this->requireAdmin();
        $this->requireSubscription();

        $code = $promotion->code;
        $promotion->delete();

        return redirect()->route('pos.promotions.index')
            ->with('success', "Promoción {$code} eliminada.");
    }

    public function toggle(PosPromotion $promotion): RedirectResponse
    {
        $this->requireAdmin();
        $this->requireSubscription();

        $promotion->update(['active' => !$promotion->active]);

        $status = $promotion->active ? 'activada' : 'desactivada';
        return back()->with('success', "Promoción {$status}.");
    }
}
