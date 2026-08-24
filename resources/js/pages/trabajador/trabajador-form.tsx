import { FormEvent, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useDniLookup } from '@/hooks/use-dni-lookup';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    BadgeCheck,
    Eye,
    EyeOff,
    IdCard,
    Loader2,
    MapPin,
    ShieldCheck,
    Sparkles,
    UserRound,
} from 'lucide-react';
import type {
    Departamento,
    Distrito,
    Provincia,
    Rol,
    TipoDocumento,
    Trabajador,
    TrabajadorFormValues,
} from '@/types/trabajador';

const emptyForm: TrabajadorFormValues = {
    fk_tipo_documento: '',
    num_documento: '',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    telefono: '',
    fecha_nacimiento: '',
    direccion: '',
    referencia: '',
    fk_departamento: '',
    fk_provincia: '',
    fk_distrito: '',
    email: '',
    password: '',
    password_confirmation: '',
    fk_rol: '',
    fecha_ingreso: new Date().toISOString().slice(0, 10),
};

function generarPassword(): string {
    const mayus = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const minus = 'abcdefghijkmnpqrstuvwxyz';
    const nums = '23456789';
    const simbolos = '!@#$%';
    const pool = mayus + minus + nums + simbolos;

    let base = [
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

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trabajador: Trabajador | null;
    roles: Rol[];
    tiposDocumento: TipoDocumento[];
    departamentos: Departamento[];
    onSuccess: () => void;
}

export default function TrabajadorForm({
    open,
    onOpenChange,
    trabajador,
    roles,
    tiposDocumento,
    departamentos,
    onSuccess,
}: Props) {
    const isEdit = trabajador !== null;

    const [values, setValues] = useState<TrabajadorFormValues>(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [loadingRecord, setLoadingRecord] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [changePassword, setChangePassword] = useState(!isEdit);
    const [camposBloqueados, setCamposBloqueados] = useState(false);

    const [provincias, setProvincias] = useState<Provincia[]>([]);
    const [distritos, setDistritos] = useState<Distrito[]>([]);

    const dniHabilitado = !isEdit && Number(values.fk_tipo_documento) > 0;
    const { resultado, cargando: buscandoDocumento, reset: resetLookup } = useDniLookup(
        dniHabilitado ? values.num_documento : '',
        values.fk_tipo_documento,
    );

    // Reset / precarga al abrir
    useEffect(() => {
        if (!open) return;

        setErrors({});
        setShowPassword(false);
        resetLookup();

        if (!trabajador) {
            setValues(emptyForm);
            setChangePassword(true);
            setCamposBloqueados(false);
            setProvincias([]);
            setDistritos([]);
            return;
        }

        setChangePassword(false);
        setLoadingRecord(true);

        axios
            .get(`/trabajador/${trabajador.id_trabajador}/edit`)
            .then(async ({ data }) => {
                setValues({
                    fk_tipo_documento: String(data.fk_tipo_documento ?? ''),
                    num_documento: data.num_documento ?? '',
                    nombres: data.nombres ?? '',
                    apellido_paterno: data.apellido_paterno ?? '',
                    apellido_materno: data.apellido_materno ?? '',
                    telefono: data.telefono ?? '',
                    fecha_nacimiento: data.fecha_nacimiento ?? '',
                    direccion: data.direccion ?? '',
                    referencia: data.referencia ?? '',
                    fk_departamento: data.fk_departamento ? String(data.fk_departamento) : '',
                    fk_provincia: data.fk_provincia ? String(data.fk_provincia) : '',
                    fk_distrito: data.fk_distrito ? String(data.fk_distrito) : '',
                    email: data.email ?? '',
                    password: '',
                    password_confirmation: '',
                    fk_rol: String(data.fk_rol ?? ''),
                    fecha_ingreso: data.fecha_ingreso ?? emptyForm.fecha_ingreso,
                });

                if (data.fk_departamento) {
                    const { data: provs } = await axios.get(`/trabajador/provincias/${data.fk_departamento}`);
                    setProvincias(provs);
                }
                if (data.fk_provincia) {
                    const { data: dists } = await axios.get(`/trabajador/distritos/${data.fk_provincia}`);
                    setDistritos(dists);
                }
            })
            .finally(() => setLoadingRecord(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, trabajador]);

    // Autocompletar con el resultado de la búsqueda de documento (solo al crear)
    useEffect(() => {
        if (!resultado || isEdit) return;

        if (resultado.persona) {
            setValues((v) => ({
                ...v,
                nombres: resultado.persona!.nombres ?? v.nombres,
                apellido_paterno: resultado.persona!.apellido_paterno ?? v.apellido_paterno,
                apellido_materno: resultado.persona!.apellido_materno ?? v.apellido_materno ?? '',
                telefono: resultado.origen === 'local' ? resultado.persona!.telefono ?? v.telefono : v.telefono,
                fecha_nacimiento: resultado.persona!.fecha_nacimiento ?? v.fecha_nacimiento,
            }));
            setCamposBloqueados(resultado.origen === 'local' || resultado.origen === 'reniec');
        } else {
            setCamposBloqueados(false);
        }
    }, [resultado, isEdit]);

    const bloqueadoPorDuplicado = !isEdit && resultado?.ya_es_trabajador === true;

    function set<K extends keyof TrabajadorFormValues>(key: K, value: TrabajadorFormValues[K]) {
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
        const { data } = await axios.get(`/trabajador/provincias/${value}`);
        setProvincias(data);
    }

    async function handleProvinciaChange(value: string) {
        set('fk_provincia', value);
        set('fk_distrito', '');
        if (!value) {
            setDistritos([]);
            return;
        }
        const { data } = await axios.get(`/trabajador/distritos/${value}`);
        setDistritos(data);
    }

    const tituloDocumento = useMemo(
        () => tiposDocumento.find((t) => String(t.id_tipo_documento) === values.fk_tipo_documento)?.nombre,
        [tiposDocumento, values.fk_tipo_documento],
    );

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (bloqueadoPorDuplicado) return;

        setProcessing(true);
        setErrors({});

        const payload: Record<string, unknown> = {
            fk_tipo_documento: values.fk_tipo_documento,
            num_documento: values.num_documento,
            nombres: values.nombres,
            apellido_paterno: values.apellido_paterno,
            apellido_materno: values.apellido_materno || null,
            telefono: values.telefono,
            fecha_nacimiento: values.fecha_nacimiento || null,
            direccion: values.direccion || null,
            referencia: values.referencia || null,
            fk_distrito: values.fk_distrito || null,
            email: values.email,
            fk_rol: values.fk_rol,
            fecha_ingreso: values.fecha_ingreso,
        };

        if (!isEdit || changePassword) {
            payload.password = values.password;
            payload.password_confirmation = values.password_confirmation;
        }

        try {
            if (isEdit) {
                await axios.put(`/trabajador/${trabajador!.id_trabajador}`, payload);
            } else {
                await axios.post('/trabajador', payload);
            }
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            if (err.response?.status === 422) {
                const backendErrors = err.response.data.errors ?? {};
                setErrors(Object.fromEntries(Object.entries(backendErrors).map(([k, v]) => [k, (v as string[])[0]])));
            }
        } finally {
            setProcessing(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl">
                <div className="bg-gradient-to-br from-slate-800 via-indigo-700 to-blue-600 px-6 py-6 text-white">
                    <SheetHeader className="space-y-1 p-0 text-left">
                        <SheetTitle className="flex items-center gap-2 text-white">
                            <UserRound className="h-5 w-5" />
                            {isEdit ? 'Editar trabajador' : 'Nuevo trabajador'}
                        </SheetTitle>
                        <SheetDescription className="text-indigo-100">
                            {isEdit
                                ? 'Actualiza los datos personales, dirección y accesos del trabajador.'
                                : 'Registra a la persona, su dirección (opcional) y su acceso al sistema.'}
                        </SheetDescription>
                    </SheetHeader>
                </div>

                {loadingRecord ? (
                    <div className="flex h-64 items-center justify-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8 px-6 py-6">
                        {errors.general && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                                {errors.general}
                            </div>
                        )}

                        {/* Datos personales */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <IdCard className="h-4 w-4 text-indigo-500" />
                                Datos personales
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Tipo de documento <span className="text-red-500 ml-1">*</span></Label>
                                    <Select
                                        value={values.fk_tipo_documento}
                                        onValueChange={(v) => set('fk_tipo_documento', v)}
                                        disabled={isEdit}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tiposDocumento.map((t) => (
                                                <SelectItem key={t.id_tipo_documento} value={String(t.id_tipo_documento)}>
                                                    {t.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.fk_tipo_documento && (
                                        <p className="text-xs text-destructive">{errors.fk_tipo_documento}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label>N.º de {tituloDocumento ?? 'documento'} <span className="text-red-500 ml-1">*</span></Label>
                                    <div className="relative">
                                        <Input
                                            value={values.num_documento}
                                            onChange={(e) => set('num_documento', e.target.value.toUpperCase())}
                                            maxLength={20}
                                            disabled={isEdit}
                                            required
                                        />
                                        {buscandoDocumento && (
                                            <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                                        )}
                                    </div>
                                    {errors.num_documento && <p className="text-xs text-destructive">{errors.num_documento}</p>}
                                </div>
                            </div>

                            {!isEdit && resultado && (
                                <div>
                                    {bloqueadoPorDuplicado ? (
                                        <Badge variant="destructive" className="gap-1">
                                            Ya existe un trabajador con este documento
                                        </Badge>
                                    ) : resultado.origen === 'reniec' ? (
                                        <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                                            <BadgeCheck className="h-3.5 w-3.5" /> Verificado en RENIEC
                                        </Badge>
                                    ) : resultado.origen === 'local' ? (
                                        <Badge variant="secondary" className="gap-1">
                                            <BadgeCheck className="h-3.5 w-3.5" /> Persona ya registrada, se reutilizarán sus datos
                                        </Badge>
                                    ) : null}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Nombres <span className="text-red-500 ml-1">*</span></Label>
                                    <Input
                                        value={values.nombres}
                                        onChange={(e) => set('nombres', e.target.value)}
                                        readOnly={camposBloqueados}
                                        required
                                        maxLength={100}
                                    />
                                    {errors.nombres && <p className="text-xs text-destructive">{errors.nombres}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Apellido paterno <span className="text-red-500 ml-1">*</span></Label>
                                    <Input
                                        value={values.apellido_paterno}
                                        onChange={(e) => set('apellido_paterno', e.target.value)}
                                        readOnly={camposBloqueados}
                                        required
                                        maxLength={100}
                                    />
                                    {errors.apellido_paterno && (
                                        <p className="text-xs text-destructive">{errors.apellido_paterno}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Apellido materno <span className="text-red-500 ml-1">*</span></Label>
                                    <Input
                                        value={values.apellido_materno}
                                        onChange={(e) => set('apellido_materno', e.target.value)}
                                        readOnly={camposBloqueados}
                                        maxLength={100}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Fecha de nacimiento <span className="text-red-500 ml-1">(Opcional)</span></Label>
                                    <Input
                                        type="date"
                                        value={values.fecha_nacimiento ?? ''}
                                        onChange={(e) => set('fecha_nacimiento', e.target.value)}
                                        readOnly={camposBloqueados}
                                    />
                                    {errors.fecha_nacimiento && (
                                        <p className="text-xs text-destructive">{errors.fecha_nacimiento}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Teléfono <span className="text-red-500 ml-1">*</span></Label>
                                <Input
                                    value={values.telefono}
                                    onChange={(e) => set('telefono', e.target.value)}
                                    maxLength={9}
                                    required
                                />
                                {errors.telefono && <p className="text-xs text-destructive">{errors.telefono}</p>}
                            </div>
                        </section>

                        <Separator />

                        {/* Dirección */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <MapPin className="h-4 w-4 text-indigo-500" />
                                Dirección <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Departamento <span className="text-red-500 ml-1">*</span></Label>
                                    <Select value={values.fk_departamento} onValueChange={handleDepartamentoChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departamentos.map((d) => (
                                                <SelectItem key={d.id_departamento} value={String(d.id_departamento)}>
                                                    {d.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Provincia <span className="text-red-500 ml-1">*</span></Label>
                                    <Select
                                        value={values.fk_provincia}
                                        onValueChange={handleProvinciaChange}
                                        disabled={!values.fk_departamento}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {provincias.map((p) => (
                                                <SelectItem key={p.id_provincia} value={String(p.id_provincia)}>
                                                    {p.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Distrito <span className="text-red-500 ml-1">*</span></Label>
                                    <Select
                                        value={values.fk_distrito}
                                        onValueChange={(v) => set('fk_distrito', v)}
                                        disabled={!values.fk_provincia}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {distritos.map((d) => (
                                                <SelectItem key={d.id_distrito} value={String(d.id_distrito)}>
                                                    {d.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.fk_distrito && <p className="text-xs text-destructive">{errors.fk_distrito}</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Dirección <span className="text-red-500 ml-1">*</span></Label>
                                <Input
                                    value={values.direccion}
                                    onChange={(e) => set('direccion', e.target.value)}
                                    maxLength={150}
                                    placeholder="Av. / Jr. / Calle, número"
                                />
                                {errors.direccion && <p className="text-xs text-destructive">{errors.direccion}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Referencia</Label>
                                <Input
                                    value={values.referencia}
                                    onChange={(e) => set('referencia', e.target.value)}
                                    maxLength={150}
                                />
                            </div>
                        </section>

                        <Separator />

                        {/* Cuenta de acceso */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <ShieldCheck className="h-4 w-4 text-indigo-500" />
                                Cuenta y acceso al sistema
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Correo electrónico <span className="text-red-500 ml-1">*</span></Label>
                                    <Input
                                        type="email"
                                        value={values.email}
                                        onChange={(e) => set('email', e.target.value)}
                                        required
                                        maxLength={255}
                                        autoComplete="off"
                                    />
                                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Rol <span className="text-red-500 ml-1">*</span></Label>
                                    <Select value={values.fk_rol} onValueChange={(v) => set('fk_rol', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((r) => (
                                                <SelectItem key={r.id_rol} value={String(r.id_rol)}>
                                                    {r.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.fk_rol && <p className="text-xs text-destructive">{errors.fk_rol}</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Fecha de ingreso <span className="text-red-500 ml-1">*</span></Label>
                                <Input
                                    type="date"
                                    value={values.fecha_ingreso}
                                    onChange={(e) => set('fecha_ingreso', e.target.value)}
                                    max={new Date().toISOString().slice(0, 10)}
                                    required
                                />
                                {errors.fecha_ingreso && <p className="text-xs text-destructive">{errors.fecha_ingreso}</p>}
                            </div>

                            {isEdit && !changePassword ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setChangePassword(true)}
                                >
                                    Cambiar contraseña
                                </Button>
                            ) : (
                                <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs uppercase text-muted-foreground">
                                            {isEdit ? 'Nueva contraseña' : 'Contraseña de acceso'}
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 gap-1 text-xs"
                                                onClick={() => {
                                                    const pass = generarPassword();
                                                    set('password', pass);
                                                    set('password_confirmation', pass);
                                                    setShowPassword(true);
                                                }}
                                            >
                                                <Sparkles className="h-3.5 w-3.5" /> Generar
                                            </Button>
                                            {isEdit && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => {
                                                        setChangePassword(false);
                                                        set('password', '');
                                                        set('password_confirmation', '');
                                                    }}
                                                >
                                                    Cancelar
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={values.password}
                                                    onChange={(e) => set('password', e.target.value)}
                                                    autoComplete="new-password"
                                                    required={!isEdit || changePassword}
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-2.5 top-2.5 text-muted-foreground"
                                                    onClick={() => setShowPassword((s) => !s)}
                                                    tabIndex={-1}
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Confirmar contraseña"
                                                value={values.password_confirmation}
                                                onChange={(e) => set('password_confirmation', e.target.value)}
                                                autoComplete="new-password"
                                                required={!isEdit || changePassword}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Mínimo 8 caracteres, con mayúsculas, minúsculas y números.
                                    </p>
                                </div>
                            )}
                        </section>

                        <SheetFooter className="gap-2 px-0 pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing || bloqueadoPorDuplicado} className="gap-2">
                                {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isEdit ? 'Guardar cambios' : 'Registrar trabajador'}
                            </Button>
                        </SheetFooter>
                    </form>
                )}
            </SheetContent>
        </Sheet>
    );
}