import { Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import type { FormEvent} from 'react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
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

function valoresIniciales(servicio: ServicioEditData | undefined, tiposServicio: TipoServicioOption[]): FormShape {
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
        fk_departamento: servicio?.fk_departamento ? String(servicio.fk_departamento) : '',
        fk_provincia: servicio?.fk_provincia ? String(servicio.fk_provincia) : '',
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

const inputClass =
    'w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary';
const labelClass = 'text-sm font-medium';

export default function ServicioForm({ lookups, servicio }: Props) {
    const isEdit = servicio !== undefined;

    const [tiposServicio, setTiposServicio] = useState<TipoServicioOption[]>(lookups.tiposServicio);
    const form = useForm<FormShape>(valoresIniciales(servicio, tiposServicio));

    const [provincias, setProvincias] = useState<ProvinciaOption[]>([]);
    const [distritos, setDistritos] = useState<DistritoOption[]>([]);
    const [imagenesExistentes, setImagenesExistentes] = useState<ImagenExistente[]>(servicio?.imagenes ?? []);
    const [fotoPreview, setFotoPreview] = useState<string | null>(servicio?.foto_responsable ?? null);
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
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({ nombre }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorTipo(data.errors?.nombre?.[0] ?? 'No se pudo crear el tipo de servicio.');

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
        setFotoPreview(file ? URL.createObjectURL(file) : servicio?.foto_responsable ?? null);
    }

    function quitarFoto() {
        form.setData('foto_responsable', null);
        form.setData('eliminar_foto_responsable', true);
        setFotoPreview(null);
    }

    function agregarHorario() {
        form.setData('horarios', [...form.data.horarios, { dia_semana: lookups.diasSemana[0], hora_inicio: '09:00', hora_fin: '18:00' }]);
    }

    function actualizarHorario(index: number, campo: keyof HorarioFormValue, valor: string) {
        const copia = [...form.data.horarios];
        copia[index] = { ...copia[index], [campo]: valor };
        form.setData('horarios', copia);
    }

    function quitarHorario(index: number) {
        form.setData('horarios', form.data.horarios.filter((_, i) => i !== index));
    }

    function agregarBeneficio() {
        form.setData('beneficios', [...form.data.beneficios, { icono: '⭐', titulo: '', descripcion: '' }]);
    }

    function actualizarBeneficio(index: number, campo: keyof BeneficioFormValue, valor: string) {
        const copia = [...form.data.beneficios];
        copia[index] = { ...copia[index], [campo]: valor };
        form.setData('beneficios', copia);
    }

    function quitarBeneficio(index: number) {
        form.setData('beneficios', form.data.beneficios.filter((_, i) => i !== index));
    }

    function agregarRed() {
        form.setData('redes', [...form.data.redes, { fk_red: lookups.redesSociales[0] ? String(lookups.redesSociales[0].id_red_social) : '', link: '' }]);
    }

    function actualizarRed(index: number, campo: keyof RedFormValue, valor: string) {
        const copia = [...form.data.redes];
        copia[index] = { ...copia[index], [campo]: valor };
        form.setData('redes', copia);
    }

    function quitarRed(index: number) {
        form.setData('redes', form.data.redes.filter((_, i) => i !== index));
    }

    function agregarImagenes(files: FileList | null) {
        if (!files) {
return;
}

        const nuevos = Array.from(files);
        form.setData('imagenes_nuevas', [...form.data.imagenes_nuevas, ...nuevos]);
        setNuevasPreviews((prev) => [...prev, ...nuevos.map((f) => URL.createObjectURL(f))]);
    }

    function quitarImagenNueva(index: number) {
        form.setData('imagenes_nuevas', form.data.imagenes_nuevas.filter((_, i) => i !== index));
        setNuevasPreviews((prev) => prev.filter((_, i) => i !== index));
    }

    function quitarImagenExistente(id: number) {
        setImagenesExistentes((prev) => prev.filter((img) => img.id_servicio_imagen !== id));
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
        form.setData('imagenes_existentes_orden', copia.map((img) => img.id_servicio_imagen));
    }

    const submit = (e: FormEvent) => {
        e.preventDefault();

        const opciones = { forceFormData: true as const };

        if (isEdit && servicio) {
            form.post(route('admin.servicios.update', servicio.id_servicio), opciones);
        } else {
            form.post(route('admin.servicios.store'), opciones);
        }
    };

    const totalImagenes = imagenesExistentes.length + nuevasPreviews.length;
    const erroresGenerales = form.errors as Record<string, string>;
    const cantidadErrores = Object.keys(erroresGenerales).length;

    return (
        <>
        <form onSubmit={submit} className="space-y-8 rounded-2xl border bg-card p-4 shadow-sm sm:p-6 lg:p-8">
            {erroresGenerales.general && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {erroresGenerales.general}
                </div>
            )}

            {cantidadErrores > 0 && !erroresGenerales.general && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    No se pudo guardar: revisa los campos marcados en rojo más abajo.
                </div>
            )}

            {/* DATOS GENERALES */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold">Datos generales</h2>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className={labelClass}>Tipo de servicio *</label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <select
                                value={form.data.fk_tipo_servicio}
                                onChange={(e) => form.setData('fk_tipo_servicio', e.target.value)}
                                className={inputClass}
                            >
                                {tiposServicio.map((t) => (
                                    <option key={t.id_tipo_servicio} value={t.id_tipo_servicio}>
                                        {t.nombre}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setModalTipoAbierto(true)}
                                className="shrink-0 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted"
                            >
                                + Agregar Servicio
                            </button>
                        </div>
                        {form.errors.fk_tipo_servicio && <p className="text-sm text-destructive">{form.errors.fk_tipo_servicio}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className={labelClass}>Estado</label>
                        <label className="flex h-[42px] items-center gap-2 rounded-lg border bg-background px-3 text-sm">
                            <input
                                type="checkbox"
                                checked={form.data.activo}
                                onChange={(e) => form.setData('activo', e.target.checked)}
                            />
                            Servicio activo (visible en el Portal Web)
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className={labelClass}>Nombre del negocio *</label>
                        <input
                            value={form.data.nombre_negocio}
                            onChange={(e) => form.setData('nombre_negocio', e.target.value)}
                            placeholder="Ej. Pet Groomer Perú"
                            className={inputClass}
                        />
                        {form.errors.nombre_negocio && <p className="text-sm text-destructive">{form.errors.nombre_negocio}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className={labelClass}>Nombre del servicio *</label>
                        <input
                            value={form.data.nombre_servicio}
                            onChange={(e) => form.setData('nombre_servicio', e.target.value)}
                            placeholder="Ej. Servicio de Baño"
                            className={inputClass}
                        />
                        {form.errors.nombre_servicio && <p className="text-sm text-destructive">{form.errors.nombre_servicio}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className={labelClass}>Descripción</label>
                        <textarea
                            value={form.data.descripcion}
                            onChange={(e) => form.setData('descripcion', e.target.value)}
                            rows={4}
                            placeholder="Describe el servicio..."
                            className={`${inputClass} resize-none`}
                        />
                        {form.errors.descripcion && <p className="text-sm text-destructive">{form.errors.descripcion}</p>}
                    </div>
                </div>
            </section>

            {/* RESPONSABLE Y CONTACTO */}
            <section className="space-y-4 border-t pt-6">
                <h2 className="text-lg font-semibold">Responsable y contacto</h2>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className={labelClass}>Responsable</label>
                        <input
                            value={form.data.responsable}
                            onChange={(e) => form.setData('responsable', e.target.value)}
                            placeholder="Nombre del responsable"
                            className={inputClass}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className={labelClass}>Foto del responsable</label>
                        <div className="flex items-center gap-3">
                            {fotoPreview ? (
                                <img src={fotoPreview} alt="Responsable" className="h-14 w-14 rounded-full object-cover border" />
                            ) : (
                                <div className="h-14 w-14 rounded-full border bg-muted" />
                            )}
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => handleFoto(e.target.files?.[0] ?? null)}
                                className="text-sm"
                            />
                            {fotoPreview && (
                                <button type="button" onClick={quitarFoto} className="text-xs text-destructive hover:underline">
                                    Quitar
                                </button>
                            )}
                        </div>
                        {form.errors.foto_responsable && <p className="text-sm text-destructive">{form.errors.foto_responsable}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className={labelClass}>Teléfono de contacto</label>
                        <input
                            value={form.data.telefono_contacto}
                            onChange={(e) => form.setData('telefono_contacto', e.target.value)}
                            placeholder="Ej. 987654321"
                            className={inputClass}
                        />
                        {form.errors.telefono_contacto && <p className="text-sm text-destructive">{form.errors.telefono_contacto}</p>}
                        <p className="text-xs text-muted-foreground">Se usa para generar el botón de WhatsApp en el Portal Web.</p>
                    </div>

                    <div className="space-y-2">
                        <label className={labelClass}>Correo de contacto</label>
                        <input
                            type="email"
                            value={form.data.correo_contacto}
                            onChange={(e) => form.setData('correo_contacto', e.target.value)}
                            placeholder="contacto@negocio.com"
                            className={inputClass}
                        />
                        {form.errors.correo_contacto && <p className="text-sm text-destructive">{form.errors.correo_contacto}</p>}
                    </div>
                </div>
            </section>

            {/* DIRECCIÓN */}
            <section className="space-y-4 border-t pt-6">
                <h2 className="text-lg font-semibold">Dirección</h2>
                <p className="text-xs text-muted-foreground">Opcional. Si registras una dirección, selecciona también el distrito.</p>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                        <label className={labelClass}>Dirección</label>
                        <input
                            value={form.data.direccion}
                            onChange={(e) => form.setData('direccion', e.target.value)}
                            placeholder="Av. Ejemplo 123"
                            className={inputClass}
                        />
                        {form.errors.direccion && <p className="text-sm text-destructive">{form.errors.direccion}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className={labelClass}>Referencia</label>
                        <input
                            value={form.data.referencia}
                            onChange={(e) => form.setData('referencia', e.target.value)}
                            placeholder="Cerca a..."
                            className={inputClass}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className={labelClass}>Departamento</label>
                        <select
                            value={form.data.fk_departamento}
                            onChange={(e) => {
                                form.setData('fk_departamento', e.target.value);
                                form.setData('fk_provincia', '');
                                form.setData('fk_distrito', '');
                            }}
                            className={inputClass}
                        >
                            <option value="">Seleccionar</option>
                            {lookups.departamentos.map((d) => (
                                <option key={d.id_departamento} value={d.id_departamento}>
                                    {d.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className={labelClass}>Provincia</label>
                        <select
                            value={form.data.fk_provincia}
                            onChange={(e) => {
                                form.setData('fk_provincia', e.target.value);
                                form.setData('fk_distrito', '');
                            }}
                            disabled={!form.data.fk_departamento}
                            className={inputClass}
                        >
                            <option value="">Seleccionar</option>
                            {provincias.map((p) => (
                                <option key={p.id_provincia} value={p.id_provincia}>
                                    {p.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className={labelClass}>Distrito</label>
                        <select
                            value={form.data.fk_distrito}
                            onChange={(e) => form.setData('fk_distrito', e.target.value)}
                            disabled={!form.data.fk_provincia}
                            className={inputClass}
                        >
                            <option value="">Seleccionar</option>
                            {distritos.map((d) => (
                                <option key={d.id_distrito} value={d.id_distrito}>
                                    {d.nombre}
                                </option>
                            ))}
                        </select>
                        {form.errors.fk_distrito && <p className="text-sm text-destructive">{form.errors.fk_distrito}</p>}
                    </div>
                </div>
            </section>

            {/* HORARIOS */}
            <section className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Horarios</h2>
                    <button type="button" onClick={agregarHorario} className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted">
                        + Agregar horario
                    </button>
                </div>

                {form.data.horarios.length === 0 && <p className="text-sm text-muted-foreground">Sin horarios registrados.</p>}

                <div className="space-y-3">
                    {form.data.horarios.map((h, i) => (
                        <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Día</label>
                                <select value={h.dia_semana} onChange={(e) => actualizarHorario(i, 'dia_semana', e.target.value)} className={inputClass}>
                                    {lookups.diasSemana.map((dia) => (
                                        <option key={dia} value={dia}>{dia}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Hora inicio</label>
                                <input type="time" value={h.hora_inicio} onChange={(e) => actualizarHorario(i, 'hora_inicio', e.target.value)} className={inputClass} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Hora fin</label>
                                <input type="time" value={h.hora_fin} onChange={(e) => actualizarHorario(i, 'hora_fin', e.target.value)} className={inputClass} />
                            </div>
                            <button type="button" onClick={() => quitarHorario(i)} className="rounded-lg border px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10">
                                Quitar
                            </button>
                        </div>
                    ))}
                </div>
                {Object.keys(form.errors).some((k) => k.startsWith('horarios.')) && (
                    <p className="text-sm text-destructive">Revisa los horarios: la hora de fin debe ser posterior a la de inicio.</p>
                )}
            </section>

            {/* IMÁGENES */}
            <section className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Imágenes ({totalImagenes})</h2>
                    <label className="cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted">
                        + Agregar imágenes
                        <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => agregarImagenes(e.target.files)}
                            className="hidden"
                        />
                    </label>
                </div>
                <p className="text-xs text-muted-foreground">La primera imagen es la principal. Usa las flechas para reordenar.</p>

                {totalImagenes === 0 && <p className="text-sm text-muted-foreground">Sin imágenes registradas.</p>}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {imagenesExistentes.map((img, i) => (
                        <div key={img.id_servicio_imagen} className="group relative aspect-square overflow-hidden rounded-lg border">
                            <img src={img.url} alt="" className="h-full w-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 p-1">
                                <button type="button" disabled={i === 0} onClick={() => moverImagenExistente(i, -1)} className="rounded bg-white/20 px-1.5 text-xs text-white disabled:opacity-30">←</button>
                                <button type="button" onClick={() => quitarImagenExistente(img.id_servicio_imagen)} className="rounded bg-destructive px-1.5 text-xs text-white">✕</button>
                                <button type="button" disabled={i === imagenesExistentes.length - 1} onClick={() => moverImagenExistente(i, 1)} className="rounded bg-white/20 px-1.5 text-xs text-white disabled:opacity-30">→</button>
                            </div>
                        </div>
                    ))}

                    {nuevasPreviews.map((url, i) => (
                        <div key={`nueva-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border border-dashed">
                            <img src={url} alt="" className="h-full w-full object-cover" />
                            <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">Nueva</span>
                            <button type="button" onClick={() => quitarImagenNueva(i)} className="absolute bottom-1 right-1 rounded bg-destructive px-1.5 text-xs text-white">✕</button>
                        </div>
                    ))}
                </div>
                {Object.keys(erroresGenerales)
                    .filter((k) => k.startsWith('imagenes_nuevas.'))
                    .map((k) => (
                        <p key={k} className="text-sm text-destructive">{erroresGenerales[k]}</p>
                    ))}
            </section>

            {/* BENEFICIOS */}
            <section className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Beneficios</h2>
                    <button type="button" onClick={agregarBeneficio} className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted">
                        + Agregar beneficio
                    </button>
                </div>

                {form.data.beneficios.length === 0 && <p className="text-sm text-muted-foreground">Sin beneficios registrados.</p>}

                <div className="space-y-3">
                    {form.data.beneficios.map((b, i) => (
                        <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-[80px_1fr_2fr_auto] sm:items-end">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Ícono</label>
                                <input value={b.icono} onChange={(e) => actualizarBeneficio(i, 'icono', e.target.value)} placeholder="✂️" className={inputClass} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Título</label>
                                <input value={b.titulo} onChange={(e) => actualizarBeneficio(i, 'titulo', e.target.value)} placeholder="Ej. Personal certificado" className={inputClass} />
                                {erroresGenerales[`beneficios.${i}.titulo`] && (
                                    <p className="text-xs text-destructive">{erroresGenerales[`beneficios.${i}.titulo`]}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Descripción</label>
                                <input value={b.descripcion} onChange={(e) => actualizarBeneficio(i, 'descripcion', e.target.value)} placeholder="Descripción breve" className={inputClass} />
                            </div>
                            <button type="button" onClick={() => quitarBeneficio(i)} className="rounded-lg border px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10">
                                Quitar
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* REDES SOCIALES */}
            <section className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Redes sociales</h2>
                    <button
                        type="button"
                        onClick={agregarRed}
                        disabled={lookups.redesSociales.length === 0}
                        className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        + Agregar red
                    </button>
                </div>

                {form.data.redes.length === 0 && <p className="text-sm text-muted-foreground">Sin redes sociales registradas.</p>}

                <div className="space-y-3">
                    {form.data.redes.map((r, i) => (
                        <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Red</label>
                                <select value={r.fk_red} onChange={(e) => actualizarRed(i, 'fk_red', e.target.value)} className={inputClass}>
                                    {lookups.redesSociales.map((red) => (
                                        <option key={red.id_red_social} value={red.id_red_social}>{red.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Enlace</label>
                                <input value={r.link} onChange={(e) => actualizarRed(i, 'link', e.target.value)} placeholder="https://..." className={inputClass} />
                                {erroresGenerales[`redes.${i}.link`] && (
                                    <p className="text-xs text-destructive">{erroresGenerales[`redes.${i}.link`]}</p>
                                )}
                            </div>
                            <button type="button" onClick={() => quitarRed(i)} className="rounded-lg border px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10">
                                Quitar
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* BOTONES */}
            <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
                <Link href={route('admin.servicios.index')} className="inline-flex items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted">
                    Cancelar
                </Link>
                <button
                    type="submit"
                    disabled={form.processing}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {form.processing ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar servicio'}
                </button>
            </div>
        </form>

        {/* MODAL: nuevo tipo de servicio */}
        {modalTipoAbierto && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                onMouseDown={() => setModalTipoAbierto(false)}
            >
                <div
                    className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl"
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Nuevo tipo de servicio</h2>
                        <button
                            type="button"
                            onClick={() => setModalTipoAbierto(false)}
                            className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="Cerrar"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Nombre</label>
                            <input
                                autoFocus
                                value={nuevoTipoNombre}
                                onChange={(e) => setNuevoTipoNombre(e.target.value)}
                                placeholder="Ej. Adiestramiento"
                                className={inputClass}
                            />
                            {errorTipo && <p className="mt-1 text-sm text-destructive">{errorTipo}</p>}
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setModalTipoAbierto(false)}
                                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={crearTipoServicio}
                                disabled={!nuevoTipoNombre.trim() || creandoTipo}
                                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {creandoTipo ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
