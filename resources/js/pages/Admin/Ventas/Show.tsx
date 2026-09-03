import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, Download, FileText, Loader2, Mail, Send } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { route } from 'ziggy-js';

interface Item {
    codigo: string;
    descripcion: string;
    unidad: string;
    cantidad: number;
    precio_unitario: string;
    descuento_linea: string;
    total_linea: string;
}

interface ComprobanteDetalle {
    id: number;
    pedido_id: number;
    correo_enviado_en: string | null;
    cliente_correo: string | null;
    emisor: { ruc: string; razon_social: string; nombre_comercial: string };
    receptor: { tipo_doc: string; num_doc: string; nombre: string; direccion: string | null };
    comprobante: { tipo_nombre: string; serie: string; numero: string; fecha_emision: string; estado_sunat: string };
    items: Item[];
    totales: { op_gravadas: string; igv: string; total: string; total_letras: string };
}

export default function VentaShow({ comprobante: c }: { comprobante: ComprobanteDetalle }) {
    const [enviando, setEnviando] = useState(false);
    const [email, setEmail] = useState('');
    const [incluirXml, setIncluirXml] = useState(false);

    async function reenviar(e: FormEvent) {
        e.preventDefault();
        setEnviando(true);
        try {
            const { data } = await axios.post(`/comprobante/${c.id}/reenviar`, {
                email: email || undefined,
                incluir_xml: incluirXml,
            });
            alert(data.message);
        } catch (err: any) {
            alert(err.response?.data?.message ?? 'No se pudo reenviar el comprobante.');
        } finally {
            setEnviando(false);
        }
    }

    return (
        <>
            <Head title={`${c.comprobante.serie}-${c.comprobante.numero}`} />
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
                <Link href={route('admin.ventas.index')} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Volver a Ventas
                </Link>

                <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">
                            {c.comprobante.tipo_nombre} {c.comprobante.serie}-{c.comprobante.numero}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Emitido el {new Date(c.comprobante.fecha_emision).toLocaleString('es-PE')} · Pedido #{String(c.pedido_id).padStart(6, '0')}
                        </p>
                        {c.correo_enviado_en && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                <Mail className="h-3.5 w-3.5" /> Enviado por correo el {new Date(c.correo_enviado_en).toLocaleString('es-PE')}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <a href={`/comprobante/${c.id}/pdf`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
                            <FileText className="h-4 w-4" /> Ver PDF
                        </a>
                        <a href={`/comprobante/${c.id}/xml`} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
                            <Download className="h-4 w-4" /> XML
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emisor</h2>
                        <p className="mt-1 text-sm font-medium text-foreground">{c.emisor.razon_social}</p>
                        <p className="text-xs text-muted-foreground">RUC {c.emisor.ruc}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Receptor</h2>
                        <p className="mt-1 text-sm font-medium text-foreground">{c.receptor.nombre}</p>
                        <p className="text-xs text-muted-foreground">Doc. {c.receptor.num_doc}</p>
                        {c.cliente_correo && <p className="text-xs text-muted-foreground">{c.cliente_correo}</p>}
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs text-muted-foreground">
                            <tr>
                                <th className="px-3 py-2 text-left">Código</th>
                                <th className="px-3 py-2 text-left">Descripción</th>
                                <th className="px-3 py-2 text-right">Cant.</th>
                                <th className="px-3 py-2 text-right">P. Unit.</th>
                                <th className="px-3 py-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {c.items.map((it, i) => (
                                <tr key={i}>
                                    <td className="px-3 py-2">{it.codigo}</td>
                                    <td className="px-3 py-2">{it.descripcion}</td>
                                    <td className="px-3 py-2 text-right">
                                        {it.cantidad} {it.unidad}
                                    </td>
                                    <td className="px-3 py-2 text-right">S/ {it.precio_unitario}</td>
                                    <td className="px-3 py-2 text-right font-medium">S/ {it.total_linea}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="ml-auto w-full max-w-xs space-y-1 rounded-xl border border-border bg-card p-4 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Op. gravada</span>
                        <span>S/ {c.totales.op_gravadas}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>IGV</span>
                        <span>S/ {c.totales.igv}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1.5 text-base font-bold text-foreground">
                        <span>Total</span>
                        <span>S/ {c.totales.total}</span>
                    </div>
                    <p className="pt-1 text-xs italic text-muted-foreground">{c.totales.total_letras}</p>
                </div>

                <form onSubmit={reenviar} className="rounded-xl border border-border bg-card p-4">
                    <h2 className="text-sm font-semibold text-foreground">Reenviar comprobante</h2>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground">Correo destino (opcional)</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={c.cliente_correo ?? 'correo@cliente.com'}
                                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <input type="checkbox" checked={incluirXml} onChange={(e) => setIncluirXml(e.target.checked)} />
                            Incluir XML
                        </label>
                        <button
                            type="submit"
                            disabled={enviando}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                        >
                            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Reenviar
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

VentaShow.layout = {
    breadcrumbs: [
        { title: 'Ventas', href: '/admin/ventas' },
        { title: 'Detalle', href: '#' },
    ],
};
