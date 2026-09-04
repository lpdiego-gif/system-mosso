import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Building2, FileWarning, Package, FolderGit2, LayoutGrid, Receipt, RotateCcw, Scissors, Settings2, ShieldCheck, ShoppingBag, Users } from 'lucide-react';
import { useMemo } from 'react';
import { route } from 'ziggy-js';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
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

/**
 * Cada ítem operativo se asocia a la clave de permiso (`modulo.accion`,
 * tabla `permisos`) que lo habilita — ver `Admin/Roles/Index.tsx`. Los
 * ítems de `SUPER_ADMIN_NAV_ITEMS` no tienen permiso asociado porque no son
 * delegables: solo se muestran cuando `esSuperAdmin` es verdadero (ver
 * `EnsureSuperAdmin`, el middleware que protege sus rutas en el backend).
 */
interface NavItemConPermiso extends NavItem {
    permiso: string;
}

const OPERATIVE_NAV_ITEMS: NavItemConPermiso[] = [
    {
        title: 'Panel de Controles',
        href: route('dashboard'),
        icon: LayoutGrid,
        permiso: 'dashboard.ver',
    },
    {
        title: 'Clientes',
        href: route('admin.clientes.index'),
        icon: Users,
        permiso: 'clientes.ver',
    },
    {
        title: 'Productos',
        href: route('admin.productos.index'),
        icon: Package,
        permiso: 'productos.ver',
    },
    {
        title: 'Empresa',
        href: route('empresa.index'),
        icon: Building2,
        permiso: 'empresa.ver',
    },
    {
        title: 'Servicios',
        href: route('admin.servicios.index'),
        icon: Scissors,
        permiso: 'servicios.ver',
    },
    {
        title: 'Pedidos',
        href: route('admin.pedidos.index'),
        icon: ShoppingBag,
        permiso: 'pedidos.ver',
    },
    {
        title: 'Ventas',
        href: route('admin.ventas.index'),
        icon: Receipt,
        permiso: 'ventas.ver',
    },
    {
        title: 'Cambios y devoluciones',
        href: route('admin.devoluciones.index'),
        icon: RotateCcw,
        permiso: 'devoluciones.ver',
    },
    {
        title: 'Libro de reclamaciones',
        href: route('admin.reclamos.index'),
        icon: FileWarning,
        permiso: 'reclamos.ver',
    },
    {
        title: 'Trabajadores',
        href: '/trabajador',
        icon: FolderGit2,
        permiso: 'trabajadores.ver',
        items: [
            {
                title: 'Trabajadores',
                href: '/trabajador',
            },
        ],
    },
    {
        title: 'Departamento',
        href: '/distrito',
        icon: FolderGit2,
        permiso: 'distritos.ver',
        items: [
            {
                title: 'Provincias',
                href: '/provincia',
            },
            {
                title: 'Distritos',
                href: '/distrito',
            },
        ],
    },
];

/** Exclusivos del Super Administrador — ver EnsureSuperAdmin. */
const SUPER_ADMIN_NAV_ITEMS: NavItem[] = [
    {
        title: 'Menu Header',
        href: route('admin.menus.index'),
        icon: FolderGit2,
    },
    {
        title: 'Menu Clientes',
        href: route('admin.menu-cuenta.index'),
        icon: FolderGit2,
    },
    {
        title: 'Funciones',
        href: route('admin.funciones.index'),
        icon: Settings2,
    },
];

/**
 * No es ni operativo (no depende de una clave en `misPermisos`, ya que
 * `roles.*` dejó de ser un permiso delegable) ni exclusivo del Super
 * Administrador: también lo ve «Administrador», con alcance acotado a su
 * equipo — ver `PermisoService::puedeGestionarRoles()`.
 */
const ROLES_NAV_ITEM: NavItem = {
    title: 'Roles y Permisos',
    href: route('admin.roles.index'),
    icon: ShieldCheck,
};

const footerNavItems: NavItem[] = [
    {
        title: 'Portal Web',
        href: route('home'),
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

function useNavItemsVisibles(): NavItem[] {
    const { misPermisos } = usePage().props;

    return useMemo(() => {
        const set = new Set(misPermisos ?? []);

        return OPERATIVE_NAV_ITEMS.filter((item) => set.has(item.permiso));
    }, [misPermisos]);
}

export function AppSidebar() {
    const mainNavItems = useNavItemsVisibles();
    const { esSuperAdmin, puedeGestionarRoles } = usePage().props;

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
                {puedeGestionarRoles && <NavMain items={[ROLES_NAV_ITEM]} label="Equipo" />}
                {esSuperAdmin && <NavMain items={SUPER_ADMIN_NAV_ITEMS} label="Super Admin" />}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
