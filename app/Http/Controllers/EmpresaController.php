<?php

namespace App\Http\Controllers;

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Requests\Empresa\UpdateEmpresaRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class EmpresaController extends Controller
{
    /**
     * Vista de configuración de la empresa. Al ser un registro único, se toma
     * siempre el primero (y único) registro de la tabla `empresa`, si existe.
     */
    public function index(): Response
    {
        $empresa = $this->obtenerEmpresa();

        return Inertia::render('empresa', [
            'empresa' => $empresa,
            'departamentos' => DB::table('departamentos')
                ->select('id_departamento', 'nombre')
                ->orderBy('nombre')
                ->get(),
            'cuentasBancarias' => $empresa
                ? DB::table('cuentas_bancarias')->where('fk_empresa', $empresa->id_empresa)->orderBy('orden')->get()
                : [],
        ]);
    }

    public function provincias(int $departamento): JsonResponse
    {
        return response()->json(
            DB::table('provincias')
                ->where('fk_departamento', $departamento)
                ->select('id_provincia', 'nombre')
                ->orderBy('nombre')
                ->get()
        );
    }

    public function distritos(int $provincia): JsonResponse
    {
        return response()->json(
            DB::table('distritos')
                ->where('fk_provincia', $provincia)
                ->select('id_distrito', 'nombre')
                ->orderBy('nombre')
                ->get()
        );
    }

    /**
     * Crea o actualiza el registro único de la empresa (upsert manual).
     */
    public function guardar(UpdateEmpresaRequest $request): JsonResponse
    {
        $data = $request->validated();
        $actual = DB::table('empresa')->first();
        $logoAnterior = $actual->logo ?? null;
        $logoNuevo = null;

        if ($request->hasFile('logo')) {
            $logoNuevo = $request->file('logo')->store('empresa', 'public');
        }

        try {
            $empresa = DB::transaction(function () use ($data, $actual, $logoNuevo, $request) {
                // 1) Dirección: se reutiliza y actualiza la existente, o se crea una nueva.
                if ($actual && $actual->fk_direccion) {
                    DB::table('direcciones')->where('id_direccion', $actual->fk_direccion)->update([
                        'direccion' => $data['direccion'],
                        'referencia' => $data['referencia'] ?? null,
                        'fk_distrito' => $data['fk_distrito'],
                    ]);
                    $idDireccion = $actual->fk_direccion;
                } else {
                    $idDireccion = DB::table('direcciones')->insertGetId([
                        'direccion' => $data['direccion'],
                        'referencia' => $data['referencia'] ?? null,
                        'fk_distrito' => $data['fk_distrito'],
                    ]);
                }

                // 2) Logo: nuevo archivo, eliminación explícita, o se conserva el actual.
                if ($logoNuevo) {
                    $logo = $logoNuevo;
                } elseif ($request->boolean('eliminar_logo')) {
                    $logo = null;
                } else {
                    $logo = $actual->logo ?? null;
                }

                $payload = [
                    'ruc' => $data['ruc'],
                    'razon_social' => $data['razon_social'],
                    'nombre_comercial' => $data['nombre_comercial'],
                    'correo' => $data['correo'],
                    'telefono' => $data['telefono'],
                    'celular' => $data['celular'] ?? null,
                    'website' => $data['website'] ?? null,
                    'logo' => $logo,
                    'fk_direccion' => $idDireccion,
                ];

                // 3) Registro único: se actualiza si ya existe, se crea si no.
                if ($actual) {
                    DB::table('empresa')->where('id_empresa', $actual->id_empresa)->update($payload);
                    $id = $actual->id_empresa;
                } else {
                    $id = DB::table('empresa')->insertGetId($payload);
                }

                return DB::table('empresa')->where('id_empresa', $id)->first();
            });
        } catch (Throwable $e) {
            if ($logoNuevo) {
                Storage::disk('public')->delete($logoNuevo);
            }

            report($e);

            return response()->json([
                'message' => 'No se pudo guardar la información de la empresa. Intenta nuevamente.',
            ], 500);
        }

        // El logo anterior solo se elimina del disco tras confirmar el guardado.
        if ($logoAnterior && ($logoNuevo || $request->boolean('eliminar_logo')) && $logoAnterior !== $empresa->logo) {
            Storage::disk('public')->delete($logoAnterior);
        }

        // Los datos de la empresa se comparten cacheados en cada request
        // (ver HandleInertiaRequests) -- se limpian al guardar para que el
        // header/footer reflejen el cambio de inmediato.
        Cache::forget(HandleInertiaRequests::EMPRESA_CACHE_KEY);

        return response()->json([
            'message' => 'Datos de la empresa guardados correctamente.',
            'empresa' => $this->obtenerEmpresa(),
        ]);
    }

    private function obtenerEmpresa(): ?object
    {
        return DB::table('empresa as e')
            ->join('direcciones as d', 'd.id_direccion', '=', 'e.fk_direccion')
            ->join('distritos as dist', 'dist.id_distrito', '=', 'd.fk_distrito')
            ->join('provincias as prov', 'prov.id_provincia', '=', 'dist.fk_provincia')
            ->select([
                'e.id_empresa', 'e.ruc', 'e.razon_social', 'e.nombre_comercial',
                'e.logo', 'e.correo', 'e.telefono', 'e.celular', 'e.website', 'e.fk_direccion',
                'd.direccion', 'd.referencia',
                'dist.id_distrito as fk_distrito',
                'prov.id_provincia as fk_provincia',
                'prov.fk_departamento',
            ])
            ->first();
    }
}
