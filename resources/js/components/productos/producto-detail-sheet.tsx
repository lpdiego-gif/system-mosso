import { Link } from '@inertiajs/react';
import axios from 'axios';
import {
    Barcode,
    Boxes,
    Layers,
    Loader2,
    Package,
    PencilLine,
    Power,
    Tag,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { ProductoDetalle, ProductoRow } from '@/types/producto';

interface Props {
    productoId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAjustarStock: (producto: ProductoRow) => void;
    onToggleEstado: (producto: ProductoRow) => void;
    onEliminar: (producto: ProductoRow) => void;
}

const soles = (n: number) => `S/ ${Number(n || 0).toFixed(2)}`;

function fecha(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    return new Date(iso.replace(' ', 'T')).toLocaleDateString('es-PE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function ProductoDetailSheet({
    productoId,
    open,
    onOpenChange,
    onAjustarStock,
    onToggleEstado,
    onEliminar,
}: Props) {
    const [detalle, setDetalle] = useState<ProductoDetalle | null>(null);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        if (!open || productoId === null) {
            return;
        }

        let vivo = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- carga del detalle al abrir el panel
        setCargando(true);
        setDetalle(null);

        axios
            .get<ProductoDetalle>(route('admin.productos.show', productoId))
            .then(({ data }) => {
                if (vivo) {
                    setDetalle(data);
                }
            })
            .catch(() => {
                if (vivo) {
                    onOpenChange(false);
                }
            })
            .finally(() => {
                if (vivo) {
                    setCargando(false);
                }
            });

        return () => {
            vivo = false;
        };
    }, [open, productoId, onOpenChange]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md"
            >
                <SheetHeader className="border-b p-4 sm:p-5">
                    <SheetTitle>Detalle del producto</SheetTitle>
                    <SheetDescription className="sr-only">
                        Información completa y acciones rápidas del producto
                        seleccionado.
                    </SheetDescription>
                </SheetHeader>

                {cargando || !detalle ? (
                    <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground">
                        <Loader2 className="size-6 animate-spin" />
                    </div>
                ) : (
                    <div className="flex flex-1 flex-col">
                        {/* Cabecera */}
                        <div className="flex gap-4 p-4 sm:p-5">
                            <div className="size-24 shrink-0 overflow-hidden rounded-xl border bg-muted">
                                {detalle.imagen_url ? (
                                    <img
                                        src={detalle.imagen_url}
                                        alt={detalle.nombre}
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <div className="flex size-full items-center justify-center text-muted-foreground/40">
                                        <Package className="size-7" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-balance text-foreground">
                                    {detalle.nombre}
                                </h3>
                                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                                    <Tag className="size-3.5" />
                                    {detalle.marca_nombre ?? 'Sin marca'}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                                            detalle.activo
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                                                : 'bg-muted text-muted-foreground',
                                        )}
                                    >
                                        {detalle.estado_nombre}
                                    </span>
                                    {detalle.descuento_label ? (
                                        <span className="inline-flex items-center rounded-full bg-mosso-yellow/20 px-2 py-0.5 text-xs font-semibold text-mosso-dark ring-1 ring-inset ring-mosso-yellow/40 dark:text-mosso-yellow">
                                            {detalle.descuento_label}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {/* Precio + stock */}
                        <div className="grid grid-cols-2 gap-px border-y bg-border">
                            <div className="bg-card p-4">
                                <p className="text-xs text-muted-foreground">
                                    Precio
                                </p>
                                <p className="mt-1 text-lg font-semibold tabular-nums">
                                    {soles(detalle.precio_final)}
                                </p>
                                {detalle.precio_final !== detalle.precio ? (
                                    <p className="text-xs text-muted-foreground line-through">
                                        {soles(detalle.precio)}
                                    </p>
                                ) : null}
                            </div>
                            <div className="bg-card p-4">
                                <p className="text-xs text-muted-foreground">
                                    Stock
                                </p>
                                <p
                                    className={cn(
                                        'mt-1 text-lg font-semibold tabular-nums',
                                        detalle.stock === 0 &&
                                            'text-destructive',
                                        detalle.stock_bajo &&
                                            'text-amber-600 dark:text-amber-500',
                                    )}
                                >
                                    {detalle.stock}{' '}
                                    <span className="text-sm font-normal text-muted-foreground">
                                        {detalle.unidad_abreviatura}
                                    </span>
                                </p>
                                {detalle.stock === 0 ? (
                                    <p className="text-xs text-destructive">
                                        Sin stock
                                    </p>
                                ) : detalle.stock_bajo ? (
                                    <p className="text-xs text-amber-600 dark:text-amber-500">
                                        Stock bajo
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        {/* Datos */}
                        <dl className="divide-y text-sm">
                            <DetalleFila
                                icon={Barcode}
                                etiqueta="Código de barras"
                                valor={detalle.codigo_barras ?? '—'}
                                mono
                            />
                            <DetalleFila
                                icon={Package}
                                etiqueta="SKU"
                                valor={detalle.sku}
                                mono
                            />
                            <DetalleFila
                                icon={Layers}
                                etiqueta="Clasificación"
                                valor={[
                                    detalle.animal_nombre,
                                    detalle.categoria_nombre,
                                    detalle.subcategoria_nombre,
                                ]
                                    .filter(Boolean)
                                    .join(' · ') || '—'}
                            />
                            {detalle.etapa_nombre ? (
                                <DetalleFila
                                    icon={Boxes}
                                    etiqueta="Etapa de vida"
                                    valor={detalle.etapa_nombre}
                                />
                            ) : null}
                            <DetalleFila
                                icon={Boxes}
                                etiqueta="Unidad"
                                valor={detalle.unidad_nombre ?? '—'}
                            />
                        </dl>

                        {detalle.descripcion ? (
                            <div className="border-t p-4 sm:p-5">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Descripción
                                </p>
                                <p className="mt-1.5 text-sm whitespace-pre-line text-foreground">
                                    {detalle.descripcion}
                                </p>
                            </div>
                        ) : null}

                        <p className="px-4 py-3 text-xs text-muted-foreground sm:px-5">
                            Actualizado el {fecha(detalle.actualizado_en)}
                        </p>

                        {/* Acciones */}
                        <div className="mt-auto grid grid-cols-2 gap-2 border-t p-4 sm:p-5">
                            <Link
                                href={route(
                                    'admin.productos.edit',
                                    detalle.id_producto,
                                )}
                                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                            >
                                <PencilLine className="size-4" /> Editar
                            </Link>
                            <button
                                type="button"
                                onClick={() => onAjustarStock(detalle)}
                                className="inline-flex items-center justify-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
                            >
                                <Boxes className="size-4" /> Ajustar stock
                            </button>
                            <button
                                type="button"
                                onClick={() => onToggleEstado(detalle)}
                                className="inline-flex items-center justify-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
                            >
                                <Power className="size-4" />
                                {detalle.activo ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                                type="button"
                                onClick={() => onEliminar(detalle)}
                                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-background px-3 py-2 text-sm font-medium text-destructive shadow-xs transition-colors hover:bg-destructive/10"
                            >
                                <Trash2 className="size-4" /> Eliminar
                            </button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

function DetalleFila({
    icon: Icon,
    etiqueta,
    valor,
    mono,
}: {
    icon: React.ComponentType<{ className?: string }>;
    etiqueta: string;
    valor: string;
    mono?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-3 px-4 py-2.5 sm:px-5">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Icon className="size-3.5" />
                {etiqueta}
            </dt>
            <dd
                className={cn(
                    'max-w-[62%] text-right font-medium text-foreground',
                    mono && 'font-mono text-[0.8rem]',
                )}
            >
                {valor}
            </dd>
        </div>
    );
}
