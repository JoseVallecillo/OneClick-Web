import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Ban,
    ChefHat,
    CreditCard,
    FileText,
    Landmark,
    Minus,
    Plus,
    Search,
    ShoppingCart,
    Trash2,
    User,
    Wallet,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Product {
    id: number;
    sku: string;
    name: string;
    price: string;
    type: string;
    uom: { abbreviation: string };
    category: { id: number; name: string; image_path: string | null } | null;
    category_id: number | null;
    stock: number | null;
    image_path: string | null;
    tax_rate?: { id: number; rate: string };
}

interface OrderLine {
    id: number;
    product_id: number;
    product: { id: number; name: string; sku: string; uom: { abbreviation: string } };
    qty: string;
    unit_price: string;
    tax_rate: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    notes: string | null;
    status: 'pending' | 'served';
}

interface Waiter { id: number; name: string; code: string | null }

interface PosOrder {
    id: number;
    reference: string;
    status: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    notes: string | null;
    pos_waiter_id: number | null;
    waiter: Waiter | null;
    table: { id: number; number: number; section: string } | null;
    session: { id: number; reference: string; currency: { symbol: string }; warehouse_id: number };
    lines: OrderLine[];
}

interface Props {
    order: PosOrder;
    products: Product[];
    waiters: Waiter[];
}

type PaymentMethod = 'cash' | 'card' | 'transfer';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { value: 'cash',     label: 'Efectivo',     icon: <Wallet className="h-4 w-4" /> },
    { value: 'card',     label: 'Tarjeta',       icon: <CreditCard className="h-4 w-4" /> },
    { value: 'transfer', label: 'Transferencia', icon: <Landmark className="h-4 w-4" /> },
];

function fmtNum(v: number) {
    return v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OrderShow({ order, products, waiters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const sym = order.session.currency.symbol;

    const [searchQuery, setSearchQuery]       = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('__all__');
    const [showCheckout, setShowCheckout]     = useState(false);
    const [paymentMethod, setPaymentMethod]   = useState<PaymentMethod>('cash');
    const [amountTendered, setAmountTendered] = useState('');
    const [processing, setProcessing]         = useState(false);

    const [flashVisible, setFlashVisible] = useState(!!flash?.success);
    useEffect(() => {
        if (!flash?.success) return;
        setFlashVisible(true);
        const t = setTimeout(() => setFlashVisible(false), 3000);
        return () => clearTimeout(t);
    }, [flash?.success]);

    const searchRef = useRef<HTMLInputElement>(null);
    useEffect(() => { searchRef.current?.focus(); }, []);

    // Totals from server
    const grandTotal = parseFloat(order.total || '0');
    const subtotal   = parseFloat(order.subtotal || '0');
    const taxTotal   = parseFloat(order.tax_amount || '0');

    // Categories
    const categories = useMemo(() => {
        const map = new Map<number, { name: string; image_path: string | null }>();
        products.forEach(p => { if (p.category) map.set(p.category.id, { name: p.category.name, image_path: p.category.image_path }); });
        return Array.from(map.entries()).map(([id, d]) => ({ id, ...d }));
    }, [products]);

    const filteredProducts = useMemo(() => {
        let list = products;
        if (categoryFilter !== '__all__') list = list.filter(p => String(p.category_id) === categoryFilter);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
        }
        return list;
    }, [products, searchQuery, categoryFilter]);

    function addProduct(product: Product) {
        router.post(`/pos/orders/${order.id}/lines`, {
            product_id:  product.id,
            qty:         1,
            unit_price:  parseFloat(product.price),
            tax_rate:    product.tax_rate ? parseFloat(product.tax_rate.rate) : 0,
            description: '',
        }, { preserveScroll: true });
    }

    function updateLineQty(line: OrderLine, delta: number) {
        const newQty = Math.max(0.01, parseFloat(line.qty) + delta);
        router.patch(`/pos/orders/${order.id}/lines/${line.id}`, {
            qty:        newQty,
            unit_price: parseFloat(line.unit_price),
            tax_rate:   parseFloat(line.tax_rate),
            notes:      line.notes,
        }, { preserveScroll: true });
    }

    function removeLine(line: OrderLine) {
        router.delete(`/pos/orders/${order.id}/lines/${line.id}`, { preserveScroll: true });
    }

    function markServed(line: OrderLine) {
        router.patch(`/pos/orders/${order.id}/lines/${line.id}`, {
            qty:        parseFloat(line.qty),
            unit_price: parseFloat(line.unit_price),
            tax_rate:   parseFloat(line.tax_rate),
            notes:      line.notes,
            status:     line.status === 'served' ? 'pending' : 'served',
        }, { preserveScroll: true });
    }

    function assignWaiter(waiterId: string) {
        router.patch(`/pos/orders/${order.id}/waiter`, {
            pos_waiter_id: waiterId === '__none__' ? null : waiterId,
        }, { preserveScroll: true });
    }

    function submitCheckout() {
        if (processing) return;
        setProcessing(true);
        router.post(`/pos/orders/${order.id}/checkout`, {
            payment_method:  paymentMethod,
            amount_tendered: paymentMethod === 'cash' ? parseFloat(amountTendered) : grandTotal,
        }, { onFinish: () => setProcessing(false) });
    }

    function cancelOrder() {
        if (!confirm('¿Cancelar la orden? Esta acción no se puede deshacer.')) return;
        router.post(`/pos/orders/${order.id}/cancel`);
    }

    const tendered = parseFloat(amountTendered || '0');
    const change   = paymentMethod === 'cash' ? Math.max(0, tendered - grandTotal) : 0;
    const canCheckout = order.lines.length > 0 && (paymentMethod !== 'cash' || tendered >= grandTotal);

    const quickAmounts = useMemo(() => {
        if (grandTotal <= 0) return [];
        const c50  = Math.ceil(grandTotal / 50) * 50;
        const c100 = Math.ceil(grandTotal / 100) * 100;
        return [grandTotal, c50, c100, c100 + 100]
            .filter((v, i, a) => a.indexOf(v) === i && v >= grandTotal)
            .slice(0, 4);
    }, [grandTotal]);

    return (
        <>
            <Head title={`Orden ${order.reference}`} />

            {flash?.success && flashVisible && (
                <div className="fixed top-4 right-4 z-50 max-w-sm rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-lg dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="fixed top-4 right-4 z-50 max-w-sm rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-lg">
                    {flash.error}
                </div>
            )}

            <div className="flex h-full flex-col overflow-hidden">

                {/* ── Top bar ─────────────────────────────────────────────── */}
                <div className="flex items-center gap-3 border-b bg-background px-4 py-2 flex-shrink-0">
                    <Link href="/pos/tables">
                        <Button variant="ghost" size="sm" className="gap-1.5 pl-1 text-xs h-8">
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Mesas
                        </Button>
                    </Link>
                    <span className="text-muted-foreground text-xs">/</span>
                    {order.table && (
                        <>
                            <span className="text-sm font-semibold">Mesa {order.table.number}</span>
                            <span className="text-muted-foreground text-xs">{order.table.section}</span>
                            <span className="text-muted-foreground text-xs">/</span>
                        </>
                    )}
                    <span className="font-mono text-sm font-semibold">{order.reference}</span>
                    <Badge className="border border-blue-300 bg-blue-50 text-blue-700 text-[10px] dark:bg-blue-950 dark:text-blue-300">En curso</Badge>

                    <div className="ml-auto flex items-center gap-2">
                        {/* Waiter selector */}
                        <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <Select
                                value={order.pos_waiter_id ? String(order.pos_waiter_id) : '__none__'}
                                onValueChange={assignWaiter}
                            >
                                <SelectTrigger className="h-8 w-36 text-xs">
                                    <SelectValue placeholder="Sin mesero" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Sin mesero</SelectItem>
                                    {waiters.map(w => (
                                        <SelectItem key={w.id} value={String(w.id)}>
                                            {w.name}{w.code ? ` (${w.code})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Link href={`/pos/orders/${order.id}/prebill`} target="_blank">
                            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                                <FileText className="h-3.5 w-3.5" />
                                Pre-cuenta
                            </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive" onClick={cancelOrder}>
                            <Ban className="h-3.5 w-3.5" />
                            Cancelar
                        </Button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">

                    {/* ── Left: Product catalog ─────────────────────────── */}
                    <div className="flex w-[58%] flex-col border-r overflow-hidden">
                        <div className="flex gap-2 p-3 border-b flex-shrink-0">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    ref={searchRef}
                                    placeholder="Buscar por nombre o SKU…"
                                    className="h-8 pl-9 pr-8 text-sm"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setSearchQuery('')}>
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            {categories.length > 0 && (
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Todas las categorías</SelectItem>
                                        {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-3">
                            {!searchQuery.trim() && categoryFilter === '__all__' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {categories.map((c, i) => {
                                        const colors = [
                                            'bg-blue-500/10 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
                                            'bg-purple-500/10 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300',
                                            'bg-emerald-500/10 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300',
                                            'bg-amber-500/10 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
                                            'bg-rose-500/10 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300',
                                            'bg-indigo-500/10 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300',
                                        ];
                                        return (
                                            <button key={c.id} onClick={() => setCategoryFilter(String(c.id))}
                                                className={`group relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border transition-all hover:scale-[1.02] active:scale-95 ${colors[i % colors.length]}`}>
                                                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-background/80 shadow-sm">
                                                    {c.image_path
                                                        ? <img src={`/storage/${c.image_path}`} alt={c.name} className="h-full w-full rounded-full object-cover" />
                                                        : <ChefHat className="h-6 w-6 opacity-70" />}
                                                </div>
                                                <div className="relative z-10 font-bold text-sm leading-tight px-3">{c.name}</div>
                                                <div className="relative z-10 text-[10px] opacity-60">
                                                    {products.filter(p => p.category_id === c.id).length} productos
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {!searchQuery.trim() && categoryFilter !== '__all__' && (
                                        <div className="flex items-center justify-between">
                                            <Button variant="ghost" size="sm" onClick={() => setCategoryFilter('__all__')}
                                                className="h-7 gap-1.5 text-xs text-muted-foreground pl-1">
                                                <X className="h-3.5 w-3.5" />Todas las categorías
                                            </Button>
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                {categories.find(c => String(c.id) === categoryFilter)?.name}
                                            </span>
                                        </div>
                                    )}
                                    {filteredProducts.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                                            <Search className="h-6 w-6 mb-2 opacity-30" />No se encontraron productos
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {filteredProducts.map(product => {
                                                const stockLow = product.stock !== null && product.stock <= 0;
                                                return (
                                                    <button key={product.id}
                                                        onClick={() => !stockLow && addProduct(product)}
                                                        disabled={stockLow}
                                                        className={`group relative rounded-lg border overflow-hidden text-left transition-all text-sm flex flex-col ${
                                                            stockLow
                                                                ? 'opacity-40 cursor-not-allowed border-dashed'
                                                                : 'hover:border-primary hover:bg-primary/5 active:scale-95 cursor-pointer shadow-sm hover:shadow-md'
                                                        }`}>
                                                        <div className="aspect-video w-full overflow-hidden bg-muted relative">
                                                            {product.image_path
                                                                ? <img src={`/storage/${product.image_path}`} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                                                                : <div className="flex h-full w-full items-center justify-center text-muted-foreground/20"><ShoppingCart className="h-8 w-8" /></div>}
                                                            {stockLow && (
                                                                <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">Sin stock</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="p-3 flex flex-col gap-1 flex-1">
                                                            <div className="font-medium text-xs leading-tight line-clamp-2 group-hover:text-primary transition-colors">{product.name}</div>
                                                            <div className="font-mono text-[10px] text-muted-foreground">{product.sku}</div>
                                                            <div className="mt-auto pt-2 flex items-end justify-between">
                                                                <span className="text-sm font-bold tabular-nums text-primary">{sym} {fmtNum(parseFloat(product.price))}</span>
                                                                {product.stock !== null && (
                                                                    <span className={`text-[10px] tabular-nums ${product.stock < 5 ? 'text-amber-600 font-bold' : 'text-muted-foreground'}`}>
                                                                        {fmtNum(product.stock)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {!stockLow && (
                                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                                                                <Plus className="h-3 w-3" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right: Order lines + payment ─────────────────── */}
                    <div className="flex w-[42%] flex-col overflow-hidden">

                        {/* Order lines */}
                        <div className="flex-1 overflow-y-auto">
                            {order.lines.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-4">
                                    <ChefHat className="h-8 w-8 mb-2 opacity-20" />
                                    <p>Agrega productos al pedido</p>
                                </div>
                            ) : (
                                <div className="p-2 flex flex-col gap-1">
                                    {order.lines.map(line => (
                                        <div key={line.id} className={`rounded-lg border bg-background p-2 ${line.status === 'served' ? 'opacity-60' : ''}`}>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium leading-tight truncate">{line.product.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono">{line.product.sku}</p>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button
                                                        onClick={() => markServed(line)}
                                                        title={line.status === 'served' ? 'Marcar pendiente' : 'Marcar servido'}
                                                        className={`rounded p-1 text-xs transition-colors ${line.status === 'served' ? 'text-green-600 hover:text-muted-foreground' : 'text-muted-foreground hover:text-green-600'}`}>
                                                        <ChefHat className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button onClick={() => removeLine(line)} className="text-muted-foreground hover:text-destructive">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => updateLineQty(line, -1)}
                                                        className="rounded border h-6 w-6 flex items-center justify-center text-muted-foreground hover:bg-muted">
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-10 text-center text-xs tabular-nums">{parseFloat(line.qty).toFixed(0)}</span>
                                                    <button onClick={() => updateLineQty(line, 1)}
                                                        className="rounded border h-6 w-6 flex items-center justify-center text-muted-foreground hover:bg-muted">
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <span className="text-xs text-muted-foreground flex-1">
                                                    {sym} {fmtNum(parseFloat(line.unit_price))} c/u
                                                </span>
                                                <span className="text-xs font-bold tabular-nums ml-auto whitespace-nowrap">
                                                    {sym} {fmtNum(parseFloat(line.total))}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Totals + Checkout */}
                        <div className="border-t bg-background flex-shrink-0">
                            <div className="px-4 py-2 space-y-0.5 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span className="tabular-nums">{sym} {fmtNum(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Impuestos</span>
                                    <span className="tabular-nums">{sym} {fmtNum(taxTotal)}</span>
                                </div>
                                <Separator className="my-1" />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>TOTAL</span>
                                    <span className="tabular-nums">{sym} {fmtNum(grandTotal)}</span>
                                </div>
                            </div>

                            {!showCheckout ? (
                                <div className="px-4 pb-4">
                                    <Button
                                        className="w-full h-12 text-base font-bold gap-2"
                                        disabled={order.lines.length === 0}
                                        onClick={() => setShowCheckout(true)}
                                    >
                                        <CreditCard className="h-5 w-5" />
                                        Cobrar {sym} {fmtNum(grandTotal)}
                                    </Button>
                                </div>
                            ) : (
                                <div className="px-4 pb-4 space-y-3">
                                    {/* Payment method */}
                                    <div className="flex gap-1">
                                        {PAYMENT_OPTIONS.map(opt => (
                                            <button key={opt.value} onClick={() => setPaymentMethod(opt.value)}
                                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border py-1.5 text-xs font-medium transition-colors ${
                                                    paymentMethod === opt.value
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                                                }`}>
                                                {opt.icon}{opt.label}
                                            </button>
                                        ))}
                                    </div>

                                    {paymentMethod === 'cash' && (
                                        <div className="space-y-2">
                                            <Label className="text-xs">Monto recibido</Label>
                                            <Input
                                                type="number"
                                                min={grandTotal}
                                                step="0.01"
                                                value={amountTendered}
                                                onChange={e => setAmountTendered(e.target.value)}
                                                placeholder={`Mínimo ${sym} ${fmtNum(grandTotal)}`}
                                                className="h-9 text-lg tabular-nums font-mono"
                                                autoFocus
                                            />
                                            <div className="flex gap-1">
                                                {quickAmounts.map(amt => (
                                                    <button key={amt} onClick={() => setAmountTendered(amt.toFixed(2))}
                                                        className={`flex-1 rounded border py-1 text-xs tabular-nums transition-colors ${
                                                            parseFloat(amountTendered) === amt
                                                                ? 'border-primary bg-primary text-primary-foreground'
                                                                : 'border-border hover:bg-muted'
                                                        }`}>
                                                        {sym} {fmtNum(amt)}
                                                    </button>
                                                ))}
                                            </div>
                                            {change > 0 && (
                                                <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300">
                                                    <span className="text-xs">Cambio: </span>
                                                    <span className="text-lg font-bold tabular-nums">{sym} {fmtNum(change)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-none" onClick={() => setShowCheckout(false)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                        <Button className="flex-1 h-11 font-bold gap-2" disabled={!canCheckout || processing} onClick={submitCheckout}>
                                            <CreditCard className="h-4 w-4" />
                                            {processing ? 'Procesando…' : `Confirmar ${sym} ${fmtNum(grandTotal)}`}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

OrderShow.layout = null;
