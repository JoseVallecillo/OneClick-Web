<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    /**
     * Sube un archivo a un directorio específico en el disco public.
     */
    public function upload(Request $request)
    {
        $this->requireAdmin($request);

        $request->validate([
            'file'   => ['required', 'image', 'max:5120'], // 5MB max
            'folder' => ['nullable', 'string', 'max:50'],
        ]);

        $file   = $request->file('file');
        $folder = $request->input('folder', 'uploads');
        
        // Generar nombre único para evitar colisiones
        $filename = Str::random(30) . '.' . $file->getClientOriginalExtension();
        
        // Guardar en storage/app/public/{folder}
        $path = $file->storeAs($folder, $filename, 'public');

        return response()->json([
            'path' => $path,
            'url'  => Storage::disk('public')->url($path),
        ]);
    }
}
