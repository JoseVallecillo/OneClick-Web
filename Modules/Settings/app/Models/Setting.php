<?php

namespace Modules\Settings\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['group', 'key', 'value', 'type'];

    // ── Static helpers ────────────────────────────────────────────────────────

    /**
     * Read a setting by key, casting it to the correct type.
     * Returns $default if the key does not exist.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();

        if (! $setting || $setting->value === null) {
            return $default;
        }

        return match ($setting->type) {
            'boolean'   => (bool) $setting->value,
            'integer'   => (int) $setting->value,
            'encrypted' => rescue(fn () => decrypt($setting->value), $default),
            default     => $setting->value,
        };
    }

    /**
     * Persist a setting. Creates it if it doesn't exist, updates it otherwise.
     */
    public static function set(string $key, mixed $value, string $group = 'general', string $type = 'string'): void
    {
        $stored = match ($type) {
            'boolean'   => $value ? '1' : '0',
            'encrypted' => encrypt((string) $value),
            default     => (string) $value,
        };

        static::updateOrCreate(
            ['key' => $key],
            ['value' => $stored, 'group' => $group, 'type' => $type],
        );
    }

    /**
     * Return all settings for a group as key => decoded-value array.
     */
    public static function group(string $group): array
    {
        return static::where('group', $group)
            ->get()
            ->mapWithKeys(fn ($s) => [$s->key => static::get($s->key)])
            ->toArray();
    }
}
