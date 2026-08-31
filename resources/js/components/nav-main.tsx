import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { IsCurrentUrlFn } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

const activeClasses = 'data-[active=true]:bg-sidebar-accent/70 data-[active=true]:opacity-100';

function activeParentTitle(items: NavItem[], isCurrentUrl: IsCurrentUrlFn): string | null {
    const activeParent = items.find((item) =>
        item.items?.some((subItem) => isCurrentUrl(subItem.href)),
    );

    return activeParent ? activeParent.title : null;
}

export function NavMain({ items = [], label = 'MOSSO' }: { items: NavItem[]; label?: string }) {
    const { isCurrentUrl, currentUrl } = useCurrentUrl();
    const [openTitle, setOpenTitle] = useState<string | null>(() =>
        activeParentTitle(items, isCurrentUrl),
    );
    const [trackedUrl, setTrackedUrl] = useState(currentUrl);

    // Re-sincroniza qué submenú debe estar abierto cuando cambia la URL (navegación),
    // siguiendo el patrón de React de ajustar estado durante el render en vez de en un efecto.
    if (currentUrl !== trackedUrl) {
        setTrackedUrl(currentUrl);
        setOpenTitle(activeParentTitle(items, isCurrentUrl));
    }

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    if (item.items?.length) {
                        const hasActiveChild = item.items.some((subItem) =>
                            isCurrentUrl(subItem.href),
                        );
                        const isOpen = openTitle === item.title;

                        return (
                            <Collapsible
                                key={item.title}
                                asChild
                                open={isOpen}
                                onOpenChange={(open) => setOpenTitle(open ? item.title : null)}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            isActive={hasActiveChild}
                                            tooltip={{ children: item.title }}
                                            className={activeClasses}
                                        >
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {item.items.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={isCurrentUrl(subItem.href)}
                                                        className={activeClasses}
                                                    >
                                                        <Link href={subItem.href} prefetch>
                                                            {subItem.icon && <subItem.icon />}
                                                            <span>{subItem.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        );
                    }

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(item.href)}
                                tooltip={{ children: item.title }}
                                className={activeClasses}
                            >
                                <Link href={item.href} prefetch onClick={() => setOpenTitle(null)}>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
