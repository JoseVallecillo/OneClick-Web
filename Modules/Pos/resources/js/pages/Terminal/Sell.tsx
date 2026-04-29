import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
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
    ChevronUp,
    ChevronDown,
    LayoutGrid,
    LayoutList,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Product {
    id: number;
    sku: string;
    barcode: string | null;
    name: string;
    price: string;
    uom_id: number;
    category_id: number | null;
    uom: { abbreviation: string };
    category: { id: number; name: string; image_path: string | null } | null;
    stock: number | null;
    image_path: string | null;
    type: string;
    tax_rate_id: number | null;
    tax_rate?: { id: number; rate: string };
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
    original_price: number;
    price_changes: { from: number; to: number; timestamp: number }[];
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
    const { props } = usePage<{ flash?: { success?: string; error?: string }; auth?: { user?: { id: number; pos_catalog_view: 'cards' | 'table' } } }>();
    const flash = props.flash;
    const auth = props.auth;
    const user = auth?.user;
    const sym = session.currency.symbol;

    const [flashVisible, setFlashVisible] = useState(!!flash?.success);
    useEffect(() => {
        if (!flash?.success) return;
        setFlashVisible(true);
        const t = setTimeout(() => setFlashVisible(false), 3000);
        return () => clearTimeout(t);
    }, [flash?.success]);

    const [errorModalOpen, setErrorModalOpen] = useState(!!flash?.error);
    useEffect(() => {
        setErrorModalOpen(!!flash?.error);
    }, [flash?.error]);

    // ── Cart state ──────────────────────────────────────────────────────────
    const STORAGE_KEY = `pos_cart_${session.id}`;
    const [cart, setCart] = useState<CartLine[]>([]);
    const [cartLoaded, setCartLoaded] = useState(false);
    const [customerId, setCustomerId] = useState<string>('__walk_in__');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [amountTendered, setAmountTendered] = useState<string>('');
    const [searchQuery, setSearchQuery]       = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('__all__');
    const [showHistory, setShowHistory]       = useState(false);
    const [scanFeedback, setScanFeedback]     = useState<{ type: 'success' | 'error'; message: string; timestamp: number } | null>(null);
    const [catalogView, setCatalogView]       = useState<'cards' | 'table'>('cards');

    const searchRef = useRef<HTMLInputElement>(null);
    const lastScanTimeRef = useRef<number>(0);

    // Load catalog view preference from user or localStorage
    useEffect(() => {
        if (user?.pos_catalog_view) {
            setCatalogView(user.pos_catalog_view);
        } else {
            const saved = localStorage.getItem('pos_catalog_view');
            if (saved === 'table' || saved === 'cards') {
                setCatalogView(saved);
            }
        }
    }, [user?.pos_catalog_view]);

    function toggleCatalogView() {
        const newView = catalogView === 'cards' ? 'table' : 'cards';
        setCatalogView(newView);
        localStorage.setItem('pos_catalog_view', newView);

        if (user?.id) {
            router.post(`/api/users/${user.id}/pos-preference`, { pos_catalog_view: newView });
        }
    }

    // Load cart from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setCart(parsed);
            } catch (e) {
                console.error('Failed to load cart from localStorage', e);
            }
        }
        setCartLoaded(true);
    }, [STORAGE_KEY]);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (!cartLoaded) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }, [cart, cartLoaded, STORAGE_KEY]);

    // Focus search on mount
    useEffect(() => { searchRef.current?.focus(); }, []);

    // ── Product filtering ───────────────────────────────────────────────────
    const categories = useMemo(() => {
        const map = new Map<number, { name: string; image_path: string | null }>();
        products.forEach((p) => {
            if (p.category) {
                map.set(p.category.id, { name: p.category.name, image_path: p.category.image_path });
            }
        });
        return Array.from(map.entries()).map(([id, data]) => ({ id, ...data }));
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
    const addProduct = useCallback((product: Product) => {
        setCart((prev) => {
            const existing = prev.findIndex((l) => l.product_id === product.id);
            const price = parseFloat(product.price);
            if (existing >= 0) {
                return prev.map((l, i) => i === existing ? { ...l, qty: l.qty + 1 } : l);
            }
            return [...prev, {
                product_id:  product.id,
                product,
                qty:         1,
                unit_price:  price,
                tax_rate:    product.tax_rate ? parseFloat(product.tax_rate.rate) : 0,
                description: '',
                original_price: price,
                price_changes: [],
            }];
        });
    }, []);

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
            setCart((prev) => prev.map((l, i) => {
                if (i === idx) {
                    const changes = l.price_changes.length > 0 ? [...l.price_changes] : [];
                    if (l.unit_price !== parsed) {
                        changes.push({ from: l.unit_price, to: parsed, timestamp: Date.now() });
                    }
                    return { ...l, unit_price: parsed, price_changes: changes };
                }
                return l;
            }));
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
        setCustomerId('__walk_in__');
        setAmountTendered('');
        setPaymentMethod('cash');
        localStorage.removeItem(STORAGE_KEY);
    }

    // ── Handle barcode scanner input ────────────────────────────────────────
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            e.preventDefault();
            const now = Date.now();
            const timeSinceLastScan = now - lastScanTimeRef.current;
            lastScanTimeRef.current = now;

            const query = searchQuery.trim();
            const barcodeProduct = products.find(p => p.barcode && p.barcode === query);

            if (barcodeProduct) {
                const stockLow = barcodeProduct.stock !== null && barcodeProduct.stock <= 0;
                if (!stockLow) {
                    addProduct(barcodeProduct);
                    setSearchQuery('');
                    setScanFeedback({ type: 'success', message: `✓ ${barcodeProduct.name}`, timestamp: now });
                    setTimeout(() => setScanFeedback(null), 2000);
                } else {
                    setScanFeedback({ type: 'error', message: `✗ Sin stock: ${barcodeProduct.name}`, timestamp: now });
                    setTimeout(() => setScanFeedback(null), 2000);
                }
            }
        }
    };

    // ── Keyboard shortcuts ──────────────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'k' || e.key === 'K') {
                    e.preventDefault();
                    searchRef.current?.focus();
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    submitSale();
                }
            }
            if (e.key === 'Escape') {
                searchQuery && setSearchQuery('');
            }
            if (e.key === 'Delete' && e.shiftKey && cart.length > 0) {
                e.preventDefault();
                clearCart();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [searchQuery, cart.length]);

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
            onFinish: () => {
                setProcessing(false);
                localStorage.removeItem(STORAGE_KEY);
            },
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

            <AlertDialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" /> Acción bloqueada
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base text-foreground mt-2">
                            {flash?.error}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setErrorModalOpen(false)}>Entendido</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {flash?.success && flashVisible && (
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
                    <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="text-[10px]">Ctrl+K buscar • Ctrl+Enter cobrar • Shift+Del limpiar</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={toggleCatalogView}
                            title={catalogView === 'cards' ? 'Cambiar a vista tabla' : 'Cambiar a vista tarjetas'}
                        >
                            {catalogView === 'cards' ? (
                                <><LayoutList className="h-3.5 w-3.5" />Tabla</>
                            ) : (
                                <><LayoutGrid className="h-3.5 w-3.5" />Tarjetas</>
                            )}
                        </Button>
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
                                    placeholder="Buscar por nombre, SKU o código de barras… (Enter para escanear)"
                                    className="h-8 pl-9 pr-8 text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
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

                        {/* Catalog area: Category Grid or Product Grid */}
                        <div className="flex-1 overflow-y-auto">
                            {catalogView === 'cards' ? (
                                /* ── CARDS VIEW ────────────────────────────────── */
                                <div className="p-3">
                                    {!searchQuery.trim() && categoryFilter === '__all__' ? (
                                        /* ── Category Grid ───────────────────────────────── */
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
                                        const colorClass = colors[i % colors.length];

                                        return (
                                            <button
                                                key={c.id}
                                                onClick={() => setCategoryFilter(String(c.id))}
                                                className={`group relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border transition-all hover:scale-[1.02] active:scale-95 ${colorClass}`}
                                            >
                                                {c.image_path ? (
                                                    <img src={`/storage/${c.image_path}`} alt={c.name} className="absolute inset-0 h-full w-full object-cover opacity-30 transition-opacity group-hover:opacity-50" />
                                                ) : (
                                                    <div className="absolute -bottom-2 -right-2 h-16 w-16 rounded-full bg-current opacity-[0.05]" />
                                                )}

                                                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-background/80 shadow-sm backdrop-blur-sm transition-transform group-hover:scale-110">
                                                    {c.image_path ? (
                                                        <img src={`/storage/${c.image_path}`} alt={c.name} className="h-full w-full rounded-full object-cover" />
                                                    ) : (
                                                        <ShoppingCart className="h-6 w-6 opacity-70" />
                                                    )}
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
                                /* ── Product Grid ────────────────────────────────── */
                                <div className="space-y-4">
                                    {!searchQuery.trim() && categoryFilter !== '__all__' && (
                                        <div className="flex items-center justify-between">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setCategoryFilter('__all__')}
                                                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground pl-1"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                                Todas las categorías
                                            </Button>
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                {categories.find(c => String(c.id) === categoryFilter)?.name}
                                            </span>
                                        </div>
                                    )}

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
                                                        className={`group relative rounded-lg border overflow-hidden text-left transition-all text-sm flex flex-col ${
                                                            stockLow
                                                                ? 'opacity-40 cursor-not-allowed border-dashed'
                                                                : 'hover:border-primary hover:bg-primary/5 active:scale-95 cursor-pointer shadow-sm hover:shadow-md'
                                                        }`}
                                                    >
                                                        <div className="aspect-video w-full overflow-hidden bg-muted relative">
                                                            {product.image_path ? (
                                                                <img src={`/storage/${product.image_path}`} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
                                                                    <ShoppingCart className="h-8 w-8" />
                                                                </div>
                                                            )}
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
                            ) : (
                                /* ── TABLE VIEW ────────────────────────────────── */
                                <div className="p-3">
                                    {!searchQuery.trim() && categoryFilter === '__all__' ? (
                                        /* ── Category Table ───────────────────────────────── */
                                        <div className="space-y-2">
                                            {categories.map((c) => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => setCategoryFilter(String(c.id))}
                                                    className="w-full text-left p-2.5 rounded border border-border hover:bg-primary/10 hover:border-primary transition-colors flex items-center justify-between group"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {c.image_path ? (
                                                            <img src={`/storage/${c.image_path}`} alt={c.name} className="h-8 w-8 rounded object-cover" />
                                                        ) : (
                                                            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                                                        )}
                                                        <span className="font-medium text-sm">{c.name}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded group-hover:bg-primary/20">
                                                        {products.filter(p => p.category_id === c.id).length}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        /* ── Product Table ───────────────────────────────── */
                                        <div className="space-y-2">
                                            {!searchQuery.trim() && categoryFilter !== '__all__' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setCategoryFilter('__all__')}
                                                    className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                    Volver a categorías
                                                </Button>
                                            )}

                                            {filteredProducts.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                                                    <Search className="h-6 w-6 mb-2 opacity-30" />
                                                    No se encontraron productos
                                                </div>
                                            ) : (
                                                <div className="border rounded-lg overflow-hidden">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-muted/50 border-b sticky top-0">
                                                            <tr>
                                                                <th className="text-left px-3 py-2 font-semibold">Producto</th>
                                                                <th className="text-center px-2 py-2 font-semibold w-16">Stock</th>
                                                                <th className="text-right px-3 py-2 font-semibold w-20">Precio</th>
                                                                <th className="text-center px-2 py-2 w-10"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredProducts.map((product) => {
                                                                const stockLow = product.stock !== null && product.stock <= 0;
                                                                return (
                                                                    <tr
                                                                        key={product.id}
                                                                        className={`border-b hover:bg-muted/50 transition-colors ${stockLow ? 'opacity-50' : 'cursor-pointer'}`}
                                                                    >
                                                                        <td className="px-3 py-2">
                                                                            <div>
                                                                                <div className="font-medium">{product.name}</div>
                                                                                <div className="text-[10px] text-muted-foreground font-mono">{product.sku}</div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="text-center px-2 py-2">
                                                                            <span className={product.stock !== null && product.stock < 5 ? 'text-amber-600 font-bold' : ''}>
                                                                                {product.stock !== null ? fmtNum(product.stock) : 'N/A'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="text-right px-3 py-2 font-bold tabular-nums">
                                                                            {sym} {fmtNum(parseFloat(product.price))}
                                                                        </td>
                                                                        <td className="text-center px-2 py-2">
                                                                            <button
                                                                                onClick={() => !stockLow && addProduct(product)}
                                                                                disabled={stockLow}
                                                                                className={`rounded p-1 transition-colors ${stockLow ? 'text-muted-foreground cursor-not-allowed' : 'text-primary hover:bg-primary/10'}`}
                                                                                title={stockLow ? 'Sin stock' : 'Agregar'}
                                                                            >
                                                                                <Plus className="h-4 w-4" />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Barcode scan feedback */}
                        {scanFeedback && (
                            <div className={`fixed bottom-4 left-1/3 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg animate-in fade-in duration-200 ${
                                scanFeedback.type === 'success'
                                    ? 'border border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
                                    : 'border border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
                            }`}>
                                {scanFeedback.message}
                            </div>
                        )}

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

                        {/* Cart table */}
                        <div className="flex-1 overflow-auto">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-4">
                                    <ShoppingCart className="h-8 w-8 mb-2 opacity-20" />
                                    <p>Selecciona productos del catálogo</p>
                                </div>
                            ) : (
                                <div className="border-b">
                                    <table className="w-full text-xs">
                                        <thead className="sticky top-0 bg-muted/50 border-b">
                                            <tr>
                                                <th className="text-left px-2 py-1.5 font-semibold">Producto</th>
                                                <th className="text-center px-2 py-1.5 font-semibold w-14">Cant.</th>
                                                <th className="text-center px-2 py-1.5 font-semibold w-16">Precio</th>
                                                <th className="text-center px-2 py-1.5 font-semibold w-12">Tax%</th>
                                                <th className="text-right px-2 py-1.5 font-semibold w-14">Total</th>
                                                <th className="text-center px-1 py-1.5 w-8"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cart.map((line, idx) => {
                                                const { total } = calcLine(line);
                                                const priceModified = line.original_price !== line.unit_price;
                                                return (
                                                    <tr key={line.product_id} className="border-b hover:bg-muted/30 transition-colors">
                                                        <td className="px-2 py-2">
                                                            <div>
                                                                <div className="font-medium">{line.product.name}</div>
                                                                <div className="text-[10px] text-muted-foreground font-mono">{line.product.sku}</div>
                                                                {priceModified && (
                                                                    <div className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5">
                                                                        <ChevronUp className="h-3 w-3" />
                                                                        {sym} {fmtNum(line.original_price)} → {sym} {fmtNum(line.unit_price)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <div className="flex items-center justify-center gap-0.5">
                                                                <button onClick={() => updateQty(idx, -1)} className="rounded hover:bg-muted p-0.5">
                                                                    <Minus className="h-2.5 w-2.5" />
                                                                </button>
                                                                <Input
                                                                    type="number"
                                                                    min="0.01"
                                                                    step="0.01"
                                                                    value={line.qty}
                                                                    onChange={(e) => setQty(idx, e.target.value)}
                                                                    className="h-6 w-12 text-center text-xs tabular-nums px-0.5 py-0"
                                                                />
                                                                <button onClick={() => updateQty(idx, 1)} className="rounded hover:bg-muted p-0.5">
                                                                    <Plus className="h-2.5 w-2.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={line.unit_price}
                                                                onChange={(e) => setPrice(idx, e.target.value)}
                                                                className="h-6 text-xs tabular-nums text-center px-1 py-0"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
                                                                value={line.tax_rate}
                                                                onChange={(e) => setTaxRate(idx, e.target.value)}
                                                                className="h-6 text-xs tabular-nums text-center px-0.5 py-0"
                                                            />
                                                        </td>
                                                        <td className="text-right px-2 py-2 font-bold tabular-nums whitespace-nowrap">
                                                            {sym} {fmtNum(total)}
                                                        </td>
                                                        <td className="text-center px-1 py-2">
                                                            <button onClick={() => removeLine(idx)} className="text-muted-foreground hover:text-destructive transition-colors p-0.5">
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
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

Sell.layout = null;
