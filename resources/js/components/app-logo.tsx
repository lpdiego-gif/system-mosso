import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name, empresa, miRol } = usePage().props;

    const nombre = empresa?.nombre_comercial || empresa?.razon_social || name;
    const logoUrl = empresa?.logo ? `/storage/${empresa.logo}` : null;

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                {logoUrl ? (
                    <img src={logoUrl} alt={nombre} className="size-full object-contain" />
                ) : (
                    <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
                )}
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-semibold">{nombre}</span>
                {miRol && (
                    <span className="truncate text-xs leading-tight text-muted-foreground">
                        {miRol}
                    </span>
                )}
            </div>
        </>
    );
}
