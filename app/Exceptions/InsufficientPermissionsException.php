<?php

namespace App\Exceptions;

use Exception;

class InsufficientPermissionsException extends Exception
{
    public function __construct(
        public string $requiredPermission,
        string $message = 'No cuentas con los permisos necesarios para realizar esta acción.',
    ) {
        parent::__construct($message);
    }

    public function render()
    {
        return back()->with('permission_error', [
            'title'      => 'Permiso Denegado',
            'message'    => $this->message,
            'permission' => $this->requiredPermission,
        ]);
    }
}
