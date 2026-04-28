<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Models\Product;
use Modules\Inventory\Models\ProductCategory;
use Modules\Inventory\Models\ProductPrice;
use Modules\Inventory\Models\ProductRecipeLine;
use Modules\Inventory\Models\UnitOfMeasure;
use Modules\Accounting\Models\Tax;
use Modules\Inventory\Services\InventoryAuditService;
use Modules\Inventory\Services\InventoryPermissionService;

class ProductController extends Controller
{
    public function lookup(Request $request)
    {
        $this->requireAdmin($request);
        $query = $request->get('query');

        if (!$query || mb_strlen($query) < 2) {
            return response()->json(['products' => []]);
        }

        $products = Product::where('active', true)
            ->whereIn('type', ['storable', 'service', 'consumable'])
            ->where(function($q) use ($query) {
                $q->where('name', 'ilike', "%{$query}%")
                  ->orWhere('sku', 'like', "%{$query}%");
            })
            ->with('uom:id,abbreviation')
            ->limit(15)
            ->get(['id', 'sku', 'name', 'price', 'uom_id']);

        return response()->json(['products' => $products]);
    }

    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = Product::with(['category', 'uom', 'taxRate'])
            ->withSum('stockQuantities as total_stock', 'quantity')
            ->withSum('stockQuantities as total_reserved', 'reserved_quantity');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($categoryId = $request->input('category_id')) {
            $query->where('category_id', $categoryId);
        }

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($request->has('active') && $request->input('active') !== null && $request->input('active') !== '') {
            $query->where('active', filter_var($request->input('active'), FILTER_VALIDATE_BOOLEAN));
        }

        $products = $query->orderBy('name')->paginate(50)->withQueryString();

        return Inertia::render('Inventory::Products/Index', [
            'products'   => $products,
            'categories' => ProductCategory::active()->orderBy('name')->get(),
            'filters'    => $request->only(['search', 'category_id', 'type', 'active']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Inventory::Products/Form', [
            'product'     => null,
            'categories'  => ProductCategory::where('active', true)->orderBy('name')->get(),
            'uoms'        => UnitOfMeasure::where('active', true)->orderBy('name')->get(),
            'taxRates'    => Tax::where('active', true)->whereIn('tax_scope', ['sales', 'all'])->orderBy('name')->get(['id', 'name', 'code', 'type', 'rate']),
            'ingredients' => Product::where('active', true)->orderBy('name')->with('uom:id,abbreviation')->get(['id', 'name', 'sku', 'uom_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();
        InventoryPermissionService::ensurePermission($request->user(), 'inventory.products.create');

        $request->merge([
            'category_id' => $request->category_id === '__none__' ? null : $request->category_id,
            'uom_id'      => $request->uom_id === '__none__' ? null : $request->uom_id,
            'tax_rate_id' => $request->tax_rate_id === '__none__' ? null : $request->tax_rate_id,
        ]);

        $data = $request->validate([
            'sku'         => ['required', 'string', 'max:100', 'unique:products,sku'],
            'name'        => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category_id' => ['required', 'exists:product_categories,id'],
            'uom_id'      => ['required_unless:type,service', 'nullable', 'exists:units_of_measure,id'],
            'tax_rate_id' => ['nullable', 'exists:account_taxes,id'],
            'type'        => ['required', 'in:storable,service,consumable'],
            'tracking'    => ['required', 'in:none,lot,serial'],
            'valuation'   => ['required', 'in:average,fifo'],
            'cost'        => ['required', 'numeric', 'min:0'],
            'price'       => ['required', 'numeric', 'min:0'],
            'min_stock'   => ['numeric', 'min:0'],
            'image_path'  => ['nullable', 'string', 'max:500'],
            'active'      => ['boolean'],
            'has_recipe'  => ['boolean'],
            'recipe'      => ['nullable', 'array'],
            'recipe.*.ingredient_id' => ['required_with:recipe', 'exists:products,id'],
            'recipe.*.qty'           => ['required_with:recipe', 'numeric', 'min:0.001'],
            'extra_prices'           => ['nullable', 'array'],
            'extra_prices.*.name'    => ['required_with:extra_prices', 'string', 'max:100'],
            'extra_prices.*.price'   => ['required_with:extra_prices', 'numeric', 'min:0'],
        ]);

        $product = Product::create($data);

        $this->syncRecipe($product, $data);
        $this->syncPrices($product, $data);

        InventoryAuditService::logProductCreated($data, $request->user(), $request);

        return redirect()->route('inventory.products.create')
            ->with('success', "Producto '{$product->name}' creado correctamente. Puedes agregar otro.");
    }

    public function edit(Request $request, Product $product): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $product->load(['recipeLines.ingredient:id,name,sku', 'prices']);

        return Inertia::render('Inventory::Products/Form', [
            'product'     => $product,
            'categories'  => ProductCategory::where('active', true)->orderBy('name')->get(),
            'uoms'        => UnitOfMeasure::where('active', true)->orderBy('name')->get(),
            'taxRates'    => Tax::where('active', true)->whereIn('tax_scope', ['sales', 'all'])->orderBy('name')->get(['id', 'name', 'code', 'type', 'rate']),
            'ingredients' => Product::where('active', true)->where('id', '!=', $product->id)->orderBy('name')->with('uom:id,abbreviation')->get(['id', 'name', 'sku', 'uom_id']),
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $request->merge([
            'category_id' => $request->category_id === '__none__' ? null : $request->category_id,
            'uom_id'      => $request->uom_id === '__none__' ? null : $request->uom_id,
            'tax_rate_id' => $request->tax_rate_id === '__none__' ? null : $request->tax_rate_id,
        ]);

        $data = $request->validate([
            'sku'         => ['required', 'string', 'max:100', "unique:products,sku,{$product->id}"],
            'name'        => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category_id' => ['required', 'exists:product_categories,id'],
            'uom_id'      => ['required_unless:type,service', 'nullable', 'exists:units_of_measure,id'],
            'tax_rate_id' => ['nullable', 'exists:account_taxes,id'],
            'type'        => ['required', 'in:storable,service,consumable'],
            'tracking'    => ['required', 'in:none,lot,serial'],
            'valuation'   => ['required', 'in:average,fifo'],
            'cost'        => ['required', 'numeric', 'min:0'],
            'price'       => ['required', 'numeric', 'min:0'],
            'min_stock'   => ['numeric', 'min:0'],
            'image_path'  => ['nullable', 'string', 'max:500'],
            'active'      => ['boolean'],
            'has_recipe'  => ['boolean'],
            'recipe'      => ['nullable', 'array'],
            'recipe.*.ingredient_id' => ['required_with:recipe', 'exists:products,id'],
            'recipe.*.qty'           => ['required_with:recipe', 'numeric', 'min:0.001'],
            'extra_prices'           => ['nullable', 'array'],
            'extra_prices.*.name'    => ['required_with:extra_prices', 'string', 'max:100'],
            'extra_prices.*.price'   => ['required_with:extra_prices', 'numeric', 'min:0'],
        ]);

        $product->update($data);

        $this->syncRecipe($product, $data);
        $this->syncPrices($product, $data);

        return back()->with('success', 'Producto actualizado correctamente.');
    }

    private function syncPrices(Product $product, array $data): void
    {
        $product->prices()->delete();

        foreach ($data['extra_prices'] ?? [] as $row) {
            if (empty($row['name'])) continue;
            ProductPrice::create([
                'product_id' => $product->id,
                'name'       => $row['name'],
                'price'      => $row['price'],
            ]);
        }
    }

    private function syncRecipe(Product $product, array $data): void
    {
        $product->recipeLines()->delete();

        if (! empty($data['has_recipe'])) {
            foreach ($data['recipe'] ?? [] as $line) {
                if (empty($line['ingredient_id'])) continue;
                ProductRecipeLine::create([
                    'product_id'    => $product->id,
                    'ingredient_id' => $line['ingredient_id'],
                    'qty'           => $line['qty'],
                ]);
            }
        }
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $product->delete();

        return redirect()->route('inventory.products.index')
            ->with('success', 'Product deleted successfully.');
    }
}
