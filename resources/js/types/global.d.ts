import type { Auth } from '@/types/auth';
import type { EmpresaPublica } from '@/types/empresa';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            carrito: { cantidad: number };
            misPermisos: string[];
            esSuperAdmin: boolean;
            puedeGestionarRoles: boolean;
            miRol: string | null;
            empresa: EmpresaPublica | null;
            [key: string]: unknown;
        };
    }
}
