import { Link, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    IdCard,
    KeyRound,
    Loader2,
    Lock,
    Mail,
    ShieldCheck,
    UserRound,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import { ClienteAvatar } from '@/components/clientes/cliente-avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ClienteEditData, TipoDocumentoOption } from '@/types/cliente';

interface Props {
    tiposDocumento: TipoDocumentoOption[];
    cliente?: ClienteEditData;
}

interface ClienteFormShape {
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    fk_tipo_documento: string;
    num_documento: string;
    telefono: string;
    fecha_nacimiento: string;
    correo: string;
    es_empresa: boolean;
    razon_social: string;
    ruc: string;
    crear_cuenta: boolean;
    password: string;
    password_confirmation: string;
    nueva_password: string;
    nueva_password_confirmation: string;
}

const controlBase =
    'w-full rounded-md border border-input bg-transparent text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30';
const selectClass = cn(controlBase, 'h-9 px-3 py-1');

function valoresIniciales(
    cliente: ClienteEditData | undefined,
    tipos: TipoDocumentoOption[],
): ClienteFormShape {
    return {
        nombres: cliente?.nombres ?? '',
        apellido_paterno: cliente?.apellido_paterno ?? '',
        apellido_materno: cliente?.apellido_materno ?? '',
        fk_tipo_documento:
            cliente?.fk_tipo_documento ||
            (tipos[0] ? String(tipos[0].id_tipo_documento) : ''),
        num_documento: cliente?.num_documento ?? '',
        telefono: cliente?.telefono ?? '',
        fecha_nacimiento: cliente?.fecha_nacimiento ?? '',
        correo: cliente?.correo ?? '',
        es_empresa: cliente?.es_empresa ?? false,
        razon_social: cliente?.razon_social ?? '',
        ruc: cliente?.ruc ?? '',
        crear_cuenta: false,
        password: '',
        password_confirmation: '',
        nueva_password: '',
        nueva_password_confirmation: '',
    };
}

function ErrorText({ children }: { children?: string }) {
    if (!children) {
        return null;
    }

    return (
        <p className="text-xs font-medium text-destructive" role="alert">
            {children}
        </p>
    );
}

function Field({
    label,
    required,
    hint,
    error,
    className,
    children,
}: {
    label: ReactNode;
    required?: boolean;
    hint?: ReactNode;
    error?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('space-y-2', className)}>
            <Label className="grid gap-2">
                <span className="flex items-center gap-1.5">
                    {label}
                    {required ? (
                        <span aria-hidden className="text-destructive">
                            *
                        </span>
                    ) : null}
                </span>
                {children}
            </Label>
            {hint ? (
                <p className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
            <ErrorText>{error}</ErrorText>
        </div>
    );
}

function Seccion({
    icon: Icon,
    titulo,
    descripcion,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    titulo: string;
    descripcion?: string;
    children: ReactNode;
}) {
    return (
        <section className="relative rounded-xl border bg-card shadow-sm">
            <div className="flex items-start gap-3.5 border-b p-4 sm:p-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-mosso-yellow/15 text-mosso-dark ring-1 ring-inset ring-mosso-yellow/30 dark:text-mosso-yellow">
                    <Icon className="size-4" />
                </span>
                <div className="space-y-0.5">
                    <h2 className="font-semibold tracking-tight text-foreground">
                        {titulo}
                    </h2>
                    {descripcion ? (
                        <p className="text-sm text-pretty text-muted-foreground">
                            {descripcion}
                        </p>
                    ) : null}
                </div>
            </div>
            <div className="p-4 sm:p-5">{children}</div>
        </section>
    );
}

function Switch({
    checked,
    onChange,
    label,
    'aria-describedby': describedBy,
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
    'aria-describedby'?: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            aria-describedby={describedBy}
            onClick={() => onChange(!checked)}
            className={cn(
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                checked ? 'bg-mosso-yellow' : 'bg-input',
            )}
        >
            <span
                className={cn(
                    'inline-block size-5 transform rounded-full bg-white shadow-sm transition-transform',
                    checked ? 'translate-x-5' : 'translate-x-0.5',
                )}
            />
        </button>
    );
}

export default function ClienteForm({ tiposDocumento, cliente }: Props) {
    const isEdit = cliente !== undefined;
    const tieneCuenta = cliente?.tiene_cuenta ?? false;

    const form = useForm<ClienteFormShape>(
        valoresIniciales(cliente, tiposDocumento),
    );
    const { data, errors, setData } = form;

    const [cambiarPassword, setCambiarPassword] = useState(false);

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (isEdit && cliente) {
            form.put(route('admin.clientes.update', cliente.id_cliente));
        } else {
            form.post(route('admin.clientes.store'));
        }
    };

    const nombreVista =
        [data.nombres, data.apellido_paterno, data.apellido_materno]
            .filter(Boolean)
            .join(' ') ||
        data.razon_social ||
        'Nuevo cliente';

    const iniciales =
        nombreVista
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase())
            .join('') || '?';

    const cantidadErrores = Object.keys(errors).length;
    const generalError = (errors as Record<string, string>).general;

    return (
        <form
            onSubmit={submit}
            className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"
        >
            <div className="space-y-5">
                {generalError ? (
                    <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive"
                    >
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <span>{generalError}</span>
                    </div>
                ) : cantidadErrores > 0 ? (
                    <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive"
                    >
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <span>
                            Revisa los campos marcados en rojo y vuelve a
                            guardar.
                        </span>
                    </div>
                ) : null}

                <Seccion
                    icon={UserRound}
                    titulo="Identidad"
                    descripcion="Datos de la persona titular del cliente."
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label="Nombres"
                            required
                            error={errors.nombres}
                            className="sm:col-span-2"
                        >
                            <Input
                                value={data.nombres}
                                onChange={(e) =>
                                    setData('nombres', e.target.value)
                                }
                                aria-invalid={!!errors.nombres}
                                placeholder="Ej. María Fernanda"
                                autoComplete="off"
                            />
                        </Field>

                        <Field
                            label="Apellido paterno"
                            required
                            error={errors.apellido_paterno}
                        >
                            <Input
                                value={data.apellido_paterno}
                                onChange={(e) =>
                                    setData('apellido_paterno', e.target.value)
                                }
                                aria-invalid={!!errors.apellido_paterno}
                                placeholder="Ej. Quispe"
                                autoComplete="off"
                            />
                        </Field>

                        <Field
                            label="Apellido materno"
                            error={errors.apellido_materno}
                        >
                            <Input
                                value={data.apellido_materno}
                                onChange={(e) =>
                                    setData('apellido_materno', e.target.value)
                                }
                                aria-invalid={!!errors.apellido_materno}
                                placeholder="Ej. Rojas"
                                autoComplete="off"
                            />
                        </Field>

                        <Field
                            label="Tipo de documento"
                            required
                            error={errors.fk_tipo_documento}
                        >
                            <select
                                value={data.fk_tipo_documento}
                                onChange={(e) =>
                                    setData('fk_tipo_documento', e.target.value)
                                }
                                className={selectClass}
                            >
                                {tiposDocumento.map((t) => (
                                    <option
                                        key={t.id_tipo_documento}
                                        value={t.id_tipo_documento}
                                    >
                                        {t.nombre}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field
                            label="Número de documento"
                            required
                            error={errors.num_documento}
                        >
                            <Input
                                value={data.num_documento}
                                onChange={(e) =>
                                    setData('num_documento', e.target.value)
                                }
                                aria-invalid={!!errors.num_documento}
                                inputMode="numeric"
                                placeholder="Ej. 71234567"
                                autoComplete="off"
                            />
                        </Field>
                    </div>
                </Seccion>

                <Seccion
                    icon={Mail}
                    titulo="Contacto"
                    descripcion="Correo y teléfono para pedidos y notificaciones."
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label="Correo electrónico"
                            required
                            error={errors.correo}
                            hint={
                                isEdit && tieneCuenta
                                    ? 'Al cambiarlo también se actualiza el correo de inicio de sesión.'
                                    : undefined
                            }
                            className="sm:col-span-2"
                        >
                            <Input
                                type="email"
                                value={data.correo}
                                onChange={(e) =>
                                    setData('correo', e.target.value)
                                }
                                aria-invalid={!!errors.correo}
                                placeholder="cliente@correo.com"
                                autoComplete="off"
                            />
                        </Field>

                        <Field
                            label="Teléfono"
                            required
                            error={errors.telefono}
                        >
                            <Input
                                value={data.telefono}
                                onChange={(e) =>
                                    setData('telefono', e.target.value)
                                }
                                aria-invalid={!!errors.telefono}
                                inputMode="tel"
                                placeholder="Ej. 987654321"
                                autoComplete="off"
                            />
                        </Field>

                        <Field
                            label="Fecha de nacimiento"
                            error={errors.fecha_nacimiento}
                        >
                            <Input
                                type="date"
                                value={data.fecha_nacimiento}
                                onChange={(e) =>
                                    setData('fecha_nacimiento', e.target.value)
                                }
                                aria-invalid={!!errors.fecha_nacimiento}
                                max={new Date().toISOString().slice(0, 10)}
                            />
                        </Field>
                    </div>
                </Seccion>

                <Seccion
                    icon={Building2}
                    titulo="Empresa"
                    descripcion="Actívalo si el cliente factura con RUC."
                >
                    <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                Cliente empresa
                            </p>
                            <p
                                id="hint-empresa"
                                className="text-xs text-muted-foreground"
                            >
                                Habilita razón social y RUC para comprobantes.
                            </p>
                        </div>
                        <Switch
                            label="Cliente empresa"
                            aria-describedby="hint-empresa"
                            checked={data.es_empresa}
                            onChange={(v) => setData('es_empresa', v)}
                        />
                    </div>

                    {data.es_empresa ? (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <Field
                                label="Razón social"
                                required
                                error={errors.razon_social}
                                className="sm:col-span-2"
                            >
                                <Input
                                    value={data.razon_social}
                                    onChange={(e) =>
                                        setData('razon_social', e.target.value)
                                    }
                                    aria-invalid={!!errors.razon_social}
                                    placeholder="Ej. Veterinaria San Roque S.A.C."
                                    autoComplete="off"
                                />
                            </Field>

                            <Field
                                label="RUC"
                                required
                                error={errors.ruc}
                                hint="11 dígitos."
                            >
                                <Input
                                    value={data.ruc}
                                    onChange={(e) =>
                                        setData('ruc', e.target.value)
                                    }
                                    aria-invalid={!!errors.ruc}
                                    inputMode="numeric"
                                    maxLength={11}
                                    placeholder="20123456789"
                                    autoComplete="off"
                                />
                            </Field>
                        </div>
                    ) : null}
                </Seccion>

                <Seccion
                    icon={KeyRound}
                    titulo="Cuenta de acceso"
                    descripcion="Opcional. Permite al cliente iniciar sesión en la tienda."
                >
                    {isEdit && tieneCuenta ? (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <div className="text-sm">
                                    <p className="font-medium text-emerald-800 dark:text-emerald-300">
                                        Cuenta vinculada
                                    </p>
                                    <p className="text-emerald-700/90 dark:text-emerald-400/80">
                                        {cliente?.cuenta_email}
                                    </p>
                                </div>
                            </div>

                            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
                                <Checkbox
                                    checked={cambiarPassword}
                                    onCheckedChange={(v) => {
                                        const on = v === true;
                                        setCambiarPassword(on);

                                        if (!on) {
                                            setData('nueva_password', '');
                                            setData(
                                                'nueva_password_confirmation',
                                                '',
                                            );
                                        }
                                    }}
                                />
                                Establecer una contraseña nueva
                            </label>

                            {cambiarPassword ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field
                                        label="Contraseña nueva"
                                        required
                                        error={errors.nueva_password}
                                    >
                                        <Input
                                            type="password"
                                            value={data.nueva_password}
                                            onChange={(e) =>
                                                setData(
                                                    'nueva_password',
                                                    e.target.value,
                                                )
                                            }
                                            aria-invalid={!!errors.nueva_password}
                                            autoComplete="new-password"
                                        />
                                    </Field>
                                    <Field
                                        label="Repetir contraseña"
                                        required
                                    >
                                        <Input
                                            type="password"
                                            value={
                                                data.nueva_password_confirmation
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'nueva_password_confirmation',
                                                    e.target.value,
                                                )
                                            }
                                            autoComplete="new-password"
                                        />
                                    </Field>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        Crear cuenta ahora
                                    </p>
                                    <p
                                        id="hint-cuenta"
                                        className="text-xs text-muted-foreground"
                                    >
                                        Se marca como verificada y queda lista
                                        para usarse.
                                    </p>
                                </div>
                                <Switch
                                    label="Crear cuenta ahora"
                                    aria-describedby="hint-cuenta"
                                    checked={data.crear_cuenta}
                                    onChange={(v) => {
                                        setData('crear_cuenta', v);

                                        if (!v) {
                                            setData('password', '');
                                            setData('password_confirmation', '');
                                        }
                                    }}
                                />
                            </div>

                            {data.crear_cuenta ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field
                                        label="Contraseña"
                                        required
                                        error={errors.password}
                                        hint="Mínimo 8 caracteres."
                                    >
                                        <Input
                                            type="password"
                                            value={data.password}
                                            onChange={(e) =>
                                                setData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                            aria-invalid={!!errors.password}
                                            autoComplete="new-password"
                                        />
                                    </Field>
                                    <Field label="Repetir contraseña" required>
                                        <Input
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) =>
                                                setData(
                                                    'password_confirmation',
                                                    e.target.value,
                                                )
                                            }
                                            autoComplete="new-password"
                                        />
                                    </Field>
                                </div>
                            ) : (
                                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Lock className="size-3.5" />
                                    Sin cuenta, el cliente solo se gestiona desde
                                    el panel.
                                </p>
                            )}
                        </div>
                    )}
                </Seccion>

                <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-3 rounded-xl border bg-card/85 px-4 py-3.5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-end sm:px-5">
                    {cantidadErrores > 0 ? (
                        <p className="text-sm font-medium text-destructive sm:mr-auto">
                            {cantidadErrores}{' '}
                            {cantidadErrores === 1
                                ? 'campo por corregir'
                                : 'campos por corregir'}
                        </p>
                    ) : form.isDirty ? (
                        <p className="text-sm text-muted-foreground sm:mr-auto">
                            Cambios sin guardar.
                        </p>
                    ) : null}
                    <Button asChild variant="outline">
                        <Link href={route('admin.clientes.index')}>
                            Cancelar
                        </Link>
                    </Button>
                    <Button
                        type="submit"
                        disabled={form.processing}
                        className="gap-2"
                    >
                        {form.processing ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        {isEdit ? 'Guardar cambios' : 'Registrar cliente'}
                    </Button>
                </div>
            </div>

            {/* Vista previa: acompaña el llenado del formulario en desktop. */}
            <aside className="top-6 hidden lg:sticky lg:block">
                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="flex flex-col items-center gap-3 border-b bg-gradient-to-b from-muted/60 to-transparent px-5 py-6 text-center">
                        <ClienteAvatar
                            nombre={nombreVista}
                            iniciales={iniciales}
                            size="xl"
                        />
                        <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">
                                {nombreVista}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">
                                {data.correo || 'correo pendiente'}
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                                <IdCard className="size-3" />
                                {tiposDocumento.find(
                                    (t) =>
                                        String(t.id_tipo_documento) ===
                                        data.fk_tipo_documento,
                                )?.nombre ?? 'Doc.'}{' '}
                                {data.num_documento || '—'}
                            </span>
                            {data.es_empresa ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-mosso-yellow/20 px-2 py-0.5 text-xs font-medium text-mosso-dark ring-1 ring-inset ring-mosso-yellow/40 dark:text-mosso-yellow">
                                    <Building2 className="size-3" /> Empresa
                                </span>
                            ) : null}
                            {(isEdit && tieneCuenta) || data.crear_cuenta ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                                    <ShieldCheck className="size-3" /> Con cuenta
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <dl className="divide-y text-sm">
                        <div className="flex items-center justify-between gap-3 px-5 py-2.5">
                            <dt className="text-muted-foreground">Teléfono</dt>
                            <dd className="font-medium text-foreground tabular-nums">
                                {data.telefono || '—'}
                            </dd>
                        </div>
                        {data.es_empresa ? (
                            <div className="flex items-center justify-between gap-3 px-5 py-2.5">
                                <dt className="text-muted-foreground">RUC</dt>
                                <dd className="font-medium text-foreground tabular-nums">
                                    {data.ruc || '—'}
                                </dd>
                            </div>
                        ) : null}
                    </dl>
                </div>
            </aside>
        </form>
    );
}
