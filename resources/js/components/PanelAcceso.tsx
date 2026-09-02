import { Form, router } from '@inertiajs/react';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    reenviar as reenviarStore,
    store as registroStore,
    verificar as verificarStore,
} from '@/actions/App/Http/Controllers/ClienteRegistroController';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import { store as loginStore } from '@/routes/login';
import { email as passwordEmail } from '@/routes/password';
import type { RegistroPendienteFlash } from '@/types/cuenta';

const inputBase =
    'w-full rounded-lg border border-gray-300 bg-white py-2 text-base text-gray-900 placeholder:text-gray-400 transition-colors focus:border-mosso-yellow focus:ring-2 focus:ring-mosso-yellow focus:outline-none sm:text-sm';

/** Input con ícono a la izquierda (correo). */
const inputClass = `${inputBase} pl-9 pr-3.5`;

/** Input sin ícono, padding simétrico (código de verificación). */
const inputCentradoClass = `${inputBase} px-3.5`;

const iconoCampoClass =
    'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400';

const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

const botonClass =
    'w-full rounded-lg bg-mosso-yellow px-6 py-2 text-sm font-bold text-gray-900 shadow-sm transition-colors hover:bg-mosso-yellow/85 disabled:opacity-60';

const enlaceClass =
    'font-semibold text-gray-900 transition-colors hover:text-mosso-yellow hover:underline disabled:opacity-60';

type Modo = 'login' | 'registro' | 'recuperar';

/**
 * Formulario de acceso del storefront (login + registro por código +
 * "olvidé mi contraseña"), sin layout ni tarjeta contenedora — lo pone quien
 * lo usa. Hoy vive en dos sitios con la misma lógica: la página `/cuenta`
 * (`pages/cuenta.tsx`, para visitas directas y redirecciones del backend) y
 * el modal del header (`components/ModalAcceso.tsx`).
 *
 * El 2° paso del registro (código de 6 dígitos) es su propio modal
 * (`ModalCodigo`), que se abre al recibir el flash `registroPendiente` que el
 * backend manda tras "Crear cuenta".
 */
export default function PanelAcceso({
    canResetPassword = true,
    onCerrarCodigo,
}: {
    canResetPassword?: boolean;
    onCerrarCodigo?: () => void;
}) {
    const [modo, setModo] = useState<Modo>('login');
    const [emailPendiente, setEmailPendiente] = useState<string | null>(null);

    // Los datos flash de Inertia (registroPendiente) NO llegan en `props`, sino
    // por el evento `flash` del router — igual que useFlashToast. Al registrarse,
    // el backend hace flash + redirect a /cuenta: aquí abrimos el modal del código.
    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash as
                | { registroPendiente?: RegistroPendienteFlash }
                | undefined;
            const email = flash?.registroPendiente?.email;

            if (email) {
                setEmailPendiente(email);
                setModo('registro');
            }
        });
    }, []);

    return (
        <div>
            {modo !== 'recuperar' && (
                <ToggleAcceso modo={modo} onCambiar={setModo} />
            )}

            {modo === 'recuperar' ? (
                <FormularioRecuperar onIrALogin={() => setModo('login')} />
            ) : modo === 'registro' ? (
                <FormularioRegistro />
            ) : (
                <FormularioLogin
                    canResetPassword={canResetPassword}
                    onRecuperar={() => setModo('recuperar')}
                />
            )}

            {emailPendiente && (
                <ModalCodigo
                    email={emailPendiente}
                    onCerrar={() => {
                        setEmailPendiente(null);
                        onCerrarCodigo?.();
                    }}
                />
            )}
        </div>
    );
}

/** Selector segmentado para alternar entre iniciar sesión y crear cuenta. */
function ToggleAcceso({
    modo,
    onCambiar,
}: {
    modo: 'login' | 'registro';
    onCambiar: (m: Modo) => void;
}) {
    const opciones = [
        { valor: 'login' as const, texto: 'Iniciar sesión' },
        { valor: 'registro' as const, texto: 'Crear cuenta' },
    ];

    return (
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 text-sm font-semibold">
            {opciones.map(({ valor, texto }) => (
                <button
                    key={valor}
                    type="button"
                    onClick={() => onCambiar(valor)}
                    aria-pressed={modo === valor}
                    className={`rounded-lg px-3 py-2 transition-colors ${
                        modo === valor
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    {texto}
                </button>
            ))}
        </div>
    );
}

function Encabezado({
    titulo,
    descripcion,
}: {
    titulo: string;
    descripcion?: string;
}) {
    return (
        <div className="text-center">
            <h1 className="text-xl font-black text-gray-900">{titulo}</h1>
            {descripcion && (
                <p className="mx-auto mt-1 max-w-xs text-sm text-gray-500">
                    {descripcion}
                </p>
            )}
        </div>
    );
}

/** Nota de confianza bajo el botón principal, discreta y sin alarmar. */
function NotaSegura() {
    return (
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-gray-400">
            <ShieldCheck className="size-3.5" />
            Tu información viaja cifrada y nunca se comparte.
        </p>
    );
}

/** Input de correo con ícono, reutilizado por los 3 formularios (login, registro, recuperar). */
function CampoEmail({ autoFocus = true }: { autoFocus?: boolean }) {
    return (
        <div className="relative">
            <span className={iconoCampoClass}>
                <Mail className="size-4" />
            </span>
            <input
                type="email"
                name="email"
                required
                autoFocus={autoFocus}
                autoComplete="email"
                placeholder="nombre@correo.com"
                className={inputClass}
            />
        </div>
    );
}

/**
 * Input de contraseña con botón para mostrar/ocultar, con la estética de esta
 * página (mismo patrón que components/password-input.tsx pero sin shadcn). El
 * label lo pone quien lo usa (el login necesita meter el enlace de recupero al
 * lado del label).
 */
function CampoPassword({
    name,
    autoComplete,
    placeholder,
    autoFocus,
}: {
    name: string;
    autoComplete: string;
    placeholder: string;
    autoFocus?: boolean;
}) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative">
            <span className={iconoCampoClass}>
                <Lock className="size-4" />
            </span>
            <input
                type={visible ? 'text' : 'password'}
                name={name}
                required
                autoFocus={autoFocus}
                autoComplete={autoComplete}
                placeholder={placeholder}
                className={`${inputBase} pr-10 pl-9`}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                tabIndex={-1}
                aria-label={
                    visible ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-700"
            >
                {visible ? (
                    <EyeOff className="size-4" />
                ) : (
                    <Eye className="size-4" />
                )}
            </button>
        </div>
    );
}

function FormularioLogin({
    canResetPassword,
    onRecuperar,
}: {
    canResetPassword: boolean;
    onRecuperar: () => void;
}) {
    return (
        <div>
            <Encabezado titulo="Bienvenido de vuelta" />

            <div className="mt-5">
                <PasskeyVerify
                    label="Ingresar con passkey"
                    loadingLabel="Autenticando…"
                    separator="o con tu correo"
                />
            </div>

            <Form
                {...loginStore.form()}
                resetOnSuccess={['password']}
                disableWhileProcessing
                className="space-y-3.5"
            >
                {({ processing, errors }) => (
                    <>
                        <div>
                            <label className={labelClass}>
                                Correo electrónico
                            </label>
                            <CampoEmail />
                            <InputError
                                message={errors.email}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Contraseña</label>
                            <CampoPassword
                                name="password"
                                autoComplete="current-password"
                                placeholder="Tu contraseña"
                            />
                            <InputError
                                message={errors.password}
                                className="mt-1"
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-gray-600">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    className="h-4 w-4 rounded border-gray-300 text-mosso-yellow"
                                />
                                Recordarme
                            </label>
                            {canResetPassword && (
                                <button
                                    type="button"
                                    onClick={onRecuperar}
                                    className={enlaceClass}
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className={botonClass}
                        >
                            {processing ? 'Ingresando…' : 'Ingresar'}
                        </button>

                        <NotaSegura />
                    </>
                )}
            </Form>
        </div>
    );
}

function FormularioRegistro() {
    return (
        <div>
            <Encabezado
                titulo="Crea tu cuenta"
                descripcion="Solo tu correo y una contraseña. Te enviamos un código para confirmarlo."
            />

            <Form
                {...registroStore.form()}
                disableWhileProcessing
                className="mt-5 space-y-3.5"
            >
                {({ processing, errors }) => (
                    <>
                        <div>
                            <label className={labelClass}>
                                Correo electrónico
                            </label>
                            <CampoEmail />
                            <InputError
                                message={errors.email}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Contraseña</label>
                            <CampoPassword
                                name="password"
                                autoComplete="new-password"
                                placeholder="Mínimo 8 caracteres"
                            />
                            <InputError
                                message={errors.password}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Confirmar contraseña
                            </label>
                            <CampoPassword
                                name="password_confirmation"
                                autoComplete="new-password"
                                placeholder="Repite tu contraseña"
                            />
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-1"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className={botonClass}
                        >
                            {processing
                                ? 'Creando cuenta…'
                                : 'Crear cuenta y enviar código'}
                        </button>

                        <NotaSegura />
                    </>
                )}
            </Form>
        </div>
    );
}

function FormularioRecuperar({ onIrALogin }: { onIrALogin: () => void }) {
    return (
        <div>
            <Encabezado
                titulo="Recupera tu contraseña"
                descripcion="Escribe tu correo y te enviamos un enlace para crear una nueva."
            />

            <Form
                {...passwordEmail.form()}
                disableWhileProcessing
                className="mt-5 space-y-3.5"
            >
                {({ processing, errors }) => (
                    <>
                        <div>
                            <label className={labelClass}>
                                Correo electrónico
                            </label>
                            <CampoEmail />
                            <InputError
                                message={errors.email}
                                className="mt-1"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className={botonClass}
                        >
                            {processing ? 'Enviando…' : 'Enviar enlace'}
                        </button>
                    </>
                )}
            </Form>

            <p className="mt-5 text-center text-sm text-gray-500">
                <button
                    type="button"
                    onClick={onIrALogin}
                    className={enlaceClass}
                >
                    Volver a iniciar sesión
                </button>
            </p>
        </div>
    );
}

/**
 * Modal del 2° paso del registro de cliente: se abre apenas el backend
 * responde a "Crear cuenta" con el flash `registroPendiente`. Pide el código
 * de 6 dígitos que se envió por correo (en local va a laravel.log). Al
 * verificar, el backend inicia sesión y redirige según el tipo de cuenta.
 */
function ModalCodigo({
    email,
    onCerrar,
}: {
    email: string;
    onCerrar: () => void;
}) {
    const [reenviando, setReenviando] = useState(false);
    const [reenviado, setReenviado] = useState(false);

    useEffect(() => {
        const alPresionar = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCerrar();
            }
        };

        document.addEventListener('keydown', alPresionar);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', alPresionar);
            document.body.style.overflow = '';
        };
    }, [onCerrar]);

    const reenviar = () => {
        setReenviando(true);
        setReenviado(false);
        router.post(
            reenviarStore.url(),
            { email },
            {
                preserveScroll: true,
                onFinish: () => setReenviando(false),
                onSuccess: () => setReenviado(true),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Cerrar"
                onClick={onCerrar}
                className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-codigo"
                className="relative max-h-[90vh] w-full max-w-xs overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
            >
                <button
                    type="button"
                    onClick={onCerrar}
                    aria-label="Cerrar"
                    className="absolute top-3.5 right-3.5 flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                    <X className="size-4" />
                </button>

                <h2
                    id="titulo-codigo"
                    className="text-center text-xl font-black text-gray-900"
                >
                    Confirma tu correo
                </h2>
                <p className="mx-auto mt-1.5 max-w-xs text-center text-sm text-gray-500">
                    Enviamos un código de 6 dígitos a{' '}
                    <span className="font-semibold text-gray-900">{email}</span>.
                    Ingrésalo para terminar tu registro.
                </p>

                <Form
                    {...verificarStore.form()}
                    disableWhileProcessing
                    className="mt-4 space-y-3.5"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="email" value={email} />

                            <div>
                                <label className={labelClass}>
                                    Código de verificación
                                </label>
                                <input
                                    type="text"
                                    name="codigo"
                                    required
                                    autoFocus
                                    inputMode="numeric"
                                    pattern="[0-9]{6}"
                                    maxLength={6}
                                    placeholder="000000"
                                    className={`${inputCentradoClass} text-center text-lg font-bold tracking-[0.5em]`}
                                />
                                <InputError
                                    message={errors.codigo}
                                    className="mt-1"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className={botonClass}
                            >
                                {processing
                                    ? 'Verificando…'
                                    : 'Verificar y terminar registro'}
                            </button>
                        </>
                    )}
                </Form>

                <p className="mt-4 text-center text-sm text-gray-500">
                    ¿No te llegó?{' '}
                    <button
                        type="button"
                        onClick={reenviar}
                        disabled={reenviando}
                        className={enlaceClass}
                    >
                        {reenviando ? 'Reenviando…' : 'Reenviar código'}
                    </button>
                    {reenviado && (
                        <span className="mt-1 block text-green-600">
                            Código reenviado.
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}
