<?php

namespace Modules\Hospitality\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Hospitality\Models\RoomType;

class RoomTypeController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);

        $types = RoomType::withCount('rooms')->orderBy('name')->get();

        return Inertia::render('Hospitality::RoomTypes/Index', [
            'types' => $types,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);

        return Inertia::render('Hospitality::RoomTypes/Form');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'name'            => ['required', 'string', 'max:100'],
            'base_price'      => ['required', 'numeric', 'min:0'],
            'capacity_adults' => ['required', 'integer', 'min:1'],
            'capacity_kids'   => ['required', 'integer', 'min:0'],
        ]);

        RoomType::create($data);

        return redirect()->route('hospitality.room-types.index')
            ->with('success', "Tipo de habitación {$data['name']} creado.");
    }

    public function edit(Request $request, RoomType $roomType): Response
    {
        $this->requireAdmin($request);

        return Inertia::render('Hospitality::RoomTypes/Form', [
            'roomType' => $roomType,
        ]);
    }

    public function update(Request $request, RoomType $roomType): RedirectResponse
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'name'            => ['required', 'string', 'max:100'],
            'base_price'      => ['required', 'numeric', 'min:0'],
            'capacity_adults' => ['required', 'integer', 'min:1'],
            'capacity_kids'   => ['required', 'integer', 'min:0'],
        ]);

        $roomType->update($data);

        return redirect()->route('hospitality.room-types.index')
            ->with('success', "Tipo {$roomType->name} actualizado.");
    }

    public function destroy(Request $request, RoomType $roomType): RedirectResponse
    {
        $this->requireAdmin($request);

        if ($roomType->rooms()->exists()) {
            return back()->withErrors(['roomType' => 'No puedes eliminar un tipo que tiene habitaciones asignadas.']);
        }

        $roomType->delete();

        return redirect()->route('hospitality.room-types.index')
            ->with('success', 'Tipo de habitación eliminado.');
    }
}
