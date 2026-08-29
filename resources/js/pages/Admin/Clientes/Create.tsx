import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Users } from 'lucide-react';
import { route } from 'ziggy-js';
import ClienteForm from '@/components/clientes/cliente-form';
import type { TipoDocumentoOption } from '@/types/cliente';

interface Props {
    tiposDocumento: TipoDocumentoOption[];
}

export default function Create({ tiposDocumento }: Props) {
    return (
        <>
            <Head title="Nuevo cliente" />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mosso-yellow/15 text-mosso-dark ring-1 ring-inset ring-mosso-yellow/30 dark:text-mosso-yellow">
                            <Users className="size-5" />
                        </span>
                        <div className="space-y-1">
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                Nuevo cliente
                            </h1>
                            <p className="max-w-prose text-sm text-pretty text-muted-foreground">
                                Registra los datos de la persona, su contacto y,
                                si aplica, la cuenta de acceso a la tienda.
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route('admin.clientes.index')}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent sm:self-auto"
                    >
                        <ArrowLeft className="size-4" /> Volver
                    </Link>
                </div>

                <ClienteForm tiposDocumento={tiposDocumento} />
            </div>
        </>
    );
}

Create.layout = {
    breadcrumbs: [
        { title: 'Clientes', href: '/admin/clientes' },
        { title: 'Nuevo', href: '/admin/clientes/create' },
    ],
};
