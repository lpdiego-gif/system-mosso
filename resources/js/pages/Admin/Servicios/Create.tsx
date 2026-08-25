import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import ServicioForm from '@/components/servicios/servicio-form';
import type { ServicioFormLookups } from '@/types/servicio';

export default function Create(props: ServicioFormLookups) {
    return (
        <>
            <Head title="Nuevo servicio" />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Nuevo servicio</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Registra un servicio (grooming, veterinaria, etc.) para el Portal Web de MOSSO.
                        </p>
                    </div>

                    <Link href={route('admin.servicios.index')} className="text-sm text-muted-foreground hover:text-foreground">
                        ← Volver a servicios
                    </Link>
                </div>

                <ServicioForm lookups={props} />
            </div>
        </>
    );
}
