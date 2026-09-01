import { Form, Head, router, usePage } from '@inertiajs/react';
import { Eye, EyeOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    reenviar as reenviarStore,
    store as registroStore,
    verificar as verificarStore,
} from '@/actions/App/Http/Controllers/ClienteRegistroController';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import StorefrontLayout from '@/layouts/storefront-layout';
import { store as loginStore } from '@/routes/login';
import { email as passwordEmail } from '@/routes/password';
import type { RegistroPendienteFlash } from '@/types/cuenta';

const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-base text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-mosso-yellow focus:border-mosso-yellow sm:text-sm';

const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

const botonClass =
    'w-full rounded-lg bg-mosso-yellow px-6 py-2 text-sm font-bold text-gray-900 shadow-sm transition-colors hover:bg-mosso-yellow/85 disabled:opacity-60';

const enlaceClass =
    'font-semibold text-gray-900 transition-colors hover:text-mosso-yellow hover:underline disabled:opacity-60';

const cardClass =
    'rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-200/60 sm:p-8';

type Modo = 'login' | 'registro' | 'recuperar';

/**
 * Puerta pública de login/registro. Si ya hay sesión, CuentaController
 * redirige antes de llegar aquí (a /mi-cuenta o /dashboard según el tipo de
 * cuenta) — este componente solo maneja los estados de invitado.
 *
 * Concentra toda la seguridad de acceso del storefront: contraseña, passkey,
 * "olvidé mi contraseña" y el registro de cliente por código. El desafío 2FA
 * (solo trabajadores) y el restablecimiento por enlace viven en sus propias
 * rutas de Fortify pero con la misma estética (StorefrontLayout).
 */
export default function Cuenta() {
    const { status, canResetPassword } = usePage().props as unknown as {
        status?: string;
        canResetPassword?: boolean;
    };

    const [modo, setModo] = useState<Modo>('login');
    const [emailPendiente, setEmailPendiente] = useState<string | null>(null);

    // Los datos flash de Inertia (registroPendiente) NO llegan en `props`, sino
    // por el evento `flash` del router — igual que useFlashToast. Al registrarse,
    // el backend hace flash + redirect a /cuenta: aquí abrimos el modal del código.
    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash as
                { registroPendiente?: RegistroPendienteFlash } | undefined;
            const email = flash?.registroPendiente?.email;

            if (email) {
                setEmailPendiente(email);
                setModo('registro');
            }
        });
    }, []);

    return (
        <StorefrontLayout>
            <Head title="Mi cuenta" />

            <section className="mx-auto flex w-full max-w-md flex-col px-4 py-10 sm:px-6 sm:py-16">
                {status && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {status}
                    </div>
                )}

                <div className={cardClass}>
                    {modo !== 'recuperar' && (
                        <ToggleAcceso modo={modo} onCambiar={setModo} />
                    )}

                    {modo === 'recuperar' ? (
                        <FormularioRecuperar
                            onIrALogin={() => setModo('login')}
                        />
                    ) : modo === 'registro' ? (
                        <FormularioRegistro />
                    ) : (
                        <FormularioLogin
                            canResetPassword={canResetPassword ?? false}
                            onRecuperar={() => setModo('recuperar')}
                        />
                    )}
                </div>
            </section>

            {emailPendiente && (
                <ModalCodigo
                    email={emailPendiente}
                    onCerrar={() => setEmailPendiente(null)}
                />
            )}
        </StorefrontLayout>
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
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 text-sm font-semibold">
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
            <h1 className="text-2xl font-black text-gray-900">{titulo}</h1>
            {descripcion && (
                <p className="mx-auto mt-1.5 max-w-xs text-sm text-gray-500">
                    {descripcion}
                </p>
            )}
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
            <input
                type={visible ? 'text' : 'password'}
                name={name}
                required
                autoFocus={autoFocus}
                autoComplete={autoComplete}
                placeholder={placeholder}
                className={`${inputClass} pr-10`}
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

            <div className="mt-6">
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
                className="space-y-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div>
                            <label className={labelClass}>
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                autoFocus
                                autoComplete="email"
                                placeholder="nombre@correo.com"
                                className={inputClass}
                            />
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
                className="mt-6 space-y-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div>
                            <label className={labelClass}>
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                autoFocus
                                autoComplete="email"
                                placeholder="nombre@correo.com"
                                className={inputClass}
                            />
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
                className="mt-6 space-y-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div>
                            <label className={labelClass}>
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                autoFocus
                                autoComplete="email"
                                placeholder="nombre@correo.com"
                                className={inputClass}
                            />
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

            <p className="mt-6 text-center text-sm text-gray-500">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Cerrar"
                onClick={onCerrar}
                className="absolute inset-0 bg-black/50"
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-codigo"
                className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-7"
            >
                <button
                    type="button"
                    onClick={onCerrar}
                    aria-label="Cerrar"
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                >
                    <X className="size-5" />
                </button>

                <h2
                    id="titulo-codigo"
                    className="text-center text-xl font-black text-gray-900"
                >
                    Confirma tu correo
                </h2>
                <p className="mx-auto mt-1.5 max-w-xs text-center text-sm text-gray-500">
                    Enviamos un código de 6 dígitos a{' '}
                    <span className="font-semibold text-gray-900">{email}</span>
                    . Ingrésalo para terminar tu registro.
                </p>

                <Form
                    {...verificarStore.form()}
                    disableWhileProcessing
                    className="mt-5 space-y-4"
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
                                    className={`${inputClass} text-center text-lg font-bold tracking-[0.5em]`}
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
