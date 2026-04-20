<?php

namespace Modules\RealEstate\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Modules\RealEstate\Models\Property;
use Modules\RealEstate\Models\PropertyMedia;

class PropertyController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = Property::with(['agent', 'media'])->withCount('deals');

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                  ->orWhere('reference', 'ilike', "%{$search}%")
                  ->orWhere('zone', 'ilike', "%{$search}%")
                  ->orWhere('city', 'ilike', "%{$search}%");
            });
        }

        $properties = $query->orderByDesc('id')->paginate(30)->withQueryString();

        return Inertia::render('RealEstate::Properties/Index', [
            'properties' => $properties,
            'filters'    => $request->only(['search', 'type', 'status']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('RealEstate::Properties/Form');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $this->validateProperty($request);

        $property = Property::create(array_merge($data, [
            'reference'  => Property::generateReference(),
            'created_by' => Auth::id(),
        ]));

        return redirect()->route('realestate.properties.show', $property)
            ->with('success', "Propiedad {$property->reference} creada correctamente.");
    }

    public function show(Request $request, Property $property): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $property->load(['agent', 'creator', 'media', 'deals.contact']);

        return Inertia::render('RealEstate::Properties/Show', [
            'property' => $property,
        ]);
    }

    public function edit(Request $request, Property $property): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $property->load('media');

        return Inertia::render('RealEstate::Properties/Form', [
            'property' => $property,
        ]);
    }

    public function update(Request $request, Property $property): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $this->validateProperty($request);
        $property->update($data);

        return redirect()->route('realestate.properties.show', $property)
            ->with('success', "Propiedad {$property->reference} actualizada.");
    }

    public function destroy(Request $request, Property $property): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(
            $property->deals()->whereNotIn('status', ['cancelled'])->exists(),
            403,
            'No se puede eliminar una propiedad con negocios activos.'
        );

        foreach ($property->media as $media) {
            Storage::disk('public')->delete($media->path);
        }
        $property->media()->delete();
        $property->delete();

        return redirect()->route('realestate.properties.index')
            ->with('success', "Propiedad eliminada.");
    }

    public function storeMedia(Request $request, Property $property): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $request->validate([
            'files'    => ['required', 'array', 'max:20'],
            'files.*'  => ['required', 'file', 'mimes:jpeg,jpg,png,webp,mp4,mov', 'max:51200'],
            'type'     => ['required', 'in:photo,video,tour360,document'],
        ]);

        $isMain  = ! $property->media()->where('is_main', true)->exists();
        $order   = $property->media()->max('sort_order') ?? 0;

        foreach ($request->file('files') as $file) {
            $path = $file->store("realestate/properties/{$property->id}", 'public');
            PropertyMedia::create([
                'property_id' => $property->id,
                'type'        => $request->input('type', 'photo'),
                'path'        => $path,
                'sort_order'  => ++$order,
                'is_main'     => $isMain,
                'uploaded_by' => Auth::id(),
            ]);
            $isMain = false;
        }

        return back()->with('success', 'Archivos subidos correctamente.');
    }

    public function destroyMedia(Request $request, Property $property, PropertyMedia $media): RedirectResponse
    {
        $this->requireAdmin($request);
        abort_if($media->property_id !== $property->id, 404);

        Storage::disk('public')->delete($media->path);
        $wasMain = $media->is_main;
        $media->delete();

        if ($wasMain) {
            $first = $property->media()->first();
            $first?->update(['is_main' => true]);
        }

        return back()->with('success', 'Archivo eliminado.');
    }

    public function lookup(Request $request)
    {
        $search = $request->input('q', '');

        return Property::where('status', 'available')
            ->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                  ->orWhere('reference', 'ilike', "%{$search}%");
            })
            ->limit(20)
            ->get(['id', 'reference', 'title', 'type', 'sale_price', 'rent_price', 'currency']);
    }

    private function validateProperty(Request $request): array
    {
        return $request->validate([
            'type'            => ['required', 'in:apartment,house,land,commercial,office,warehouse'],
            'status'          => ['required', 'in:available,reserved,sold,rented,maintenance,inactive'],
            'title'           => ['required', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'address'         => ['nullable', 'string', 'max:500'],
            'city'            => ['nullable', 'string', 'max:100'],
            'zone'            => ['nullable', 'string', 'max:150'],
            'department'      => ['nullable', 'string', 'max:100'],
            'latitude'        => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'       => ['nullable', 'numeric', 'between:-180,180'],
            'land_area'       => ['nullable', 'numeric', 'min:0'],
            'build_area'      => ['nullable', 'numeric', 'min:0'],
            'bedrooms'        => ['nullable', 'integer', 'min:0'],
            'bathrooms'       => ['nullable', 'integer', 'min:0'],
            'parking_spots'   => ['nullable', 'integer', 'min:0'],
            'floors'          => ['nullable', 'integer', 'min:1'],
            'soil_type'       => ['nullable', 'in:residential,commercial,industrial,agricultural,mixed'],
            'has_water'       => ['boolean'],
            'has_electricity' => ['boolean'],
            'has_gas'         => ['boolean'],
            'has_internet'    => ['boolean'],
            'has_sewage'      => ['boolean'],
            'sale_price'      => ['nullable', 'numeric', 'min:0'],
            'rent_price'      => ['nullable', 'numeric', 'min:0'],
            'currency'        => ['required', 'string', 'size:3'],
            'agent_id'        => ['nullable', 'exists:users,id'],
            'notes'           => ['nullable', 'string', 'max:2000'],
        ]);
    }
}
