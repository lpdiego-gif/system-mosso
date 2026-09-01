import { usePage } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import PanelAcceso from '@/components/PanelAcceso';

/**
 * Evento que abre el modal de acceso desde cualquier parte del storefront
 * (icono de usuario del Header, "Mi cuenta" del MobileMenu). Mismo patrón de
 * eventos DOM que usa `use-favoritos` para no pasar props por todo el árbol.
 */
export const EVENTO_ABRIR_ACCESO = 'mosso:abrir-acceso';

export function abrirAcceso(): void {
    window.dispatchEvent(new Event(EVENTO_ABRIR_ACCESO));
}

/**
 * Modal de login/registro del Portal Web. Va montado una vez en
 * `StorefrontLayout`, así está disponible en todas las páginas públicas sin
 * navegar a `/cuenta` (esa página sigue existiendo para visitas directas y
 * para las redirecciones del backend a invitados — ver `redirectGuestsTo`).
 */
export default function ModalAcceso() {
    const { auth } = usePage().props;
    const autenticado = Boolean(auth?.user);
    const [abierto, setAbierto] = useState(false);

    const cerrar = useCallback(() => setAbierto(false), []);

    useEffect(() => {
        const abrir = () => setAbierto(true);

        window.addEventListener(EVENTO_ABRIR_ACCESO, abrir);

        return () => window.removeEventListener(EVENTO_ABRIR_ACCESO, abrir);
    }, []);

    // Con sesión el modal no se muestra (aunque quede `abierto=true` de antes):
    // el login exitoso redirige, pero por si el layout no llega a desmontarse.
    const visible = abierto && !autenticado;

    useEffect(() => {
        if (!visible) {
            return;
        }

        const alPresionar = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                cerrar();
            }
        };

        document.addEventListener('keydown', alPresionar);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', alPresionar);
            document.body.style.overflow = '';
        };
    }, [visible, cerrar]);

    if (!visible) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[55] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
            <button
                type="button"
                aria-label="Cerrar"
                onClick={cerrar}
                className="fixed inset-0 bg-black/50"
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-acceso"
                className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl sm:p-8"
            >
                <button
                    type="button"
                    onClick={cerrar}
                    aria-label="Cerrar"
                    className="absolute top-4 right-4 text-gray-400 transition-colors hover:text-gray-700"
                >
                    <X className="size-5" />
                </button>

                <span id="titulo-acceso" className="sr-only">
                    Iniciar sesión o crear cuenta
                </span>

                <PanelAcceso onCerrarCodigo={cerrar} />
            </div>
        </div>
    );
}
