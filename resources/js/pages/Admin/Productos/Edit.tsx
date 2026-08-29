import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Package } from 'lucide-react';
import { route } from 'ziggy-js';
import ProductoForm from '@/components/productos/producto-form';
import type {
    CategoriaOption,
    EstadoOption,
    EtapaOption,
    ProductoEditData,
    SubCategoriaOption,
    AnimalOption,
    MarcaOption,
    UnidadOption,
} from '@/types/producto';

interface Props {
    animales: AnimalOption[];
    marcas: MarcaOption[];
    unidades: UnidadOption[];
    estados: EstadoOption[];
    categorias: CategoriaOption[];
    subcategorias: SubCategoriaOption[];
    etapas: EtapaOption[];
    producto: ProductoEditData;
}

export default function Edit({
    animales,
    marcas,
    unidades,
    estados,
    categorias,
    subcategorias,
    etapas,
    producto,
}: Props) {
    return (
        <>
            <Head title={`Editar · ${producto.nombre}`} />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mosso-yellow/15 text-mosso-dark ring-1 ring-inset ring-mosso-yellow/30 dark:text-mosso-yellow">
                            <Package className="size-5" />
                        </span>
                        <div className="space-y-1">
                            <h1 className="text-xl font-semibold tracking-tight text-balance text-foreground sm:text-2xl">
                                Editar producto
                            </h1>
                            <p className="max-w-prose text-sm text-pretty text-muted-foreground">
                                Actualiza los datos de{' '}
                                <span className="font-medium text-foreground">
                                    {producto.nombre}
                                </span>
                                .
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route('admin.productos.index')}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent sm:self-auto"
                    >
                        <ArrowLeft className="size-4" /> Volver
                    </Link>
                </div>

                <ProductoForm
                    lookups={{ animales, marcas, unidades, estados }}
                    producto={producto}
                    categorias={categorias}
                    subcategorias={subcategorias}
                    etapas={etapas}
                />
            </div>
        </>
    );
}

Edit.layout = {
    breadcrumbs: [
        { title: 'Productos', href: '/admin/productos' },
        { title: 'Editar', href: '#' },
    ],
};
