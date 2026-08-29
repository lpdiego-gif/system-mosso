import { Link } from '@inertiajs/react';
import { BookOpen, Building2, Package, FolderGit2, LayoutGrid, Scissors, Users } from 'lucide-react';
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


const mainNavItems: NavItem[] = [
    {
        title: 'Panel de Control',
        href: route('dashboard'),
        icon: LayoutGrid,
    },{
        title: 'Clientes',
        href: route('admin.clientes.index'),
        icon: Users,
    },

    {
        title: 'Productos',
        href: route('admin.productos.index'),
        icon: Package,
    },
    {
        title: 'Empresa',
        href: route('empresa.index'),
        icon: Building2,
    },
    {
        title: 'Servicios',
        href: route('admin.servicios.index'),
        icon: Scissors,
    },
    {
        title: 'Trabajadores',
        href: '/trabajador',
        icon: FolderGit2,
        items: [
            {
                title: 'Trabajadores',
                href: '/trabajador',
            },
        ],
    },{
        title: 'Departamento',
        href: '/distrito',
        icon: FolderGit2,
        items: [
            {
                title: 'Provincia',
                href: '/distrito',
            },
            {
                title: 'Menu',
                href: route('admin.menus.index'),
            },
            
        ],
    },
    
];

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
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
