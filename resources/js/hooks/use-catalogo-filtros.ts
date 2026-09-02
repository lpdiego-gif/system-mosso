import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ProductoCatalogo } from '@/types/producto';

export type OrdenCatalogo = 'relevancia' | 'precio_asc' | 'precio_desc' | 'novedades' | 'descuento';

export type NivelCatalogo = 'animal' | 'categoria' | 'subcategoria';

export interface OpcionFacet {
    id: number;
    nombre: string;
    cantidad: number;
}

interface FiltrosState {
    orden: OrdenCatalogo;
    oferta: boolean;
    marcas: number[];
    categoriaId: number | null;
    subcategoriaId: number | null;
    /** null = todavía no lo tocó el usuario -> se usa el rango completo derivado de `productos`. */
    precio: [number, number] | null;
}

const ORDEN_DEFECTO: OrdenCatalogo = 'relevancia';
const ORDENES_VALIDOS: OrdenCatalogo[] = ['relevancia', 'precio_asc', 'precio_desc', 'novedades', 'descuento'];

function leerNumeroCsv(valor: string | null): number[] {
    if (!valor) return [];
    return valor
        .split(',')
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n));
}

function leerRango(valor: string | null): [number, number] | null {
    if (!valor) return null;
    const [min, max] = valor.split('-').map((v) => Number(v));
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return [min, max];
}

function parsearFiltrosDesdeUrl(): FiltrosState {
    if (typeof window === 'undefined') {
        return { orden: ORDEN_DEFECTO, oferta: false, marcas: [], categoriaId: null, subcategoriaId: null, precio: null };
    }

    const params = new URLSearchParams(window.location.search);
    const orden = params.get('orden') as OrdenCatalogo | null;

    return {
        orden: orden && ORDENES_VALIDOS.includes(orden) ? orden : ORDEN_DEFECTO,
        oferta: params.get('oferta') === '1',
        marcas: leerNumeroCsv(params.get('marca')),
        categoriaId: params.get('categoria') ? Number(params.get('categoria')) : null,
        subcategoriaId: params.get('subcategoria') ? Number(params.get('subcategoria')) : null,
        precio: leerRango(params.get('precio')),
    };
}

function construirUrl(filtros: FiltrosState): string {
    const params = new URLSearchParams();

    if (filtros.orden !== ORDEN_DEFECTO) params.set('orden', filtros.orden);
    if (filtros.oferta) params.set('oferta', '1');
    if (filtros.marcas.length > 0) params.set('marca', filtros.marcas.join(','));
    if (filtros.categoriaId !== null) params.set('categoria', String(filtros.categoriaId));
    if (filtros.subcategoriaId !== null) params.set('subcategoria', String(filtros.subcategoriaId));
    if (filtros.precio !== null) params.set('precio', `${Math.round(filtros.precio[0])}-${Math.round(filtros.precio[1])}`);

    const qs = params.toString();
    return qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
}

/**
 * Aplica el subconjunto de filtros indicado sobre `productos`, opcionalmente
 * saltándose uno de ellos (`excluir`). Se usa tanto para el resultado final
 * (sin excluir nada) como para calcular el contador de cada opción de un facet
 * (marca/categoría/subcategoría) contra los DEMÁS filtros activos.
 */
function aplicarFiltros(productos: ProductoCatalogo[], filtros: FiltrosState, excluir?: keyof FiltrosState): ProductoCatalogo[] {
    let resultado = productos;

    if (excluir !== 'oferta' && filtros.oferta) {
        resultado = resultado.filter((p) => p.porcentajeOff !== null);
    }

    if (excluir !== 'precio' && filtros.precio !== null) {
        const [min, max] = filtros.precio;
        resultado = resultado.filter((p) => p.precioFinal >= min && p.precioFinal <= max);
    }

    if (excluir !== 'marcas' && filtros.marcas.length > 0) {
        resultado = resultado.filter((p) => p.marcaId !== null && filtros.marcas.includes(p.marcaId));
    }

    if (excluir !== 'categoriaId' && filtros.categoriaId !== null) {
        resultado = resultado.filter((p) => p.categoriaId === filtros.categoriaId);
    }

    if (excluir !== 'subcategoriaId' && filtros.subcategoriaId !== null) {
        resultado = resultado.filter((p) => p.subcategoriaId === filtros.subcategoriaId);
    }

    return resultado;
}

function ordenar(lista: ProductoCatalogo[], orden: OrdenCatalogo): ProductoCatalogo[] {
    const copia = [...lista];

    switch (orden) {
        case 'precio_asc':
            return copia.sort((a, b) => a.precioFinal - b.precioFinal);
        case 'precio_desc':
            return copia.sort((a, b) => b.precioFinal - a.precioFinal);
        case 'novedades':
            // `productos` no expone una columna de fecha en este payload (ver
            // CatalogoController::formato()); el id autoincremental es un proxy
            // válido de "más reciente primero".
            return copia.sort((a, b) => b.id - a.id);
        case 'descuento':
            return copia.sort((a, b) => {
                if (a.porcentajeOff === null && b.porcentajeOff === null) return 0;
                if (a.porcentajeOff === null) return 1;
                if (b.porcentajeOff === null) return -1;
                return b.porcentajeOff - a.porcentajeOff;
            });
        case 'relevancia':
        default:
            // Sin flag "destacado" en `productos` (mismo gotcha documentado en
            // HomeService::productosDestacados): relevancia = con stock primero,
            // preservando el orden que ya trae el controlador (latest('created_at'))
            // gracias a que Array.prototype.sort es estable.
            return copia.sort((a, b) => (a.stock > 0 ? 0 : 1) - (b.stock > 0 ? 0 : 1));
    }
}

function agruparFacet(productos: ProductoCatalogo[], idKey: 'marcaId' | 'categoriaId' | 'subcategoriaId', nombreKey: 'marca' | 'categoriaNombre' | 'subcategoriaNombre'): OpcionFacet[] {
    const conteo = new Map<number, OpcionFacet>();

    for (const p of productos) {
        const id = p[idKey];
        const nombre = p[nombreKey];
        if (id === null || !nombre) continue;

        const actual = conteo.get(id);
        if (actual) {
            actual.cantidad += 1;
        } else {
            conteo.set(id, { id, nombre, cantidad: 1 });
        }
    }

    return Array.from(conteo.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function useCatalogoFiltros(productos: ProductoCatalogo[], nivel: NivelCatalogo) {
    const [filtros, setFiltros] = useState<FiltrosState>(() => parsearFiltrosDesdeUrl());

    useEffect(() => {
        const alNavegar = () => setFiltros(parsearFiltrosDesdeUrl());
        window.addEventListener('popstate', alNavegar);
        return () => window.removeEventListener('popstate', alNavegar);
    }, []);

    const rangoCompleto = useMemo<[number, number]>(() => {
        if (productos.length === 0) return [0, 0];
        const precios = productos.map((p) => p.precioFinal);
        return [Math.floor(Math.min(...precios)), Math.ceil(Math.max(...precios))];
    }, [productos]);

    const actualizar = useCallback((cambios: Partial<FiltrosState>) => {
        setFiltros((prev) => {
            const siguiente = { ...prev, ...cambios };
            window.history.pushState(siguiente, '', construirUrl(siguiente));
            return siguiente;
        });
    }, []);

    const limpiarFiltros = useCallback(() => {
        actualizar({ oferta: false, marcas: [], categoriaId: null, subcategoriaId: null, precio: null });
    }, [actualizar]);

    const toggleMarca = useCallback(
        (id: number) => {
            const marcas = filtros.marcas.includes(id) ? filtros.marcas.filter((m) => m !== id) : [...filtros.marcas, id];
            actualizar({ marcas });
        },
        [filtros.marcas, actualizar],
    );

    const seleccionarCategoria = useCallback(
        (id: number | null) => {
            // Cambiar de categoría invalida cualquier subcategoría elegida bajo la anterior.
            actualizar({ categoriaId: id, subcategoriaId: null });
        },
        [actualizar],
    );

    const seleccionarSubcategoria = useCallback(
        (id: number | null) => {
            actualizar({ subcategoriaId: id });
        },
        [actualizar],
    );

    const opcionesMarca = useMemo(
        () => agruparFacet(aplicarFiltros(productos, filtros, 'marcas'), 'marcaId', 'marca'),
        [productos, filtros],
    );

    const opcionesCategoria = useMemo(
        () => (nivel === 'animal' ? agruparFacet(aplicarFiltros(productos, filtros, 'categoriaId'), 'categoriaId', 'categoriaNombre') : []),
        [productos, filtros, nivel],
    );

    const opcionesSubcategoria = useMemo(
        () =>
            nivel === 'animal' || nivel === 'categoria'
                ? agruparFacet(aplicarFiltros(productos, filtros, 'subcategoriaId'), 'subcategoriaId', 'subcategoriaNombre')
                : [],
        [productos, filtros, nivel],
    );

    const resultado = useMemo(() => ordenar(aplicarFiltros(productos, filtros), filtros.orden), [productos, filtros]);

    const precioActivo = filtros.precio ?? rangoCompleto;

    const hayFiltrosActivos =
        filtros.oferta || filtros.marcas.length > 0 || filtros.categoriaId !== null || filtros.subcategoriaId !== null || filtros.precio !== null;

    return {
        filtros,
        resultado,
        rangoCompleto,
        precioActivo,
        opcionesMarca,
        opcionesCategoria,
        opcionesSubcategoria,
        hayFiltrosActivos,
        setOrden: (orden: OrdenCatalogo) => actualizar({ orden }),
        setOferta: (oferta: boolean) => actualizar({ oferta }),
        setPrecio: (precio: [number, number] | null) => actualizar({ precio }),
        toggleMarca,
        seleccionarCategoria,
        seleccionarSubcategoria,
        limpiarFiltros,
    };
}
