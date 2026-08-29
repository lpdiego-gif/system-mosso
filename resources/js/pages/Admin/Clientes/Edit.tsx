import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, Users } from 'lucide-react';
import { route } from 'ziggy-js';
import ClienteForm from '@/components/clientes/cliente-form';
import type { ClienteEditData, TipoDocumentoOption } from '@/types/cliente';

interface Props {
    tiposDocumento: TipoDocumentoOption[];
    cliente: ClienteEditData;
}

export default function Edit({ tiposDocumento, cliente }: Props) {
    const nombre =
        [cliente.nombres, cliente.apellido_paterno, cliente.apellido_materno]
            .filter(Boolean)
            .join(' ') ||
        cliente.razon_social ||
        cliente.correo;

    return (
        <>
            <Head title={`Editar · ${nombre}`} />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mosso-yellow/15 text-mosso-dark ring-1 ring-inset ring-mosso-yellow/30 dark:text-mosso-yellow">
                            <Users className="size-5" />
                        </span>
                        <div className="space-y-1">
                            <h1 className="text-xl font-semibold tracking-tight text-balance text-foreground sm:text-2xl">
                                Editar cliente
                            </h1>
                            <p className="max-w-prose text-sm text-pretty text-muted-foreground">
                                Actualiza los datos de{' '}
                                <span className="font-medium text-foreground">
                                    {nombre}
                                </span>
                                .
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
                        <Link
                            href={route(
                                'admin.clientes.show',
                                cliente.id_cliente,
                            )}
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
                        >
                            <ExternalLink className="size-4" /> Ficha
                        </Link>
                        <Link
                            href={route('admin.clientes.index')}
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
                        >
                            <ArrowLeft className="size-4" /> Volver
                        </Link>
                    </div>
                </div>

                <ClienteForm tiposDocumento={tiposDocumento} cliente={cliente} />
            </div>
        </>
    );
}

Edit.layout = {
    breadcrumbs: [
        { title: 'Clientes', href: '/admin/clientes' },
        { title: 'Editar', href: '#' },
    ],
};
