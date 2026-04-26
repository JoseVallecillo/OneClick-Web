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
import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import {
    Bed,
    BookUser,
    Building2,
    Calculator,
    Car,
    CircleDollarSign,
    Gauge,
    Key,
    Landmark,
    LayoutGrid,
    Monitor,
    Package,
    Scissors,
    ShoppingCart,
} from 'lucide-react';

const allNavItems: NavItem[] = [
    {
        title: 'Panel de Control',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Contactos',
        href: '/contacts',
        icon: BookUser,
        module: 'Contacts',
        items: [
            { title: 'Crear Contacto', href: '/contacts/create' },
            { title: 'Contactos',      href: '/contacts' },
        ],
    },
    {
        title: 'Inventario',
        href: '/inventory',
        icon: Package,
        module: 'Inventory',
        items: [
            { title: 'Operaciones',   href: '/inventory/movements' },
            { title: 'Productos',     href: '/inventory/products' },
            { title: 'Lotes y Series', href: '/inventory/lots' },
            { title: 'Configuración', href: '/inventory/config' },
        ],
    },
    {
        title: 'Barbería',
        href: '/barbershop',
        icon: Scissors,
        module: 'Barbershop',
        items: [
            { title: 'Panel',          href: '/barbershop' },
            { title: 'Citas',          href: '/barbershop/appointments' },
            { title: 'Cola de espera', href: '/barbershop/queue' },
            { title: 'Clientes',       href: '/barbershop/clients' },
            { title: 'Barberos',       href: '/barbershop/barbers' },
            { title: 'Servicios',      href: '/barbershop/services' },
            { title: 'Configuración',  href: '/barbershop/config' },
        ],
    },
    {
        title: 'Autolote',
        href: '/autolote/vehicles',
        icon: Gauge,
        module: 'AutoLote',
        items: [
            { title: 'Inventario',         href: '/autolote/vehicles' },
            { title: 'Registrar Vehículo', href: '/autolote/vehicles/create' },
        ],
    },
    {
        title: 'Lubricentro',
        href: '/carservice/orders',
        icon: Car,
        module: 'CarService',
        items: [
            { title: 'Nuevo Check-in', href: '/carservice/orders/create' },
            { title: 'Órdenes',        href: '/carservice/orders' },
            { title: 'Vehículos',      href: '/carservice/vehicles' },
        ],
    },
    {
        title: 'Compras',
        href: '/purchases/orders',
        icon: ShoppingCart,
        module: 'Purchases',
        items: [
            { title: 'Operaciones',   href: '/purchases/orders' },
            { title: 'Nueva Orden',   href: '/purchases/orders/create' },
            { title: 'Crear Factura', href: '/purchases/orders/create?type=invoice' },
        ],
    },
    {
        title: 'Ventas',
        href: '/sales/orders',
        icon: CircleDollarSign,
        module: 'Sales',
        items: [
            { title: 'Órdenes de Venta',  href: '/sales/orders' },
            { title: 'Nueva Cotización',  href: '/sales/orders/create' },
        ],
    },
    {
        title: 'Punto de Venta (POS)',
        href: '/pos/sessions',
        icon: Monitor,
        module: 'Pos',
        items: [
            { title: 'Table Board', href: '/pos/tables' },
            { title: 'Sesiones',    href: '/pos/sessions' },
            { title: 'Abrir Caja',  href: '/pos/sessions/open' },
        ],
    },
    {
        title: 'Contabilidad',
        href: '/accounting',
        icon: Calculator,
        module: 'Accounting',
        items: [
            { title: 'Asientos Contables',  href: '/accounting/moves' },
            { title: 'Catálogo de Cuentas', href: '/accounting/accounts' },
            { title: 'Diarios',             href: '/accounting/journals' },
            { title: 'Impuestos',           href: '/accounting/taxes' },
            { title: 'Reportes',            href: '/accounting/reports/trial-balance' },
            { title: 'Configuración CAI',   href: '/accounting/cai' },
        ],
    },
    {
        title: 'Inmobiliaria',
        href: '/realestate/properties',
        icon: Building2,
        module: 'RealEstate',
        items: [
            { title: 'Propiedades',    href: '/realestate/properties' },
            { title: 'Leads',          href: '/realestate/leads' },
            { title: 'Negocios',       href: '/realestate/deals' },
            { title: 'Planes de Pago', href: '/realestate/payment-plans' },
            { title: 'Comisiones',     href: '/realestate/commissions' },
            { title: 'Soporte',        href: '/realestate/support' },
            { title: 'Cuotas de Mant.', href: '/realestate/condo-fees' },
        ],
    },
    {
        title: 'Alquileres',
        href: '/rentals',
        icon: Key,
        module: 'Rentals',
        items: [
            { title: 'Órdenes de Alquiler', href: '/rentals' },
            { title: 'Calendario',          href: '/rentals/calendar' },
            { title: 'Tarifas',             href: '/rentals/config/rates' },
        ],
    },
    {
        title: 'Hotelería',
        href: '/hospitality/rooms',
        icon: Bed,
        module: 'Hospitality',
        items: [
            { title: 'Recepción',     href: '/hospitality/rooms' },
            { title: 'Reservaciones', href: '/hospitality/reservations' },
        ],
    },
    {
        title: 'Microfinanciera',
        href: '/microfinance',
        icon: Landmark,
        module: 'Microfinance',
        items: [
            { title: 'Préstamos', href: '/microfinance/loans' },
            { title: 'Clientes',  href: '/microfinance/clients' },
            { title: 'Grupos',    href: '/microfinance/groups' },
            { title: 'Cobranzas', href: '/microfinance/collection/route' },
            { title: 'Tesorería', href: '/microfinance/treasury/disbursements' },
            { title: 'Reportes',  href: '/microfinance/reports/par' },
            { title: 'Productos',  href: '/microfinance/config/products' },
        ],
    },
];

export function AppSidebar() {
    const enabledModules: string[] = usePage().props.enabledModules ?? [];

    const navItems = allNavItems.filter(
        (item) => !item.module || enabledModules.includes(item.module),
    );

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
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
