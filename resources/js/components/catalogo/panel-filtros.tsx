import { useEffect, useState } from 'react';
import type { NivelCatalogo, OpcionFacet } from '@/hooks/use-catalogo-filtros';

interface PanelFiltrosProps {
    nivel: NivelCatalogo;
    oferta: boolean;
    onOferta: (v: boolean) => void;
    precioActivo: [number, number];
    rangoCompleto: [number, number];
    onPrecio: (v: [number, number] | null) => void;
    marcasSeleccionadas: number[];
    opcionesMarca: OpcionFacet[];
    onToggleMarca: (id: number) => void;
    categoriaId: number | null;
    opcionesCategoria: OpcionFacet[];
    onCategoria: (id: number | null) => void;
    subcategoriaId: number | null;
    opcionesSubcategoria: OpcionFacet[];
    onSubcategoria: (id: number | null) => void;
}

export default function PanelFiltros({
    nivel,
    oferta,
    onOferta,
    precioActivo,
    rangoCompleto,
    onPrecio,
    marcasSeleccionadas,
    opcionesMarca,
    onToggleMarca,
    categoriaId,
    opcionesCategoria,
    onCategoria,
    subcategoriaId,
    opcionesSubcategoria,
    onSubcategoria,
}: PanelFiltrosProps) {
    const [minInput, setMinInput] = useState(String(precioActivo[0]));
    const [maxInput, setMaxInput] = useState(String(precioActivo[1]));

    // Si el usuario quita el filtro de precio desde un chip, refleja el rango completo en los inputs.
    useEffect(() => {
        setMinInput(String(precioActivo[0]));
        setMaxInput(String(precioActivo[1]));
    }, [precioActivo]);

    const aplicarPrecio = () => {
        const min = Number(minInput);
        const max = Number(maxInput);
        if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) return;

        if (min <= rangoCompleto[0] && max >= rangoCompleto[1]) {
            onPrecio(null);
        } else {
            onPrecio([min, max]);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <Seccion titulo="Ofertas">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={oferta}
                        onChange={(e) => onOferta(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-mosso-yellow focus:ring-mosso-yellow"
                    />
                    Solo productos en oferta
                </label>
            </Seccion>

            <Seccion titulo="Precio">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 flex-1">
                        <span className="text-xs text-gray-400">S/</span>
                        <input
                            type="number"
                            min={rangoCompleto[0]}
                            max={rangoCompleto[1]}
                            value={minInput}
                            onChange={(e) => setMinInput(e.target.value)}
                            onBlur={aplicarPrecio}
                            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-mosso-yellow focus:outline-none"
                        />
                    </div>
                    <span className="text-gray-300">—</span>
                    <div className="flex items-center gap-1 flex-1">
                        <span className="text-xs text-gray-400">S/</span>
                        <input
                            type="number"
                            min={rangoCompleto[0]}
                            max={rangoCompleto[1]}
                            value={maxInput}
                            onChange={(e) => setMaxInput(e.target.value)}
                            onBlur={aplicarPrecio}
                            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-mosso-yellow focus:outline-none"
                        />
                    </div>
                </div>
                <button
                    onClick={aplicarPrecio}
                    className="mt-2 w-full text-xs font-bold text-mosso-dark hover:underline"
                >
                    Aplicar rango
                </button>
            </Seccion>

            {nivel === 'animal' && opcionesCategoria.length > 0 && (
                <Seccion titulo="Categoría">
                    <ListaFacetUnica
                        opciones={opcionesCategoria}
                        seleccionado={categoriaId}
                        onSeleccionar={onCategoria}
                    />
                </Seccion>
            )}

            {(nivel === 'animal' || nivel === 'categoria') && opcionesSubcategoria.length > 0 && (
                <Seccion titulo="Subcategoría">
                    <ListaFacetUnica
                        opciones={opcionesSubcategoria}
                        seleccionado={subcategoriaId}
                        onSeleccionar={onSubcategoria}
                    />
                </Seccion>
            )}

            {opcionesMarca.length > 0 && (
                <Seccion titulo="Marca">
                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                        {opcionesMarca.map((m) => (
                            <label key={m.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={marcasSeleccionadas.includes(m.id)}
                                    onChange={() => onToggleMarca(m.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-mosso-yellow focus:ring-mosso-yellow"
                                />
                                <span className="flex-1">{m.nombre}</span>
                                <span className="text-xs text-gray-400">({m.cantidad})</span>
                            </label>
                        ))}
                    </div>
                </Seccion>
            )}
        </div>
    );
}

function ListaFacetUnica({
    opciones,
    seleccionado,
    onSeleccionar,
}: {
    opciones: OpcionFacet[];
    seleccionado: number | null;
    onSeleccionar: (id: number | null) => void;
}) {
    return (
        <div className="flex flex-col gap-1">
            <button
                onClick={() => onSeleccionar(null)}
                className={`text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                    seleccionado === null ? 'bg-mosso-yellow/15 text-mosso-dark font-bold' : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
                Todas
            </button>
            {opciones.map((o) => (
                <button
                    key={o.id}
                    onClick={() => onSeleccionar(o.id)}
                    className={`flex items-center justify-between text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                        seleccionado === o.id ? 'bg-mosso-yellow/15 text-mosso-dark font-bold' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <span>{o.nombre}</span>
                    <span className="text-xs text-gray-400">({o.cantidad})</span>
                </button>
            ))}
        </div>
    );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">{titulo}</h3>
            {children}
        </div>
    );
}
