import { Form, Head, Link, router } from '@inertiajs/react';
import { usePasskeyVerify } from '@laravel/passkeys/react';
import { useEffect, useState } from 'react';
import {
  reenviar as reenviarStore,
  store as registroStore,
  verificar as verificarStore,
} from '@/actions/App/Http/Controllers/ClienteRegistroController';
import InputError from '@/components/input-error';
import StorefrontLayout from '@/layouts/storefront-layout';
import { logout } from '@/routes';
import { store as loginStore } from '@/routes/login';
import { request as solicitarReset } from '@/routes/password';

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-mosso-yellow focus:ring-2 focus:ring-mosso-yellow/30';

const labelClass = 'mb-1 block text-[13px] font-medium text-gray-700';

const botonPrimario =
  'w-full rounded-lg bg-mosso-yellow px-5 py-2 text-sm font-bold text-gray-900 transition hover:bg-mosso-yellow/85 disabled:opacity-60';

type Modo = 'login' | 'registro';

type CuentaProps = {
  canResetPassword?: boolean;
  status?: string;
  /** Correo de un cliente ya autenticado pero sin verificar (viene del controlador). */
  emailPendiente?: string | null;
};

/**
 * Puerta pública y ÚNICA de acceso: login + registro de clientes. `/login` y
 * `/register` de Fortify redirigen aquí. Si ya hay sesión verificada,
 * CuentaController redirige antes de llegar — este componente solo maneja los
 * estados de invitado y el de "cuenta creada, falta confirmar el correo".
 *
 * El paso del código es parte del REGISTRO: aparece tras "Crear cuenta y enviar
 * código" (o si un cliente sin verificar intenta entrar). El formulario de
 * login no lo muestra nunca.
 */
export default function Cuenta({ canResetPassword, status, emailPendiente }: CuentaProps) {
  const [modo, setModo] = useState<Modo>('login');
  // El paso del código lo dispara el propio formulario de registro (onSuccess)
  // o el servidor cuando un cliente sin verificar intenta entrar (emailPendiente).
  const [emailCodigo, setEmailCodigo] = useState(emailPendiente ?? '');
  const [pasoCodigo, setPasoCodigo] = useState(Boolean(emailPendiente));

  const irAlCodigo = (email: string) => {
    setEmailCodigo(email);
    setPasoCodigo(true);
  };

  return (
    <StorefrontLayout>
      <Head title="Acceder a MOSSO" />

      <section className="mx-auto flex min-h-[60vh] w-full max-w-sm flex-col justify-center px-4 py-8 sm:py-10">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-200/60 sm:p-6">
          {pasoCodigo ? (
            <PasoCodigo
              email={emailCodigo}
              sesionIniciada={Boolean(emailPendiente)}
              onVolver={() => {
                setPasoCodigo(false);
                setModo('registro');
              }}
            />
          ) : (
            <>
              <Tabs modo={modo} onCambiar={setModo} />
              {modo === 'login' ? (
                <FormularioLogin canResetPassword={canResetPassword} status={status} />
              ) : (
                <FormularioRegistro onRegistrado={irAlCodigo} />
              )}
            </>
          )}
        </div>

        {!pasoCodigo && (
          <p className="mx-auto mt-4 max-w-xs text-center text-[11px] leading-relaxed text-gray-400">
            ¿Eres trabajador de MOSSO? Tu cuenta la crea el administrador; solo inicia sesión aquí.
          </p>
        )}
      </section>
    </StorefrontLayout>
  );
}

function Tabs({ modo, onCambiar }: { modo: Modo; onCambiar: (m: Modo) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-0.5">
      {(['login', 'registro'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onCambiar(m)}
          aria-pressed={modo === m}
          className={`rounded-md py-1.5 text-[13px] font-semibold transition ${
            modo === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </button>
      ))}
    </div>
  );
}

function Encabezado({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <div className="mt-4 text-center">
      <h1 className="text-lg font-black text-gray-900 sm:text-xl">{titulo}</h1>
      <p className="mx-auto mt-1 max-w-[16rem] text-xs leading-relaxed text-gray-500">{descripcion}</p>
    </div>
  );
}

function FormularioLogin({
  canResetPassword,
  status,
}: {
  canResetPassword?: boolean;
  status?: string;
}) {
  return (
    <div>
      <Encabezado
        titulo="Inicia sesión"
        descripcion="Con la misma cuenta entras como cliente o como trabajador de MOSSO."
      />

      {status && (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-1.5 text-center text-[13px] font-medium text-green-700">
          {status}
        </p>
      )}

      <AccesoConPasskey />

      <Form
        {...loginStore.form()}
        resetOnSuccess={['password']}
        disableWhileProcessing
        className="mt-4 space-y-3"
      >
        {({ processing, errors }) => (
          <>
            <div>
              <label htmlFor="login-email" className={labelClass}>
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                required
                autoFocus
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="email"
                placeholder="tucorreo@ejemplo.com"
                className={inputClass}
              />
              <InputError message={errors.email} className="mt-1" />
            </div>

            <div>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <label htmlFor="login-password" className="text-[13px] font-medium text-gray-700">
                  Contraseña
                </label>
                {canResetPassword && (
                  <Link
                    href={solicitarReset.url()}
                    className="text-[11px] font-semibold text-gray-500 hover:text-mosso-yellow hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                )}
              </div>
              <InputContrasena
                id="login-password"
                name="password"
                autoComplete="current-password"
                placeholder="Tu contraseña"
              />
              <InputError message={errors.password} className="mt-1" />
            </div>

            <label className="flex items-center gap-2 text-[13px] text-gray-600">
              <input
                type="checkbox"
                name="remember"
                className="h-3.5 w-3.5 rounded border-gray-300 text-mosso-yellow focus:ring-mosso-yellow/40"
              />
              Mantener la sesión iniciada
            </label>

            <button type="submit" disabled={processing} className={botonPrimario}>
              {processing ? 'Ingresando…' : 'Ingresar'}
            </button>
          </>
        )}
      </Form>
    </div>
  );
}

/**
 * Botón "Entrar con passkey". Usa el mismo hook que el resto del starter kit
 * (`usePasskeyVerify`), con estilo del storefront. El redirect lo decide el
 * servidor (App\Http\Responses\PasskeyLoginResponse). Si el navegador no
 * soporta WebAuthn no se renderiza.
 */
function AccesoConPasskey() {
  const { verify, isLoading, error, isSupported } = usePasskeyVerify({
    onSuccess: (response) => router.visit(response.redirect ?? '/'),
  });

  if (!isSupported) {
    return null;
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={verify}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-bold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60"
      >
        <IconoLlave className="h-3.5 w-3.5" />
        {isLoading ? 'Verificando…' : 'Entrar con passkey'}
      </button>
      {error && <InputError message={error} className="mt-1 text-center" />}

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-2 text-[10px] uppercase tracking-wide text-gray-400">
            o con tu correo
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Deriva un nombre presentable de la parte local del correo:
 * `juan.perez@x.com` -> `Juan Perez`. Solo es una sugerencia; el nombre real se
 * completa después en "Detalles de la cuenta". No se muestra como campo
 * editable, solo como texto, y se envía en un input oculto.
 */
function nombreDesdeCorreo(email: string): string {
  const local = email.split('@')[0] ?? '';

  return local
    .split(/[._+-]+/)
    .filter(Boolean)
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
    .join(' ');
}

function FormularioRegistro({ onRegistrado }: { onRegistrado: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const nombre = nombreDesdeCorreo(email);

  return (
    <div>
      <Encabezado
        titulo="Crea tu cuenta"
        descripcion="Solo tu correo y una contraseña. Te enviamos un código para confirmarlo."
      />

      <Form
        {...registroStore.form()}
        disableWhileProcessing
        onSuccess={() => onRegistrado(email)}
        className="mt-4 space-y-3"
      >
        {({ processing, errors }) => (
          <>
            <div>
              <label htmlFor="registro-email" className={labelClass}>
                Correo electrónico
              </label>
              <input
                id="registro-email"
                type="email"
                name="email"
                required
                autoFocus
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className={inputClass}
              />
              <input type="hidden" name="name" value={nombre} />
              {nombre && (
                <p className="mt-1 text-[11px] text-gray-400">
                  Te llamaremos <span className="font-semibold text-gray-600">{nombre}</span> · lo cambias luego
                </p>
              )}
              <InputError message={errors.email} className="mt-1" />
              <InputError message={errors.name} className="mt-1" />
            </div>

            <div>
              <label htmlFor="registro-password" className={labelClass}>
                Contraseña
              </label>
              <InputContrasena
                id="registro-password"
                name="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
              />
              <InputError message={errors.password} className="mt-1" />
            </div>

            <div>
              <label htmlFor="registro-password-confirm" className={labelClass}>
                Repite la contraseña
              </label>
              <InputContrasena
                id="registro-password-confirm"
                name="password_confirmation"
                autoComplete="new-password"
                placeholder="Repite la contraseña"
              />
              <InputError message={errors.password_confirmation} className="mt-1" />
            </div>

            <button type="submit" disabled={processing} className={botonPrimario}>
              {processing ? 'Creando cuenta…' : 'Crear cuenta y enviar código'}
            </button>
          </>
        )}
      </Form>
    </div>
  );
}

const COOLDOWN_REENVIO = 60;

function PasoCodigo({
  email,
  sesionIniciada,
  onVolver,
}: {
  email: string;
  sesionIniciada: boolean;
  onVolver: () => void;
}) {
  const [reenviando, setReenviando] = useState(false);
  const [reenviado, setReenviado] = useState(false);
  // Al llegar aquí desde el registro/reenvío ya se acaba de mandar un código,
  // así que arrancamos el cooldown. Si el cliente vuelve más tarde con la sesión
  // iniciada (código quizá vencido), le dejamos reenviar de inmediato.
  const [segundos, setSegundos] = useState(sesionIniciada ? 0 : COOLDOWN_REENVIO);

  useEffect(() => {
    if (segundos <= 0) {
      return;
    }

    const id = setTimeout(() => setSegundos((s) => s - 1), 1000);

    return () => clearTimeout(id);
  }, [segundos]);

  const reenviar = () => {
    setReenviando(true);
    setReenviado(false);
    router.post(
      reenviarStore.url(),
      { email },
      {
        preserveScroll: true,
        onFinish: () => setReenviando(false),
        onSuccess: () => {
          setReenviado(true);
          setSegundos(COOLDOWN_REENVIO);
        },
      },
    );
  };

  return (
    <div>
      <Encabezado
        titulo="Confirma tu correo"
        descripcion="Último paso: escribe el código de 6 dígitos que enviamos a tu correo."
      />

      <p className="mt-2.5 truncate rounded-lg bg-gray-50 px-3 py-1.5 text-center text-[13px] font-semibold text-gray-700">
        {email}
      </p>

      <Form {...verificarStore.form()} disableWhileProcessing className="mt-4 space-y-3">
        {({ processing, errors }) => (
          <>
            <input type="hidden" name="email" value={email} />

            <div>
              <label htmlFor="codigo" className={`${labelClass} text-center`}>
                Código de verificación
              </label>
              <input
                id="codigo"
                type="text"
                name="codigo"
                required
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                className={`${inputClass} py-2 text-center text-lg font-bold tracking-[0.3em]`}
              />
              <InputError message={errors.codigo} className="mt-1 text-center" />
            </div>

            <button type="submit" disabled={processing} className={botonPrimario}>
              {processing ? 'Verificando…' : 'Verificar y entrar'}
            </button>
          </>
        )}
      </Form>

      <div className="mt-4 space-y-1 text-center text-[13px] text-gray-500">
        <p>
          ¿No te llegó?{' '}
          <button
            type="button"
            onClick={reenviar}
            disabled={reenviando || segundos > 0}
            className="font-semibold text-gray-900 transition-colors hover:text-mosso-yellow hover:underline disabled:text-gray-400 disabled:no-underline"
          >
            {reenviando
              ? 'Reenviando…'
              : segundos > 0
                ? `Reenviar en ${segundos}s`
                : 'Reenviar código'}
          </button>
        </p>
        {reenviado && <p className="text-green-600">Código reenviado.</p>}

        {sesionIniciada ? (
          <p>
            <Link
              href={logout()}
              as="button"
              className="font-semibold text-gray-500 hover:text-gray-900 hover:underline"
            >
              Cerrar sesión y usar otro correo
            </Link>
          </p>
        ) : (
          <p>
            <button
              type="button"
              onClick={onVolver}
              className="font-semibold text-gray-500 hover:text-gray-900 hover:underline"
            >
              ← Volver
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Input de contraseña con botón de mostrar/ocultar, con el estilo del
 * storefront (Tailwind puro + SVG a mano, sin `components/ui` ni lucide).
 */
function InputContrasena({
  id,
  name,
  autoComplete,
  placeholder,
}: {
  id: string;
  name: string;
  autoComplete: 'current-password' | 'new-password';
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        name={name}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`${inputClass} pr-9`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400 transition-colors hover:text-gray-600"
      >
        {visible ? <IconoOjoTachado className="h-4 w-4" /> : <IconoOjo className="h-4 w-4" />}
      </button>
    </div>
  );
}

function IconoOjo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconoOjoTachado({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

function IconoLlave({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m10.7 12.3 8.3-8.3" />
      <path d="m17 5 2.5 2.5" />
      <path d="m14 8 2.5 2.5" />
    </svg>
  );
}
