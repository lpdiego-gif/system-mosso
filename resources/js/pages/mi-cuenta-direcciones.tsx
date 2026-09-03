import { Form, Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { store as direccionesStore } from '@/actions/App/Http/Controllers/MiCuentaDireccionController';
import InputError from '@/components/input-error';
import MiCuentaShell from '@/components/MiCuentaShell';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { MiCuentaDireccionesProps } from '@/types/cuenta';
import type { DistritoUbigeo } from '@/types/ubigeo';

const input =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mosso-yellow focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-400';

export default function MiCuentaDirecciones({
  direcciones,
  departamentos,
  provincias,
}: MiCuentaDireccionesProps) {
  const [depSel, setDepSel] = useState('');
  const [provSel, setProvSel] = useState('');
  const [distSel, setDistSel] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  // Catálogo nacional completo: los distritos (~1891) se piden por provincia
  // en vez de mandarlos todos de una en el prop de la página.
  const [distritosProvincia, setDistritosProvincia] = useState<DistritoUbigeo[]>([]);
  const [cargandoDistritos, setCargandoDistritos] = useState(false);
  const [avisoSinEnvio, setAvisoSinEnvio] = useState(false);

  const provFiltradas = useMemo(
    () => provincias.filter((p) => p.fk_departamento === Number(depSel)),
    [provincias, depSel],
  );

  useEffect(() => {
    if (!provSel) {
      setDistritosProvincia([]);
      return;
    }

    let cancelado = false;
    setCargandoDistritos(true);
    axios
      .get<DistritoUbigeo[]>('/ubigeo/distritos', { params: { provincia: provSel } })
      .then((r) => {
        if (!cancelado) setDistritosProvincia(r.data);
      })
      .finally(() => {
        if (!cancelado) setCargandoDistritos(false);
      });

    return () => {
      cancelado = true;
    };
  }, [provSel]);

  function seleccionarDistrito(id: string) {
    setDistSel(id);
    const opcion = distritosProvincia.find((d) => String(d.id_distrito) === id);
    if (opcion && !opcion.activo) {
      setAvisoSinEnvio(true);
    }
  }

  return (
    <StorefrontLayout>
      <Head title="Mis direcciones" />

      <MiCuentaShell activo="direcciones">
        <div className="mb-6">
          <h1 className="text-xl font-black text-gray-900">Direcciones</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tus direcciones guardadas quedan disponibles para envíos y comprobantes.
          </p>
        </div>

        {/* Address list */}
        {direcciones.length > 0 ? (
          <div className="space-y-3 mb-4">
            {direcciones.map((d) => (
              <div key={d.id_cliente_direccion} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900">{d.alias || 'Dirección'}</p>
                      {d.es_principal === 1 && (
                        <span className="text-[11px] font-bold bg-mosso-yellow/20 text-gray-800 rounded-full px-2 py-0.5">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{d.direccion}</p>
                    {d.referencia && <p className="text-xs text-gray-400">Ref: {d.referencia}</p>}
                    <p className="mt-0.5 text-xs text-gray-400">
                      {d.distrito}, {d.provincia}, {d.departamento}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {d.es_principal !== 1 && (
                      <Link
                        href={`/mi-cuenta/direcciones/${d.id_direccion}/principal`}
                        method="patch"
                        as="button"
                        className="text-xs font-semibold text-gray-700 hover:text-mosso-yellow transition-colors whitespace-nowrap"
                      >
                        Hacer principal
                      </Link>
                    )}
                    <Link
                      href={`/mi-cuenta/direcciones/${d.id_direccion}`}
                      method="delete"
                      as="button"
                      className="text-xs text-gray-400 hover:text-mosso-red transition-colors hover:underline whitespace-nowrap"
                    >
                      Eliminar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center text-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-3xl select-none">
              📍
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Sin direcciones guardadas</p>
              <p className="text-xs text-gray-400 mt-0.5">Agrega tu primera dirección aquí abajo.</p>
            </div>
          </div>
        )}

        {/* Add form - collapsible */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-mosso-yellow/20 flex items-center justify-center text-mosso-yellow font-black text-base leading-none">
                +
              </span>
              Agregar dirección
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`text-gray-400 transition-transform ${formOpen ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {formOpen && (
            <div className="border-t border-gray-100 px-5 pb-5 pt-4">
              <Form
                {...direccionesStore.form()}
                resetOnSuccess
                disableWhileProcessing
                onSuccess={() => {
                  setDepSel('');
                  setProvSel('');
                  setDistSel('');
                  setAvisoSinEnvio(false);
                  setFormOpen(false);
                }}
                className="space-y-4"
              >
                {({ processing, errors }) => (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Alias <span className="font-normal text-gray-400">(opcional)</span>
                        </label>
                        <input name="alias" placeholder="Casa, trabajo…" maxLength={50} className={input} />
                        <InputError message={errors.alias} className="mt-1" />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-600 sm:mt-6">
                        <input
                          type="checkbox"
                          name="es_principal"
                          value="1"
                          className="h-4 w-4 rounded border-gray-300 accent-mosso-yellow"
                        />
                        Usar como dirección principal
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dirección</label>
                      <input name="direccion" required maxLength={150} placeholder="Av. Ejemplo 123" className={input} />
                      <InputError message={errors.direccion} className="mt-1" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Referencia <span className="font-normal text-gray-400">(opcional)</span>
                      </label>
                      <input name="referencia" maxLength={150} placeholder="Cerca de…" className={input} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Departamento</label>
                        <select
                          value={depSel}
                          onChange={(e) => { setDepSel(e.target.value); setProvSel(''); setDistSel(''); }}
                          className={input}
                        >
                          <option value="">Selecciona…</option>
                          {departamentos.map((d) => (
                            <option key={d.id_departamento} value={d.id_departamento}>{d.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Provincia</label>
                        <select
                          value={provSel}
                          onChange={(e) => { setProvSel(e.target.value); setDistSel(''); }}
                          disabled={!depSel}
                          className={input}
                        >
                          <option value="">Selecciona…</option>
                          {provFiltradas.map((p) => (
                            <option key={p.id_provincia} value={p.id_provincia}>{p.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Distrito</label>
                        <select
                          name="fk_distrito"
                          required
                          value={distSel}
                          onChange={(e) => seleccionarDistrito(e.target.value)}
                          disabled={!provSel || cargandoDistritos}
                          className={input}
                        >
                          <option value="">{cargandoDistritos ? 'Cargando…' : 'Selecciona…'}</option>
                          {distritosProvincia.map((d) => (
                            <option key={d.id_distrito} value={d.id_distrito}>{d.nombre}</option>
                          ))}
                        </select>
                        <InputError message={errors.fk_distrito} className="mt-1" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={processing}
                      className="bg-mosso-yellow hover:bg-mosso-yellow/85 disabled:opacity-50 text-gray-900 font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
                    >
                      {processing ? 'Guardando…' : 'Guardar dirección'}
                    </button>
                  </>
                )}
              </Form>
            </div>
          )}
        </div>
      </MiCuentaShell>

      {avisoSinEnvio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Cerrar aviso"
            className="absolute inset-0 bg-black/40"
            onClick={() => setAvisoSinEnvio(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <p className="text-sm font-bold text-gray-900">No hay envíos hacia esta dirección</p>
            <p className="mt-2 text-sm text-gray-600">
              Puedes guardarla igual, pero no estará disponible para envío a domicilio.
            </p>
            <button
              onClick={() => setAvisoSinEnvio(false)}
              className="mt-5 w-full bg-mosso-yellow hover:bg-mosso-yellow/85 text-gray-900 font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </StorefrontLayout>
  );
}
