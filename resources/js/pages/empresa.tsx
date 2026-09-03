import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    Banknote,
    Building2,
    ImagePlus,
    Loader2,
    Mail,
    MapPin,
    Phone,
    RotateCcw,
    Save,
    ScrollText,
    X,
} from 'lucide-react';
import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import CuentasBancariasPanel from '@/components/empresa/cuentas-bancarias-panel';
import type { CuentaBancaria, Departamento, Distrito, Empresa, EmpresaFormValues, Provincia } from '@/types/empresa';

const inputClass =
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground/60 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50';

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

interface PageProps {
    empresa: Empresa | null;
    departamentos: Departamento[];
    cuentasBancarias: CuentaBancaria[];
}

export default function EmpresaPage({ empresa: empresaInicial, departamentos, cuentasBancarias }: PageProps) {
    const [tab, setTab] = useState<'general' | 'bancos'>('general');
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

    async function cargarUbicacion(e: Empresa | null) {
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
    }

    useEffect(() => {
        cargarUbicacion(empresaInicial);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function set<K extends keyof EmpresaFormValues>(key: K, value: EmpresaFormValues[K]) {
        setValues((v) => ({ ...v, [key]: value }));
    }

    async function handleDepartamentoChange(value: string) {
        set('fk_departamento', value);
        set('fk_provincia', '');
        set('fk_distrito', '');
        setDistritos([]);

        if (!value) {
            setProvincias([]);

            return;
        }

        const { data } = await axios.get(`/empresa/provincias/${value}`);
        setProvincias(data);
    }

    async function handleProvinciaChange(value: string) {
        set('fk_provincia', value);
        set('fk_distrito', '');

        if (!value) {
            setDistritos([]);

            return;
        }

        const { data } = await axios.get(`/empresa/distritos/${value}`);
        setDistritos(data);
    }

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

    function handleReset() {
        setValues(buildValues(empresa));
        setLogoFile(null);
        setEliminarLogo(false);
        setLogoPreview(empresa?.logo ? `/storage/${empresa.logo}` : null);
        setErrors({});
        cargarUbicacion(empresa);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const formData = new FormData();
        formData.append('ruc', values.ruc);
        formData.append('razon_social', values.razon_social);
        formData.append('nombre_comercial', values.nombre_comercial);
        formData.append('correo', values.correo);
        formData.append('telefono', values.telefono);

        if (values.celular) {
            formData.append('celular', values.celular);
        }

        if (values.website) {
            formData.append('website', values.website);
        }

        formData.append('direccion', values.direccion);

        if (values.referencia) {
            formData.append('referencia', values.referencia);
        }

        formData.append('fk_distrito', values.fk_distrito);

        if (logoFile) {
            formData.append('logo', logoFile);
        }

        if (eliminarLogo) {
            formData.append('eliminar_logo', '1');
        }

        try {
            const { data } = await axios.post('/empresa', formData);
            toast.success(data.message ?? 'Datos guardados correctamente.');

            const nuevaEmpresa = data.empresa as Empresa;
            setEmpresa(nuevaEmpresa);
            setValues(buildValues(nuevaEmpresa));
            setLogoFile(null);
            setEliminarLogo(false);
            setLogoPreview(nuevaEmpresa?.logo ? `/storage/${nuevaEmpresa.logo}` : null);
            cargarUbicacion(nuevaEmpresa);
        } catch (err: any) {
            if (err.response?.status === 422) {
                const backendErrors = err.response.data.errors ?? {};
                setErrors(Object.fromEntries(Object.entries(backendErrors).map(([k, v]) => [k, (v as string[])[0]])));
                toast.error('Revisa los campos marcados en el formulario.');
            } else {
                toast.error(err.response?.data?.message ?? 'No se pudo guardar la información de la empresa.');
            }
        } finally {
            setProcessing(false);
        }
    }

    const distritoNombre = useMemo(
        () => distritos.find((d) => String(d.id_distrito) === values.fk_distrito)?.nombre,
        [distritos, values.fk_distrito],
    );

    return (
        <>
            <Head title="Datos de la empresa" />

            <div className="relative flex-1 overflow-x-hidden rounded-xl bg-background p-4 dark:bg-gradient-to-br dark:from-[#150f30] dark:via-[#0b1220] dark:to-[#170c24] sm:p-6">
                <div className="pointer-events-none absolute inset-0 hidden dark:block">
                    <div className="absolute top-0 left-1/4 size-72 rounded-full bg-indigo-600/20 blur-[100px]" />
                    <div className="absolute right-0 bottom-0 size-72 rounded-full bg-fuchsia-600/10 blur-[100px]" />
                </div>

                <div className="relative flex flex-col gap-6">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
                            <Building2 className="h-6 w-6 text-indigo-500" />
                            Datos de la empresa
                        </div>
                        <p className="text-muted-foreground">
                            Esta información se usa en comprobantes y en el portal web. Es un registro único: cada
                            cambio actualiza los datos actuales de la empresa.
                        </p>
                    </div>

                    <div className="flex gap-2 border-b border-border">
                        <button
                            type="button"
                            onClick={() => setTab('general')}
                            className={`flex items-center gap-1.5 border-b-2 px-3 pb-2 text-sm font-medium transition-colors ${
                                tab === 'general'
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <ScrollText className="h-4 w-4" /> Datos generales
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('bancos')}
                            className={`flex items-center gap-1.5 border-b-2 px-3 pb-2 text-sm font-medium transition-colors ${
                                tab === 'bancos'
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Banknote className="h-4 w-4" /> Cuentas bancarias
                        </button>
                    </div>

                    {tab === 'bancos' && <CuentasBancariasPanel cuentasIniciales={cuentasBancarias} />}

                {tab === 'general' && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {errors.general && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {errors.general}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Columna izquierda: logo + vista previa */}
                        <div className="flex flex-col gap-6 lg:col-span-1">
                            <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
                                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <ImagePlus className="h-4 w-4 text-indigo-500" /> Logo
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">PNG, JPG o WEBP. Máximo 2 MB.</p>

                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOver(true);
                                    }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition ${
                                        dragOver
                                            ? 'border-indigo-500 bg-indigo-500/5'
                                            : 'border-border hover:border-indigo-400 hover:bg-muted/40'
                                    }`}
                                >
                                    {logoPreview ? (
                                        <div className="relative">
                                            <img
                                                src={logoPreview}
                                                alt="Logo de la empresa"
                                                className="h-28 w-28 rounded-xl bg-white object-contain p-2 shadow-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveLogo();
                                                }}
                                                className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow hover:bg-destructive/90"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                            <Building2 className="h-10 w-10" />
                                        </div>
                                    )}
                                    <span className="text-xs font-medium text-indigo-500">
                                        {logoPreview ? 'Cambiar imagen' : 'Haz clic o arrastra una imagen'}
                                    </span>
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
                                {errors.logo && <p className="mt-2 text-xs text-destructive">{errors.logo}</p>}
                            </div>

                            <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
                                <h2 className="text-sm font-semibold text-foreground">Vista previa</h2>
                                <div className="mt-4 rounded-xl bg-gradient-to-br from-slate-800 via-indigo-700 to-blue-600 p-5 text-white shadow-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/90">
                                            {logoPreview ? (
                                                <img src={logoPreview} className="h-full w-full object-contain p-1" alt="" />
                                            ) : (
                                                <Building2 className="h-6 w-6 text-indigo-600" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">
                                                {values.nombre_comercial || 'Nombre comercial'}
                                            </p>
                                            <p className="truncate text-xs text-indigo-100">
                                                RUC {values.ruc || '-----------'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-1.5 text-xs text-indigo-50">
                                        <p className="flex items-center gap-2">
                                            <Mail className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">{values.correo || 'correo@empresa.com'}</span>
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Phone className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">{values.telefono || '000 000 000'}</span>
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">
                                                {values.direccion || 'Dirección no registrada'}
                                                {distritoNombre ? `, ${distritoNombre}` : ''}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna derecha: formulario */}
                        <div className="flex flex-col gap-6 lg:col-span-2">
                            <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
                                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <ScrollText className="h-4 w-4 text-indigo-500" /> Datos generales
                                </h2>

                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            RUC <span className="ml-1 text-red-500">*</span>
                                        </label>
                                        <input
                                            value={values.ruc}
                                            onChange={(e) => set('ruc', e.target.value.replace(/\D/g, '').slice(0, 11))}
                                            inputMode="numeric"
                                            maxLength={11}
                                            placeholder="20123456789"
                                            className={inputClass}
                                            required
                                        />
                                        {errors.ruc && <p className="text-xs text-destructive">{errors.ruc}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Nombre comercial <span className="ml-1 text-red-500">*</span>
                                        </label>
                                        <input
                                            value={values.nombre_comercial}
                                            onChange={(e) => set('nombre_comercial', e.target.value)}
                                            maxLength={150}
                                            placeholder="Mosso Pet Shop"
                                            className={inputClass}
                                            required
                                        />
                                        {errors.nombre_comercial && (
                                            <p className="text-xs text-destructive">{errors.nombre_comercial}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">
                                        Razón social <span className="ml-1 text-red-500">*</span>
                                    </label>
                                    <input
                                        value={values.razon_social}
                                        onChange={(e) => set('razon_social', e.target.value)}
                                        maxLength={150}
                                        placeholder="Mosso S.A.C."
                                        className={inputClass}
                                        required
                                    />
                                    {errors.razon_social && (
                                        <p className="text-xs text-destructive">{errors.razon_social}</p>
                                    )}
                                </div>
                            </section>

                            <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
                                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <Phone className="h-4 w-4 text-indigo-500" /> Contacto
                                </h2>

                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Correo electrónico <span className="ml-1 text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={values.correo}
                                            onChange={(e) => set('correo', e.target.value)}
                                            maxLength={150}
                                            placeholder="contacto@empresa.com"
                                            className={inputClass}
                                            required
                                        />
                                        {errors.correo && <p className="text-xs text-destructive">{errors.correo}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Teléfono <span className="ml-1 text-red-500">*</span>
                                        </label>
                                        <input
                                            value={values.telefono}
                                            onChange={(e) => set('telefono', e.target.value)}
                                            maxLength={20}
                                            placeholder="+51 999 999 999"
                                            className={inputClass}
                                            required
                                        />
                                        {errors.telefono && (
                                            <p className="text-xs text-destructive">{errors.telefono}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground">Celular</label>
                                        <input
                                            value={values.celular}
                                            onChange={(e) => set('celular', e.target.value)}
                                            maxLength={20}
                                            placeholder="+51 999 999 999"
                                            className={inputClass}
                                        />
                                        {errors.celular && <p className="text-xs text-destructive">{errors.celular}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground">Sitio web</label>
                                        <input
                                            value={values.website}
                                            onChange={(e) => set('website', e.target.value)}
                                            maxLength={150}
                                            placeholder="https://mosso.pe"
                                            className={inputClass}
                                        />
                                        {errors.website && <p className="text-xs text-destructive">{errors.website}</p>}
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
                                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <MapPin className="h-4 w-4 text-indigo-500" /> Dirección
                                </h2>

                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Departamento <span className="ml-1 text-red-500">*</span>
                                        </label>
                                        <select
                                            value={values.fk_departamento}
                                            onChange={(e) => handleDepartamentoChange(e.target.value)}
                                            className={inputClass}
                                            required
                                        >
                                            <option value="">Selecciona</option>
                                            {departamentos.map((d) => (
                                                <option key={d.id_departamento} value={d.id_departamento}>
                                                    {d.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Provincia <span className="ml-1 text-red-500">*</span>
                                        </label>
                                        <select
                                            value={values.fk_provincia}
                                            onChange={(e) => handleProvinciaChange(e.target.value)}
                                            disabled={!values.fk_departamento}
                                            className={inputClass}
                                            required
                                        >
                                            <option value="">Selecciona</option>
                                            {provincias.map((p) => (
                                                <option key={p.id_provincia} value={p.id_provincia}>
                                                    {p.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Distrito <span className="ml-1 text-red-500">*</span>
                                        </label>
                                        <select
                                            value={values.fk_distrito}
                                            onChange={(e) => set('fk_distrito', e.target.value)}
                                            disabled={!values.fk_provincia}
                                            className={inputClass}
                                            required
                                        >
                                            <option value="">Selecciona</option>
                                            {distritos.map((d) => (
                                                <option key={d.id_distrito} value={d.id_distrito}>
                                                    {d.nombre}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.fk_distrito && (
                                            <p className="text-xs text-destructive">{errors.fk_distrito}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">
                                        Dirección <span className="ml-1 text-red-500">*</span>
                                    </label>
                                    <input
                                        value={values.direccion}
                                        onChange={(e) => set('direccion', e.target.value)}
                                        maxLength={150}
                                        placeholder="Av. / Jr. / Calle, número"
                                        className={inputClass}
                                        required
                                    />
                                    {errors.direccion && (
                                        <p className="text-xs text-destructive">{errors.direccion}</p>
                                    )}
                                </div>

                                <div className="mt-4 space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Referencia</label>
                                    <input
                                        value={values.referencia}
                                        onChange={(e) => set('referencia', e.target.value)}
                                        maxLength={150}
                                        placeholder="Cerca a..."
                                        className={inputClass}
                                    />
                                </div>
                            </section>
                        </div>
                    </div>

                    <div className="sticky bottom-4 z-10 flex flex-col items-stretch gap-3 rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">
                            {empresa
                                ? 'Los cambios se aplican al registro actual de la empresa.'
                                : 'Aún no se ha registrado la empresa. Completa el formulario para crear el registro.'}
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
                            >
                                <RotateCcw className="h-4 w-4" /> Restablecer
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:opacity-90 disabled:opacity-60"
                            >
                                {processing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Guardar cambios
                            </button>
                        </div>
                    </div>
                </form>
                )}
                </div>
            </div>
        </>
    );
}

EmpresaPage.layout = {
    breadcrumbs: [
        {
            title: 'Datos de la empresa',
            href: route('empresa.index'),
        },
    ],
};
