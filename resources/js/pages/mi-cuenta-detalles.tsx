import { Form, Head } from '@inertiajs/react';
import { update as detallesUpdate } from '@/actions/App/Http/Controllers/MiCuentaDetallesController';
import InputError from '@/components/input-error';
import MiCuentaShell from '@/components/MiCuentaShell';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { MiCuentaDetallesProps } from '@/types/cuenta';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500';

export default function MiCuentaDetalles({ email, persona, tiposDocumento }: MiCuentaDetallesProps) {
  return (
    <StorefrontLayout>
      <Head title="Detalles de la cuenta" />

      <MiCuentaShell activo="detalles">
        <h1 className="text-xl font-bold text-gray-900">Detalles de la cuenta</h1>
        <p className="mt-1 text-sm text-gray-500">
          Correo de la cuenta: <span className="text-gray-700 font-medium">{email}</span>
        </p>

        <Form {...detallesUpdate.form()} disableWhileProcessing className="mt-6 space-y-4 max-w-xl">
          {({ processing, errors }) => (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de documento</label>
                  <select
                    name="fk_tipo_documento"
                    required
                    defaultValue={persona?.fk_tipo_documento ?? ''}
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Selecciona…
                    </option>
                    {tiposDocumento.map((t) => (
                      <option key={t.id_tipo_documento} value={t.id_tipo_documento}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                  <InputError message={errors.fk_tipo_documento} className="mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nro. de documento</label>
                  <input
                    name="num_documento"
                    required
                    maxLength={20}
                    defaultValue={persona?.num_documento ?? ''}
                    className={inputClass}
                  />
                  <InputError message={errors.num_documento} className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                  <input
                    name="nombres"
                    required
                    maxLength={100}
                    defaultValue={persona?.nombres ?? ''}
                    className={inputClass}
                  />
                  <InputError message={errors.nombres} className="mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido paterno</label>
                  <input
                    name="apellido_paterno"
                    required
                    maxLength={100}
                    defaultValue={persona?.apellido_paterno ?? ''}
                    className={inputClass}
                  />
                  <InputError message={errors.apellido_paterno} className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido materno <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    name="apellido_materno"
                    maxLength={100}
                    defaultValue={persona?.apellido_materno ?? ''}
                    className={inputClass}
                  />
                  <InputError message={errors.apellido_materno} className="mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    name="telefono"
                    required
                    maxLength={20}
                    defaultValue={persona?.telefono ?? ''}
                    className={inputClass}
                  />
                  <InputError message={errors.telefono} className="mt-1" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de nacimiento <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  defaultValue={persona?.fecha_nacimiento ?? ''}
                  className={inputClass}
                />
                <InputError message={errors.fecha_nacimiento} className="mt-1" />
              </div>

              <button
                type="submit"
                disabled={processing}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-lg"
              >
                {processing ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </>
          )}
        </Form>
      </MiCuentaShell>
    </StorefrontLayout>
  );
}
