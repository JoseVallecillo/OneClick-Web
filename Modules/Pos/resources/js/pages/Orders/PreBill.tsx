import { Head } from '@inertiajs/react';

interface OrderLine {
    id: number;
    product: { name: string; sku: string };
    qty: string;
    unit_price: string;
    tax_rate: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    notes: string | null;
}

interface PosOrder {
    id: number;
    reference: string;
    opened_at: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    notes: string | null;
    waiter: { name: string } | null;
    table: { number: number; section: string } | null;
    session: {
        reference: string;
        warehouse: { name: string };
        currency: { symbol: string; code: string };
    };
    creator: { name: string } | null;
    lines: OrderLine[];
}

interface Props { order: PosOrder }

function fmtNum(v: number) {
    return v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PreBill({ order }: Props) {
    const sym = order.session.currency.symbol;

    const subtotal   = parseFloat(order.subtotal || '0');
    const taxTotal   = parseFloat(order.tax_amount || '0');
    const grandTotal = parseFloat(order.total || '0');

    return (
        <>
            <Head title={`Pre-cuenta ${order.reference}`} />

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { margin: 0; font-family: 'Courier New', monospace; }
                }
                body { font-family: 'Courier New', monospace; background: #fff; color: #000; }
            `}</style>

            <div className="mx-auto max-w-sm p-6 text-sm" style={{ fontFamily: "'Courier New', monospace" }}>
                {/* Print button */}
                <div className="no-print mb-4 flex justify-end gap-2">
                    <button
                        onClick={() => window.print()}
                        className="rounded border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium hover:bg-gray-50"
                    >
                        Imprimir
                    </button>
                    <button
                        onClick={() => window.close()}
                        className="rounded border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium hover:bg-gray-50"
                    >
                        Cerrar
                    </button>
                </div>

                {/* Header */}
                <div className="text-center mb-4">
                    <div className="text-lg font-bold tracking-widest">PRE-CUENTA</div>
                    <div className="text-xs text-gray-500 mt-1">(No es un comprobante fiscal)</div>
                    <div className="mt-2 border-t border-dashed border-gray-400 pt-2">
                        <div className="font-bold">{order.reference}</div>
                        {order.table && (
                            <div className="text-xs">Mesa {order.table.number} — {order.table.section}</div>
                        )}
                        {order.waiter && (
                            <div className="text-xs">Mesero: {order.waiter.name}</div>
                        )}
                        <div className="text-xs text-gray-500">
                            {new Date(order.opened_at).toLocaleString('es-HN', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                            })}
                        </div>
                    </div>
                </div>

                {/* Lines */}
                <div className="border-t border-dashed border-gray-400 pt-2 mb-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                        <span className="flex-1">Descripción</span>
                        <span className="w-10 text-right">Cant</span>
                        <span className="w-16 text-right">P.Unit</span>
                        <span className="w-16 text-right">Total</span>
                    </div>
                    {order.lines.map(line => (
                        <div key={line.id} className="flex justify-between text-xs py-0.5">
                            <span className="flex-1 truncate pr-1">{line.product.name}</span>
                            <span className="w-10 text-right tabular-nums">{parseFloat(line.qty).toFixed(0)}</span>
                            <span className="w-16 text-right tabular-nums">{fmtNum(parseFloat(line.unit_price))}</span>
                            <span className="w-16 text-right tabular-nums">{fmtNum(parseFloat(line.total))}</span>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="border-t border-dashed border-gray-400 pt-2 space-y-0.5">
                    <div className="flex justify-between text-xs">
                        <span>Subtotal</span>
                        <span className="tabular-nums">{sym} {fmtNum(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span>Impuestos</span>
                        <span className="tabular-nums">{sym} {fmtNum(taxTotal)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t border-dashed border-gray-400 pt-1 mt-1">
                        <span>TOTAL</span>
                        <span className="tabular-nums">{sym} {fmtNum(grandTotal)}</span>
                    </div>
                </div>

                {order.notes && (
                    <div className="mt-3 border-t border-dashed border-gray-400 pt-2 text-xs text-gray-500">
                        Notas: {order.notes}
                    </div>
                )}

                <div className="mt-4 text-center text-[10px] text-gray-400 border-t border-dashed border-gray-400 pt-2">
                    Sesión {order.session.reference} · {order.session.warehouse.name}
                </div>
            </div>
        </>
    );
}

PreBill.layout = null;
