<?php

namespace Modules\Settings\Services;

use Illuminate\Support\Facades\Config;
use Modules\Settings\Models\Setting;

class MailConfigurator
{
    /**
     * Aplica los ajustes SMTP guardados en la base de datos al config
     * de Laravel en tiempo de ejecución, antes de enviar un correo.
     *
     * Si no hay SMTP configurado en la BD, deja el config del .env intacto.
     */
    public static function applyFromDatabase(): bool
    {
        $host = Setting::get('smtp_host');

        if (! $host) {
            return false; // Sin config guardada — usar .env
        }

        Config::set('mail.mailers.smtp.host',       $host);
        Config::set('mail.mailers.smtp.port',        (int) Setting::get('smtp_port', 587));
        Config::set('mail.mailers.smtp.username',    Setting::get('smtp_username', ''));
        Config::set('mail.mailers.smtp.encryption',  Setting::get('smtp_encryption', 'tls'));
        Config::set('mail.from.address',             Setting::get('smtp_from_address', ''));
        Config::set('mail.from.name',                Setting::get('smtp_from_name', config('app.name')));

        $password = Setting::get('smtp_password'); // type=encrypted
        if ($password) {
            Config::set('mail.mailers.smtp.password', $password);
        }

        Config::set('mail.default', 'smtp');

        return true;
    }
}
