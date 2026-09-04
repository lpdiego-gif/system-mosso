import axios from 'axios';
import { ArrowDown, ArrowUp, CreditCard, Landmark, Loader2, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CuentaBancaria } from '@/types/empresa';

type FormValues = {
    banco: string;
    moneda: 'PEN' | 'USD';
    tipo_cuenta: string;
    numero_cuenta: string;
    cci: string;
    titular: string;
};

const TIPOS = ['Corriente', 'Ahorros', 'Maestra', 'Sueldo', 'Detracciones'];

const formVacio: FormValues = {
    banco: '',
    moneda: 'PEN',
    tipo_cuenta: 'Corriente',
    numero_cuenta: '',
    cci: '',
    titular: '',
};

interface Props {
    cuentasIniciales: CuentaBancaria[];
    empresaRegistrada: boolean;
    onCountChange?: (n: number) => void;
}

export default function CuentasBancariasPanel({ cuentasIniciales, empresaRegistrada, onCountChange }: Props) {
    const [cuentas, setCuentas] = useState<CuentaBancaria[]>(
        [...cuentasIniciales].sort((a, b) => a.orden - b.orden),
    );
    const [dialogo, setDialogo] = useState<'nueva' | number | null>(null);
    const [values, setValues] = useState<FormValues>(formVacio);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [procesando, setProcesando] = useState(false);
    const [eliminar, setEliminar] = useState<CuentaBancaria | null>(null);
    const [eliminando, setEliminando] = useState(false);

    useEffect(() => {
        onCountChange?.(cuentas.filter((c) => c.activo).length);
    }, [cuentas, onCountChange]);

    function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
        setValues((v) => ({ ...v, [key]: value }));
        setErrors((e) => (e[key] ? { ...e, [key]: '' } : e));
    }

    function abrirNueva() {
        setValues(formVacio);
        setErrors({});
        setDialogo('nueva');
    }

    function abrirEditar(c: CuentaBancaria) {
        setValues({
            banco: c.banco,
            moneda: c.moneda,
            tipo_cuenta: c.tipo_cuenta,
            numero_cuenta: c.numero_cuenta,
            cci: c.cci ?? '',
            titular: c.titular ?? '',
        });
        setErrors({});
        setDialogo(c.id_cuenta_bancaria);
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setProcesando(true);
        setErrors({});

        const payload = { ...values, cci: values.cci || null, titular: values.titular || null };

        try {
            if (typeof dialogo === 'number') {
                await axios.put(`/empresa/cuentas-bancarias/${dialogo}`, payload);
                setCuentas((prev) =>
                    prev.map((c) => (c.id_cuenta_bancaria === dialogo ? { ...c, ...values, cci: values.cci || null, titular: values.titular || null } : c)),
                );
                toast.success('Cuenta bancaria actualizada.');
            } else {
                const { data } = await axios.post('/empresa/cuentas-bancarias', payload);

                setCuentas((prev) => [...prev, data.cuenta]);
                toast.success('Cuenta bancaria agregada.');
            }

            setDialogo(null);
        } catch (err: unknown) {
            const res = axios.isAxiosError(err) ? err.response : undefined;

            if (res?.status === 422) {
                const backend = (res.data?.errors ?? {}) as Record<string, string[]>;

                setErrors(Object.fromEntries(Object.entries(backend).map(([k, v]) => [k, v[0]])));
            } else {
                toast.error(res?.data?.message ?? 'No se pudo guardar la cuenta bancaria.');
            }
        } finally {
            setProcesando(false);
        }
    }

    async function toggleActivo(c: CuentaBancaria) {
        // Optimista: se refleja el cambio y se revierte si el servidor falla.
        setCuentas((prev) =>
            prev.map((x) => (x.id_cuenta_bancaria === c.id_cuenta_bancaria ? { ...x, activo: !x.activo } : x)),
        );

        try {
            await axios.patch(`/empresa/cuentas-bancarias/${c.id_cuenta_bancaria}/activo`);
        } catch {
            setCuentas((prev) =>
                prev.map((x) => (x.id_cuenta_bancaria === c.id_cuenta_bancaria ? { ...x, activo: c.activo } : x)),
            );
            toast.error('No se pudo cambiar el estado.');
        }
    }

    async function mover(c: CuentaBancaria, direccion: 'arriba' | 'abajo') {
        const idx = cuentas.findIndex((x) => x.id_cuenta_bancaria === c.id_cuenta_bancaria);
        const vecinoIdx = direccion === 'arriba' ? idx - 1 : idx + 1;

        if (vecinoIdx < 0 || vecinoIdx >= cuentas.length) {
            return;
        }

        const copia = [...cuentas];

        [copia[idx], copia[vecinoIdx]] = [copia[vecinoIdx], copia[idx]];
        setCuentas(copia);

        try {
            await axios.patch(`/empresa/cuentas-bancarias/${c.id_cuenta_bancaria}/mover`, { direccion });
        } catch {
            setCuentas(cuentas);
            toast.error('No se pudo cambiar el orden.');
        }
    }

    async function confirmarEliminar() {
        if (!eliminar) {
            return;
        }

        setEliminando(true);

        try {
            await axios.delete(`/empresa/cuentas-bancarias/${eliminar.id_cuenta_bancaria}`);
            setCuentas((prev) => prev.filter((x) => x.id_cuenta_bancaria !== eliminar.id_cuenta_bancaria));
            toast.success('Cuenta bancaria eliminada.');
            setEliminar(null);
        } catch {
            toast.error('No se pudo eliminar la cuenta.');
        } finally {
            setEliminando(false);
        }
    }

    if (!empresaRegistrada) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Lock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Primero registra los datos de la empresa</p>
                    <p className="text-sm text-muted-foreground">
                        Las cuentas bancarias se asocian a la empresa. Completa las pestañas anteriores y guarda para
                        habilitarlas.
                    </p>
                </div>
            </div>
        );
    }

    const editando = typeof dialogo === 'number';

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold text-foreground">Cuentas bancarias</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Se imprimen en el comprobante para que el cliente transfiera o deposite. El orden es el orden en
                        que aparecen.
                    </p>
                </div>
                <Button size="sm" className="h-9 shrink-0 gap-1.5" onClick={abrirNueva}>
                    <Plus className="h-4 w-4" /> Nueva cuenta
                </Button>
            </div>

            {cuentas.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Landmark className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">Sin cuentas registradas</p>
                        <p className="text-sm text-muted-foreground">
                            Agrega la primera para que aparezca en los comprobantes.
                        </p>
                    </div>
                    <Button size="sm" className="mt-1 gap-1.5" onClick={abrirNueva}>
                        <Plus className="h-4 w-4" /> Nueva cuenta
                    </Button>
                </div>
            ) : (
                <ul className="flex flex-col gap-2">
                    {cuentas.map((c, i) => (
                        <li
                            key={c.id_cuenta_bancaria}
                            className={cn(
                                'flex items-center gap-3 rounded-xl border border-border bg-card p-3',
                                !c.activo && 'opacity-60',
                            )}
                        >
                            <div className="flex flex-col">
                                <button
                                    type="button"
                                    disabled={i === 0}
                                    onClick={() => mover(c, 'arriba')}
                                    aria-label={`Subir ${c.banco}`}
                                    className="rounded p-0.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-25"
                                >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    disabled={i === cuentas.length - 1}
                                    onClick={() => mover(c, 'abajo')}
                                    aria-label={`Bajar ${c.banco}`}
                                    className="rounded p-0.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-25"
                                >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <Landmark className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                    {c.banco}
                                    <span className="ml-1.5 font-normal text-muted-foreground">
                                        {c.tipo_cuenta} · {c.moneda}
                                    </span>
                                </p>
                                <p className="truncate font-mono text-xs text-muted-foreground tabular-nums">
                                    {c.numero_cuenta}
                                    {c.cci ? `  ·  CCI ${c.cci}` : ''}
                                </p>
                                {c.titular && (
                                    <p className="truncate text-xs text-muted-foreground">{c.titular}</p>
                                )}
                            </div>

                            <button
                                type="button"
                                role="switch"
                                aria-checked={c.activo}
                                aria-label={`${c.banco} ${c.activo ? 'activa' : 'inactiva'}`}
                                onClick={() => toggleActivo(c)}
                                className={cn(
                                    'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                    c.activo ? 'bg-mosso-yellow' : 'bg-muted-foreground/30',
                                )}
                            >
                                <span
                                    className={cn(
                                        'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform motion-reduce:transition-none',
                                        c.activo ? 'translate-x-[18px]' : 'translate-x-1',
                                    )}
                                />
                            </button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => abrirEditar(c)}
                                aria-label={`Editar ${c.banco}`}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setEliminar(c)}
                                aria-label={`Eliminar ${c.banco}`}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            {/* -------------------------------------- Dialog: nueva / editar */}
            <Dialog open={dialogo !== null} onOpenChange={(o) => !o && setDialogo(null)}>
                <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader className="space-y-1.5 border-b border-border p-6">
                            <DialogTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
                                <CreditCard className="h-4 w-4" />
                                {editando ? 'Editar cuenta bancaria' : 'Nueva cuenta bancaria'}
                            </DialogTitle>
                            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                                El CCI, si lo agregas, permite transferencias desde otros bancos.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 p-6">
                            <div className="space-y-1.5">
                                <Label htmlFor="cb-banco" className="text-xs font-medium text-foreground">
                                    Banco
                                </Label>
                                <Input
                                    id="cb-banco"
                                    value={values.banco}
                                    onChange={(e) => set('banco', e.target.value)}
                                    maxLength={60}
                                    placeholder="BCP, Interbank, BBVA…"
                                    autoFocus
                                    required
                                    aria-invalid={Boolean(errors.banco)}
                                />
                                {errors.banco && <p className="text-[11px] font-medium text-destructive">{errors.banco}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-foreground">Moneda</Label>
                                    <Select value={values.moneda} onValueChange={(v) => set('moneda', v as 'PEN' | 'USD')}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PEN">PEN — Soles</SelectItem>
                                            <SelectItem value="USD">USD — Dólares</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-foreground">Tipo</Label>
                                    <Select value={values.tipo_cuenta} onValueChange={(v) => set('tipo_cuenta', v)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIPOS.map((t) => (
                                                <SelectItem key={t} value={t}>
                                                    {t}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="cb-numero" className="text-xs font-medium text-foreground">
                                    Número de cuenta
                                </Label>
                                <Input
                                    id="cb-numero"
                                    value={values.numero_cuenta}
                                    onChange={(e) => set('numero_cuenta', e.target.value.replace(/[^\dxX-]/g, ''))}
                                    inputMode="numeric"
                                    maxLength={30}
                                    placeholder="191-1234567-0-12"
                                    className="font-mono tabular-nums"
                                    required
                                    aria-invalid={Boolean(errors.numero_cuenta)}
                                />
                                {errors.numero_cuenta && (
                                    <p className="text-[11px] font-medium text-destructive">{errors.numero_cuenta}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="cb-cci" className="text-xs font-medium text-foreground">
                                    CCI <span className="font-normal text-muted-foreground">— opcional, 20 dígitos</span>
                                </Label>
                                <Input
                                    id="cb-cci"
                                    value={values.cci}
                                    onChange={(e) => set('cci', e.target.value.replace(/\D/g, '').slice(0, 20))}
                                    inputMode="numeric"
                                    maxLength={20}
                                    placeholder="00219100123456789012"
                                    className="font-mono tabular-nums"
                                    aria-invalid={Boolean(errors.cci)}
                                />
                                {errors.cci ? (
                                    <p className="text-[11px] font-medium text-destructive">{errors.cci}</p>
                                ) : values.cci.length > 0 && values.cci.length < 20 ? (
                                    <p className="text-[11px] text-muted-foreground tabular-nums">
                                        {values.cci.length}/20 dígitos
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="cb-titular" className="text-xs font-medium text-foreground">
                                    Titular <span className="font-normal text-muted-foreground">— opcional</span>
                                </Label>
                                <Input
                                    id="cb-titular"
                                    value={values.titular}
                                    onChange={(e) => set('titular', e.target.value)}
                                    maxLength={150}
                                    placeholder="Comercial Mosso S.A.C."
                                    aria-invalid={Boolean(errors.titular)}
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 border-t border-border bg-muted/30 p-4 sm:gap-2">
                            <Button type="button" variant="ghost" size="sm" className="h-9" onClick={() => setDialogo(null)}>
                                Cancelar
                            </Button>
                            <Button type="submit" size="sm" className="h-9 gap-2" disabled={procesando}>
                                {procesando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                {editando ? 'Guardar cambios' : 'Agregar cuenta'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* -------------------------------------- Confirmar borrado */}
            <AlertDialog open={eliminar !== null} onOpenChange={(o) => !o && setEliminar(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar la cuenta de {eliminar?.banco}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Dejará de aparecer en los comprobantes. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={eliminando}
                            onClick={(e) => {
                                e.preventDefault();
                                confirmarEliminar();
                            }}
                        >
                            {eliminando && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
