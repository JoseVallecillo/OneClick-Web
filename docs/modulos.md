# Análisis de Módulos — OneClick Web

---

## Módulo 1: AppStore
**Prioridad:** 0 (base del sistema)

### ¿Qué hace?
Es la tienda de aplicaciones del sistema. Permite instalar y desinstalar módulos adicionales desde una interfaz visual, sin tocar código ni línea de comandos.

### Funciones principales
- Lista todos los módulos disponibles con su estado (instalado / no instalado)
- Instala un módulo: lo habilita y corre sus migraciones automáticamente
- Desinstala un módulo: lo deshabilita con opción de revertir sus tablas
- Protege los módulos núcleo — no pueden desinstalarse desde la interfaz

### Reglas de negocio
- Los módulos **AppStore, Governance, Settings, Users y Subscriptions** son de núcleo y siempre aparecen instalados
- Cualquier módulo futuro que se agregue al proyecto puede gestionarse desde aquí sin modificar código

---

## Módulo 2: Governance
**Prioridad:** carga temprana

### ¿Qué hace?
Es el motor de control de acciones dentro del sistema. Define qué elementos de la interfaz requieren autorización adicional (PIN, aprobación de otro usuario) o están restringidos para ciertos roles.

### Funciones principales
- **Reglas de UI:** ocultar, deshabilitar o requerir aprobación/PIN sobre cualquier botón, campo o sección de cualquier módulo
- **Validadores de campo:** forzar que un campo específico sea requerido u opcional para un rol determinado
- Cada regla puede aplicar a todos los roles o solo a uno específico (`admin` / `user`)
- Cada regla puede vincularse a una `permission_key` del módulo de perfiles — si el usuario ya tiene ese permiso, la restricción de Governance se omite automáticamente

### Flujo
```
Regla activa en BD
  → HandleInertiaRequests la evalúa en cada request
  → Se comparte como auth.ui_rules y auth.field_validators
  → El frontend lee esos props y aplica la restricción visualmente
```

### Reglas de negocio
- Solo administradores pueden gestionar reglas
- Una regla con `permission_key` solo aplica a usuarios que **no tienen** ese permiso
- `max_pin_attempts` es opcional — sin límite si se deja vacío

---

## Módulo 3: Settings
**Prioridad:** 5

### ¿Qué hace?
Centraliza toda la configuración operativa del sistema. Cubre desde la identidad de la empresa hasta los parámetros que afectan cálculos del negocio.

### Tabs y funciones

**Empresa**
- Datos legales: nombre comercial, nombre legal, RTN, representante legal
- Logos en tres formatos: claro, oscuro y PDF (archivos PNG/JPG/SVG)
- Localización: zona horaria y formato de fecha

**Sucursales**
- CRUD de sucursales vinculadas a la empresa
- Asignación de usuarios por sucursal (relación muchos a muchos)
- Selector de sucursal activa guardado en sesión
- Middleware `SetActiveBranch`: si el usuario pertenece a una sola sucursal se asigna automáticamente; si pertenece a varias, se redirige al selector; si no pertenece a ninguna, pasa sin restricción

**Operación**
- Tasa de ISV (impuesto sobre ventas)
- **Monedas CRUD:** código, nombre, símbolo, tasa de cambio, bandera de moneda principal, estado activo/inactivo
- La moneda principal siempre tiene tasa de cambio = 1 y no puede eliminarse

**Correo (SMTP)**
- Configuración completa de servidor de correo
- Contraseña almacenada cifrada con `encrypt()`, nunca se expone en el frontend
- Botón de prueba que envía un correo real y muestra el resultado en pantalla

### Reglas de negocio
- Solo puede existir una moneda principal al mismo tiempo
- Los logos anteriores se eliminan del disco al reemplazarlos
- La sucursal activa se valida en cada request — si ya no existe en sesión, se limpia automáticamente

---

## Módulo 4: Users
**Prioridad:** 11

### ¿Qué hace?
Gestiona los usuarios del sistema y el sistema de permisos basado en perfiles JSON, sin dependencias externas (sin Spatie ni paquetes de terceros).

### Tabs y funciones

**Tab Usuarios**
- Sub-tab Admin: usuarios con rol administrador
- Sub-tab Usuario: usuarios con rol estándar
- Crear usuario: nombre, email, contraseña, rol
- Cambiar rol inline
- Asignar perfil de permisos

**Excepciones individuales**
- Cada usuario puede tener permisos adicionales o restricciones sobre su perfil base
- Los permisos se fusionan: `perfil + excepciones del usuario` — las excepciones del usuario siempre ganan

**Tab Perfiles**
- CRUD de perfiles de permisos
- Cada perfil tiene un mapa JSON de claves de permiso: `{ "ventas.crear": true, "ventas.eliminar": false }`
- Al eliminar un perfil, los usuarios asignados quedan sin perfil (no se eliminan)

### Flujo de permisos
```
Usuario tiene profile_id → carga perfil.permissions
Usuario tiene permissions propios → se fusionan con array_merge()
HasPermission("ventas.crear") → busca en el mapa fusionado
Governance evalúa si aplica la restricción basándose en ese resultado
```

### Reglas de negocio
- Un admin no puede cambiar su propio rol ni eliminarse a sí mismo
- La creación de usuarios está bloqueada si se alcanzó el `user_limit` del plan de suscripción activo
- Si no hay suscripción activa, la creación de usuarios también se bloquea

---

## Módulo 5: Subscriptions
**Prioridad:** 3

### ¿Qué hace?
Gestiona el ciclo de vida de las licencias del sistema: planes, suscripciones activas y activación mediante tokens firmados enviados por correo.

### Funciones principales

**Planes**

| Plan       | Usuarios  | Duración  |
|------------|-----------|-----------|
| Básico     | 2         | 30 días   |
| Pro        | 5         | 365 días  |
| Enterprise | Ilimitado | 365 días  |

**Generación de token**
- El admin selecciona empresa, plan, correo destino y validez del enlace
- El sistema genera un token HMAC-SHA256, revoca tokens pendientes anteriores de esa empresa y envía el correo
- El correo incluye los detalles del plan y el enlace de activación

**Activación**
- El destinatario hace clic en el enlace → ve pantalla de confirmación con detalles
- Al confirmar → suscripción anterior queda inactiva, nueva suscripción se crea
- El token se marca como `used` y no puede reutilizarse

**Historial de tokens**
- Estados: `pending` / `used` / `expired` / `revoked`
- Botón reenviar correo: reenvía el enlace sin generar un token nuevo
- Botón revocar: invalida el token pendiente

**Banner global**
- Amarillo si quedan ≤ 10 días
- Rojo si la licencia está vencida
- Visible en todas las páginas del sistema autenticado

**Expiración automática**
- `php artisan subscriptions:expire` corre cada hora
- Marca como `expired` los tokens vencidos
- Desactiva suscripciones cuyo `ends_at` ya pasó

---

## Relación entre módulos

```
Subscriptions ──► limita usuarios en ──► Users
Users ──────────► define permisos para ──► Governance
Governance ──────► controla UI de todos los módulos
Settings ──────── provee empresa/sucursal a ──► Subscriptions
HandleInertia ──► comparte auth.ui_rules, auth.subscription, auth.active_branch con ──► todos los módulos frontend
```

---

## Resumen de tablas creadas

| Tabla                       | Módulo        |
|-----------------------------|---------------|
| `profiles`                  | Users         |
| `subscription_plans`        | Subscriptions |
| `subscriptions`             | Subscriptions |
| `license_tokens`            | Subscriptions |
| `companies`                 | Settings      |
| `branches`                  | Settings      |
| `branch_user`               | Settings      |
| `settings`                  | Settings      |
| `currencies`                | Settings      |
| `ui_governance_rules`       | Governance    |
| `governance_field_validators` | Governance  |
