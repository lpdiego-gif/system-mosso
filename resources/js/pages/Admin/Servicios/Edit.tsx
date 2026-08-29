import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Scissors } from 'lucide-react';
import { route } from 'ziggy-js';
import ServicioForm from '@/components/servicios/servicio-form';
import { ServicioPageHeader } from '@/components/servicios/servicio-page-header';
import { Button } from '@/components/ui/button';
import type { ServicioEditData, ServicioFormLookups } from '@/types/servicio';

interface Props extends ServicioFormLookups {
    servicio: ServicioEditData;
}

export default function Edit({ servicio, ...lookups }: Props) {
    return (
        <>
            <Head title={`Editar ${servicio.nombre_servicio}`} />

            <div className="mx-auto w-full space-y-6 p-4 sm:p-6 lg:p-8">
                <ServicioPageHeader
                    icon={Scissors}
                    title="Editar servicio"
                    description={
                        <>
                            <span className="font-medium text-foreground">
                                {servicio.nombre_negocio}
                            </span>{' '}
                            · {servicio.nombre_servicio}
                        </>
                    }
                    action={
                        <Button asChild variant="outline" size="sm" className="gap-1.5">
                            <Link href={route('admin.servicios.index')}>
                                <ArrowLeft className="size-4" /> Volver
                            </Link>
                        </Button>
                    }
                />

                <ServicioForm lookups={lookups} servicio={servicio} />
            </div>
        </>
    );
}

Edit.layout = {
    breadcrumbs: [
        { title: 'Servicios', href: '/admin/servicios' },
        { title: 'Editar', href: '#' },
    ],
};
