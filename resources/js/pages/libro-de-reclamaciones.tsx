import { Form, Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { store } from '@/actions/App/Http/Controllers/ReclamoController';
import InputError from '@/components/input-error';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { ReclamoRegistradoFlash } from '@/types/reclamo';
import type { EmpresaPublica } from '@/types/empresa';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-mosso-yellow focus:border-mosso-yellow';

export default function LibroDeReclamaciones() {
  const { flash, empresa } = usePage().props as unknown as {
    flash?: { reclamoRegistrado?: ReclamoRegistradoFlash };
    empresa: EmpresaPublica | null;
  };
  const [esMenorEdad, setEsMenorEdad] = useState(false);

  const direccionFiscal = empresa?.direccion
    ? `${empresa.direccion}${empresa.distrito ? `, ${empresa.distrito}` : ''}`
    : null;

  return (
    <StorefrontLayout>
      <Head title="Libro de Reclamaciones" />

      <section className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">Libro de reclamaciones</h1>

          <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-semibold text-gray-900">Razón social:</span>{' '}
              {empresa?.razon_social || 'Pendiente de configurar en el panel de administración.'}
            </p>
            <p>
              <span className="font-semibold text-gray-900">RUC:</span>{' '}
              {empresa?.ruc || 'Pendiente de configurar en el panel de administración.'}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Dirección fiscal:</span>{' '}
              {direccionFiscal || 'Pendiente de configurar en el panel de administración.'}
            </p>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Conforme al Código de Protección y Defensa del Consumidor (Ley N° 29571) y su reglamento, este
            establecimiento pone a tu disposición el presente Libro de Reclamaciones.
          </p>
        </header>

        {flash?.reclamoRegistrado && (
          <div className="mb-8 rounded-lg border border-green-300 bg-green-50 p-5 text-green-800">
            <p className="font-bold">
              Tu {flash.reclamoRegistrado.tipo === 'queja' ? 'queja' : 'reclamo'} N° {flash.reclamoRegistrado.id} fue
              registrado correctamente.
            </p>
            <p className="mt-1 text-sm">
              Fecha de registro: {flash.reclamoRegistrado.fecha}. Te responderemos al correo indicado en un plazo no
              mayor a quince (15) días hábiles.
            </p>
          </div>
        )}

        <Form {...store.form()} resetOnSuccess disableWhileProcessing className="space-y-10">
          {({ processing, errors }) => (
            <>
              <FormSeccion titulo="1. Datos de la persona que presenta el reclamo">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Campo label="Tipo de documento" error={errors.tipo_documento}>
                    <select name="tipo_documento" required defaultValue="" className={inputClass}>
                      <option value="" disabled>
                        Selecciona…
                      </option>
                      <option value="DNI">DNI</option>
                      <option value="CE">Carné de Extranjería</option>
                      <option value="Pasaporte">Pasaporte</option>
                    </select>
                  </Campo>
                  <Campo label="Nro. de documento" error={errors.num_documento}>
                    <input name="num_documento" required maxLength={20} className={inputClass} />
                  </Campo>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <Campo label="Nombres" error={errors.nombres}>
                    <input name="nombres" required maxLength={100} className={inputClass} />
                  </Campo>
                  <Campo label="Apellido paterno" error={errors.apellido_paterno}>
                    <input name="apellido_paterno" required maxLength={100} className={inputClass} />
                  </Campo>
                  <Campo label="Apellido materno" error={errors.apellido_materno}>
                    <input name="apellido_materno" maxLength={100} className={inputClass} />
                  </Campo>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Campo label="Email" error={errors.email}>
                    <input type="email" name="email" required maxLength={150} className={inputClass} />
                  </Campo>
                  <Campo label="Tipo de respuesta preferida" error={errors.tipo_respuesta}>
                    <select name="tipo_respuesta" required defaultValue="correo_electronico" className={inputClass}>
                      <option value="correo_electronico">Correo electrónico</option>
                    </select>
                  </Campo>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <Campo label="Dirección" error={errors.direccion} className="sm:col-span-2">
                    <input name="direccion" required maxLength={150} className={inputClass} />
                  </Campo>
                  <Campo label="Distrito" error={errors.distrito}>
                    <input name="distrito" required maxLength={100} className={inputClass} />
                  </Campo>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Campo label="Teléfono" error={errors.telefono}>
                    <input name="telefono" required maxLength={20} className={inputClass} />
                  </Campo>
                </div>
              </FormSeccion>

              <FormSeccion titulo="2. Información general">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Campo label="Tienda de compra" error={errors.tienda_compra}>
                    <select name="tienda_compra" required defaultValue="" className={inputClass}>
                      <option value="" disabled>
                        Selecciona…
                      </option>
                      <option value="fisica">Tienda física</option>
                      <option value="online">Online</option>
                    </select>
                  </Campo>
                  <Campo label="Monto reclamado (S/.)" error={errors.monto_reclamado}>
                    <input
                      type="number"
                      name="monto_reclamado"
                      min={0}
                      step="0.01"
                      placeholder="Opcional"
                      className={inputClass}
                    />
                  </Campo>
                </div>

                {/* MOSSO solo vende productos (no ofrece servicios reclamables), así que el
                    tipo de bien queda fijo en "producto" — sin selector para el cliente. */}
                <input type="hidden" name="tipo_bien" value="producto" />

                <Campo label="Descripción del producto" error={errors.descripcion_bien} className="mt-4">
                  <textarea name="descripcion_bien" required rows={3} className={inputClass} />
                </Campo>
              </FormSeccion>

              <FormSeccion titulo="3. Detalle de su reclamo">
                <fieldset>
                  <legend className="block text-sm font-medium text-gray-700 mb-2">Tipo de atención</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <RadioCard
                      name="tipo_atencion"
                      value="reclamo"
                      label="Reclamo"
                      description="Disconformidad relacionada al producto o servicio."
                      defaultChecked
                    />
                    <RadioCard
                      name="tipo_atencion"
                      value="queja"
                      label="Queja"
                      description="Disconformidad relacionada a la atención al cliente."
                    />
                  </div>
                  <InputError message={errors.tipo_atencion} className="mt-1" />
                </fieldset>

                <Campo label="Detalle del reclamo o queja" error={errors.detalle} className="mt-4">
                  <textarea name="detalle" required rows={4} className={inputClass} />
                </Campo>

                <Campo label="Pedido o solución esperada" error={errors.pedido} className="mt-4">
                  <textarea name="pedido" required rows={3} className={inputClass} />
                </Campo>
              </FormSeccion>

              <FormSeccion titulo="4. Datos del apoderado">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="es_menor_edad"
                    value="1"
                    checked={esMenorEdad}
                    onChange={(e) => setEsMenorEdad(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-mosso-yellow focus:ring-mosso-yellow"
                  />
                  Soy menor de edad (estos datos los completa mi padre, madre o apoderado)
                </label>

                {esMenorEdad && (
                  <div className="mt-4 space-y-4 rounded-lg border border-gray-200 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Campo label="Tipo de documento del apoderado" error={errors.apoderado_tipo_documento}>
                        <select name="apoderado_tipo_documento" defaultValue="" className={inputClass}>
                          <option value="" disabled>
                            Selecciona…
                          </option>
                          <option value="DNI">DNI</option>
                          <option value="CE">Carné de Extranjería</option>
                          <option value="Pasaporte">Pasaporte</option>
                        </select>
                      </Campo>
                      <Campo label="Nro. de documento del apoderado" error={errors.apoderado_num_documento}>
                        <input name="apoderado_num_documento" maxLength={20} className={inputClass} />
                      </Campo>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Campo label="Nombres del apoderado" error={errors.apoderado_nombres}>
                        <input name="apoderado_nombres" maxLength={150} className={inputClass} />
                      </Campo>
                      <Campo label="Apellidos del apoderado" error={errors.apoderado_apellidos}>
                        <input name="apoderado_apellidos" maxLength={150} className={inputClass} />
                      </Campo>
                    </div>
                  </div>
                )}
              </FormSeccion>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-600">
                  El proveedor deberá dar respuesta al reclamo y/o queja en un plazo no mayor a quince (15) días
                  hábiles.
                </p>

                <button
                  type="submit"
                  disabled={processing}
                  className="mt-4 bg-mosso-yellow hover:bg-mosso-yellow/85 disabled:opacity-60 text-gray-900 font-bold px-8 py-3 rounded-xl"
                >
                  {processing ? 'Enviando…' : 'Enviar'}
                </button>

                <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                  Los datos personales consignados en este formulario serán tratados de forma confidencial y
                  utilizados exclusivamente para la atención de tu reclamo o queja, conforme a la Ley N° 29733, Ley
                  de Protección de Datos Personales, y su reglamento. Puedes ejercer tus derechos de Acceso,
                  Rectificación, Cancelación y Oposición (derechos ARCO) escribiendo a hola@mosso.com.pe.
                </p>
              </div>
            </>
          )}
        </Form>
      </section>
    </StorefrontLayout>
  );
}

function FormSeccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">{titulo}</h2>
      {children}
    </div>
  );
}

function Campo({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      <InputError message={error} className="mt-1" />
    </div>
  );
}

function RadioCard({
  name,
  value,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-gray-300 px-4 py-3 cursor-pointer has-[:checked]:border-mosso-yellow has-[:checked]:bg-mosso-yellow/10">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        required
        className="mt-1 h-4 w-4 border-gray-300 text-mosso-yellow focus:ring-mosso-yellow"
      />
      <span>
        <span className="block text-sm font-semibold text-gray-900">{label}</span>
        {description && <span className="block text-xs text-gray-500 mt-0.5">{description}</span>}
      </span>
    </label>
  );
}
