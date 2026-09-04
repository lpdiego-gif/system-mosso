import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    BadgeCheck,
    Check,
    CircleAlert,
    Eye,
    EyeOff,
    IdCard,
    Loader2,
    Lock,
    MapPin,
    ShieldCheck,
    Sparkles,
    UserRound,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

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
import { useDniLookup } from '@/hooks/use-dni-lookup';
import { cn } from '@/lib/utils';
import type {
    Departamento,
    Distrito,
    Provincia,
    Rol,
    TipoDocumento,
    TrabajadorFormValues,
    TrabajadorRecord,
} from '@/types/trabajador';

// ---------------------------------------------------------------------------
// Constantes / helpers
// ---------------------------------------------------------------------------

const HOY = new Date().toISOString().slice(0, 10);

const DOC_REGEX = /^[A-Za-z0-9]+$/;
const TEL_REGEX = /^[0-9+\s-]{6,20}$/;

type Seccion = 'identidad' | 'ubicacion' | 'acceso';

const CAMPO_SECCION: Record<string, Seccion> = {
    fk_tipo_documento: 'identidad',
    num_documento: 'identidad',
    nombres: 'identidad',
    apellido_paterno: 'identidad',
    apellido_materno: 'identidad',
    fecha_nacimiento: 'identidad',
    telefono: 'identidad',
    fk_departamento: 'ubicacion',
    fk_provincia: 'ubicacion',
    fk_distrito: 'ubicacion',
    direccion: 'ubicacion',
    referencia: 'ubicacion',
    email: 'acceso',
    fk_rol: 'acceso',
    fecha_ingreso: 'acceso',
    password: 'acceso',
    password_confirmation: 'acceso',
    general: 'identidad',
};

function buildValues(t: TrabajadorRecord | null): TrabajadorFormValues {
    return {
        fk_tipo_documento: t?.fk_tipo_documento
            ? String(t.fk_tipo_documento)
            : '',
        num_documento: t?.num_documento ?? '',
        nombres: t?.nombres ?? '',
        apellido_paterno: t?.apellido_paterno ?? '',
        apellido_materno: t?.apellido_materno ?? '',
        telefono: t?.telefono ?? '',
        fecha_nacimiento: t?.fecha_nacimiento ?? '',
        direccion: t?.direccion ?? '',
        referencia: t?.referencia ?? '',
        fk_departamento: t?.fk_departamento ? String(t.fk_departamento) : '',
        fk_provincia: t?.fk_provincia ? String(t.fk_provincia) : '',
        fk_distrito: t?.fk_distrito ? String(t.fk_distrito) : '',
        email: t?.email ?? '',
        password: '',
        password_confirmation: '',
        fk_rol: t?.fk_rol ? String(t.fk_rol) : '',
        fecha_ingreso: t?.fecha_ingreso ?? HOY,
    };
}

function tieneMayoriaDeEdad(iso: string): boolean {
    if (!iso) {
        return true;
    }

    const nacimiento = new Date(iso);

    if (Number.isNaN(nacimiento.getTime())) {
        return false;
    }

    const limite = new Date();

    limite.setFullYear(limite.getFullYear() - 18);

    return nacimiento <= limite;
}

function generarPassword(): string {
    const mayus = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const minus = 'abcdefghijkmnpqrstuvwxyz';
    const nums = '23456789';
    const simbolos = '!@#$%';
    const pool = mayus + minus + nums + simbolos;

    const base = [
        mayus[Math.floor(Math.random() * mayus.length)],
        minus[Math.floor(Math.random() * minus.length)],
        nums[Math.floor(Math.random() * nums.length)],
        simbolos[Math.floor(Math.random() * simbolos.length)],
    ];

    for (let i = 0; i < 6; i++) {
        base.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    return base.sort(() => Math.random() - 0.5).join('');
}

function reglasPassword(pass: string) {
    return [
        { label: 'Al menos 8 caracteres', ok: pass.length >= 8 },
        { label: 'Una minúscula', ok: /[a-z]/.test(pass) },
        { label: 'Una mayúscula', ok: /[A-Z]/.test(pass) },
        { label: 'Un número', ok: /\d/.test(pass) },
    ];
}

interface PageProps {
    trabajador: TrabajadorRecord | null;
    roles: Rol[];
    tiposDocumento: TipoDocumento[];
    departamentos: Departamento[];
    provinciasIniciales: Provincia[];
    distritosIniciales: Distrito[];
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function TrabajadorFormPage({
    trabajador,
    roles,
    tiposDocumento,
    departamentos,
    provinciasIniciales,
    distritosIniciales,
}: PageProps) {
    const isEdit = trabajador !== null;

    const inicial = useMemo(() => buildValues(trabajador), [trabajador]);

    const [values, setValues] = useState<TrabajadorFormValues>(inicial);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [changePassword, setChangePassword] = useState(!isEdit);
    const [camposBloqueados, setCamposBloqueados] = useState(false);
    const [seccionActiva, setSeccionActiva] = useState<Seccion>('identidad');

    const [provincias, setProvincias] = useState<Provincia[]>(
        provinciasIniciales ?? [],
    );
    const [distritos, setDistritos] = useState<Distrito[]>(
        distritosIniciales ?? [],
    );

    const resumenErroresRef = useRef<HTMLDivElement>(null);

    const dniHabilitado = !isEdit && Number(values.fk_tipo_documento) > 0;
    const { resultado, cargando: buscandoDocumento } = useDniLookup(
        dniHabilitado ? values.num_documento : '',
        values.fk_tipo_documento,
    );

    // Autocompletar con el resultado del lookup (solo al crear).
    useEffect(() => {
        if (!resultado || isEdit) {
            return;
        }

        if (resultado.persona) {
            setValues((v) => ({
                ...v,
                nombres: resultado.persona!.nombres ?? v.nombres,
                apellido_paterno:
                    resultado.persona!.apellido_paterno ?? v.apellido_paterno,
                apellido_materno:
                    resultado.persona!.apellido_materno ??
                    v.apellido_materno ??
                    '',
                telefono:
                    resultado.origen === 'local'
                        ? (resultado.persona!.telefono ?? v.telefono)
                        : v.telefono,
                fecha_nacimiento:
                    resultado.persona!.fecha_nacimiento ?? v.fecha_nacimiento,
            }));
            setCamposBloqueados(
                resultado.origen === 'local' || resultado.origen === 'reniec',
            );
        } else {
            setCamposBloqueados(false);
        }
    }, [resultado, isEdit]);

    const bloqueadoPorDuplicado =
        !isEdit && resultado?.ya_es_trabajador === true;

    // ---------------------------------------------------- aviso de cambios sin guardar
    const dirty = useMemo(() => {
        const cambioCampos = (
            Object.keys(inicial) as (keyof TrabajadorFormValues)[]
        ).some(
            (k) =>
                k !== 'password' &&
                k !== 'password_confirmation' &&
                inicial[k] !== values[k],
        );

        return (
            cambioCampos ||
            values.password !== '' ||
            values.password_confirmation !== ''
        );
    }, [inicial, values]);

    useEffect(() => {
        function aviso(e: BeforeUnloadEvent) {
            if (dirty && !processing) {
                e.preventDefault();
                e.returnValue = '';
            }
        }

        window.addEventListener('beforeunload', aviso);

        return () => window.removeEventListener('beforeunload', aviso);
    }, [dirty, processing]);

    useEffect(() => {
        const quitar = router.on('before', (event) => {
            if (
                dirty &&
                !processing &&
                !window.confirm(
                    'Tienes cambios sin guardar. ¿Salir de todos modos?',
                )
            ) {
                event.preventDefault();
            }
        });

        return quitar;
    }, [dirty, processing]);

    // --------------------------------------------------------------- setters
    function set<K extends keyof TrabajadorFormValues>(
        key: K,
        value: TrabajadorFormValues[K],
    ) {
        setValues((v) => ({ ...v, [key]: value }));
        setErrors((e) => (e[key] ? { ...e, [key]: '' } : e));
    }

    async function handleDepartamentoChange(value: string) {
        setValues((v) => ({
            ...v,
            fk_departamento: value,
            fk_provincia: '',
            fk_distrito: '',
        }));
        setProvincias([]);
        setDistritos([]);

        if (!value) {
            return;
        }

        try {
            const { data } = await axios.get<Provincia[]>(
                `/trabajador/provincias/${value}`,
            );

            setProvincias(data);
        } catch {
            toast.error('No se pudieron cargar las provincias.');
        }
    }

    async function handleProvinciaChange(value: string) {
        setValues((v) => ({ ...v, fk_provincia: value, fk_distrito: '' }));
        setDistritos([]);

        if (!value) {
            return;
        }

        try {
            const { data } = await axios.get<Distrito[]>(
                `/trabajador/distritos/${value}`,
            );

            setDistritos(data);
        } catch {
            toast.error('No se pudieron cargar los distritos.');
        }
    }

    const tituloDocumento = useMemo(
        () =>
            tiposDocumento.find(
                (t) => String(t.id_tipo_documento) === values.fk_tipo_documento,
            )?.nombre,
        [tiposDocumento, values.fk_tipo_documento],
    );

    // ---------------------------------------------------------- validación local
    function validar(): Record<string, string> {
        const e: Record<string, string> = {};
        const requierePassword = !isEdit || changePassword;

        if (!values.fk_tipo_documento) {
            e.fk_tipo_documento = 'Selecciona el tipo de documento.';
        }

        const doc = values.num_documento.trim();

        if (!doc) {
            e.num_documento = 'Ingresa el número de documento.';
        } else if (!DOC_REGEX.test(doc)) {
            e.num_documento =
                'Solo se permiten letras y números, sin espacios ni guiones.';
        } else if (doc.length < 8 || doc.length > 20) {
            e.num_documento = 'Debe tener entre 8 y 20 caracteres.';
        }

        if (!values.nombres.trim()) {
            e.nombres = 'Ingresa los nombres.';
        }

        if (!values.apellido_paterno.trim()) {
            e.apellido_paterno = 'Ingresa el apellido paterno.';
        }

        const tel = values.telefono.trim();

        if (!tel) {
            e.telefono = 'Ingresa el teléfono.';
        } else if (!TEL_REGEX.test(tel)) {
            e.telefono = 'Teléfono no válido (6 a 20 dígitos).';
        }

        if (
            values.fecha_nacimiento &&
            !tieneMayoriaDeEdad(values.fecha_nacimiento)
        ) {
            e.fecha_nacimiento = 'El trabajador debe ser mayor de edad.';
        }

        // Dirección: completa o vacía, nunca a medias.
        const tieneDireccion = values.direccion.trim() !== '';
        const tieneDistrito = values.fk_distrito !== '';

        if (tieneDireccion && !tieneDistrito) {
            e.fk_distrito = 'Selecciona el distrito de la dirección.';
        }

        if (!tieneDireccion && tieneDistrito) {
            e.direccion = 'Escribe la dirección o quita el distrito.';
        }

        if (!values.email.trim()) {
            e.email = 'Ingresa el correo electrónico.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
            e.email = 'El correo no tiene un formato válido.';
        }

        if (!values.fk_rol) {
            e.fk_rol = 'Selecciona el rol del trabajador.';
        }

        if (!values.fecha_ingreso) {
            e.fecha_ingreso = 'Indica la fecha de ingreso.';
        } else if (values.fecha_ingreso > HOY) {
            e.fecha_ingreso = 'La fecha de ingreso no puede ser futura.';
        }

        if (requierePassword) {
            const fallas = reglasPassword(values.password).filter((r) => !r.ok);

            if (!values.password) {
                e.password = 'Define una contraseña de acceso.';
            } else if (fallas.length > 0) {
                e.password = 'La contraseña no cumple los requisitos.';
            } else if (values.password !== values.password_confirmation) {
                e.password_confirmation = 'Las contraseñas no coinciden.';
            }
        }

        return e;
    }

    function irAErrores(mapa: Record<string, string>) {
        const primer = Object.keys(mapa)[0];

        if (primer && CAMPO_SECCION[primer]) {
            setSeccionActiva(CAMPO_SECCION[primer]);
        }

        requestAnimationFrame(() => {
            resumenErroresRef.current?.focus();
            const destino = primer
                ? document.getElementById(`campo-${primer}`)
                : null;

            destino?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    // ------------------------------------------------------------------ submit
    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        if (bloqueadoPorDuplicado) {
            return;
        }

        const localErrors = validar();

        if (Object.keys(localErrors).length > 0) {
            setErrors(localErrors);
            irAErrores(localErrors);

            return;
        }

        setProcessing(true);
        setErrors({});

        const payload: Record<string, unknown> = {
            fk_tipo_documento: values.fk_tipo_documento,
            num_documento: values.num_documento.trim(),
            nombres: values.nombres.trim(),
            apellido_paterno: values.apellido_paterno.trim(),
            apellido_materno: values.apellido_materno.trim() || null,
            telefono: values.telefono.trim(),
            fecha_nacimiento: values.fecha_nacimiento || null,
            direccion: values.direccion.trim() || null,
            referencia: values.referencia.trim() || null,
            fk_distrito: values.fk_distrito || null,
            email: values.email.trim(),
            fk_rol: values.fk_rol,
            fecha_ingreso: values.fecha_ingreso,
        };

        if (!isEdit || changePassword) {
            payload.password = values.password;
            payload.password_confirmation = values.password_confirmation;
        }

        try {
            if (isEdit) {
                const { data } = await axios.put(
                    `/trabajador/${trabajador!.id_trabajador}`,
                    payload,
                );

                toast.success(data.message ?? 'Trabajador actualizado.');
            } else {
                const { data } = await axios.post('/trabajador', payload);

                toast.success(data.message ?? 'Trabajador registrado.');
            }

            router.visit('/trabajador');
        } catch (err: unknown) {
            const res = axios.isAxiosError(err) ? err.response : undefined;

            if (res?.status === 422) {
                const backend = (res.data?.errors ?? {}) as Record<
                    string,
                    string[]
                >;
                const mapa = Object.fromEntries(
                    Object.entries(backend).map(([k, v]) => [k, v[0]]),
                );

                setErrors(mapa);
                irAErrores(mapa);
            } else {
                toast.error(
                    res?.data?.message ?? 'No se pudo guardar el trabajador.',
                );
            }

            setProcessing(false);
        }
    }

    // --------------------------------------------------------------- derivados
    const requierePassword = !isEdit || changePassword;
    const passwordChecks = reglasPassword(values.password);
    const passwordScore = passwordChecks.filter((r) => r.ok).length;

    const nombreVisible =
        `${values.nombres} ${values.apellido_paterno} ${values.apellido_materno}`.trim();
    const rolVisible = roles.find(
        (r) => String(r.id_rol) === values.fk_rol,
    )?.nombre;

    const progreso: {
        seccion: Seccion;
        label: string;
        opcional?: boolean;
        completo: boolean;
    }[] = [
        {
            seccion: 'identidad',
            label: 'Identidad',
            completo:
                !!values.fk_tipo_documento &&
                DOC_REGEX.test(values.num_documento.trim()) &&
                values.num_documento.trim().length >= 8 &&
                !!values.nombres.trim() &&
                !!values.apellido_paterno.trim() &&
                TEL_REGEX.test(values.telefono.trim()),
        },
        {
            seccion: 'ubicacion',
            label: 'Dirección',
            opcional: true,
            completo:
                values.direccion.trim() !== '' && values.fk_distrito !== '',
        },
        {
            seccion: 'acceso',
            label: 'Acceso al sistema',
            completo:
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) &&
                !!values.fk_rol &&
                !!values.fecha_ingreso &&
                (!requierePassword ||
                    (passwordScore === 4 &&
                        values.password === values.password_confirmation)),
        },
    ];

    const listaErrores = Object.entries(errors).filter(([, v]) => v);

    return (
        <>
            <Head title={isEdit ? 'Editar trabajador' : 'Nuevo trabajador'} />

            <form
                onSubmit={handleSubmit}
                className="mx-auto w-full max-w-5xl p-4 pb-28 sm:p-6"
            >
                {/* ------------------------------------------- Encabezado */}
                <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mosso-yellow text-mosso-dark shadow-sm">
                            <UserRound className="h-5 w-5" strokeWidth={2.25} />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground">
                                {isEdit
                                    ? 'Editar trabajador'
                                    : 'Nuevo trabajador'}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {isEdit
                                    ? 'Actualiza los datos personales, la dirección y el acceso al sistema.'
                                    : 'Registra a la persona, su dirección opcional y su cuenta de acceso.'}
                            </p>
                        </div>
                    </div>

                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="gap-1.5 self-start sm:self-auto"
                    >
                        <Link href="/trabajador">
                            <ArrowLeft className="h-4 w-4" /> Volver al listado
                        </Link>
                    </Button>
                </header>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
                    {/* --------------------------------------- Columna del formulario */}
                    <div className="min-w-0 space-y-4">
                        {/* Navegación por secciones */}
                        <nav className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
                            {(
                                [
                                    ['identidad', 'Identidad'],
                                    ['ubicacion', 'Dirección'],
                                    ['acceso', 'Acceso'],
                                ] as const
                            ).map(([clave, label]) => (
                                <button
                                    key={clave}
                                    type="button"
                                    onClick={() => {
                                        setSeccionActiva(clave);
                                        document
                                            .getElementById(`seccion-${clave}`)
                                            ?.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'start',
                                            });
                                    }}
                                    aria-pressed={seccionActiva === clave}
                                    className={cn(
                                        'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                        seccionActiva === clave
                                            ? 'bg-foreground text-background'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </nav>

                        {/* Resumen de errores */}
                        {listaErrores.length > 0 && (
                            <div
                                ref={resumenErroresRef}
                                tabIndex={-1}
                                role="alert"
                                className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm outline-none"
                            >
                                <p className="flex items-center gap-2 font-medium text-destructive">
                                    <CircleAlert className="h-4 w-4" />
                                    Revisa{' '}
                                    {listaErrores.length === 1
                                        ? 'este dato'
                                        : `estos ${listaErrores.length} datos`}
                                </p>
                                <ul className="mt-2 list-inside list-disc space-y-0.5 text-destructive/90">
                                    {listaErrores.map(([campo, mensaje]) => (
                                        <li key={campo}>{mensaje}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* -------------------- Sección: Identidad -------------------- */}
                        <Seccion
                            id="seccion-identidad"
                            icon={<IdCard className="h-4 w-4" />}
                            titulo="Identidad de la persona"
                            descripcion="Datos personales tomados del documento de identidad."
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Campo
                                    id="campo-fk_tipo_documento"
                                    label="Tipo de documento"
                                    error={errors.fk_tipo_documento}
                                    requerido
                                >
                                    <Select
                                        value={values.fk_tipo_documento}
                                        onValueChange={(v) =>
                                            set('fk_tipo_documento', v)
                                        }
                                        disabled={isEdit}
                                    >
                                        <SelectTrigger
                                            id="campo-fk_tipo_documento"
                                            className="h-9"
                                            aria-invalid={
                                                !!errors.fk_tipo_documento
                                            }
                                        >
                                            <SelectValue placeholder="Selecciona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tiposDocumento.map((t) => (
                                                <SelectItem
                                                    key={t.id_tipo_documento}
                                                    value={String(
                                                        t.id_tipo_documento,
                                                    )}
                                                >
                                                    {t.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Campo>

                                <Campo
                                    id="campo-num_documento"
                                    label={`N.º de ${tituloDocumento ?? 'documento'}`}
                                    error={errors.num_documento}
                                    requerido
                                    hint={
                                        isEdit
                                            ? 'El documento no se edita.'
                                            : 'Entre 8 y 20 caracteres, solo letras y números.'
                                    }
                                >
                                    <div className="relative">
                                        <Input
                                            id="campo-num_documento"
                                            value={values.num_documento}
                                            onChange={(e) =>
                                                set(
                                                    'num_documento',
                                                    e.target.value
                                                        .toUpperCase()
                                                        .replace(/\s/g, ''),
                                                )
                                            }
                                            maxLength={20}
                                            disabled={isEdit}
                                            inputMode="text"
                                            autoComplete="off"
                                            className="h-9 pr-9 font-mono tabular-nums"
                                            aria-invalid={
                                                !!errors.num_documento
                                            }
                                        />
                                        {buscandoDocumento && (
                                            <Loader2 className="absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                                        )}
                                    </div>
                                </Campo>
                            </div>

                            {!isEdit && resultado && (
                                <div className="text-xs">
                                    {bloqueadoPorDuplicado ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1 font-medium text-destructive">
                                            <CircleAlert className="h-3.5 w-3.5" />{' '}
                                            Ya existe un trabajador con este
                                            documento
                                        </span>
                                    ) : resultado.origen === 'reniec' ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2 py-1 font-medium text-foreground">
                                            <BadgeCheck className="h-3.5 w-3.5" />{' '}
                                            Verificado en RENIEC
                                        </span>
                                    ) : resultado.origen === 'local' ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2 py-1 font-medium text-foreground">
                                            <BadgeCheck className="h-3.5 w-3.5" />{' '}
                                            Persona ya registrada · se
                                            reutilizan sus datos
                                        </span>
                                    ) : null}
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Campo
                                    id="campo-nombres"
                                    label="Nombres"
                                    error={errors.nombres}
                                    requerido
                                >
                                    <Input
                                        id="campo-nombres"
                                        value={values.nombres}
                                        onChange={(e) =>
                                            set('nombres', e.target.value)
                                        }
                                        readOnly={camposBloqueados}
                                        maxLength={100}
                                        className="h-9"
                                        aria-invalid={!!errors.nombres}
                                    />
                                </Campo>
                                <Campo
                                    id="campo-apellido_paterno"
                                    label="Apellido paterno"
                                    error={errors.apellido_paterno}
                                    requerido
                                >
                                    <Input
                                        id="campo-apellido_paterno"
                                        value={values.apellido_paterno}
                                        onChange={(e) =>
                                            set(
                                                'apellido_paterno',
                                                e.target.value,
                                            )
                                        }
                                        readOnly={camposBloqueados}
                                        maxLength={100}
                                        className="h-9"
                                        aria-invalid={!!errors.apellido_paterno}
                                    />
                                </Campo>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Campo
                                    id="campo-apellido_materno"
                                    label="Apellido materno"
                                    error={errors.apellido_materno}
                                    hint="Opcional"
                                >
                                    <Input
                                        id="campo-apellido_materno"
                                        value={values.apellido_materno}
                                        onChange={(e) =>
                                            set(
                                                'apellido_materno',
                                                e.target.value,
                                            )
                                        }
                                        readOnly={camposBloqueados}
                                        maxLength={100}
                                        className="h-9"
                                    />
                                </Campo>
                                <Campo
                                    id="campo-fecha_nacimiento"
                                    label="Fecha de nacimiento"
                                    error={errors.fecha_nacimiento}
                                    hint="Opcional · debe ser mayor de edad"
                                >
                                    <Input
                                        id="campo-fecha_nacimiento"
                                        type="date"
                                        value={values.fecha_nacimiento}
                                        onChange={(e) =>
                                            set(
                                                'fecha_nacimiento',
                                                e.target.value,
                                            )
                                        }
                                        readOnly={camposBloqueados}
                                        max={HOY}
                                        className="h-9"
                                        aria-invalid={!!errors.fecha_nacimiento}
                                    />
                                </Campo>
                            </div>

                            <Campo
                                id="campo-telefono"
                                label="Teléfono"
                                error={errors.telefono}
                                requerido
                                hint="Solo dígitos, entre 6 y 20."
                            >
                                <Input
                                    id="campo-telefono"
                                    value={values.telefono}
                                    onChange={(e) =>
                                        set(
                                            'telefono',
                                            e.target.value.replace(
                                                /[^\d+\s-]/g,
                                                '',
                                            ),
                                        )
                                    }
                                    maxLength={20}
                                    inputMode="tel"
                                    className="h-9 font-mono tabular-nums sm:max-w-xs"
                                    aria-invalid={!!errors.telefono}
                                />
                            </Campo>
                        </Seccion>

                        {/* -------------------- Sección: Dirección -------------------- */}
                        <Seccion
                            id="seccion-ubicacion"
                            icon={<MapPin className="h-4 w-4" />}
                            titulo="Dirección"
                            descripcion="Opcional. Si la registras, completa distrito y calle."
                        >
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Campo
                                    id="campo-fk_departamento"
                                    label="Departamento"
                                    error={errors.fk_departamento}
                                >
                                    <Select
                                        value={values.fk_departamento}
                                        onValueChange={handleDepartamentoChange}
                                    >
                                        <SelectTrigger
                                            id="campo-fk_departamento"
                                            className="h-9"
                                        >
                                            <SelectValue placeholder="Selecciona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departamentos.map((d) => (
                                                <SelectItem
                                                    key={d.id_departamento}
                                                    value={String(
                                                        d.id_departamento,
                                                    )}
                                                >
                                                    {d.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Campo>
                                <Campo
                                    id="campo-fk_provincia"
                                    label="Provincia"
                                    error={errors.fk_provincia}
                                >
                                    <Select
                                        value={values.fk_provincia}
                                        onValueChange={handleProvinciaChange}
                                        disabled={!values.fk_departamento}
                                    >
                                        <SelectTrigger
                                            id="campo-fk_provincia"
                                            className="h-9"
                                        >
                                            <SelectValue placeholder="Selecciona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {provincias.map((p) => (
                                                <SelectItem
                                                    key={p.id_provincia}
                                                    value={String(
                                                        p.id_provincia,
                                                    )}
                                                >
                                                    {p.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Campo>
                                <Campo
                                    id="campo-fk_distrito"
                                    label="Distrito"
                                    error={errors.fk_distrito}
                                >
                                    <Select
                                        value={values.fk_distrito}
                                        onValueChange={(v) =>
                                            set('fk_distrito', v)
                                        }
                                        disabled={!values.fk_provincia}
                                    >
                                        <SelectTrigger
                                            id="campo-fk_distrito"
                                            className="h-9"
                                            aria-invalid={!!errors.fk_distrito}
                                        >
                                            <SelectValue placeholder="Selecciona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {distritos.map((d) => (
                                                <SelectItem
                                                    key={d.id_distrito}
                                                    value={String(
                                                        d.id_distrito,
                                                    )}
                                                >
                                                    {d.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Campo>
                            </div>

                            <Campo
                                id="campo-direccion"
                                label="Dirección"
                                error={errors.direccion}
                                hint="Av. / Jr. / Calle y número"
                            >
                                <Input
                                    id="campo-direccion"
                                    value={values.direccion}
                                    onChange={(e) =>
                                        set('direccion', e.target.value)
                                    }
                                    maxLength={150}
                                    className="h-9"
                                    aria-invalid={!!errors.direccion}
                                />
                            </Campo>
                            <Campo
                                id="campo-referencia"
                                label="Referencia"
                                error={errors.referencia}
                                hint="Opcional"
                            >
                                <Input
                                    id="campo-referencia"
                                    value={values.referencia}
                                    onChange={(e) =>
                                        set('referencia', e.target.value)
                                    }
                                    maxLength={150}
                                    className="h-9"
                                />
                            </Campo>
                        </Seccion>

                        {/* -------------------- Sección: Acceso -------------------- */}
                        <Seccion
                            id="seccion-acceso"
                            icon={<ShieldCheck className="h-4 w-4" />}
                            titulo="Cuenta y acceso al sistema"
                            descripcion="Con estos datos el trabajador inicia sesión en MOSSO."
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Campo
                                    id="campo-email"
                                    label="Correo electrónico"
                                    error={errors.email}
                                    requerido
                                >
                                    <Input
                                        id="campo-email"
                                        type="email"
                                        value={values.email}
                                        onChange={(e) =>
                                            set('email', e.target.value)
                                        }
                                        maxLength={255}
                                        autoComplete="off"
                                        className="h-9"
                                        aria-invalid={!!errors.email}
                                    />
                                </Campo>
                                <Campo
                                    id="campo-fk_rol"
                                    label="Rol"
                                    error={errors.fk_rol}
                                    requerido
                                >
                                    <Select
                                        value={values.fk_rol}
                                        onValueChange={(v) => set('fk_rol', v)}
                                    >
                                        <SelectTrigger
                                            id="campo-fk_rol"
                                            className="h-9"
                                            aria-invalid={!!errors.fk_rol}
                                        >
                                            <SelectValue placeholder="Selecciona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((r) => (
                                                <SelectItem
                                                    key={r.id_rol}
                                                    value={String(r.id_rol)}
                                                >
                                                    {r.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Campo>
                            </div>

                            <Campo
                                id="campo-fecha_ingreso"
                                label="Fecha de ingreso"
                                error={errors.fecha_ingreso}
                                requerido
                                hint="No puede ser una fecha futura."
                            >
                                <Input
                                    id="campo-fecha_ingreso"
                                    type="date"
                                    value={values.fecha_ingreso}
                                    onChange={(e) =>
                                        set('fecha_ingreso', e.target.value)
                                    }
                                    max={HOY}
                                    className="h-9 sm:max-w-xs"
                                    aria-invalid={!!errors.fecha_ingreso}
                                />
                            </Campo>

                            {isEdit && !changePassword ? (
                                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                        La contraseña actual se mantiene sin
                                        cambios.
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="ml-auto"
                                        onClick={() => setChangePassword(true)}
                                    >
                                        Cambiar contraseña
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium text-foreground">
                                            {isEdit
                                                ? 'Nueva contraseña'
                                                : 'Contraseña de acceso'}
                                        </Label>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="xs"
                                                onClick={() => {
                                                    const pass =
                                                        generarPassword();

                                                    set('password', pass);
                                                    set(
                                                        'password_confirmation',
                                                        pass,
                                                    );
                                                    setShowPassword(true);
                                                }}
                                            >
                                                <Sparkles className="h-3.5 w-3.5" />{' '}
                                                Generar
                                            </Button>
                                            {isEdit && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="xs"
                                                    onClick={() => {
                                                        setChangePassword(
                                                            false,
                                                        );
                                                        set('password', '');
                                                        set(
                                                            'password_confirmation',
                                                            '',
                                                        );
                                                    }}
                                                >
                                                    Cancelar
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <div className="relative">
                                                <Input
                                                    id="campo-password"
                                                    type={
                                                        showPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    value={values.password}
                                                    onChange={(e) =>
                                                        set(
                                                            'password',
                                                            e.target.value,
                                                        )
                                                    }
                                                    autoComplete="new-password"
                                                    placeholder="Contraseña"
                                                    className="h-9 pr-9"
                                                    aria-invalid={
                                                        !!errors.password
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            (s) => !s,
                                                        )
                                                    }
                                                    tabIndex={-1}
                                                    aria-label={
                                                        showPassword
                                                            ? 'Ocultar contraseña'
                                                            : 'Mostrar contraseña'
                                                    }
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                            {errors.password && (
                                                <p className="text-[11px] font-medium text-destructive">
                                                    {errors.password}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Input
                                                id="campo-password_confirmation"
                                                type={
                                                    showPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                value={
                                                    values.password_confirmation
                                                }
                                                onChange={(e) =>
                                                    set(
                                                        'password_confirmation',
                                                        e.target.value,
                                                    )
                                                }
                                                autoComplete="new-password"
                                                placeholder="Repite la contraseña"
                                                className="h-9"
                                                aria-invalid={
                                                    !!errors.password_confirmation
                                                }
                                            />
                                            {errors.password_confirmation && (
                                                <p className="text-[11px] font-medium text-destructive">
                                                    {
                                                        errors.password_confirmation
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {(values.password || requierePassword) && (
                                        <div className="space-y-2">
                                            <div className="flex gap-1">
                                                {[0, 1, 2, 3].map((i) => (
                                                    <span
                                                        key={i}
                                                        className={cn(
                                                            'h-1 flex-1 rounded-full transition-colors',
                                                            i < passwordScore
                                                                ? 'bg-mosso-yellow'
                                                                : 'bg-border',
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                                                {passwordChecks.map((r) => (
                                                    <li
                                                        key={r.label}
                                                        className={cn(
                                                            'flex items-center gap-1.5 text-[11px]',
                                                            r.ok
                                                                ? 'text-foreground'
                                                                : 'text-muted-foreground',
                                                        )}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                'h-3 w-3',
                                                                r.ok
                                                                    ? 'text-mosso-dark dark:text-mosso-yellow'
                                                                    : 'text-muted-foreground/40',
                                                            )}
                                                        />
                                                        {r.label}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Seccion>
                    </div>

                    {/* --------------------------------------- Columna resumen */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-6 space-y-4 rounded-xl border border-border bg-card p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground/70 ring-1 ring-border">
                                    {(
                                        values.nombres.charAt(0) +
                                        values.apellido_paterno.charAt(0)
                                    ).toUpperCase() || '—'}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">
                                        {nombreVisible ||
                                            'Trabajador sin nombre'}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {rolVisible ?? 'Sin rol asignado'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 border-t border-border pt-3">
                                {progreso.map((p) => (
                                    <button
                                        key={p.seccion}
                                        type="button"
                                        onClick={() => {
                                            setSeccionActiva(p.seccion);
                                            document
                                                .getElementById(
                                                    `seccion-${p.seccion}`,
                                                )
                                                ?.scrollIntoView({
                                                    behavior: 'smooth',
                                                    block: 'start',
                                                });
                                        }}
                                        className="flex w-full items-center gap-2 text-left text-xs"
                                    >
                                        <span
                                            className={cn(
                                                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                                                p.completo
                                                    ? 'border-mosso-yellow bg-mosso-yellow text-mosso-dark'
                                                    : 'border-muted-foreground/40 text-transparent',
                                            )}
                                        >
                                            <Check
                                                className="h-2.5 w-2.5"
                                                strokeWidth={3}
                                            />
                                        </span>
                                        <span
                                            className={cn(
                                                p.completo
                                                    ? 'text-foreground'
                                                    : 'text-muted-foreground',
                                            )}
                                        >
                                            {p.label}
                                            {p.opcional && (
                                                <span className="text-muted-foreground/60">
                                                    {' '}
                                                    · opcional
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
                                {isEdit
                                    ? 'Los cambios se aplican al guardar. El documento no puede modificarse.'
                                    : 'Al registrar, se crea la cuenta con acceso activo de inmediato.'}
                            </p>
                        </div>
                    </aside>
                </div>

                {/* --------------------------------------- Barra de acciones fija */}
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                    <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
                        <p className="hidden text-xs text-muted-foreground sm:block">
                            {dirty
                                ? 'Tienes cambios sin guardar.'
                                : 'Sin cambios pendientes.'}
                        </p>
                        <div className="flex flex-1 items-center justify-end gap-2">
                            <Button
                                asChild
                                type="button"
                                variant="ghost"
                                size="sm"
                            >
                                <Link href="/trabajador">Cancelar</Link>
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="gap-2"
                                disabled={processing || bloqueadoPorDuplicado}
                            >
                                {processing && (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                )}
                                {isEdit
                                    ? 'Guardar cambios'
                                    : 'Registrar trabajador'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}

// ---------------------------------------------------------------------------
// Piezas auxiliares
// ---------------------------------------------------------------------------

function Seccion({
    id,
    icon,
    titulo,
    descripcion,
    children,
}: {
    id: string;
    icon: ReactNode;
    titulo: string;
    descripcion: string;
    children: ReactNode;
}) {
    return (
        <section
            id={id}
            className="scroll-mt-6 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5"
        >
            <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {icon}
                </span>
                <div>
                    <h2 className="text-sm font-semibold text-foreground">
                        {titulo}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        {descripcion}
                    </p>
                </div>
            </div>
            {children}
        </section>
    );
}

function Campo({
    id,
    label,
    error,
    hint,
    requerido = false,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    hint?: string;
    requerido?: boolean;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-xs font-medium text-foreground">
                {label}
                {requerido ? (
                    <span className="ml-0.5 text-destructive">*</span>
                ) : (
                    <span className="ml-1 font-normal text-muted-foreground">
                        (opcional)
                    </span>
                )}
            </Label>
            {children}
            {error ? (
                <p className="text-[11px] font-medium text-destructive">
                    {error}
                </p>
            ) : hint ? (
                <p className="text-[11px] text-muted-foreground">{hint}</p>
            ) : null}
        </div>
    );
}

TrabajadorFormPage.layout = {
    breadcrumbs: [
        { title: 'Trabajadores', href: '/trabajador' },
        { title: 'Formulario', href: '/trabajador' },
    ],
};
