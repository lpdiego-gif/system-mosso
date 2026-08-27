import { Form, Head } from '@inertiajs/react';
import { update as detallesUpdate } from '@/actions/App/Http/Controllers/MiCuentaDetallesController';
import InputError from '@/components/input-error';
import MiCuentaShell from '@/components/MiCuentaShell';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { MiCuentaDetallesProps } from '@/types/cuenta';

const input =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mosso-yellow focus:border-transparent transition';

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">{children}</div>;
}

function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
      {children}
      {optional && <span className="ml-1 font-normal text-gray-400">(opcional)</span>}
    </label>
  );
}

export default function MiCuentaDetalles({ email, persona, tiposDocumento }: MiCuentaDetallesProps) {
  return (
    <StorefrontLayout>
      <Head title="Detalles de la cuenta" />

      <MiCuentaShell activo="detalles">
        <div className="mb-6">
          <h1 className="text-xl font-black text-gray-900">Detalles de la cuenta</h1>
          <p className="mt-1 text-sm text-gray-500">
            Correo:{' '}
            <span className="text-gray-700 font-medium">{email}</span>
          </p>
        </div>

        <Form {...detallesUpdate.form()} disableWhileProcessing className="space-y-4 max-w-2xl">
          {({ processing, errors }) => (
            <>
              {/* Documento */}
              <FieldGroup>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Documento</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de documento</Label>
                    <select
                      name="fk_tipo_documento"
                      required
                      defaultValue={persona?.fk_tipo_documento ?? ''}
                      className={input}
                    >
                      <option value="" disabled>Selecciona…</option>
                      {tiposDocumento.map((t) => (
                        <option key={t.id_tipo_documento} value={t.id_tipo_documento}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>
                    <InputError message={errors.fk_tipo_documento} className="mt-1" />
                  </div>
                  <div>
                    <Label>Nro. de documento</Label>
                    <input
                      name="num_documento"
                      required
                      maxLength={20}
                      defaultValue={persona?.num_documento ?? ''}
                      className={input}
                    />
                    <InputError message={errors.num_documento} className="mt-1" />
                  </div>
                </div>
              </FieldGroup>

              {/* Nombre */}
              <FieldGroup>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre completo</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombres</Label>
                    <input
                      name="nombres"
                      required
                      maxLength={100}
                      defaultValue={persona?.nombres ?? ''}
                      className={input}
                    />
                    <InputError message={errors.nombres} className="mt-1" />
                  </div>
                  <div>
                    <Label>Apellido paterno</Label>
                    <input
                      name="apellido_paterno"
                      required
                      maxLength={100}
                      defaultValue={persona?.apellido_paterno ?? ''}
                      className={input}
                    />
                    <InputError message={errors.apellido_paterno} className="mt-1" />
                  </div>
                  <div>
                    <Label optional>Apellido materno</Label>
                    <input
                      name="apellido_materno"
                      maxLength={100}
                      defaultValue={persona?.apellido_materno ?? ''}
                      className={input}
                    />
                    <InputError message={errors.apellido_materno} className="mt-1" />
                  </div>
                </div>
              </FieldGroup>

              {/* Contacto */}
              <FieldGroup>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contacto</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Teléfono</Label>
                    <input
                      name="telefono"
                      required
                      maxLength={20}
                      defaultValue={persona?.telefono ?? ''}
                      className={input}
                    />
                    <InputError message={errors.telefono} className="mt-1" />
                  </div>
                  <div>
                    <Label optional>Fecha de nacimiento</Label>
                    <input
                      type="date"
                      name="fecha_nacimiento"
                      defaultValue={persona?.fecha_nacimiento ?? ''}
                      className={input}
                    />
                    <InputError message={errors.fecha_nacimiento} className="mt-1" />
                  </div>
                </div>
              </FieldGroup>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={processing}
                  className="bg-mosso-yellow hover:bg-mosso-yellow/85 disabled:opacity-50 text-gray-900 font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
                >
                  {processing ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </>
          )}
        </Form>
      </MiCuentaShell>
    </StorefrontLayout>
  );
}
