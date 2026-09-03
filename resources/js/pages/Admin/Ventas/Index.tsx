import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Download, Eye, FileText, Loader2, Receipt, Search, Send } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';

interface TipoComprobante {
    id_tipo_comprobante: number;
    nombre: string;
}

interface VentaRow {
    id_comprobante: number;
    serie_numero: string;
    tipo: string;
    id_tipo_comprobante: number;
    fecha_emision: string;
    cliente: string;
    documento: string | null;
    total: number;
    estado_sunat: string;
    correo_enviado_en: string | null;
}

interface PaginatedMeta {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

interface PageProps {
    filtros: { tipo: number | null; desde: string | null; hasta: string | null; estado_sunat: string | null; q: string | null; page: number; perPage: number };
    opciones: { tipos: TipoComprobante[]; porPagina: number[] };
}

const soles = (n: number) => `S/ ${n.toFixed(2)}`;

export default function VentasIndex({ opciones }: PageProps) {
    const [rows, setRows] = useState<VentaRow[]>([]);
    const [meta, setMeta] = useState<PaginatedMeta>({ current_page: 1, per_page: 10, total: 0, last_page: 1 });
    const [loading, setLoading] = useState(true);
    const [reenviando, setReenviando] = useState<number | null>(null);

    const [q, setQ] = useState('');
    const [tipo, setTipo] = useState('todos');
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState('10');

    const abortRef = useRef<AbortController | null>(null);

    const cargar = useCallback(() => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        axios
            .get('/admin/ventas/data', {
                params: {
                    q: q || undefined,
                    tipo: tipo !== 'todos' ? tipo : undefined,
                    desde: desde || undefined,
                    hasta: hasta || undefined,
                    page,
                    per_page: perPage,
                },
                signal: controller.signal,
            })
            .then((response: { data: { data: VentaRow[]; meta: PaginatedMeta } }) => {
                setRows(response.data.data);
                setMeta(response.data.meta);
            })
            .catch((err: any) => {
                if (axios.isCancel(err)) return;
            })
            .finally(() => setLoading(false));
    }, [q, tipo, desde, hasta, page, perPage]);

    useEffect(() => {
        const t = window.setTimeout(cargar, q ? 400 : 0);
        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, tipo, desde, hasta, page, perPage]);

    useEffect(() => {
        setPage(1);
    }, [q, tipo, desde, hasta, perPage]);

    async function reenviar(id: number) {
        setReenviando(id);
        try {
            const { data } = await axios.post(`/comprobante/${id}/reenviar`, {});
            alert(data.message);
            cargar();
        } catch (err: any) {
            alert(err.response?.data?.message ?? 'No se pudo reenviar el comprobante.');
        } finally {
            setReenviando(null);
        }
    }

    const desdeReg = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
    const hastaReg = Math.min(meta.current_page * meta.per_page, meta.total);

    return (
        <>
            <Head title="Ventas" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                        <Receipt className="h-6 w-6 text-indigo-500" />
                        Ventas
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Comprobantes electrónicos emitidos (boletas y facturas). El envío real a SUNAT es una fase
                        siguiente — hoy todos quedan en <code>no_enviado</code>.
                    </p>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:flex-wrap">
                    <div className="relative flex-1 sm:min-w-[220px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Buscar por serie-número o cliente..."
                            className="w-full rounded-md border border-input bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        />
                    </div>

                    <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="rounded-md border border-input bg-transparent px-3 py-2 text-sm sm:w-44">
                        <option value="todos">Todos los tipos</option>
                        {opciones.tipos.map((t) => (
                            <option key={t.id_tipo_comprobante} value={t.id_tipo_comprobante}>
                                {t.nombre}
                            </option>
                        ))}
                    </select>

                    <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
                    <span className="text-xs text-muted-foreground">a</span>
                    <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" />

                    <select value={perPage} onChange={(e) => setPerPage(e.target.value)} className="rounded-md border border-input bg-transparent px-3 py-2 text-sm sm:w-28">
                        {opciones.porPagina.map((n) => (
                            <option key={n} value={n}>
                                {n} / pág.
                            </option>
                        ))}
                    </select>
                </div>

                <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                    <table className="w-full min-w-[820px] text-sm">
                        <thead className="bg-muted/50">
                            <tr className="text-xs text-muted-foreground">
                                <th className="px-4 py-3 text-left font-semibold">Comprobante</th>
                                <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                                <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                                <th className="px-4 py-3 text-right font-semibold">Total</th>
                                <th className="px-4 py-3 text-left font-semibold">Estado SUNAT</th>
                                <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                        No se encontraron comprobantes con estos filtros.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((v) => (
                                    <tr key={v.id_comprobante} className="hover:bg-muted/40">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-foreground">{v.serie_numero}</p>
                                            <p className="text-xs text-muted-foreground">{v.tipo}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-foreground">{v.cliente}</p>
                                            {v.documento && <p className="text-xs text-muted-foreground">{v.documento}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{new Date(v.fecha_emision).toLocaleDateString('es-PE')}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-foreground">{soles(v.total)}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-400">
                                                {v.estado_sunat ?? 'no_enviado'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Link href={route('admin.ventas.show', v.id_comprobante)} title="Ver detalle" className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-accent hover:text-foreground">
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                <a href={`/comprobante/${v.id_comprobante}/pdf`} target="_blank" rel="noopener noreferrer" title="Ver PDF" className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-accent hover:text-foreground">
                                                    <FileText className="h-4 w-4" />
                                                </a>
                                                <a href={`/comprobante/${v.id_comprobante}/xml`} title="Descargar XML" className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-accent hover:text-foreground">
                                                    <Download className="h-4 w-4" />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => reenviar(v.id_comprobante)}
                                                    disabled={reenviando === v.id_comprobante}
                                                    title="Reenviar por correo"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                                                >
                                                    {reenviando === v.id_comprobante ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{meta.total > 0 ? `Mostrando ${desdeReg}–${hastaReg} de ${meta.total}` : 'Sin resultados'}</span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={meta.current_page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-card text-muted-foreground hover:bg-accent disabled:opacity-40"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span>
                            Página {meta.current_page} de {meta.last_page}
                        </span>
                        <button
                            type="button"
                            disabled={meta.current_page >= meta.last_page}
                            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-card text-muted-foreground hover:bg-accent disabled:opacity-40"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

VentasIndex.layout = {
    breadcrumbs: [{ title: 'Ventas', href: '/admin/ventas' }],
};
