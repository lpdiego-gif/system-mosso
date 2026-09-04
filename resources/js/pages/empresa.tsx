import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    BookText,
    Building2,
    Check,
    CreditCard,
    Globe,
    IdCard,
    ImageUp,
    Loader2,
    Mail,
    MapPin,
    Phone,
    RotateCcw,
    ScrollText,
    Store,
    Trash2,
} from 'lucide-react';
import type { ChangeEvent, DragEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

import CuentasBancariasPanel from '@/components/empresa/cuentas-bancarias-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { evaluarRuc, MENSAJE_RUC } from '@/lib/ruc';
import { cn } from '@/lib/utils';
import type { CuentaBancaria, Departamento, Distrito, Empresa, EmpresaFormValues, Provincia } from '@/types/empresa';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildValues(empresa: Empresa | null): EmpresaFormValues {
    return {
        ruc: empresa?.ruc ?? '',
        razon_social: empresa?.razon_social ?? '',
        nombre_comercial: empresa?.nombre_comercial ?? '',
        correo: empresa?.correo ?? '',
        telefono: empresa?.telefono ?? '',
        celular: empresa?.celular ?? '',
        website: empresa?.website ?? '',
        direccion: empresa?.direccion ?? '',
        referencia: empresa?.referencia ?? '',
        fk_departamento: empresa?.fk_departamento ? String(empresa.fk_departamento) : '',
        fk_provincia: empresa?.fk_provincia ? String(empresa.fk_provincia) : '',
        fk_distrito: empresa?.fk_distrito ? String(empresa.fk_distrito) : '',
    };
}

type TabId = 'identidad' | 'contacto' | 'direccion' | 'bancos';

const CAMPO_TAB: Record<string, TabId> = {
    ruc: 'identidad',
    razon_social: 'identidad',
    nombre_comercial: 'identidad',
    logo: 'identidad',
    correo: 'contacto',
    telefono: 'contacto',
    celular: 'contacto',
    website: 'contacto',
    direccion: 'direccion',
    referencia: 'direccion',
    fk_distrito: 'direccion',
};

interface PageProps {
    empresa: Empresa | null;
    departamentos: Departamento[];
    cuentasBancarias: CuentaBancaria[];
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function EmpresaPage({ empresa: empresaInicial, departamentos, cuentasBancarias }: PageProps) {
    const [tab, setTab] = useState<TabId>('identidad');
    const [empresa, setEmpresa] = useState<Empresa | null>(empresaInicial);
    const [values, setValues] = useState<EmpresaFormValues>(buildValues(empresaInicial));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const [provincias, setProvincias] = useState<Provincia[]>([]);
    const [distritos, setDistritos] = useState<Distrito[]>([]);

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(
        empresaInicial?.logo ? `/storage/${empresaInicial.logo}` : null,
    );
    const [eliminarLogo, setEliminarLogo] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const resumenErroresRef = useRef<HTMLDivElement>(null);

    const [cuentasCount, setCuentasCount] = useState(cuentasBancarias.filter((c) => c.activo).length);

    // -------------------------------------------------- cascada de ubicación
    const cargarUbicacion = useCallback(async (e: Empresa | null) => {
        if (!e) {
            setProvincias([]);
            setDistritos([]);

            return;
        }

        if (e.fk_departamento) {
            const { data } = await axios.get(`/empresa/provincias/${e.fk_departamento}`);

            setProvincias(data);
        }

        if (e.fk_provincia) {
            const { data } = await axios.get(`/empresa/distritos/${e.fk_provincia}`);

            setDistritos(data);
        }
    }, []);

    useEffect(() => {
        cargarUbicacion(empresaInicial);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function set<K extends keyof EmpresaFormValues>(key: K, value: EmpresaFormValues[K]) {
        setValues((v) => ({ ...v, [key]: value }));
        setErrors((e) => (e[key] ? { ...e, [key]: '' } : e));
    }

    async function handleDepartamentoChange(value: string) {
        setValues((v) => ({ ...v, fk_departamento: value, fk_provincia: '', fk_distrito: '' }));
        setDistritos([]);
        setProvincias([]);

        if (value) {
            const { data } = await axios.get(`/empresa/provincias/${value}`);

            setProvincias(data);
        }
    }

    async function handleProvinciaChange(value: string) {
        setValues((v) => ({ ...v, fk_provincia: value, fk_distrito: '' }));
        setDistritos([]);

        if (value) {
            const { data } = await axios.get(`/empresa/distritos/${value}`);

            setDistritos(data);
        }
    }

    // ---------------------------------------------------------------- logo
    function handleLogoFile(file: File | null) {
        if (!file) {
            return;
        }

        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            toast.error('El logo debe ser una imagen JPG, PNG o WEBP.');

            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('El logo no debe pesar más de 2 MB.');

            return;
        }

        setLogoFile(file);
        setEliminarLogo(false);
        setLogoPreview(URL.createObjectURL(file));
        setErrors((e) => (e.logo ? { ...e, logo: '' } : e));
    }

    function handleRemoveLogo() {
        setLogoFile(null);
        setLogoPreview(null);
        setEliminarLogo(true);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    function handleDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setDragOver(false);
        handleLogoFile(e.dataTransfer.files?.[0] ?? null);
    }

    // ------------------------------------------------------- dirty tracking
    const dirty = useMemo(() => {
        const base = buildValues(empresa);
        const cambioCampos = (Object.keys(base) as (keyof EmpresaFormValues)[]).some((k) => base[k] !== values[k]);

        return cambioCampos || logoFile !== null || eliminarLogo;
    }, [empresa, values, logoFile, eliminarLogo]);

    useEffect(() => {
        function aviso(e: BeforeUnloadEvent) {
            if (dirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        }

        window.addEventListener('beforeunload', aviso);

        return () => window.removeEventListener('beforeunload', aviso);
    }, [dirty]);

    useEffect(() => {
        const quitar = router.on('before', (event) => {
            if (dirty && !window.confirm('Tienes cambios sin guardar. ¿Salir de todos modos?')) {
                event.preventDefault();
            }
        });

        return quitar;
    }, [dirty]);

    function irACampo(campo: string) {
        const destino = CAMPO_TAB[campo];

        if (destino) {
            setTab(destino);
        }

        requestAnimationFrame(() => document.getElementById(`campo-${campo}`)?.focus());
    }

    function handleReset() {
        setValues(buildValues(empresa));
        setLogoFile(null);
        setEliminarLogo(false);
        setLogoPreview(empresa?.logo ? `/storage/${empresa.logo}` : null);
        setErrors({});
        cargarUbicacion(empresa);
    }

    // ----------------------------------------------------------- guardar
    async function guardar() {
        const rucEstado = evaluarRuc(values.ruc);

        if (rucEstado !== 'valido') {
            setTab('identidad');
            setErrors({ ruc: rucEstado === 'vacio' ? 'Ingresa el RUC de la empresa.' : MENSAJE_RUC[rucEstado] });
            requestAnimationFrame(() => resumenErroresRef.current?.focus());

            return;
        }

        setProcessing(true);
        setErrors({});

        const formData = new FormData();
        const campos: (keyof EmpresaFormValues)[] = [
            'ruc',
            'razon_social',
            'nombre_comercial',
            'correo',
            'telefono',
            'direccion',
            'fk_distrito',
        ];

        campos.forEach((k) => formData.append(k, values[k]));

        if (values.celular) {
formData.append('celular', values.celular);
}

        if (values.website) {
formData.append('website', values.website);
}

        if (values.referencia) {
formData.append('referencia', values.referencia);
}

        if (logoFile) {
formData.append('logo', logoFile);
}

        if (eliminarLogo) {
formData.append('eliminar_logo', '1');
}

        try {
            const { data } = await axios.post('/empresa', formData);

            toast.success(data.message ?? 'Datos guardados correctamente.');

            const nueva = data.empresa as Empresa;

            setEmpresa(nueva);
            setValues(buildValues(nueva));
            setLogoFile(null);
            setEliminarLogo(false);
            setLogoPreview(nueva?.logo ? `/storage/${nueva.logo}` : null);
            cargarUbicacion(nueva);
        } catch (err: unknown) {
            const res = axios.isAxiosError(err) ? err.response : undefined;

            if (res?.status === 422) {
                const backend = (res.data?.errors ?? {}) as Record<string, string[]>;
                const mapa = Object.fromEntries(Object.entries(backend).map(([k, v]) => [k, v[0]]));

                setErrors(mapa);

                const primerCampo = Object.keys(mapa)[0];

                if (primerCampo && CAMPO_TAB[primerCampo]) {
                    setTab(CAMPO_TAB[primerCampo]);
                }

                requestAnimationFrame(() => resumenErroresRef.current?.focus());
            } else {
                toast.error(res?.data?.message ?? 'No se pudo guardar la información de la empresa.');
            }
        } finally {
            setProcessing(false);
        }
    }

    // --------------------------------------------------------------- derivados
    const rucEstado = evaluarRuc(values.ruc);
    const distritoNombre = useMemo(
        () => distritos.find((d) => String(d.id_distrito) === values.fk_distrito)?.nombre,
        [distritos, values.fk_distrito],
    );

    const erroresLista = Object.entries(errors).filter(([, v]) => v);

    const completo =
        rucEstado === 'valido' &&
        values.razon_social.trim() !== '' &&
        values.nombre_comercial.trim() !== '' &&
        values.correo.trim() !== '' &&
        values.telefono.trim() !== '' &&
        values.direccion.trim() !== '' &&
        values.fk_distrito !== '';

    const tabs: { id: TabId; label: string; icon: typeof IdCard; badge?: number; alerta?: boolean }[] = [
        {
            id: 'identidad',
            label: 'Identidad',
            icon: IdCard,
            alerta: Boolean(errors.ruc || errors.razon_social || errors.nombre_comercial || errors.logo),
        },
        {
            id: 'contacto',
            label: 'Contacto',
            icon: Phone,
            alerta: Boolean(errors.correo || errors.telefono || errors.celular || errors.website),
        },
        {
            id: 'direccion',
            label: 'Dirección fiscal',
            icon: MapPin,
            alerta: Boolean(errors.direccion || errors.fk_distrito),
        },
        { id: 'bancos', label: 'Cuentas bancarias', icon: CreditCard, badge: cuentasCount },
    ];

    return (
        <>
            <Head title="Datos de la empresa" />

            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 pb-28 sm:p-6">
                {/* --------------------------------------------- Encabezado */}
                <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mosso-yellow text-mosso-dark shadow-sm">
                            <Building2 className="h-5 w-5" strokeWidth={2.25} />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground">Empresa</h1>
                            <p className="text-sm text-muted-foreground">
                                La identidad que aparece en tus comprobantes electrónicos y en la tienda. Es un único
                                registro: cada guardado reemplaza los datos actuales.
                            </p>
                        </div>
                    </div>

                    <span
                        className={cn(
                            'inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border px-2.5 py-1 text-xs font-medium',
                            completo
                                ? 'border-mosso-yellow/50 bg-mosso-yellow/10 text-foreground'
                                : 'border-border bg-muted text-muted-foreground',
                        )}
                    >
                        <span
                            className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                completo ? 'bg-mosso-yellow' : 'bg-muted-foreground/40',
                            )}
                        />
                        {empresa ? (completo ? 'Datos completos' : 'Faltan datos obligatorios') : 'Sin registrar'}
                    </span>
                </header>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
                    {/* ============================ Columna principal ============================ */}
                    <div className="flex min-w-0 flex-col gap-5">
                        {/* Tabs */}
                        <div
                            role="tablist"
                            aria-label="Secciones de datos de la empresa"
                            className="flex flex-wrap gap-1 border-b border-border"
                        >
                            {tabs.map((t) => {
                                const activo = tab === t.id;

                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={activo}
                                        onClick={() => setTab(t.id)}
                                        className={cn(
                                            'relative -mb-px flex items-center gap-1.5 rounded-t-md px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:bg-accent',
                                            activo ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                                        )}
                                    >
                                        <t.icon className="h-4 w-4" />
                                        {t.label}
                                        {typeof t.badge === 'number' && t.badge > 0 && (
                                            <span className="ml-0.5 rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground tabular-nums">
                                                {t.badge}
                                            </span>
                                        )}
                                        {t.alerta && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                                        <span
                                            className={cn(
                                                'absolute inset-x-0 -bottom-px h-0.5 rounded-full transition-colors',
                                                activo ? 'bg-mosso-yellow' : 'bg-transparent',
                                            )}
                                        />
                                    </button>
                                );
                            })}
                        </div>

                        {/* Resumen de errores */}
                        {erroresLista.length > 0 && (
                            <div
                                ref={resumenErroresRef}
                                role="alert"
                                tabIndex={-1}
                                className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 outline-none"
                            >
                                <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    Revisa {erroresLista.length === 1 ? 'este dato' : `estos ${erroresLista.length} datos`}
                                </p>
                                <ul className="mt-2 space-y-1 text-sm">
                                    {erroresLista.map(([campo, msg]) => (
                                        <li key={campo}>
                                            <button
                                                type="button"
                                                className="text-left text-destructive/90 underline underline-offset-2 hover:no-underline"
                                                onClick={() => irACampo(campo)}
                                            >
                                                {msg}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {tab === 'bancos' ? (
                            <CuentasBancariasPanel
                                cuentasIniciales={cuentasBancarias}
                                empresaRegistrada={empresa !== null}
                                onCountChange={setCuentasCount}
                            />
                        ) : (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    guardar();
                                }}
                                className="flex flex-col gap-5"
                                noValidate
                            >
                                {/* ------------------------------- Identidad */}
                                {tab === 'identidad' && (
                                    <div className="flex flex-col gap-5">
                                        <Seccion titulo="Datos legales" descripcion="Tal como figuran en tu ficha RUC de SUNAT.">
                                            <Campo
                                                id="ruc"
                                                label="RUC"
                                                requerido
                                                error={errors.ruc}
                                                hint={
                                                    rucEstado === 'valido' ? (
                                                        <span className="inline-flex items-center gap-1 text-foreground">
                                                            <Check className="h-3.5 w-3.5 text-mosso-dark dark:text-mosso-yellow" />
                                                            RUC válido
                                                        </span>
                                                    ) : rucEstado !== 'vacio' ? (
                                                        MENSAJE_RUC[rucEstado]
                                                    ) : (
                                                        'Once dígitos. Empieza con 20 para persona jurídica.'
                                                    )
                                                }
                                                hintTono={
                                                    rucEstado === 'valido'
                                                        ? 'ok'
                                                        : rucEstado === 'vacio'
                                                          ? 'muted'
                                                          : 'error'
                                                }
                                            >
                                                <Input
                                                    id="campo-ruc"
                                                    value={values.ruc}
                                                    onChange={(e) => set('ruc', e.target.value.replace(/\D/g, '').slice(0, 11))}
                                                    inputMode="numeric"
                                                    maxLength={11}
                                                    placeholder="20512345678"
                                                    className="font-mono tabular-nums"
                                                    aria-invalid={Boolean(errors.ruc)}
                                                    aria-describedby="ruc-hint"
                                                />
                                            </Campo>

                                            <Campo
                                                id="razon_social"
                                                label="Razón social"
                                                requerido
                                                error={errors.razon_social}
                                            >
                                                <Input
                                                    id="campo-razon_social"
                                                    value={values.razon_social}
                                                    onChange={(e) => set('razon_social', e.target.value)}
                                                    maxLength={150}
                                                    placeholder="Comercial Mosso S.A.C."
                                                    aria-invalid={Boolean(errors.razon_social)}
                                                />
                                            </Campo>

                                            <Campo
                                                id="nombre_comercial"
                                                label="Nombre comercial"
                                                requerido
                                                error={errors.nombre_comercial}
                                                hint="El nombre con el que te conocen tus clientes."
                                            >
                                                <Input
                                                    id="campo-nombre_comercial"
                                                    value={values.nombre_comercial}
                                                    onChange={(e) => set('nombre_comercial', e.target.value)}
                                                    maxLength={150}
                                                    placeholder="Mosso"
                                                    aria-invalid={Boolean(errors.nombre_comercial)}
                                                />
                                            </Campo>
                                        </Seccion>

                                        <Seccion
                                            titulo="Logo"
                                            descripcion="Se muestra en el comprobante y en la cabecera de la tienda. PNG, JPG o WEBP hasta 2 MB."
                                        >
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                                                    {logoPreview ? (
                                                        <img
                                                            src={logoPreview}
                                                            alt="Logo actual de la empresa"
                                                            className="h-full w-full object-contain p-2"
                                                        />
                                                    ) : (
                                                        <Building2 className="h-8 w-8 text-muted-foreground" />
                                                    )}
                                                </div>

                                                <div
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        setDragOver(true);
                                                    }}
                                                    onDragLeave={() => setDragOver(false)}
                                                    onDrop={handleDrop}
                                                    className={cn(
                                                        'flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed p-4 text-center transition-colors',
                                                        dragOver ? 'border-mosso-yellow bg-mosso-yellow/10' : 'border-border',
                                                    )}
                                                >
                                                    <ImageUp className="h-5 w-5 text-muted-foreground" />
                                                    <p className="text-xs text-muted-foreground">
                                                        Arrastra una imagen o
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8"
                                                            onClick={() => fileInputRef.current?.click()}
                                                        >
                                                            {logoPreview ? 'Cambiar' : 'Elegir archivo'}
                                                        </Button>
                                                        {logoPreview && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 gap-1.5 text-muted-foreground hover:text-destructive"
                                                                onClick={handleRemoveLogo}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" /> Quitar
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/png,image/jpeg,image/webp"
                                                        className="hidden"
                                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                            handleLogoFile(e.target.files?.[0] ?? null)
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            {errors.logo && (
                                                <p className="mt-2 text-xs font-medium text-destructive">{errors.logo}</p>
                                            )}
                                        </Seccion>
                                    </div>
                                )}

                                {/* ------------------------------- Contacto */}
                                {tab === 'contacto' && (
                                    <Seccion
                                        titulo="Canales de contacto"
                                        descripcion="El correo y el teléfono se imprimen en el comprobante y se muestran en la tienda."
                                    >
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Campo id="correo" label="Correo electrónico" requerido error={errors.correo}>
                                                <Input
                                                    id="campo-correo"
                                                    type="email"
                                                    value={values.correo}
                                                    onChange={(e) => set('correo', e.target.value)}
                                                    maxLength={150}
                                                    placeholder="contacto@mosso.pe"
                                                    aria-invalid={Boolean(errors.correo)}
                                                />
                                            </Campo>
                                            <Campo id="telefono" label="Teléfono" requerido error={errors.telefono}>
                                                <Input
                                                    id="campo-telefono"
                                                    value={values.telefono}
                                                    onChange={(e) => set('telefono', e.target.value)}
                                                    maxLength={20}
                                                    placeholder="(01) 234 5678"
                                                    aria-invalid={Boolean(errors.telefono)}
                                                />
                                            </Campo>
                                            <Campo id="celular" label="Celular" error={errors.celular}>
                                                <Input
                                                    id="campo-celular"
                                                    value={values.celular}
                                                    onChange={(e) => set('celular', e.target.value)}
                                                    maxLength={20}
                                                    placeholder="999 888 777"
                                                    aria-invalid={Boolean(errors.celular)}
                                                />
                                            </Campo>
                                            <Campo
                                                id="website"
                                                label="Sitio web"
                                                error={errors.website}
                                                hint="Si escribes solo el dominio, se añade https://"
                                            >
                                                <Input
                                                    id="campo-website"
                                                    value={values.website}
                                                    onChange={(e) => set('website', e.target.value)}
                                                    maxLength={150}
                                                    placeholder="mosso.pe"
                                                    aria-invalid={Boolean(errors.website)}
                                                />
                                            </Campo>
                                        </div>
                                    </Seccion>
                                )}

                                {/* ------------------------------- Dirección */}
                                {tab === 'direccion' && (
                                    <Seccion
                                        titulo="Dirección fiscal"
                                        descripcion="El domicilio registrado ante SUNAT. Aparece en el comprobante."
                                    >
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <Campo id="fk_departamento" label="Departamento" requerido>
                                                <Select
                                                    value={values.fk_departamento}
                                                    onValueChange={handleDepartamentoChange}
                                                >
                                                    <SelectTrigger id="campo-fk_departamento" className="w-full">
                                                        <SelectValue placeholder="Elige" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {departamentos.map((d) => (
                                                            <SelectItem
                                                                key={d.id_departamento}
                                                                value={String(d.id_departamento)}
                                                            >
                                                                {d.nombre}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </Campo>
                                            <Campo id="fk_provincia" label="Provincia" requerido>
                                                <Select
                                                    value={values.fk_provincia}
                                                    onValueChange={handleProvinciaChange}
                                                    disabled={!values.fk_departamento}
                                                >
                                                    <SelectTrigger id="campo-fk_provincia" className="w-full">
                                                        <SelectValue placeholder="Elige" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {provincias.map((p) => (
                                                            <SelectItem
                                                                key={p.id_provincia}
                                                                value={String(p.id_provincia)}
                                                            >
                                                                {p.nombre}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </Campo>
                                            <Campo id="fk_distrito" label="Distrito" requerido error={errors.fk_distrito}>
                                                <Select
                                                    value={values.fk_distrito}
                                                    onValueChange={(v) => set('fk_distrito', v)}
                                                    disabled={!values.fk_provincia}
                                                >
                                                    <SelectTrigger
                                                        id="campo-fk_distrito"
                                                        className="w-full"
                                                        aria-invalid={Boolean(errors.fk_distrito)}
                                                    >
                                                        <SelectValue placeholder="Elige" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {distritos.map((d) => (
                                                            <SelectItem key={d.id_distrito} value={String(d.id_distrito)}>
                                                                {d.nombre}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </Campo>
                                        </div>

                                        <Campo id="direccion" label="Dirección" requerido error={errors.direccion}>
                                            <Input
                                                id="campo-direccion"
                                                value={values.direccion}
                                                onChange={(e) => set('direccion', e.target.value)}
                                                maxLength={150}
                                                placeholder="Av. Grau 123, Urb. Santa Rosa"
                                                aria-invalid={Boolean(errors.direccion)}
                                            />
                                        </Campo>
                                        <Campo id="referencia" label="Referencia" error={errors.referencia}>
                                            <Input
                                                id="campo-referencia"
                                                value={values.referencia}
                                                onChange={(e) => set('referencia', e.target.value)}
                                                maxLength={150}
                                                placeholder="Frente al parque, tienda azul"
                                            />
                                        </Campo>
                                    </Seccion>
                                )}
                            </form>
                        )}
                    </div>

                    {/* ============================ Panel de vista previa ============================ */}
                    <aside className="order-first lg:order-none">
                        <div className="lg:sticky lg:top-6">
                            <p className="mb-2 text-xs font-medium text-muted-foreground">Así se ve en el comprobante</p>
                            <div className="overflow-hidden rounded-xl border border-border bg-card">
                                <div className="flex items-start gap-3 border-b border-border p-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                                        {logoPreview ? (
                                            <img
                                                src={logoPreview}
                                                alt=""
                                                className="h-full w-full object-contain p-1"
                                            />
                                        ) : (
                                            <Building2 className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-foreground">
                                            {values.nombre_comercial || 'Nombre comercial'}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {values.razon_social || 'Razón social S.A.C.'}
                                        </p>
                                        <p className="mt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
                                            RUC {values.ruc || '—'}
                                        </p>
                                    </div>
                                </div>
                                <dl className="space-y-2 p-4 text-xs">
                                    <PreviewLinea icon={MapPin}>
                                        {values.direccion || 'Dirección fiscal'}
                                        {distritoNombre ? `, ${distritoNombre}` : ''}
                                    </PreviewLinea>
                                    <PreviewLinea icon={Mail}>{values.correo || 'correo@empresa.pe'}</PreviewLinea>
                                    <PreviewLinea icon={Phone}>{values.telefono || 'Teléfono'}</PreviewLinea>
                                    {values.website && <PreviewLinea icon={Globe}>{values.website}</PreviewLinea>}
                                </dl>
                            </div>
                            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                                {(
                                    [
                                        [ScrollText, 'Comprobantes electrónicos'],
                                        [Store, 'Cabecera y pie de la tienda'],
                                        [BookText, 'Libro de Reclamaciones'],
                                    ] as const
                                ).map(([Icon, txt]) => (
                                    <li key={txt} className="flex items-center gap-2">
                                        <Icon className="h-3.5 w-3.5 shrink-0" />
                                        {txt}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>
                </div>
            </div>

            {/* --------------------------------------------- Barra de guardado */}
            {tab !== 'bancos' && dirty && (
                <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 motion-safe:animate-in motion-safe:slide-in-from-bottom-4">
                    <div className="flex w-full max-w-3xl items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-lg">
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mosso-yellow" />
                            <span className="hidden sm:inline">Tienes cambios sin guardar</span>
                            <span className="sm:hidden">Sin guardar</span>
                        </p>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 gap-1.5"
                                onClick={handleReset}
                                disabled={processing}
                            >
                                <RotateCcw className="h-4 w-4" /> Descartar
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                className="h-9 gap-2"
                                onClick={guardar}
                                disabled={processing}
                            >
                                {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                                {empresa ? 'Guardar cambios' : 'Registrar empresa'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ---------------------------------------------------------------------------
// Piezas auxiliares
// ---------------------------------------------------------------------------

function Seccion({
    titulo,
    descripcion,
    children,
}: {
    titulo: string;
    descripcion?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">{titulo}</h2>
            {descripcion && <p className="mt-0.5 text-xs text-muted-foreground">{descripcion}</p>}
            <div className="mt-4 flex flex-col gap-4">{children}</div>
        </section>
    );
}

function Campo({
    id,
    label,
    requerido,
    error,
    hint,
    hintTono = 'muted',
    children,
}: {
    id: string;
    label: string;
    requerido?: boolean;
    error?: string;
    hint?: React.ReactNode;
    hintTono?: 'muted' | 'ok' | 'error';
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={`campo-${id}`} className="text-xs font-medium text-foreground">
                {label}
                {requerido && <span className="ml-1 text-muted-foreground">·&nbsp;obligatorio</span>}
            </Label>
            {children}
            {error ? (
                <p className="text-[11px] font-medium text-destructive">{error}</p>
            ) : hint ? (
                <p
                    id={`${id}-hint`}
                    className={cn(
                        'text-[11px]',
                        hintTono === 'error'
                            ? 'text-destructive'
                            : hintTono === 'ok'
                              ? 'text-foreground'
                              : 'text-muted-foreground',
                    )}
                >
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

function PreviewLinea({ icon: Icon, children }: { icon: typeof MapPin; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-2 text-muted-foreground">
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 break-words">{children}</span>
        </div>
    );
}

EmpresaPage.layout = {
    breadcrumbs: [
        {
            title: 'Empresa',
            href: route('empresa.index'),
        },
    ],
};
