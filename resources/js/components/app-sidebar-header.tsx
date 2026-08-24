import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { NavUser } from './nav-user';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border/50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 lg:px-5 transition-all duration-200 ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2 hidden md:block" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
                <NavUser />
            </div>
        </header>
    );
}
