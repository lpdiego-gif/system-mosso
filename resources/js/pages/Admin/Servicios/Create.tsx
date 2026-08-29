import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Scissors } from 'lucide-react';
import { route } from 'ziggy-js';
import ServicioForm from '@/components/servicios/servicio-form';
import { ServicioPageHeader } from '@/components/servicios/servicio-page-header';
import { Button } from '@/components/ui/button';
import type { ServicioFormLookups } from '@/types/servicio';

export default function Create(props: ServicioFormLookups) {
    return (
        <>
            <Head title="Nuevo servicio" />

            <div className="mx-auto w-full space-y-6 p-4 sm:p-6 lg:p-8">
                <ServicioPageHeader
                    icon={Scissors}
                    title="Nuevo servicio"
                    description="Registra un servicio (grooming, veterinaria, etc.) para el Portal Web de MOSSO."
                    action={
                        <Button asChild variant="outline" size="sm" className="gap-1.5">
                            <Link href={route('admin.servicios.index')}>
                                <ArrowLeft className="size-4" /> Volver
                            </Link>
                        </Button>
                    }
                />

                <ServicioForm lookups={props} />
            </div>
        </>
    );
}

Create.layout = {
    breadcrumbs: [
        { title: 'Servicios', href: '/admin/servicios' },
        { title: 'Nuevo', href: '/admin/servicios/create' },
    ],
};
