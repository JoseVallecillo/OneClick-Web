import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    Bed,
    BookUser,
    Building2,
    Calculator,
    Car,
    CircleDollarSign,
    Key,
    LayoutGrid,
    Monitor,
    Package,
    ShoppingCart,
} from 'lucide-react';

const mainNavItems: NavItem[] = [
    {
        title: 'Panel de Control',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Contactos',
        href: '/contacts',
        icon: BookUser,
        items: [
            {
                title: 'Crear Contacto',
                href: '/contacts/create',
            },
            {
                title: 'Contactos',
                href: '/contacts',
            },
        ],
    },
    {
        title: 'Inventario',
        href: '/inventory',
        icon: Package,
        items: [
            {
                title: 'Operaciones',
                href: '/inventory/movements',
            },
            {
                title: 'Productos',
                href: '/inventory/products',
            },
            {
                title: 'Lotes y Series',
                href: '/inventory/lots',
            },
            {
                title: 'Configuración',
                href: '/inventory/config',
            },
        ],
    },
    {
        title: 'Lubricentro',
        href: '/carservice/orders',
        icon: Car,
        items: [
            { title: 'Nuevo Check-in',   href: '/carservice/orders/create' },
            { title: 'Órdenes',          href: '/carservice/orders' },
            { title: 'Vehículos',        href: '/carservice/vehicles' },
        ],
    },
    {
        title: 'Compras',
        href: '/purchases/orders',
        icon: ShoppingCart,
        items: [
            {
                title: 'Operaciones',
                href: '/purchases/orders',
            },
            {
                title: 'Nueva Orden',
                href: '/purchases/orders/create',
            },
            {
                title: 'Crear Factura',
                href: '/purchases/orders/create?type=invoice',
            },
        ],
    },
    {
        title: 'Ventas',
        href: '/sales/orders',
        icon: CircleDollarSign,
        items: [
            {
                title: 'Órdenes de Venta',
                href: '/sales/orders',
            },
            {
                title: 'Nueva Cotización',
                href: '/sales/orders/create',
            },
        ],
    },
    {
        title: 'Punto de Venta (POS)',
        href: '/pos/sessions',
        icon: Monitor,
        items: [
            {
                title: 'Table Board',
                href: '/pos/tables',
            },
            {
                title: 'Sesiones',
                href: '/pos/sessions',
            },
            {
                title: 'Abrir Caja',
                href: '/pos/sessions/open',
            },
        ],
    },
    {
        title: 'Contabilidad',
        href: '/accounting',
        icon: Calculator,
        items: [
            { title: 'Asientos Contables', href: '/accounting/moves' },
            { title: 'Catálogo de Cuentas', href: '/accounting/accounts' },
            { title: 'Diarios',            href: '/accounting/journals' },
            { title: 'Impuestos',          href: '/accounting/taxes' },
            { title: 'Reportes',           href: '/accounting/reports/trial-balance' },
            { title: 'Configuración CAI',   href: '/accounting/cai' },
        ],
    },
    {
        title: 'Inmobiliaria',
        href: '/realestate/properties',
        icon: Building2,
        items: [
            { title: 'Propiedades',       href: '/realestate/properties' },
            { title: 'Leads',             href: '/realestate/leads' },
            { title: 'Negocios',          href: '/realestate/deals' },
            { title: 'Planes de Pago',    href: '/realestate/payment-plans' },
            { title: 'Comisiones',        href: '/realestate/commissions' },
            { title: 'Soporte',           href: '/realestate/support' },
            { title: 'Cuotas de Mant.',   href: '/realestate/condo-fees' },
        ],
    },
    {
        title: 'Alquileres',
        href: '/rentals',
        icon: Key,
        items: [
            { title: 'Órdenes de Alquiler', href: '/rentals' },
            { title: 'Calendario', href: '/rentals/calendar' },
            { title: 'Tarifas', href: '/rentals/config/rates' },
        ],
    },
    {
        title: 'Hotelería',
        href: '/hospitality/rooms',
        icon: Bed,
        items: [
            { title: 'Recepción', href: '/hospitality/rooms' },
            { title: 'Reservaciones', href: '/hospitality/reservations' },
        ],
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
