import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

interface Producto {
    id_producto: number;
    sku: string;
    nombre: string;
    descripcion?: string | null;

    precio: number | string;
    stock: number;

    imagen_principal?: string | null;

    fk_marca: number;
    fk_unidad_medida: number;
    fk_id_subcategorias: number;
    fk_estado: number;

    animal_nombre?: string | null;
    categoria_nombre?: string | null;
    subcategoria_nombre?: string | null;

    marca_nombre?: string | null;

    unidad_nombre?: string | null;
    unidad_abreviatura?: string | null;

    estado_nombre?: string | null;

    created_at?: string;
    updated_at?: string;
}

interface Props {
    productos: Producto[];
}

function obtenerImagen(imagen: string | null | undefined) {
    if (!imagen) {
        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Las imágenes se guardan como:
    |
    | productos/archivo.webp
    |
    | y se sirven mediante:
    |
    | /storage/productos/archivo.webp
    |--------------------------------------------------------------------------
    */

    if (
        imagen.startsWith('http://') ||
        imagen.startsWith('https://') ||
        imagen.startsWith('/')
    ) {
        return imagen;
    }

    return `/storage/${imagen}`;
}

function obtenerEstadoActivo(
    estado: string | null | undefined,
) {
    return (
        estado?.trim().toLowerCase() ===
        'activo'
    );
}

export default function Index({
    productos,
}: Props) {
    return (
        <>
            <Head title="Productos" />

            <div className="w-full p-4 sm:p-6 lg:p-8">
                {/* ENCABEZADO */}

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            Productos
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Administra el catálogo y el
                            inventario de MOSSO.
                        </p>
                    </div>

                    <Link
                        href={route(
                            'admin.productos.create',
                        )}
                        className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 sm:w-auto"
                    >
                        + Nuevo producto
                    </Link>
                </div>

                {/* TABLA */}

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px] text-sm">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Producto
                                    </th>

                                    <th className="px-4 py-3 text-left font-medium">
                                        SKU
                                    </th>

                                    <th className="px-4 py-3 text-left font-medium">
                                        Animal
                                    </th>

                                    <th className="px-4 py-3 text-left font-medium">
                                        Categoría
                                    </th>

                                    <th className="px-4 py-3 text-left font-medium">
                                        Subcategoría
                                    </th>

                                    <th className="px-4 py-3 text-right font-medium">
                                        Precio
                                    </th>

                                    <th className="px-4 py-3 text-center font-medium">
                                        Stock
                                    </th>

                                    <th className="px-4 py-3 text-center font-medium">
                                        Estado
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {productos.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-12 text-center text-muted-foreground"
                                        >
                                            No hay productos
                                            registrados.
                                        </td>
                                    </tr>
                                ) : (
                                    productos.map(
                                        (producto) => {
                                            const imagen =
                                                obtenerImagen(
                                                    producto.imagen_principal,
                                                );

                                            const activo =
                                                obtenerEstadoActivo(
                                                    producto.estado_nombre,
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        producto.id_producto
                                                    }
                                                    className="transition hover:bg-muted/30"
                                                >
                                                    {/* PRODUCTO */}

                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-muted">
                                                                {imagen ? (
                                                                    <img
                                                                        src={
                                                                            imagen
                                                                        }
                                                                        alt={
                                                                            producto.nombre
                                                                        }
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                                                        SIN
                                                                        IMAGEN
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="truncate font-medium">
                                                                    {
                                                                        producto.nombre
                                                                    }
                                                                </p>

                                                                <p className="truncate text-xs text-muted-foreground">
                                                                    {
                                                                        producto.marca_nombre
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* SKU */}

                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-xs">
                                                            {
                                                                producto.sku
                                                            }
                                                        </span>
                                                    </td>

                                                    {/* ANIMAL */}

                                                    <td className="px-4 py-3">
                                                        <span className="font-medium">
                                                            {producto.animal_nombre ||
                                                                '—'}
                                                        </span>
                                                    </td>

                                                    {/* CATEGORÍA */}

                                                    <td className="px-4 py-3">
                                                        <span>
                                                            {producto.categoria_nombre ||
                                                                '—'}
                                                        </span>
                                                    </td>

                                                    {/* SUBCATEGORÍA */}

                                                    <td className="px-4 py-3">
                                                        <span className="text-muted-foreground">
                                                            {producto.subcategoria_nombre ||
                                                                '—'}
                                                        </span>
                                                    </td>

                                                    {/* PRECIO */}

                                                    <td className="px-4 py-3 text-right font-medium">
                                                        S/{' '}
                                                        {Number(
                                                            producto.precio,
                                                        ).toFixed(
                                                            2,
                                                        )}
                                                    </td>

                                                    {/* STOCK */}

                                                    <td className="px-4 py-3 text-center">
                                                        <span
                                                            className={
                                                                producto.stock >
                                                                    0
                                                                    ? 'font-semibold'
                                                                    : 'font-semibold text-destructive'
                                                            }
                                                        >
                                                            {
                                                                producto.stock
                                                            }
                                                        </span>
                                                    </td>

                                                    {/* ESTADO */}

                                                    <td className="px-4 py-3 text-center">
                                                        <span
                                                            className={
                                                                activo
                                                                    ? 'inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-500'
                                                                    : 'inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground'
                                                            }
                                                        >
                                                            {producto.estado_nombre ||
                                                                'Sin estado'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        },
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}