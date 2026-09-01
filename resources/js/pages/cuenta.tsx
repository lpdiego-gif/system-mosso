import { Head, usePage } from '@inertiajs/react';
import PanelAcceso from '@/components/PanelAcceso';
import StorefrontLayout from '@/layouts/storefront-layout';

const cardClass =
    'rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-200/60 sm:p-8';

/**
 * Página pública de login/registro. Se llega aquí por visita directa a
 * `/cuenta` o por una redirección del backend a un invitado (ver
 * `redirectGuestsTo` en `bootstrap/app.php`). Desde el header del storefront,
 * en cambio, el mismo formulario se abre como modal (`components/ModalAcceso`)
 * sin navegar.
 *
 * Si ya hay sesión, `CuentaController` redirige antes de llegar aquí (a
 * `/mi-cuenta` o `/dashboard` según el tipo de cuenta).
 */
export default function Cuenta() {
    const { status, canResetPassword } = usePage().props as unknown as {
        status?: string;
        canResetPassword?: boolean;
    };

    return (
        <StorefrontLayout>
            <Head title="Mi cuenta" />

            <section className="mx-auto flex w-full max-w-md flex-col px-4 py-10 sm:px-6 sm:py-16">
                {status && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

                <div className={cardClass}>
                    <PanelAcceso canResetPassword={canResetPassword ?? true} />
                </div>
            </section>
        </StorefrontLayout>
    );
}
