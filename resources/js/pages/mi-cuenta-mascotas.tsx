import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import {
  destroy as mascotasDestroy,
  store as mascotasStore,
} from '@/actions/App/Http/Controllers/MiCuentaMascotaController';
import InputError from '@/components/input-error';
import MiCuentaShell from '@/components/MiCuentaShell';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { Animal, MiCuentaMascotasProps, Mascota } from '@/types/cuenta';

const input =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mosso-yellow focus:border-transparent transition';

function calcEdad(fecha: string): string {
  const meses =
    (new Date().getFullYear() - new Date(fecha).getFullYear()) * 12 +
    (new Date().getMonth() - new Date(fecha).getMonth());
  if (meses < 1) return 'recién nacido';
  if (meses < 12) return `${meses} mes${meses > 1 ? 'es' : ''}`;
  const a = Math.floor(meses / 12);
  return `${a} año${a > 1 ? 's' : ''}`;
}

function PetCard({ mascota }: { mascota: Mascota }) {
  const edad = mascota.fecha_nacimiento ? calcEdad(mascota.fecha_nacimiento) : null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-mosso-yellow/10 flex items-center justify-center text-2xl select-none">
          🐾
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 capitalize">{mascota.nombre}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {mascota.animal}
            {edad ? <span className="text-gray-400"> · {edad}</span> : null}
          </p>
        </div>
      </div>
      <Link
        href={mascotasDestroy.url(mascota.id_mascota)}
        method="delete"
        as="button"
        className="shrink-0 text-xs text-gray-400 hover:text-mosso-red transition-colors hover:underline"
      >
        Eliminar
      </Link>
    </div>
  );
}

function FormAgregarMascota({ animales }: { animales: Animal[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-mosso-yellow/20 flex items-center justify-center text-mosso-yellow font-black text-base leading-none">
            +
          </span>
          Agregar mascota
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
          <Form
            {...mascotasStore.form()}
            resetOnSuccess
            disableWhileProcessing
            onSuccess={() => setOpen(false)}
            className="space-y-4"
          >
            {({ processing, errors }) => (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre</label>
                    <input name="nombre" required maxLength={60} placeholder="Max, Luna…" className={input} />
                    <InputError message={errors.nombre} className="mt-1" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Animal</label>
                    <select name="fk_animal" required className={input} defaultValue="">
                      <option value="" disabled>Selecciona…</option>
                      {animales.map((a) => (
                        <option key={a.id_animal} value={a.id_animal}>
                          {a.nombre}
                        </option>
                      ))}
                    </select>
                    <InputError message={errors.fk_animal} className="mt-1" />
                  </div>
                </div>
                <div className="max-w-xs">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Fecha de nacimiento <span className="font-normal text-gray-400">(opcional)</span>
                  </label>
                  <input type="date" name="fecha_nacimiento" className={input} />
                  <InputError message={errors.fecha_nacimiento} className="mt-1" />
                </div>
                <button
                  type="submit"
                  disabled={processing}
                  className="bg-mosso-yellow hover:bg-mosso-yellow/85 disabled:opacity-50 text-gray-900 font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
                >
                  {processing ? 'Guardando…' : 'Agregar mascota'}
                </button>
              </>
            )}
          </Form>
        </div>
      )}
    </div>
  );
}

export default function MiCuentaMascotas({ mascotas, animales }: MiCuentaMascotasProps) {
  return (
    <StorefrontLayout>
      <Head title="Mis mascotas" />

      <MiCuentaShell activo="mascotas">
        <div className="mb-6">
          <h1 className="text-xl font-black text-gray-900">Mis mascotas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Registra a tus compañeros para recibir recomendaciones y cupones personalizados.
          </p>
        </div>

        <div className="space-y-3 mb-4">
          {mascotas.length > 0 ? (
            mascotas.map((m) => <PetCard key={m.id_mascota} mascota={m} />)
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-3xl select-none">
                🐾
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Sin mascotas registradas</p>
                <p className="text-xs text-gray-400 mt-0.5">Agrega tu primera mascota aquí abajo.</p>
              </div>
            </div>
          )}
        </div>

        <FormAgregarMascota animales={animales} />
      </MiCuentaShell>
    </StorefrontLayout>
  );
}
