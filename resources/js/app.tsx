// Must stay the first import — see resources/js/bootstrap-ziggy.ts for why.
import './bootstrap-ziggy';
import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'libro-de-reclamaciones':
            case name === 'cambios-y-devoluciones':
            case name === 'cuenta':
            case name === 'auth/reset-password':
            case name === 'auth/two-factor-challenge':
            // All mi-cuenta/* pages own their StorefrontLayout — never wrap with AppLayout.
            // auth/reset-password & auth/two-factor-challenge above render their own too.
            case name.startsWith('mi-cuenta'):
            case name.startsWith('catalogo/'):
            case name.startsWith('carrito/'):
            case name.startsWith('checkout/'):
            case name.startsWith('servicios/'):
            case name.startsWith('marcas/'):
            case name === 'buscar':
            case name === 'favoritos':
            case name === 'ofertas':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
