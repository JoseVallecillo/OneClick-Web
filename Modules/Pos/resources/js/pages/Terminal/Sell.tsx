import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Ban,
    CreditCard,
    History,
    Landmark,
    Lock,
    Minus,
    Plus,
    Search,
    ShoppingCart,
    Trash2,
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
    uom_id: number;
    category_id: number | null;
    uom: { abbreviation: string };
    category: { id: number; name: string } | null;
    stock: number | null;
    type: string;
}

interface Customer { id: number; name: string }

interface RecentSale {
    id: number;
    reference: string;
    total: string;
    created_at: string;
    customer: { name: string } | null;
    lines: { qty: string; unit_price: string }[];
}

interface Session {
    id: number;
    reference: string;
    name: string | null;
    warehouse: { id: number; name: string };
    currency: { id: number; code: string; symbol: string };
}

interface Props {
    session: Session;
    products: Product[];
    customers: Customer[];
    recentSales: RecentSale[];
}

// ── Cart line ──────────────────────────────────────────────────────────────────

interface CartLine {
    product_id: number;
    product: Product;
    qty: number;
    unit_price: number;
    tax_rate: number;
    description: string;
}

type PaymentMethod = 'cash' | 'card' | 'transfer';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtNum(v: number) {
    return v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcLine(line: CartLine) {
    const sub = line.qty * line.unit_price;
    const tax = sub * (line.tax_rate / 100);
    return { subtotal: sub, tax, total: sub + tax };
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { value: 'cash',     label: 'Efectivo',       icon: <Wallet className="h-4 w-4" /> },
    { value: 'card',     label: 'Tarjeta',         icon: <CreditCard className="h-4 w-4" /> },
    { value: 'transfer', label: 'Transferencia',   icon: <Landmark className="h-4 w-4" /> },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Sell({ session, products, customers, recentSales }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const sym = session.currency.symbol;

    // ── Cart state ──────────────────────────────────────────────────────────
    const [cart, setCart]             = useState<CartLine[]>([]);
    const [customerId, setCustomerId] = useState<string>('__walk_in__');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [amountTendered, setAmountTendered] = useState<string>('');
    const [searchQuery, setSearchQuery]       = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('__all__');
    const [showHistory, setShowHistory]       = useState(false);

    const searchRef = useRef<HTMLInputElement>(null);

    // Focus search on mount
    useEffect(() => { searchRef.current?.focus(); }, []);

    // ── Product filtering ───────────────────────────────────────────────────
    const categories = useMemo(() => {
        const map = new Map<number, string>();
        products.forEach((p) => {
            if (p.category) map.set(p.category.id, p.category.name);
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [products]);

    const filteredProducts = useMemo(() => {
        let list = products;
        if (categoryFilter !== '__all__') list = list.filter((p) => String(p.category_id) === categoryFilter);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
        }
        return list;
    }, [products, searchQuery, categoryFilter]);

    // ── Cart operations ─────────────────────────────────────────────────────
    function addProduct(product: Product) {
        setCart((prev) => {
            const existing = prev.findIndex((l) => l.product_id === product.id);
            if (existing >= 0) {
                return prev.map((l, i) => i === existing ? { ...l, qty: l.qty + 1 } : l);
            }
            return [...prev, {
                product_id:  product.id,
                product,
                qty:         1,
                unit_price:  parseFloat(product.price),
                tax_rate:    0,
                description: '',
            }];
        });
    }

    function updateQty(idx: number, delta: number) {
        setCart((prev) => {
            const updated = prev.map((l, i) => i === idx ? { ...l, qty: Math.max(0.01, parseFloat((l.qty + delta).toFixed(2))) } : l);
            return updated;
        });
    }

    function setQty(idx: number, value: string) {
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed > 0) {
            setCart((prev) => prev.map((l, i) => i === idx ? { ...l, qty: parsed } : l));
        }
    }

    function setPrice(idx: number, value: string) {
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed >= 0) {
            setCart((prev) => prev.map((l, i) => i === idx ? { ...l, unit_price: parsed } : l));
        }
    }

    function setTaxRate(idx: number, value: string) {
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed >= 0) {
            setCart((prev) => prev.map((l, i) => i === idx ? { ...l, tax_rate: parsed } : l));
        }
    }

    function removeLine(idx: number) {
        setCart((prev) => prev.filter((_, i) => i !== idx));
    }

    function clearCart() {
        setCart([]);
        setCustomerId('');
        setAmountTendered('');
        setPaymentMethod('cash');
    }

    // ── Totals ──────────────────────────────────────────────────────────────
    const subtotal  = cart.reduce((s, l) => s + calcLine(l).subtotal, 0);
    const taxTotal  = cart.reduce((s, l) => s + calcLine(l).tax, 0);
    const grandTotal = subtotal + taxTotal;
    const tendered  = parseFloat(amountTendered || '0');
    const change    = paymentMethod === 'cash' ? Math.max(0, tendered - grandTotal) : 0;
    const canCharge = cart.length > 0 && (paymentMethod !== 'cash' || tendered >= grandTotal);

    // ── Form submission ─────────────────────────────────────────────────────
    const [processing, setProcessing] = useState(false);

    function submitSale() {
        if (!canCharge || processing) return;

        const payload = {
            customer_id:      (customerId && customerId !== '__walk_in__') ? customerId : null,
            payment_method:   paymentMethod,
            amount_tendered:  paymentMethod === 'cash' ? tendered : grandTotal,
            lines: cart.map((l) => ({
                product_id:  l.product_id,
                qty:         l.qty,
                unit_price:  l.unit_price,
                tax_rate:    l.tax_rate,
                description: l.description,
            })),
        };

        setProcessing(true);
        router.post(`/pos/sessions/${session.id}/sales`, payload, {
            onFinish: () => setProcessing(false),
        });
    }

    // Quick-set tendered amount buttons
    const quickAmounts = useMemo(() => {
        if (grandTotal <= 0) return [];
        const ceil50 = Math.ceil(grandTotal / 50) * 50;
        const ceil100 = Math.ceil(grandTotal / 100) * 100;
        const amounts = [grandTotal, ceil50, ceil100, ceil100 + 100].filter((v, i, arr) => arr.indexOf(v) === i && v >= grandTotal);
        return amounts.slice(0, 4);
    }, [grandTotal]);

    return (
        <>
            <Head title={`POS — ${session.reference}`} />

            {flash?.success && (
                <div className="fixed top-4 right-4 z-50 max-w-sm rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-lg dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                    {flash.success}
                </div>
            )}

            <div className="flex h-full flex-col overflow-hidden">
                {/* ── Top bar ──────────────────────────────────────────── */}
                <div className="flex items-center gap-3 border-b bg-background px-4 py-2 flex-shrink-0">
                    <Link href="/pos/sessions">
                        <Button variant="ghost" size="sm" className="gap-1.5 pl-1 text-xs h-8">
                            <ShoppingCart className="h-3.5 w-3.5" />
                            POS
                        </Button>
                    </Link>
                    <span className="text-muted-foreground text-xs">/</span>
                    <span className="text-sm font-semibold font-mono">{session.reference}</span>
                    {session.name && <span className="text-xs text-muted-foreground">{session.name}</span>}
                    <Badge className="border border-green-300 bg-green-50 text-green-700 text-[10px] dark:bg-green-950 dark:text-green-300">Abierta</Badge>
                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShowHistory(!showHistory)}>
                            <History className="h-3.5 w-3.5" />
                            Historial
                        </Button>
                        <Link href={`/pos/sessions/${session.id}/close`}>
                            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                                <Lock className="h-3.5 w-3.5" />
                                Cerrar caja
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* ── Main area ─────────────────────────────────────────── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── Left: Product catalog ────────────────────────── */}
                    <div className="flex w-[58%] flex-col border-r overflow-hidden">
                        {/* Search + category filter */}
                        <div className="flex gap-2 p-3 border-b flex-shrink-0">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    ref={searchRef}
                                    placeholder="Buscar por nombre o SKU…"
                                    className="h-8 pl-9 pr-8 text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
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
                                    <SelectTrigger className="h-8 w-40 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Todas las categorías</SelectItem>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Product grid */}
                        <div className="flex-1 overflow-y-auto p-3">
                            {filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                                    <Search className="h-6 w-6 mb-2 opacity-30" />
                                    No se encontraron productos
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {filteredProducts.map((product) => {
                                        const stockLow = product.stock !== null && product.stock <= 0;
                                        return (
                                            <button
                                                key={product.id}
                                                onClick={() => !stockLow && addProduct(product)}
                                                disabled={stockLow}
                                                className={`rounded-lg border p-3 text-left transition-all text-sm flex flex-col gap-1 ${
                                                    stockLow
                                                        ? 'opacity-40 cursor-not-allowed border-dashed'
                                                        : 'hover:border-primary hover:bg-primary/5 active:scale-95 cursor-pointer'
                                                }`}
                                            >
                                                <div className="font-medium text-xs leading-tight line-clamp-2">{product.name}</div>
                                                <div className="font-mono text-[10px] text-muted-foreground">{product.sku}</div>
                                                <div className="mt-1 flex items-end justify-between">
                                                    <span className="text-sm font-bold tabular-nums">{sym} {fmtNum(parseFloat(product.price))}</span>
                                                    {product.stock !== null && (
                                                        <span className={`text-[10px] tabular-nums ${product.stock < 5 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                                            {fmtNum(product.stock)}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Recent sales history panel */}
                        {showHistory && recentSales.length > 0 && (
                            <div className="border-t bg-muted/30 p-3 flex-shrink-0 max-h-48 overflow-y-auto">
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Últimas ventas</p>
                                <div className="flex flex-col gap-1">
                                    {recentSales.map((sale) => (
                                        <Link key={sale.id} href={`/pos/sales/${sale.id}/receipt`}
                                            className="flex items-center justify-between rounded px-2 py-1.5 text-xs hover:bg-background transition-colors">
                                            <span className="font-mono font-semibold">{sale.reference}</span>
                                            <span className="text-muted-foreground">{sale.customer?.name ?? 'Consumidor final'}</span>
                                            <span className="font-medium tabular-nums">{sym} {fmtNum(parseFloat(sale.total))}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right: Cart + payment ─────────────────────────── */}
                    <div className="flex w-[42%] flex-col overflow-hidden">

                        {/* Customer + clear */}
                        <div className="flex items-center gap-2 border-b p-3 flex-shrink-0">
                            <Select value={customerId} onValueChange={setCustomerId}>
                                <SelectTrigger className="h-8 flex-1 text-xs">
                                    <SelectValue placeholder="Consumidor final (anónimo)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__walk_in__">Consumidor final (anónimo)</SelectItem>
                                    {customers.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {cart.length > 0 && (
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={clearCart}>
                                    <Ban className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>

                        {/* Cart lines */}
                        <div className="flex-1 overflow-y-auto">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-4">
                                    <ShoppingCart className="h-8 w-8 mb-2 opacity-20" />
                                    <p>Selecciona productos del catálogo</p>
                                </div>
                            ) : (
                                <div className="p-2 flex flex-col gap-1">
                                    {cart.map((line, idx) => {
                                        const { total } = calcLine(line);
                                        return (
                                            <div key={idx} className="rounded-lg border bg-background p-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium leading-tight truncate">{line.product.name}</p>
                                                        <p className="text-[10px] text-muted-foreground font-mono">{line.product.sku}</p>
                                                    </div>
                                                    <button onClick={() => removeLine(idx)} className="text-muted-foreground hover:text-destructive mt-0.5 flex-shrink-0">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>

                                                <div className="mt-2 flex items-center gap-2">
                                                    {/* Qty controls */}
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => updateQty(idx, -1)} className="rounded border h-6 w-6 flex items-center justify-center text-muted-foreground hover:bg-muted">
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <Input
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            value={line.qty}
                                                            onChange={(e) => setQty(idx, e.target.value)}
                                                            className="h-6 w-14 text-center text-xs tabular-nums px-1"
                                                        />
                                                        <button onClick={() => updateQty(idx, 1)} className="rounded border h-6 w-6 flex items-center justify-center text-muted-foreground hover:bg-muted">
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>

                                                    {/* Price */}
                                                    <div className="flex items-center gap-1 flex-1">
                                                        <span className="text-xs text-muted-foreground">{sym}</span>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={line.unit_price}
                                                            onChange={(e) => setPrice(idx, e.target.value)}
                                                            className="h-6 text-xs tabular-nums px-1"
                                                        />
                                                    </div>

                                                    {/* Tax */}
                                                    <div className="flex items-center gap-1 w-16">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            value={line.tax_rate}
                                                            onChange={(e) => setTaxRate(idx, e.target.value)}
                                                            className="h-6 text-xs tabular-nums px-1 w-12"
                                                        />
                                                        <span className="text-xs text-muted-foreground">%</span>
                                                    </div>

                                                    {/* Line total */}
                                                    <span className="text-xs font-bold tabular-nums ml-auto whitespace-nowrap">
                                                        {sym} {fmtNum(total)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Totals + Payment */}
                        <div className="border-t bg-background flex-shrink-0">
                            {/* Totals */}
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

                            {/* Payment method */}
                            <div className="px-4 pb-2">
                                <div className="flex gap-1 mb-2">
                                    {PAYMENT_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setPaymentMethod(opt.value)}
                                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border py-1.5 text-xs font-medium transition-colors ${
                                                paymentMethod === opt.value
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                                            }`}
                                        >
                                            {opt.icon}
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Cash tendered */}
                                {paymentMethod === 'cash' && (
                                    <div className="flex flex-col gap-2 mb-2">
                                        <Label className="text-xs">Monto recibido</Label>
                                        <Input
                                            type="number"
                                            min={grandTotal}
                                            step="0.01"
                                            value={amountTendered}
                                            onChange={(e) => setAmountTendered(e.target.value)}
                                            placeholder={`Mínimo ${sym} ${fmtNum(grandTotal)}`}
                                            className="h-9 text-lg tabular-nums font-mono"
                                        />
                                        {/* Quick amounts */}
                                        {quickAmounts.length > 0 && (
                                            <div className="flex gap-1">
                                                {quickAmounts.map((amt) => (
                                                    <button key={amt}
                                                        onClick={() => setAmountTendered(amt.toFixed(2))}
                                                        className={`flex-1 rounded border py-1 text-xs tabular-nums transition-colors ${
                                                            parseFloat(amountTendered) === amt
                                                                ? 'border-primary bg-primary text-primary-foreground'
                                                                : 'border-border hover:bg-muted'
                                                        }`}>
                                                        {sym} {fmtNum(amt)}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {change > 0 && (
                                            <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300">
                                                <span className="text-xs">Cambio a devolver: </span>
                                                <span className="text-lg font-bold tabular-nums">{sym} {fmtNum(change)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Charge button */}
                            <div className="px-4 pb-4">
                                <Button
                                    className="w-full h-12 text-base font-bold gap-2"
                                    disabled={!canCharge || processing || cart.length === 0}
                                    onClick={submitSale}
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    {cart.length === 0
                                        ? 'Carrito vacío'
                                        : paymentMethod === 'cash' && tendered < grandTotal
                                            ? `Faltan ${sym} ${fmtNum(grandTotal - tendered)}`
                                            : `Cobrar ${sym} ${fmtNum(grandTotal)}`
                                    }
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// No breadcrumb layout — full screen terminal
Sell.layout = null;
