<?php

use Illuminate\Support\Facades\Route;
use Modules\Contacts\Http\Controllers\ContactsController;

Route::middleware(['auth', 'verified'])->group(function () {

    // Búsqueda dinámica
    Route::get('contacts/lookup', [ContactsController::class, 'lookup'])->name('contacts.lookup');

    // Lista y búsqueda
    Route::get('contacts', [ContactsController::class, 'index'])->name('contacts.index');

    // Crear
    Route::get('contacts/create', [ContactsController::class, 'create'])->name('contacts.create');
    Route::post('contacts', [ContactsController::class, 'store'])->name('contacts.store');

    // Editar
    Route::get('contacts/{contact}/edit', [ContactsController::class, 'edit'])->name('contacts.edit');
    Route::patch('contacts/{contact}', [ContactsController::class, 'update'])->name('contacts.update');

    // Eliminar
    Route::delete('contacts/{contact}', [ContactsController::class, 'destroy'])->name('contacts.destroy');

    // Direcciones
    Route::post('contacts/{contact}/addresses', [ContactsController::class, 'storeAddress'])->name('contacts.addresses.store');
    Route::patch('contacts/{contact}/addresses/{address}', [ContactsController::class, 'updateAddress'])->name('contacts.addresses.update');
    Route::delete('contacts/{contact}/addresses/{address}', [ContactsController::class, 'destroyAddress'])->name('contacts.addresses.destroy');

    // Personas de contacto
    Route::post('contacts/{contact}/persons', [ContactsController::class, 'storeContactPerson'])->name('contacts.persons.store');
    Route::patch('contacts/{contact}/persons/{person}', [ContactsController::class, 'updateContactPerson'])->name('contacts.persons.update');
    Route::delete('contacts/{contact}/persons/{person}', [ContactsController::class, 'destroyContactPerson'])->name('contacts.persons.destroy');
});
