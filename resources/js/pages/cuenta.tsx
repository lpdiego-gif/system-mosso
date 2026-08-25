import { Form, Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { store as loginStore } from '@/routes/login';
import {
  reenviar as reenviarStore,
  store as registroStore,
  verificar as verificarStore,
} from '@/actions/App/Http/Controllers/ClienteRegistroController';
import InputError from '@/components/input-error';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { RegistroPendienteFlash } from '@/types/cuenta';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-mosso-yellow focus:border-mosso-yellow';

/**
 * Puerta pública de login/registro. Si ya hay sesión, CuentaController
 * redirige antes de llegar aquí (a /mi-cuenta o /dashboard según el tipo de
 * cuenta) — este componente solo maneja los estados de invitado.
 */
export default function Cuenta() {
  const { flash } = usePage().props as unknown as {
    flash?: { registroPendiente?: RegistroPendienteFlash };
  };

  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const emailPendiente = flash?.registroPendiente?.email;

  return (
    <StorefrontLayout>
      <Head title="Mi cuenta" />

      <section className="max-w-md mx-auto px-6 py-16">
        {emailPendiente ? (
          <FormularioCodigo email={emailPendiente} />
        ) : modo === 'login' ? (
          <FormularioLogin onIrARegistro={() => setModo('registro')} />
        ) : (
          <FormularioRegistro onIrALogin={() => setModo('login')} />
        )}
      </section>
    </StorefrontLayout>
  );
}

function FormularioLogin({ onIrARegistro }: { onIrARegistro: () => void }) {
  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900">Inicia sesión</h1>
      <p className="mt-1 text-sm text-gray-500">
        Con la misma cuenta puedes entrar como cliente o como trabajador de MOSSO.
      </p>

      <Form {...loginStore.form()} resetOnSuccess={['password']} disableWhileProcessing className="mt-6 space-y-4">
        {({ processing, errors }) => (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input type="email" name="email" required autoFocus autoComplete="email" className={inputClass} />
              <InputError message={errors.email} className="mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className={inputClass}
              />
              <InputError message={errors.password} className="mt-1" />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" name="remember" className="h-4 w-4 rounded border-gray-300 text-mosso-yellow" />
              Recordarme
            </label>

            <button
              type="submit"
              disabled={processing}
              className="w-full bg-mosso-yellow hover:bg-mosso-yellow/85 disabled:opacity-60 text-gray-900 font-bold px-6 py-2.5 rounded-xl"
            >
              {processing ? 'Ingresando…' : 'Ingresar'}
            </button>
          </>
        )}
      </Form>

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿Aún no tienes cuenta?{' '}
        <button type="button" onClick={onIrARegistro} className="text-gray-900 font-semibold hover:text-mosso-yellow transition-colors hover:underline">
          Regístrate como cliente
        </button>
      </p>
      <p className="mt-2 text-center text-xs text-gray-400">
        ¿Eres trabajador de MOSSO? Tu cuenta ya fue creada por el administrador, solo inicia sesión arriba.
      </p>
    </div>
  );
}

function FormularioRegistro({ onIrALogin }: { onIrALogin: () => void }) {
  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900">Crea tu cuenta</h1>
      <p className="mt-1 text-sm text-gray-500">
        Solo necesitamos tu correo y una contraseña. Después te enviamos un código para confirmarlo.
      </p>

      <Form {...registroStore.form()} disableWhileProcessing className="mt-6 space-y-4">
        {({ processing, errors }) => (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input type="email" name="email" required autoFocus autoComplete="email" className={inputClass} />
              <InputError message={errors.email} className="mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                required
                autoComplete="new-password"
                className={inputClass}
              />
              <InputError message={errors.password} className="mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <input
                type="password"
                name="password_confirmation"
                required
                autoComplete="new-password"
                className={inputClass}
              />
              <InputError message={errors.password_confirmation} className="mt-1" />
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full bg-mosso-yellow hover:bg-mosso-yellow/85 disabled:opacity-60 text-gray-900 font-bold px-6 py-2.5 rounded-xl"
            >
              {processing ? 'Creando cuenta…' : 'Crear cuenta y enviar código'}
            </button>
          </>
        )}
      </Form>

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿Ya tienes cuenta?{' '}
        <button type="button" onClick={onIrALogin} className="text-gray-900 font-semibold hover:text-mosso-yellow transition-colors hover:underline">
          Inicia sesión
        </button>
      </p>
    </div>
  );
}

function FormularioCodigo({ email }: { email: string }) {
  const [reenviando, setReenviando] = useState(false);
  const [reenviado, setReenviado] = useState(false);

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
    <div>
      <h1 className="text-2xl font-black text-gray-900">Confirma tu correo</h1>
      <p className="mt-1 text-sm text-gray-500">
        Enviamos un código de 6 dígitos a <span className="font-semibold text-gray-900">{email}</span>. Ingrésalo
        para terminar tu registro.
      </p>

      <Form {...verificarStore.form()} disableWhileProcessing className="mt-6 space-y-4">
        {({ processing, errors }) => (
          <>
            <input type="hidden" name="email" value={email} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de verificación</label>
              <input
                type="text"
                name="codigo"
                required
                autoFocus
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                className={`${inputClass} text-center tracking-[0.5em] font-bold text-lg`}
              />
              <InputError message={errors.codigo} className="mt-1" />
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full bg-mosso-yellow hover:bg-mosso-yellow/85 disabled:opacity-60 text-gray-900 font-bold px-6 py-2.5 rounded-xl"
            >
              {processing ? 'Verificando…' : 'Verificar y terminar registro'}
            </button>
          </>
        )}
      </Form>

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿No te llegó?{' '}
        <button
          type="button"
          onClick={reenviar}
          disabled={reenviando}
          className="text-gray-900 font-semibold hover:text-mosso-yellow transition-colors hover:underline disabled:opacity-60"
        >
          {reenviando ? 'Reenviando…' : 'Reenviar código'}
        </button>
        {reenviado && <span className="block mt-1 text-green-600">Código reenviado.</span>}
      </p>
    </div>
  );
}
