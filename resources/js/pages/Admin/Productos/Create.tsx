import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Package, ScanBarcode } from 'lucide-react';
import { route } from 'ziggy-js';
import ProductoForm from '@/components/productos/producto-form';
import type { ProductoFormLookups } from '@/types/producto';

export default function Create(props: ProductoFormLookups) {
    return (
        <>
            <Head title="Nuevo producto" />

            <div className="mx-auto w-full space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mosso-yellow/15 text-mosso-dark ring-1 ring-mosso-yellow/30 ring-inset dark:text-mosso-yellow">
                            <Package className="size-5" />
                        </span>
                        <div className="space-y-1">
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                Nuevo producto
                            </h1>
                            <p className="max-w-prose text-sm text-pretty text-muted-foreground">
                                Registra un producto en el catálogo e inventario
                                de MOSSO.
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 self-start sm:self-auto">
                        <Link
                            href={route('admin.productos.entrada-rapida')}
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
                        >
                            <ScanBarcode className="size-4" /> Entrada rápida
                        </Link>
                        <Link
                            href={route('admin.productos.index')}
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
                        >
                            <ArrowLeft className="size-4" /> Volver
                        </Link>
                    </div>
                </div>

                <ProductoForm lookups={props} />
            </div>
        </>
    );
}

Create.layout = {
    breadcrumbs: [
        { title: 'Productos', href: '/admin/productos' },
        { title: 'Nuevo', href: '/admin/productos/create' },
    ],
};
