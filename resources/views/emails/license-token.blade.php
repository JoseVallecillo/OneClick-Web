<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activación de licencia</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 40px; }
        .logo { font-size: 22px; font-weight: bold; color: #1d1d1d; margin-bottom: 32px; }
        h1 { font-size: 20px; color: #1d1d1d; margin-bottom: 8px; }
        p { color: #555; line-height: 1.6; }
        .details { background: #f8f8f8; border-radius: 6px; padding: 16px; margin: 24px 0; }
        .details p { margin: 4px 0; font-size: 14px; }
        .btn { display: inline-block; background: #2563eb; color: #fff; text-decoration: none;
               padding: 14px 28px; border-radius: 6px; font-weight: bold; margin: 24px 0; }
        .expiry { font-size: 13px; color: #888; margin-top: 8px; }
        .footer { font-size: 12px; color: #aaa; margin-top: 40px; border-top: 1px solid #eee; padding-top: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">{{ config('app.name') }}</div>

        <h1>Tu licencia está lista para activar</h1>
        <p>Hola, se ha generado un token de activación para la siguiente licencia:</p>

        <div class="details">
            <p><strong>Empresa:</strong> {{ $licenseToken->company->commercial_name }}</p>
            <p><strong>Plan:</strong> {{ $licenseToken->plan->name }}</p>
            <p><strong>Duración:</strong> {{ $licenseToken->plan->duration_days }} días</p>
            <p><strong>Límite de usuarios:</strong>
                {{ $licenseToken->plan->user_limit ?? 'Ilimitado' }}</p>
        </div>

        <p>Haz clic en el botón para activar la licencia:</p>

        <a href="{{ $activationUrl }}" class="btn">Activar licencia</a>

        <p class="expiry">
            Este enlace expira el {{ $licenseToken->expires_at->format('d/m/Y H:i') }}.
            Si no solicitaste esta licencia, puedes ignorar este correo.
        </p>

        <div class="footer">
            {{ config('app.name') }} &mdash; Sistema de gestión
        </div>
    </div>
</body>
</html>
