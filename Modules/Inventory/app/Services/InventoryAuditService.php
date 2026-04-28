<?php

namespace Modules\Inventory\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Modules\Inventory\Models\InventoryAuditLog;

class InventoryAuditService
{
    public static function log(
        string $entityType,
        ?int $entityId,
        string $action,
        ?User $user,
        ?float $quantityChange = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $reason = null,
        ?Request $request = null,
    ): void {
        InventoryAuditLog::create([
            'entity_type'    => $entityType,
            'entity_id'      => $entityId,
            'action'         => $action,
            'user_id'        => $user?->id,
            'quantity_change' => $quantityChange,
            'old_values'     => $oldValues,
            'new_values'     => $newValues,
            'reason'         => $reason,
            'ip_address'     => $request?->ip(),
            'created_at'     => now(),
        ]);
    }

    public static function logProductCreated(array $product, User $user, Request $request): void
    {
        self::log(
            'product',
            null,
            'create',
            $user,
            null,
            null,
            [
                'sku'       => $product['sku'],
                'name'      => $product['name'],
                'type'      => $product['type'],
                'category'  => $product['category_id'],
            ],
            null,
            $request,
        );
    }

    public static function logProductUpdated($productId, array $oldValues, array $newValues, User $user, Request $request): void
    {
        self::log(
            'product',
            $productId,
            'update',
            $user,
            null,
            $oldValues,
            $newValues,
            null,
            $request,
        );
    }

    public static function logStockAdjustment(
        $productId,
        float $quantityChange,
        ?int $warehouseId,
        string $reason,
        User $user,
        Request $request,
    ): void {
        self::log(
            'stock',
            $productId,
            'adjust_stock',
            $user,
            $quantityChange,
            ['warehouse_id' => $warehouseId],
            null,
            $reason,
            $request,
        );
    }

    public static function logTransfer(
        $transferId,
        array $details,
        User $user,
        Request $request,
    ): void {
        self::log(
            'transfer',
            $transferId,
            'transfer',
            $user,
            null,
            null,
            $details,
            null,
            $request,
        );
    }

    public static function logStockCountAdjustment(
        $productId,
        float $expectedQty,
        float $countedQty,
        User $user,
        Request $request,
    ): void {
        self::log(
            'stock',
            $productId,
            'physical_count',
            $user,
            $countedQty - $expectedQty,
            ['expected' => $expectedQty],
            ['actual' => $countedQty],
            'Physical count adjustment',
            $request,
        );
    }
}
