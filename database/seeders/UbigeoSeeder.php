<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Reemplaza el contenido de `departamentos`/`provincias`/`distritos` por el
 * catálogo NACIONAL completo del Perú (INEI, `database/data/ubigeo.json`,
 * ~1891 distritos), todos con `activo = 0` y `costo_envio = null`: el
 * checkout queda SIN zonas de envío hasta que el admin las configure desde
 * /distrito. NO crea tablas nuevas — ver la migración
 * `2026_09_02_100000_add_ubigeo_a_geografia`.
 *
 * DESTRUCTIVO: borra `direcciones` (y en cascada `cliente_direcciones`, por
 * `ON DELETE CASCADE`; `trabajadores.fk_direccion`/`servicios.fk_direccion`
 * quedan en NULL por `ON DELETE SET NULL` — no hace falta tocarlos a mano) y
 * TODO `distritos`/`provincias`/`departamentos` para reinsertarlos desde cero
 * con sus `id_*` reasignados. Los costos de envío que hubiera cargados HOY se
 * pierden — el admin los vuelve a cargar desde el panel tras correr esto.
 *
 * Antes de borrar nada, aborta (sin tocar la BD) si encuentra:
 *   - `pedidos.fk_direccion_envio` apuntando a alguna dirección: el FK real
 *     es `ON DELETE RESTRICT` a propósito (no perder la dirección de entrega
 *     de un pedido ya hecho) — si hay pedidos así, este seeder NO es seguro
 *     tal cual y hay que decidir qué hacer con ellos primero.
 *   - `empresa.fk_direccion` seteado (mismo `RESTRICT`; hoy debería estar
 *     vacía en mosso2, ver MEMORIA_PROYECTO.md).
 *
 * Guarda un respaldo de los distritos actuales (con su costo_envio) en
 * `storage/app/ubigeo-backups/` antes de borrar, por si se quiere reimportar
 * a mano después.
 *
 * Idempotente: correrlo de nuevo dos veces dentro de la misma sesión produce
 * el mismo resultado (mismos ~1891 distritos, todos activo=0 costo_envio=null).
 */
class UbigeoSeeder extends Seeder
{
    public function run(): void
    {
        $this->abortarSiHayReferenciasQueSePerderian();

        $rutaDataset = database_path('data/ubigeo.json');

        if (! file_exists($rutaDataset)) {
            throw new RuntimeException("Falta el dataset: {$rutaDataset}");
        }

        $filas = json_decode(file_get_contents($rutaDataset), true, flags: JSON_THROW_ON_ERROR);

        $this->respaldarDistritosActuales();

        [$departamentos, $provincias, $distritos] = $this->armarCatalogos($filas);

        // Cascadas/SET NULL reales del esquema (ver docblock de la clase):
        // direcciones -> cliente_direcciones (CASCADE), trabajadores/servicios
        // (SET NULL). Borrar `direcciones` directamente ya dispara todo eso.
        DB::table('direcciones')->delete();
        DB::table('distritos')->delete();
        DB::table('provincias')->delete();
        DB::table('departamentos')->delete();

        // Reinicia el autoincremento ANTES de insertar, para que los ids queden
        // igual (1..n en el mismo orden) sin importar cuántas veces se corra
        // este seeder. `ALTER TABLE` hace commit implícito en MySQL, así que va
        // fuera de la transacción de las inserciones.
        $this->reiniciarAutoIncrement();

        DB::transaction(function () use ($departamentos, $provincias, $distritos) {
            foreach (array_chunk($departamentos, 500) as $lote) {
                DB::table('departamentos')->insert($lote);
            }

            $depIdPorCodigo = DB::table('departamentos')->pluck('id_departamento', 'ubigeo');

            foreach ($provincias as &$p) {
                $p['fk_departamento'] = $depIdPorCodigo[$p['dep_ubigeo']];
                unset($p['dep_ubigeo']);
            }
            unset($p);

            foreach (array_chunk($provincias, 500) as $lote) {
                DB::table('provincias')->insert($lote);
            }

            $provIdPorCodigo = DB::table('provincias')->pluck('id_provincia', 'ubigeo');

            foreach ($distritos as &$d) {
                $d['fk_provincia'] = $provIdPorCodigo[$d['prov_ubigeo']];
                unset($d['prov_ubigeo']);
            }
            unset($d);

            foreach (array_chunk($distritos, 500) as $lote) {
                DB::table('distritos')->insert($lote);
            }
        });

        $this->command?->info(sprintf(
            'UbigeoSeeder: %d departamentos, %d provincias, %d distritos (todos activo=0).',
            count($departamentos),
            count($provincias),
            count($distritos),
        ));
    }

    private function abortarSiHayReferenciasQueSePerderian(): void
    {
        $pedidosConDireccion = DB::table('pedidos')->whereNotNull('fk_direccion_envio')->count();

        if ($pedidosConDireccion > 0) {
            throw new RuntimeException(
                "UbigeoSeeder abortado: {$pedidosConDireccion} pedido(s) tienen una dirección de envío asignada. ".
                'Borrar `direcciones` violaría el FK RESTRICT de `pedidos.fk_direccion_envio` (a propósito: '.
                'un pedido no debe perder su dirección de entrega). Decide primero qué hacer con esos pedidos.'
            );
        }

        $empresaConDireccion = DB::table('empresa')->whereNotNull('fk_direccion')->exists();

        if ($empresaConDireccion) {
            throw new RuntimeException(
                'UbigeoSeeder abortado: `empresa` tiene una dirección asignada (fk_direccion). '.
                'Borrar `direcciones` violaría ese FK RESTRICT. Quita o reasigna esa dirección primero.'
            );
        }
    }

    private function respaldarDistritosActuales(): void
    {
        $actuales = DB::table('distritos as d')
            ->join('provincias as p', 'p.id_provincia', '=', 'd.fk_provincia')
            ->join('departamentos as dep', 'dep.id_departamento', '=', 'p.fk_departamento')
            ->select(['dep.nombre as departamento', 'p.nombre as provincia', 'd.nombre as distrito', 'd.costo_envio'])
            ->get();

        if ($actuales->isEmpty()) {
            return;
        }

        $ruta = 'ubigeo-backups/distritos-'.now()->format('Y_m_d_His').'.json';
        Storage::disk('local')->put($ruta, $actuales->toJson(JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $this->command?->info("UbigeoSeeder: respaldo de distritos actuales en storage/app/{$ruta}");
    }

    /**
     * @param  array<int, array{ubigeo: string, departamento: string, provincia: string, distrito: string}>  $filas
     * @return array{0: array<int, array<string, mixed>>, 1: array<int, array<string, mixed>>, 2: array<int, array<string, mixed>>}
     */
    private function armarCatalogos(array $filas): array
    {
        $departamentos = [];
        $provincias = [];
        $distritos = [];

        foreach ($filas as $fila) {
            $ubigeo = $fila['ubigeo'];
            $depCodigo = substr($ubigeo, 0, 2);
            $provCodigo = substr($ubigeo, 0, 4);

            $departamentos[$depCodigo] ??= ['nombre' => $fila['departamento'], 'ubigeo' => $depCodigo];
            $provincias[$provCodigo] ??= ['nombre' => $fila['provincia'], 'ubigeo' => $provCodigo, 'dep_ubigeo' => $depCodigo];

            $distritos[] = [
                'nombre' => $fila['distrito'],
                'ubigeo' => $ubigeo,
                'prov_ubigeo' => $provCodigo,
                'costo_envio' => null,
                'activo' => false,
            ];
        }

        ksort($departamentos);
        ksort($provincias);

        return [array_values($departamentos), array_values($provincias), $distritos];
    }

    private function reiniciarAutoIncrement(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        foreach (['departamentos', 'provincias', 'distritos'] as $tabla) {
            DB::statement("ALTER TABLE `{$tabla}` AUTO_INCREMENT = 1");
        }
    }
}
