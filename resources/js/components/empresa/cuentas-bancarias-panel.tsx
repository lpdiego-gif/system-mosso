import axios from 'axios';
import { ArrowDown, ArrowUp, Banknote, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import type { CuentaBancaria } from '@/types/empresa';

const inputClass =
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground/60 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

type FormValues = {
    banco: string;
    moneda: 'PEN' | 'USD';
    tipo_cuenta: string;
    numero_cuenta: string;
    cci: string;
    titular: string;
};

const formVacio: FormValues = {
    banco: '',
    moneda: 'PEN',
    tipo_cuenta: 'Corriente',
    numero_cuenta: '',
    cci: '',
    titular: '',
};

export default function CuentasBancariasPanel({ cuentasIniciales }: { cuentasIniciales: CuentaBancaria[] }) {
    const [cuentas, setCuentas] = useState<CuentaBancaria[]>(
        [...cuentasIniciales].sort((a, b) => a.orden - b.orden),
    );
    const [formAbierto, setFormAbierto] = useState(false);
    const [editando, setEditando] = useState<number | null>(null);
    const [values, setValues] = useState<FormValues>(formVacio);
    const [procesando, setProcesando] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
        setValues((v) => ({ ...v, [key]: value }));
    }

    function abrirNueva() {
        setEditando(null);
        setValues(formVacio);
        setErrors({});
        setFormAbierto(true);
    }

    function abrirEditar(c: CuentaBancaria) {
        setEditando(c.id_cuenta_bancaria);
        setValues({
            banco: c.banco,
            moneda: c.moneda,
            tipo_cuenta: c.tipo_cuenta,
            numero_cuenta: c.numero_cuenta,
            cci: c.cci ?? '',
            titular: c.titular ?? '',
        });
        setErrors({});
        setFormAbierto(true);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcesando(true);
        setErrors({});

        try {
            if (editando) {
                await axios.put(`/empresa/cuentas-bancarias/${editando}`, values);
                setCuentas((prev) => prev.map((c) => (c.id_cuenta_bancaria === editando ? { ...c, ...values } : c)));
                toast.success('Cuenta bancaria actualizada.');
            } else {
                const { data } = await axios.post('/empresa/cuentas-bancarias', values);
                setCuentas((prev) => [...prev, data.cuenta]);
                toast.success('Cuenta bancaria agregada.');
            }
            setFormAbierto(false);
        } catch (err: any) {
            if (err.response?.status === 422) {
                const backendErrors = err.response.data.errors ?? {};
                setErrors(Object.fromEntries(Object.entries(backendErrors).map(([k, v]) => [k, (v as string[])[0]])));
            } else {
                toast.error(err.response?.data?.message ?? 'No se pudo guardar la cuenta bancaria.');
            }
        } finally {
            setProcesando(false);
        }
    }

    async function toggleActivo(c: CuentaBancaria) {
        try {
            await axios.patch(`/empresa/cuentas-bancarias/${c.id_cuenta_bancaria}/activo`);
            setCuentas((prev) =>
                prev.map((x) => (x.id_cuenta_bancaria === c.id_cuenta_bancaria ? { ...x, activo: !x.activo } : x)),
            );
        } catch {
            toast.error('No se pudo cambiar el estado.');
        }
    }

    async function mover(c: CuentaBancaria, direccion: 'arriba' | 'abajo') {
        const idx = cuentas.findIndex((x) => x.id_cuenta_bancaria === c.id_cuenta_bancaria);
        const vecinoIdx = direccion === 'arriba' ? idx - 1 : idx + 1;
        if (vecinoIdx < 0 || vecinoIdx >= cuentas.length) return;

        try {
            await axios.patch(`/empresa/cuentas-bancarias/${c.id_cuenta_bancaria}/mover`, { direccion });
            const copia = [...cuentas];
            [copia[idx], copia[vecinoIdx]] = [copia[vecinoIdx], copia[idx]];
            setCuentas(copia);
        } catch {
            toast.error('No se pudo cambiar el orden.');
        }
    }

    async function eliminar(c: CuentaBancaria) {
        if (!confirm(`¿Eliminar la cuenta ${c.banco} ${c.numero_cuenta}?`)) return;

        try {
            await axios.delete(`/empresa/cuentas-bancarias/${c.id_cuenta_bancaria}`);
            setCuentas((prev) => prev.filter((x) => x.id_cuenta_bancaria !== c.id_cuenta_bancaria));
            toast.success('Cuenta bancaria eliminada.');
        } catch {
            toast.error('No se pudo eliminar la cuenta.');
        }
    }

    return (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Banknote className="h-4 w-4 text-indigo-500" /> Cuentas bancarias
                </h2>
                <button
                    type="button"
                    onClick={abrirNueva}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                    <Plus className="h-3.5 w-3.5" /> Nueva cuenta
                </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
                Aparecen en el PDF del comprobante para que el cliente pueda transferir o depositar.
            </p>

            <div className="mt-4 flex flex-col gap-2">
                {cuentas.length === 0 && (
                    <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                        Sin cuentas registradas.
                    </p>
                )}
                {cuentas.map((c, i) => (
                    <div
                        key={c.id_cuenta_bancaria}
                        className={`flex items-center justify-between gap-3 rounded-lg border border-border p-3 ${!c.activo ? 'opacity-50' : ''}`}
                    >
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">
                                {c.banco} <span className="font-normal text-muted-foreground">— {c.tipo_cuenta} {c.moneda}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                                N° {c.numero_cuenta}
                                {c.cci ? ` · CCI ${c.cci}` : ''}
                                {c.titular ? ` · ${c.titular}` : ''}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                            <button type="button" disabled={i === 0} onClick={() => mover(c, 'arriba')} className="rounded p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30">
                                <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" disabled={i === cuentas.length - 1} onClick={() => mover(c, 'abajo')} className="rounded p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30">
                                <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleActivo(c)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${c.activo ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
                                title={c.activo ? 'Activa' : 'Inactiva'}
                            >
                                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${c.activo ? 'translate-x-[18px]' : 'translate-x-1'}`} />
                            </button>
                            <button type="button" onClick={() => abrirEditar(c)} className="rounded p-1.5 text-muted-foreground hover:bg-muted">
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => eliminar(c)} className="rounded p-1.5 text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {formAbierto && (
                <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {editando ? 'Editar cuenta' : 'Nueva cuenta'}
                        </h3>
                        <button type="button" onClick={() => setFormAbierto(false)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="text-xs font-medium text-foreground">Banco</label>
                            <input value={values.banco} onChange={(e) => set('banco', e.target.value)} maxLength={60} placeholder="BCP, Interbank, BBVA…" className={inputClass} required />
                            {errors.banco && <p className="text-xs text-destructive">{errors.banco}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-medium text-foreground">Moneda</label>
                                <select value={values.moneda} onChange={(e) => set('moneda', e.target.value as 'PEN' | 'USD')} className={inputClass}>
                                    <option value="PEN">PEN</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-foreground">Tipo</label>
                                <select value={values.tipo_cuenta} onChange={(e) => set('tipo_cuenta', e.target.value)} className={inputClass}>
                                    <option value="Corriente">Corriente</option>
                                    <option value="Ahorros">Ahorros</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-foreground">Número de cuenta</label>
                            <input value={values.numero_cuenta} onChange={(e) => set('numero_cuenta', e.target.value)} maxLength={30} className={inputClass} required />
                            {errors.numero_cuenta && <p className="text-xs text-destructive">{errors.numero_cuenta}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-medium text-foreground">CCI (opcional)</label>
                            <input value={values.cci} onChange={(e) => set('cci', e.target.value)} maxLength={30} className={inputClass} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs font-medium text-foreground">Titular (opcional)</label>
                            <input value={values.titular} onChange={(e) => set('titular', e.target.value)} maxLength={150} className={inputClass} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={procesando}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                    >
                        {procesando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {editando ? 'Guardar cambios' : 'Agregar cuenta'}
                    </button>
                </form>
            )}
        </div>
    );
}
