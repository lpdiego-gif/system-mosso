import { Form, Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { store as direccionesStore } from '@/actions/App/Http/Controllers/MiCuentaDireccionController';
import InputError from '@/components/input-error';
import MiCuentaShell from '@/components/MiCuentaShell';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { MiCuentaDireccionesProps } from '@/types/cuenta';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-mosso-yellow focus:border-mosso-yellow';

export default function MiCuentaDirecciones({
  direcciones,
  departamentos,
  provincias,
  distritos,
}: MiCuentaDireccionesProps) {
  const [departamentoSel, setDepartamentoSel] = useState('');
  const [provinciaSel, setProvinciaSel] = useState('');
  const [distritoSel, setDistritoSel] = useState('');

  const provinciasFiltradas = useMemo(
    () => provincias.filter((p) => p.fk_departamento === Number(departamentoSel)),
    [provincias, departamentoSel],
  );

  const distritosFiltrados = useMemo(
    () => distritos.filter((d) => d.fk_provincia === Number(provinciaSel)),
    [distritos, provinciaSel],
  );

  return (
    <StorefrontLayout>
      <Head title="Mis direcciones" />

      <MiCuentaShell activo="direcciones">
        <h1 className="text-xl font-bold text-gray-900">Direcciones</h1>
        <p className="mt-1 text-sm text-gray-500">
          Las direcciones que guardes aquí quedan disponibles para tus envíos y comprobantes.
        </p>

        {direcciones.length > 0 ? (
          <ul className="mt-6 space-y-3">
            {direcciones.map((d) => (
              <li key={d.id_cliente_direccion} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {d.alias || 'Dirección'}{' '}
                      {d.es_principal === 1 && (
                        <span className="ml-1 inline-block rounded-full bg-mosso-yellow/20 text-gray-900 text-[11px] font-bold px-2 py-0.5 align-middle">
                          Principal
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">{d.direccion}</p>
                    {d.referencia && <p className="text-xs text-gray-400">Ref: {d.referencia}</p>}
                    <p className="mt-1 text-xs text-gray-500">
                      {d.distrito}, {d.provincia}, {d.departamento}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {d.es_principal !== 1 && (
                      <Link
                        href={`/mi-cuenta/direcciones/${d.id_direccion}/principal`}
                        method="patch"
                        as="button"
                        className="text-xs text-gray-900 font-semibold hover:text-mosso-yellow whitespace-nowrap transition-colors"
                      >
                        Marcar como principal
                      </Link>
                    )}
                    <Link
                      href={`/mi-cuenta/direcciones/${d.id_direccion}`}
                      method="delete"
                      as="button"
                      className="text-xs text-red-500 hover:underline whitespace-nowrap"
                    >
                      Eliminar
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-gray-500">Todavía no tienes direcciones guardadas.</p>
        )}

        <div className="mt-8 rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-900">Agregar nueva dirección</h2>

          <Form
            {...direccionesStore.form()}
            resetOnSuccess
            disableWhileProcessing
            onSuccess={() => {
              setDepartamentoSel('');
              setProvinciaSel('');
              setDistritoSel('');
            }}
            className="mt-4 space-y-4"
          >
            {({ processing, errors }) => (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alias <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <input name="alias" placeholder="Casa, trabajo…" maxLength={50} className={inputClass} />
                    <InputError message={errors.alias} className="mt-1" />
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-600 sm:mt-6">
                    <input
                      type="checkbox"
                      name="es_principal"
                      value="1"
                      className="h-4 w-4 rounded border-gray-300 text-mosso-yellow focus:ring-mosso-yellow"
                    />
                    Usar como dirección principal
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input name="direccion" required maxLength={150} placeholder="Av. Ejemplo 123" className={inputClass} />
                  <InputError message={errors.direccion} className="mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referencia <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input name="referencia" maxLength={150} placeholder="Cerca de…" className={inputClass} />
                  <InputError message={errors.referencia} className="mt-1" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                    <select
                      value={departamentoSel}
                      onChange={(e) => {
                        setDepartamentoSel(e.target.value);
                        setProvinciaSel('');
                        setDistritoSel('');
                      }}
                      className={inputClass}
                    >
                      <option value="">Selecciona…</option>
                      {departamentos.map((d) => (
                        <option key={d.id_departamento} value={d.id_departamento}>
                          {d.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                    <select
                      value={provinciaSel}
                      onChange={(e) => {
                        setProvinciaSel(e.target.value);
                        setDistritoSel('');
                      }}
                      disabled={!departamentoSel}
                      className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
                    >
                      <option value="">Selecciona…</option>
                      {provinciasFiltradas.map((p) => (
                        <option key={p.id_provincia} value={p.id_provincia}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Distrito</label>
                    <select
                      name="fk_distrito"
                      required
                      value={distritoSel}
                      onChange={(e) => setDistritoSel(e.target.value)}
                      disabled={!provinciaSel}
                      className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
                    >
                      <option value="">Selecciona…</option>
                      {distritosFiltrados.map((d) => (
                        <option key={d.id_distrito} value={d.id_distrito}>
                          {d.nombre}
                        </option>
                      ))}
                    </select>
                    <InputError message={errors.fk_distrito} className="mt-1" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="bg-mosso-yellow hover:bg-mosso-yellow/85 disabled:opacity-60 text-gray-900 font-bold px-6 py-2.5 rounded-xl"
                >
                  {processing ? 'Guardando…' : 'Guardar dirección'}
                </button>
              </>
            )}
          </Form>
        </div>
      </MiCuentaShell>
    </StorefrontLayout>
  );
}
