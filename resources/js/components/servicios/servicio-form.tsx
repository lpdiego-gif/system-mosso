import { Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    Award,
    Clock,
    Image as ImageIcon,
    Loader2,
    MapPin,
    Phone,
    Plus,
    Share2,
    Store,
    Trash2,
    UserRound,
    X,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';
import type {
    BeneficioFormValue,
    DistritoOption,
    HorarioFormValue,
    ImagenExistente,
    ProvinciaOption,
    RedFormValue,
    ServicioEditData,
    ServicioFormLookups,
    TipoServicioOption,
} from '@/types/servicio';

interface Props {
    lookups: ServicioFormLookups;
    servicio?: ServicioEditData;
}

interface FormShape {
    fk_tipo_servicio: string;
    nombre_negocio: string;
    nombre_servicio: string;
    responsable: string;
    foto_responsable: File | null;
    eliminar_foto_responsable: boolean;
    descripcion: string;
    telefono_contacto: string;
    correo_contacto: string;
    direccion: string;
    referencia: string;
    fk_departamento: string;
    fk_provincia: string;
    fk_distrito: string;
    activo: boolean;
    horarios: HorarioFormValue[];
    beneficios: BeneficioFormValue[];
    redes: RedFormValue[];
    imagenes_nuevas: File[];
    imagenes_eliminar: number[];
    imagenes_existentes_orden: number[];
}

function valoresIniciales(
    servicio: ServicioEditData | undefined,
    tiposServicio: TipoServicioOption[],
): FormShape {
    return {
        fk_tipo_servicio: servicio
            ? String(servicio.fk_tipo_servicio)
            : tiposServicio[0]
              ? String(tiposServicio[0].id_tipo_servicio)
              : '',
        nombre_negocio: servicio?.nombre_negocio ?? '',
        nombre_servicio: servicio?.nombre_servicio ?? '',
        responsable: servicio?.responsable ?? '',
        foto_responsable: null,
        eliminar_foto_responsable: false,
        descripcion: servicio?.descripcion ?? '',
        telefono_contacto: servicio?.telefono_contacto ?? '',
        correo_contacto: servicio?.correo_contacto ?? '',
        direccion: servicio?.direccion ?? '',
        referencia: servicio?.referencia ?? '',
        fk_departamento: servicio?.fk_departamento
            ? String(servicio.fk_departamento)
            : '',
        fk_provincia: servicio?.fk_provincia
            ? String(servicio.fk_provincia)
            : '',
        fk_distrito: servicio?.fk_distrito ? String(servicio.fk_distrito) : '',
        activo: servicio?.activo ?? true,
        horarios: servicio?.horarios ?? [],
        beneficios: servicio?.beneficios ?? [],
        redes: servicio?.redes ?? [],
        imagenes_nuevas: [],
        imagenes_eliminar: [],
        imagenes_existentes_orden: [],
    };
}

/* Controles nativos (<select>, <textarea>) alineados 1:1 con <Input> de shadcn. */
const controlBase =
    'w-full rounded-md border border-input bg-transparent text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30';
const selectClass = cn(controlBase, 'h-9 px-3 py-1');
const textareaClass = cn(controlBase, 'min-h-24 resize-none px-3 py-2');
const fileInputClass =
    'block w-full text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent';

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

/** Campo estándar: etiqueta asociada al control anidado, pista y error. */
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

function MiniLabel({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'text-xs font-medium text-muted-foreground',
                className,
            )}
        >
            {children}
        </span>
    );
}

function Seccion({
    icon: Icon,
    titulo,
    descripcion,
    accion,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    titulo: string;
    descripcion?: string;
    accion?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-mosso-yellow/15 text-mosso-dark ring-1 ring-inset ring-mosso-yellow/30 dark:text-mosso-yellow">
                        <Icon className="size-4" />
                    </span>
                    <div className="space-y-0.5">
                        <h2 className="font-semibold tracking-tight text-foreground">
                            {titulo}
                        </h2>
                        {descripcion && (
                            <p className="text-sm text-pretty text-muted-foreground">
                                {descripcion}
                            </p>
                        )}
                    </div>
                </div>
                {accion ? <div className="shrink-0">{accion}</div> : null}
            </div>
            {children}
        </section>
    );
}

/** Envoltorio consistente para las filas repetibles (horarios, beneficios, redes). */
function RepeaterRow({
    columns,
    onRemove,
    removeLabel,
    children,
}: {
    columns: string;
    onRemove: () => void;
    removeLabel: string;
    children: ReactNode;
}) {
    return (
        <div
            className={cn(
                'grid grid-cols-1 gap-2.5 rounded-lg border bg-muted/40 p-3 sm:items-end',
                columns,
            )}
        >
            {children}
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="size-9 justify-self-end text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={removeLabel}
            >
                <Trash2 className="size-4" />
            </Button>
        </div>
    );
}

function EmptyHint({ children }: { children: ReactNode }) {
    return (
        <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            {children}
        </div>
    );
}

export default function ServicioForm({ lookups, servicio }: Props) {
    const isEdit = servicio !== undefined;

    const [tiposServicio, setTiposServicio] = useState<TipoServicioOption[]>(
        lookups.tiposServicio,
    );
    const form = useForm<FormShape>(valoresIniciales(servicio, tiposServicio));

    const [provincias, setProvincias] = useState<ProvinciaOption[]>([]);
    const [distritos, setDistritos] = useState<DistritoOption[]>([]);
    const [imagenesExistentes, setImagenesExistentes] = useState<
        ImagenExistente[]
    >(servicio?.imagenes ?? []);
    const [fotoPreview, setFotoPreview] = useState<string | null>(
        servicio?.foto_responsable ?? null,
    );
    const [nuevasPreviews, setNuevasPreviews] = useState<string[]>([]);

    const [modalTipoAbierto, setModalTipoAbierto] = useState(false);
    const [nuevoTipoNombre, setNuevoTipoNombre] = useState('');
    const [creandoTipo, setCreandoTipo] = useState(false);
    const [errorTipo, setErrorTipo] = useState<string | null>(null);

    async function crearTipoServicio() {
        const nombre = nuevoTipoNombre.trim();

        if (!nombre) {
            return;
        }

        setCreandoTipo(true);
        setErrorTipo(null);

        try {
            const response = await fetch(route('admin.tipos-servicio.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({ nombre }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorTipo(
                    data.errors?.nombre?.[0] ??
                        'No se pudo crear el tipo de servicio.',
                );

                return;
            }

            setTiposServicio((actual) => [...actual, data.tipo]);
            form.setData('fk_tipo_servicio', String(data.tipo.id_tipo_servicio));
            setNuevoTipoNombre('');
            setModalTipoAbierto(false);
        } catch {
            setErrorTipo('No se pudo crear el tipo de servicio.');
        } finally {
            setCreandoTipo(false);
        }
    }

    // Cargar provincias/distritos en cascada al editar o al cambiar el departamento.
    useEffect(() => {
        if (!form.data.fk_departamento) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- limpia la lista dependiente al deseleccionar el padre
            setProvincias([]);

            return;
        }

        axios
            .get(route('trabajador.provincias', form.data.fk_departamento))
            .then((res) => setProvincias(res.data));
    }, [form.data.fk_departamento]);

    useEffect(() => {
        if (!form.data.fk_provincia) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- limpia la lista dependiente al deseleccionar el padre
            setDistritos([]);

            return;
        }

        axios
            .get(route('trabajador.distritos', form.data.fk_provincia))
            .then((res) => setDistritos(res.data));
    }, [form.data.fk_provincia]);

    function handleFoto(file: File | null) {
        form.setData('foto_responsable', file);
        form.setData('eliminar_foto_responsable', false);
        setFotoPreview(
            file
                ? URL.createObjectURL(file)
                : (servicio?.foto_responsable ?? null),
        );
    }

    function quitarFoto() {
        form.setData('foto_responsable', null);
        form.setData('eliminar_foto_responsable', true);
        setFotoPreview(null);
    }

    function agregarHorario() {
        form.setData('horarios', [
            ...form.data.horarios,
            {
                dia_semana: lookups.diasSemana[0],
                hora_inicio: '09:00',
                hora_fin: '18:00',
            },
        ]);
    }

    function actualizarHorario(
        index: number,
        campo: keyof HorarioFormValue,
        valor: string,
    ) {
        const copia = [...form.data.horarios];
        copia[index] = { ...copia[index], [campo]: valor };
        form.setData('horarios', copia);
    }

    function quitarHorario(index: number) {
        form.setData(
            'horarios',
            form.data.horarios.filter((_, i) => i !== index),
        );
    }

    function agregarBeneficio() {
        form.setData('beneficios', [
            ...form.data.beneficios,
            { icono: '⭐', titulo: '', descripcion: '' },
        ]);
    }

    function actualizarBeneficio(
        index: number,
        campo: keyof BeneficioFormValue,
        valor: string,
    ) {
        const copia = [...form.data.beneficios];
        copia[index] = { ...copia[index], [campo]: valor };
        form.setData('beneficios', copia);
    }

    function quitarBeneficio(index: number) {
        form.setData(
            'beneficios',
            form.data.beneficios.filter((_, i) => i !== index),
        );
    }

    function agregarRed() {
        form.setData('redes', [
            ...form.data.redes,
            {
                fk_red: lookups.redesSociales[0]
                    ? String(lookups.redesSociales[0].id_red_social)
                    : '',
                link: '',
            },
        ]);
    }

    function actualizarRed(
        index: number,
        campo: keyof RedFormValue,
        valor: string,
    ) {
        const copia = [...form.data.redes];
        copia[index] = { ...copia[index], [campo]: valor };
        form.setData('redes', copia);
    }

    function quitarRed(index: number) {
        form.setData(
            'redes',
            form.data.redes.filter((_, i) => i !== index),
        );
    }

    function agregarImagenes(files: FileList | null) {
        if (!files) {
            return;
        }

        const nuevos = Array.from(files);
        form.setData('imagenes_nuevas', [
            ...form.data.imagenes_nuevas,
            ...nuevos,
        ]);
        setNuevasPreviews((prev) => [
            ...prev,
            ...nuevos.map((f) => URL.createObjectURL(f)),
        ]);
    }

    function quitarImagenNueva(index: number) {
        form.setData(
            'imagenes_nuevas',
            form.data.imagenes_nuevas.filter((_, i) => i !== index),
        );
        setNuevasPreviews((prev) => prev.filter((_, i) => i !== index));
    }

    function quitarImagenExistente(id: number) {
        setImagenesExistentes((prev) =>
            prev.filter((img) => img.id_servicio_imagen !== id),
        );
        form.setData('imagenes_eliminar', [...form.data.imagenes_eliminar, id]);
    }

    function moverImagenExistente(index: number, direccion: -1 | 1) {
        const destino = index + direccion;

        if (destino < 0 || destino >= imagenesExistentes.length) {
            return;
        }

        const copia = [...imagenesExistentes];
        [copia[index], copia[destino]] = [copia[destino], copia[index]];
        setImagenesExistentes(copia);
        form.setData(
            'imagenes_existentes_orden',
            copia.map((img) => img.id_servicio_imagen),
        );
    }

    const submit = (e: FormEvent) => {
        e.preventDefault();

        const opciones = { forceFormData: true as const };

        if (isEdit && servicio) {
            form.post(
                route('admin.servicios.update', servicio.id_servicio),
                opciones,
            );
        } else {
            form.post(route('admin.servicios.store'), opciones);
        }
    };

    const totalImagenes = imagenesExistentes.length + nuevasPreviews.length;
    const erroresGenerales = form.errors as Record<string, string>;
    const cantidadErrores = Object.keys(erroresGenerales).length;

    return (
        <>
            <form onSubmit={submit} className="space-y-5">
                {erroresGenerales.general && (
                    <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive"
                    >
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <span>{erroresGenerales.general}</span>
                    </div>
                )}

                {cantidadErrores > 0 && !erroresGenerales.general && (
                    <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive"
                    >
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <span>
                            No se pudo guardar: revisa los campos marcados en
                            rojo más abajo.
                        </span>
                    </div>
                )}

                {/* DATOS GENERALES */}
                <Seccion
                    icon={Store}
                    titulo="Datos generales"
                    descripcion="Información principal del servicio."
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            label="Tipo de servicio"
                            required
                            error={form.errors.fk_tipo_servicio}
                        >
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <select
                                    value={form.data.fk_tipo_servicio}
                                    onChange={(e) =>
                                        form.setData(
                                            'fk_tipo_servicio',
                                            e.target.value,
                                        )
                                    }
                                    className={selectClass}
                                >
                                    {tiposServicio.map((t) => (
                                        <option
                                            key={t.id_tipo_servicio}
                                            value={t.id_tipo_servicio}
                                        >
                                            {t.nombre}
                                        </option>
                                    ))}
                                </select>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setModalTipoAbierto(true)}
                                    className="shrink-0 gap-1.5"
                                >
                                    <Plus className="size-4" /> Tipo
                                </Button>
                            </div>
                        </Field>

                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <label className="flex h-9 cursor-pointer items-center gap-2.5 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-colors has-[:focus-visible]:border-ring has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50">
                                <Checkbox
                                    checked={form.data.activo}
                                    onCheckedChange={(v) =>
                                        form.setData('activo', v === true)
                                    }
                                />
                                Servicio activo (visible en el Portal Web)
                            </label>
                        </div>

                        <Field
                            label="Nombre del negocio"
                            required
                            error={form.errors.nombre_negocio}
                        >
                            <Input
                                value={form.data.nombre_negocio}
                                onChange={(e) =>
                                    form.setData(
                                        'nombre_negocio',
                                        e.target.value,
                                    )
                                }
                                aria-invalid={!!form.errors.nombre_negocio}
                                placeholder="Ej. Pet Groomer Perú"
                            />
                        </Field>

                        <Field
                            label="Nombre del servicio"
                            required
                            error={form.errors.nombre_servicio}
                        >
                            <Input
                                value={form.data.nombre_servicio}
                                onChange={(e) =>
                                    form.setData(
                                        'nombre_servicio',
                                        e.target.value,
                                    )
                                }
                                aria-invalid={!!form.errors.nombre_servicio}
                                placeholder="Ej. Servicio de Baño"
                            />
                        </Field>

                        <Field
                            label="Descripción"
                            error={form.errors.descripcion}
                            className="md:col-span-2"
                        >
                            <textarea
                                value={form.data.descripcion}
                                onChange={(e) =>
                                    form.setData('descripcion', e.target.value)
                                }
                                rows={4}
                                placeholder="Describe el servicio…"
                                className={textareaClass}
                            />
                        </Field>
                    </div>
                </Seccion>

                {/* RESPONSABLE Y CONTACTO */}
                <Seccion
                    icon={UserRound}
                    titulo="Responsable y contacto"
                    descripcion="Quién atiende y cómo pueden comunicarse."
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Responsable">
                            <Input
                                value={form.data.responsable}
                                onChange={(e) =>
                                    form.setData('responsable', e.target.value)
                                }
                                placeholder="Nombre del responsable"
                            />
                        </Field>

                        <div className="space-y-2">
                            <Label>Foto del responsable</Label>
                            <div className="flex items-center gap-3">
                                {fotoPreview ? (
                                    <img
                                        src={fotoPreview}
                                        alt="Responsable"
                                        className="size-14 rounded-full object-cover ring-1 ring-inset ring-border"
                                    />
                                ) : (
                                    <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground/50 ring-1 ring-inset ring-border">
                                        <UserRound className="size-5" />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) =>
                                        handleFoto(e.target.files?.[0] ?? null)
                                    }
                                    className={fileInputClass}
                                />
                                {fotoPreview && (
                                    <button
                                        type="button"
                                        onClick={quitarFoto}
                                        className="shrink-0 text-xs font-medium text-destructive hover:underline"
                                    >
                                        Quitar
                                    </button>
                                )}
                            </div>
                            <ErrorText>{form.errors.foto_responsable}</ErrorText>
                        </div>

                        <Field
                            label={
                                <span className="flex items-center gap-1.5">
                                    <Phone className="size-3.5" /> Teléfono de
                                    contacto
                                </span>
                            }
                            hint="Se usa para generar el botón de WhatsApp en el Portal Web."
                            error={form.errors.telefono_contacto}
                        >
                            <Input
                                value={form.data.telefono_contacto}
                                onChange={(e) =>
                                    form.setData(
                                        'telefono_contacto',
                                        e.target.value,
                                    )
                                }
                                inputMode="tel"
                                placeholder="Ej. 987654321"
                            />
                        </Field>

                        <Field
                            label="Correo de contacto"
                            error={form.errors.correo_contacto}
                        >
                            <Input
                                type="email"
                                value={form.data.correo_contacto}
                                onChange={(e) =>
                                    form.setData(
                                        'correo_contacto',
                                        e.target.value,
                                    )
                                }
                                placeholder="contacto@negocio.com"
                            />
                        </Field>
                    </div>
                </Seccion>

                {/* DIRECCIÓN */}
                <Seccion
                    icon={MapPin}
                    titulo="Dirección"
                    descripcion="Opcional. Si registras una dirección, selecciona también el distrito."
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            label="Dirección"
                            error={form.errors.direccion}
                            className="md:col-span-2"
                        >
                            <Input
                                value={form.data.direccion}
                                onChange={(e) =>
                                    form.setData('direccion', e.target.value)
                                }
                                placeholder="Av. Ejemplo 123"
                            />
                        </Field>

                        <Field label="Referencia" className="md:col-span-2">
                            <Input
                                value={form.data.referencia}
                                onChange={(e) =>
                                    form.setData('referencia', e.target.value)
                                }
                                placeholder="Cerca a…"
                            />
                        </Field>

                        <Field label="Departamento">
                            <select
                                value={form.data.fk_departamento}
                                onChange={(e) => {
                                    form.setData(
                                        'fk_departamento',
                                        e.target.value,
                                    );
                                    form.setData('fk_provincia', '');
                                    form.setData('fk_distrito', '');
                                }}
                                className={selectClass}
                            >
                                <option value="">Seleccionar</option>
                                {lookups.departamentos.map((d) => (
                                    <option
                                        key={d.id_departamento}
                                        value={d.id_departamento}
                                    >
                                        {d.nombre}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Provincia">
                            <select
                                value={form.data.fk_provincia}
                                onChange={(e) => {
                                    form.setData('fk_provincia', e.target.value);
                                    form.setData('fk_distrito', '');
                                }}
                                disabled={!form.data.fk_departamento}
                                className={selectClass}
                            >
                                <option value="">Seleccionar</option>
                                {provincias.map((p) => (
                                    <option
                                        key={p.id_provincia}
                                        value={p.id_provincia}
                                    >
                                        {p.nombre}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Distrito" error={form.errors.fk_distrito}>
                            <select
                                value={form.data.fk_distrito}
                                onChange={(e) =>
                                    form.setData('fk_distrito', e.target.value)
                                }
                                disabled={!form.data.fk_provincia}
                                className={selectClass}
                            >
                                <option value="">Seleccionar</option>
                                {distritos.map((d) => (
                                    <option
                                        key={d.id_distrito}
                                        value={d.id_distrito}
                                    >
                                        {d.nombre}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>
                </Seccion>

                {/* HORARIOS */}
                <Seccion
                    icon={Clock}
                    titulo="Horarios"
                    descripcion="Días y horas de atención."
                    accion={
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={agregarHorario}
                            className="gap-1.5"
                        >
                            <Plus className="size-4" /> Agregar
                        </Button>
                    }
                >
                    {form.data.horarios.length === 0 ? (
                        <EmptyHint>
                            Sin horarios registrados. Usa «Agregar» para añadir
                            un día de atención.
                        </EmptyHint>
                    ) : (
                        <div className="space-y-3">
                            {form.data.horarios.map((h, i) => (
                                <RepeaterRow
                                    key={i}
                                    columns="sm:grid-cols-[1fr_1fr_1fr_auto]"
                                    onRemove={() => quitarHorario(i)}
                                    removeLabel="Quitar horario"
                                >
                                    <label className="grid gap-1">
                                        <MiniLabel>Día</MiniLabel>
                                        <select
                                            value={h.dia_semana}
                                            onChange={(e) =>
                                                actualizarHorario(
                                                    i,
                                                    'dia_semana',
                                                    e.target.value,
                                                )
                                            }
                                            className={selectClass}
                                        >
                                            {lookups.diasSemana.map((dia) => (
                                                <option key={dia} value={dia}>
                                                    {dia}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="grid gap-1">
                                        <MiniLabel>Hora inicio</MiniLabel>
                                        <Input
                                            type="time"
                                            value={h.hora_inicio}
                                            onChange={(e) =>
                                                actualizarHorario(
                                                    i,
                                                    'hora_inicio',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </label>
                                    <label className="grid gap-1">
                                        <MiniLabel>Hora fin</MiniLabel>
                                        <Input
                                            type="time"
                                            value={h.hora_fin}
                                            onChange={(e) =>
                                                actualizarHorario(
                                                    i,
                                                    'hora_fin',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </label>
                                </RepeaterRow>
                            ))}
                        </div>
                    )}
                    {Object.keys(form.errors).some((k) =>
                        k.startsWith('horarios.'),
                    ) && (
                        <p className="mt-2 text-xs font-medium text-destructive">
                            Revisa los horarios: la hora de fin debe ser
                            posterior a la de inicio.
                        </p>
                    )}
                </Seccion>

                {/* IMÁGENES */}
                <Seccion
                    icon={ImageIcon}
                    titulo={`Imágenes (${totalImagenes})`}
                    descripcion="La primera imagen es la principal. Usa las flechas para reordenar."
                    accion={
                        <Button
                            asChild
                            type="button"
                            variant="outline"
                            size="sm"
                            className="cursor-pointer gap-1.5"
                        >
                            <label>
                                <Plus className="size-4" /> Agregar
                                <input
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) =>
                                        agregarImagenes(e.target.files)
                                    }
                                    className="hidden"
                                />
                            </label>
                        </Button>
                    }
                >
                    {totalImagenes === 0 ? (
                        <EmptyHint>
                            Sin imágenes registradas. Agrega fotos en JPG, PNG o
                            WebP.
                        </EmptyHint>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {imagenesExistentes.map((img, i) => (
                                <div
                                    key={img.id_servicio_imagen}
                                    className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-inset ring-border"
                                >
                                    <img
                                        src={img.url}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                    {i === 0 && (
                                        <span className="absolute top-1.5 left-1.5 rounded bg-mosso-yellow px-1.5 py-0.5 text-[10px] font-semibold text-mosso-dark">
                                            Principal
                                        </span>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-background/90 p-1 backdrop-blur-sm">
                                        <button
                                            type="button"
                                            disabled={i === 0}
                                            onClick={() =>
                                                moverImagenExistente(i, -1)
                                            }
                                            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
                                            aria-label="Mover antes"
                                        >
                                            <ArrowUp className="size-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                quitarImagenExistente(
                                                    img.id_servicio_imagen,
                                                )
                                            }
                                            className="rounded p-1 text-destructive hover:bg-destructive/10"
                                            aria-label="Quitar imagen"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={
                                                i ===
                                                imagenesExistentes.length - 1
                                            }
                                            onClick={() =>
                                                moverImagenExistente(i, 1)
                                            }
                                            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
                                            aria-label="Mover después"
                                        >
                                            <ArrowDown className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {nuevasPreviews.map((url, i) => (
                                <div
                                    key={`nueva-${i}`}
                                    className="group relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-border"
                                >
                                    <img
                                        src={url}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                    <span className="absolute top-1.5 left-1.5 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                        Nueva
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => quitarImagenNueva(i)}
                                        className="absolute right-1.5 bottom-1.5 rounded bg-background/90 p-1 text-destructive backdrop-blur-sm hover:bg-destructive/10"
                                        aria-label="Quitar imagen"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {Object.keys(erroresGenerales)
                        .filter((k) => k.startsWith('imagenes_nuevas.'))
                        .map((k) => (
                            <p
                                key={k}
                                className="mt-2 text-xs font-medium text-destructive"
                            >
                                {erroresGenerales[k]}
                            </p>
                        ))}
                </Seccion>

                {/* BENEFICIOS */}
                <Seccion
                    icon={Award}
                    titulo="Beneficios"
                    descripcion="Motivos para elegir este servicio."
                    accion={
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={agregarBeneficio}
                            className="gap-1.5"
                        >
                            <Plus className="size-4" /> Agregar
                        </Button>
                    }
                >
                    {form.data.beneficios.length === 0 ? (
                        <EmptyHint>
                            Sin beneficios registrados. Usa «Agregar» para
                            destacar una ventaja del servicio.
                        </EmptyHint>
                    ) : (
                        <div className="space-y-3">
                            {form.data.beneficios.map((b, i) => (
                                <RepeaterRow
                                    key={i}
                                    columns="sm:grid-cols-[72px_1fr_2fr_auto]"
                                    onRemove={() => quitarBeneficio(i)}
                                    removeLabel="Quitar beneficio"
                                >
                                    <label className="grid gap-1">
                                        <MiniLabel>Ícono</MiniLabel>
                                        <Input
                                            value={b.icono}
                                            onChange={(e) =>
                                                actualizarBeneficio(
                                                    i,
                                                    'icono',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="✂️"
                                            className="text-center"
                                        />
                                    </label>
                                    <label className="grid gap-1">
                                        <MiniLabel>Título</MiniLabel>
                                        <Input
                                            value={b.titulo}
                                            onChange={(e) =>
                                                actualizarBeneficio(
                                                    i,
                                                    'titulo',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Ej. Personal certificado"
                                        />
                                        <ErrorText>
                                            {
                                                erroresGenerales[
                                                    `beneficios.${i}.titulo`
                                                ]
                                            }
                                        </ErrorText>
                                    </label>
                                    <label className="grid gap-1">
                                        <MiniLabel>Descripción</MiniLabel>
                                        <Input
                                            value={b.descripcion}
                                            onChange={(e) =>
                                                actualizarBeneficio(
                                                    i,
                                                    'descripcion',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Descripción breve"
                                        />
                                    </label>
                                </RepeaterRow>
                            ))}
                        </div>
                    )}
                </Seccion>

                {/* REDES SOCIALES */}
                <Seccion
                    icon={Share2}
                    titulo="Redes sociales"
                    descripcion="Enlaces a las redes del negocio."
                    accion={
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={agregarRed}
                            disabled={lookups.redesSociales.length === 0}
                            className="gap-1.5"
                        >
                            <Plus className="size-4" /> Agregar
                        </Button>
                    }
                >
                    {form.data.redes.length === 0 ? (
                        <EmptyHint>
                            Sin redes sociales registradas. Usa «Agregar» para
                            enlazar una red del negocio.
                        </EmptyHint>
                    ) : (
                        <div className="space-y-3">
                            {form.data.redes.map((r, i) => (
                                <RepeaterRow
                                    key={i}
                                    columns="sm:grid-cols-[1fr_2fr_auto]"
                                    onRemove={() => quitarRed(i)}
                                    removeLabel="Quitar red"
                                >
                                    <label className="grid gap-1">
                                        <MiniLabel>Red</MiniLabel>
                                        <select
                                            value={r.fk_red}
                                            onChange={(e) =>
                                                actualizarRed(
                                                    i,
                                                    'fk_red',
                                                    e.target.value,
                                                )
                                            }
                                            className={selectClass}
                                        >
                                            {lookups.redesSociales.map((red) => (
                                                <option
                                                    key={red.id_red_social}
                                                    value={red.id_red_social}
                                                >
                                                    {red.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="grid gap-1">
                                        <MiniLabel>Enlace</MiniLabel>
                                        <Input
                                            value={r.link}
                                            onChange={(e) =>
                                                actualizarRed(
                                                    i,
                                                    'link',
                                                    e.target.value,
                                                )
                                            }
                                            inputMode="url"
                                            placeholder="https://…"
                                        />
                                        <ErrorText>
                                            {erroresGenerales[`redes.${i}.link`]}
                                        </ErrorText>
                                    </label>
                                </RepeaterRow>
                            ))}
                        </div>
                    )}
                </Seccion>

                {/* BOTONES */}
                <div className="sticky bottom-0 z-10 -mx-4 flex flex-col-reverse gap-3 border-t bg-card/85 px-4 py-4 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-end sm:rounded-xl sm:border sm:px-6 sm:shadow-sm">
                    {cantidadErrores > 0 ? (
                        <p className="text-sm font-medium text-destructive sm:mr-auto">
                            {cantidadErrores}{' '}
                            {cantidadErrores === 1
                                ? 'campo con errores'
                                : 'campos con errores'}
                        </p>
                    ) : form.isDirty ? (
                        <p className="text-sm text-muted-foreground sm:mr-auto">
                            Tienes cambios sin guardar.
                        </p>
                    ) : null}
                    <Button asChild variant="outline">
                        <Link href={route('admin.servicios.index')}>
                            Cancelar
                        </Link>
                    </Button>
                    <Button
                        type="submit"
                        disabled={form.processing}
                        className="gap-2"
                    >
                        {form.processing && (
                            <Loader2 className="size-4 animate-spin" />
                        )}
                        {isEdit ? 'Guardar cambios' : 'Guardar servicio'}
                    </Button>
                </div>
            </form>

            {/* MODAL: nuevo tipo de servicio */}
            <Dialog open={modalTipoAbierto} onOpenChange={setModalTipoAbierto}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nuevo tipo de servicio</DialogTitle>
                        <DialogDescription>
                            Se añadirá a la lista y quedará seleccionado en este
                            servicio.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="nuevo-tipo">Nombre</Label>
                        <Input
                            id="nuevo-tipo"
                            autoFocus
                            value={nuevoTipoNombre}
                            onChange={(e) => setNuevoTipoNombre(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    crearTipoServicio();
                                }
                            }}
                            placeholder="Ej. Adiestramiento"
                        />
                        <ErrorText>{errorTipo ?? undefined}</ErrorText>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setModalTipoAbierto(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={crearTipoServicio}
                            disabled={!nuevoTipoNombre.trim() || creandoTipo}
                            className="gap-2"
                        >
                            {creandoTipo && (
                                <Loader2 className="size-4 animate-spin" />
                            )}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
