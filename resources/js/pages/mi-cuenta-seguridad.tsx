import { Form, Head, router } from '@inertiajs/react';
import { usePasskeyRegister } from '@laravel/passkeys/react';
import { useState } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import { destroy as destruirPasskey } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController';
import InputError from '@/components/input-error';
import MiCuentaShell from '@/components/MiCuentaShell';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { MiCuentaSeguridadProps, PasskeyResumen } from '@/types/cuenta';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-mosso-yellow focus:border-mosso-yellow';

export default function MiCuentaSeguridad({ canManagePasskeys, passkeys }: MiCuentaSeguridadProps) {
  return (
    <StorefrontLayout>
      <Head title="Acceso y seguridad" />

      <MiCuentaShell activo="seguridad">
        <h1 className="text-xl font-bold text-gray-900">Acceso y seguridad</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cambia tu contraseña o usa una passkey para entrar sin escribirla.
        </p>

        <CambiarContrasena />

        {canManagePasskeys && <SeccionPasskeys passkeys={passkeys} />}
      </MiCuentaShell>
    </StorefrontLayout>
  );
}

function CambiarContrasena() {
  return (
    <section className="mt-10 max-w-xl">
      <h2 className="text-base font-bold text-gray-900">Contraseña</h2>

      <Form
        {...SecurityController.update.form()}
        options={{ preserveScroll: true }}
        resetOnError={['password', 'password_confirmation', 'current_password']}
        resetOnSuccess
        disableWhileProcessing
        className="mt-4 space-y-4"
      >
        {({ processing, errors }) => (
          <>
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña actual
              </label>
              <input
                id="current_password"
                type="password"
                name="current_password"
                required
                autoComplete="current-password"
                className={inputClass}
              />
              <InputError message={errors.current_password} className="mt-1" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <input
                id="password"
                type="password"
                name="password"
                required
                autoComplete="new-password"
                className={inputClass}
              />
              <InputError message={errors.password} className="mt-1" />
            </div>

            <div>
              <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar nueva contraseña
              </label>
              <input
                id="password_confirmation"
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
              className="bg-mosso-yellow hover:bg-mosso-yellow/85 disabled:opacity-60 text-gray-900 font-bold px-6 py-2.5 rounded-xl"
            >
              {processing ? 'Guardando…' : 'Actualizar contraseña'}
            </button>
          </>
        )}
      </Form>
    </section>
  );
}

function SeccionPasskeys({ passkeys }: { passkeys: PasskeyResumen[] }) {
  const [borrando, setBorrando] = useState<number | null>(null);

  const eliminar = (id: number) => {
    setBorrando(id);
    router.delete(destruirPasskey.url(id), {
      preserveScroll: true,
      onFinish: () => setBorrando(null),
    });
  };

  return (
    <section className="mt-12 max-w-xl">
      <h2 className="text-base font-bold text-gray-900">Passkeys</h2>
      <p className="mt-1 text-sm text-gray-500">
        Una passkey usa la huella, el rostro o el PIN de tu dispositivo para iniciar sesión.
      </p>

      <div className="mt-4 divide-y divide-gray-200 rounded-lg border border-gray-200">
        {passkeys.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">Todavía no tienes passkeys.</p>
        ) : (
          passkeys.map((passkey) => (
            <div key={passkey.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{passkey.name}</p>
                <p className="text-xs text-gray-500">
                  Creada {passkey.created_at_diff}
                  {passkey.last_used_at_diff && ` · usada ${passkey.last_used_at_diff}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => eliminar(passkey.id)}
                disabled={borrando === passkey.id}
                className="text-sm font-semibold text-red-600 hover:text-red-700 hover:underline disabled:opacity-60"
              >
                {borrando === passkey.id ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          ))
        )}
      </div>

      <RegistrarPasskey />
    </section>
  );
}

function RegistrarPasskey() {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const { register, isLoading, error, isSupported } = usePasskeyRegister({
    onSuccess: () => {
      setNombre('');
      setAbierto(false);
      router.reload({ only: ['passkeys'] });
    },
  });

  if (!isSupported) {
    return (
      <p className="mt-4 text-sm text-gray-500">Este navegador no admite passkeys.</p>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mt-4 rounded-xl border border-gray-300 bg-white px-6 py-2.5 font-bold text-gray-900 hover:bg-gray-50"
      >
        Agregar passkey
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        if (nombre.trim()) {
          register(nombre.trim());
        }
      }}
      className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
    >
      <div>
        <label htmlFor="passkey-nombre" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de la passkey
        </label>
        <input
          id="passkey-nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoFocus
          placeholder="Ej. iPhone de Diego, laptop del trabajo"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-400">Te ayuda a reconocerla después.</p>
      </div>

      {error && <InputError message={error} />}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading || !nombre.trim()}
          className="bg-mosso-yellow hover:bg-mosso-yellow/85 disabled:opacity-60 text-gray-900 font-bold px-5 py-2 rounded-xl"
        >
          {isLoading ? 'Registrando…' : 'Registrar'}
        </button>
        <button
          type="button"
          onClick={() => {
            setAbierto(false);
            setNombre('');
          }}
          className="px-5 py-2 rounded-xl font-semibold text-gray-600 hover:text-gray-900"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
