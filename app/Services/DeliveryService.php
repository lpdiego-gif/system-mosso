<?php

namespace App\Services;

use App\Models\ConfiguracionDelivery;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Calcula el costo de envío de un pedido. Por defecto es `distritos.costo_envio`;
 * si existe una configuración de "delivery gratis" vigente que cubre el distrito
 * y el subtotal alcanza el monto mínimo, el costo es 0.
 *
 * Nada de esto está hardcodeado: la regla se define en `configuracion_delivery`
 * (+ `configuracion_delivery_distritos`), editable por el dueño.
 */
class DeliveryService
{
    /**
     * @return array{costo_envio: float, gratis: bool, motivo: string}
     */
    public function cotizar(int $distritoId, float $subtotal): array
    {
        $distrito = DB::table('distritos')->where('id_distrito', $distritoId)->first();

        if (! $distrito) {
            return ['costo_envio' => 0.0, 'gratis' => false, 'motivo' => 'Distrito no encontrado'];
        }

        $costoBase = (float) $distrito->costo_envio;

        $config = $this->configuracionVigente();

        if ($config === null) {
            return [
                'costo_envio' => round($costoBase, 2),
                'gratis' => false,
                'motivo' => 'Tarifa regular del distrito',
            ];
        }

        if ($subtotal + 1e-6 < (float) $config->monto_minimo) {
            return [
                'costo_envio' => round($costoBase, 2),
                'gratis' => false,
                'motivo' => sprintf(
                    'Delivery gratis desde S/ %s',
                    number_format((float) $config->monto_minimo, 2)
                ),
            ];
        }

        if (! $this->distritoParticipa($config, $distritoId)) {
            return [
                'costo_envio' => round($costoBase, 2),
                'gratis' => false,
                'motivo' => 'El delivery gratis no aplica a este distrito',
            ];
        }

        return [
            'costo_envio' => 0.0,
            'gratis' => true,
            'motivo' => $config->descripcion ?: 'Delivery gratis',
        ];
    }

    /**
     * Costo de envío para retiro en tienda: siempre 0.
     */
    public function costoTienda(): float
    {
        return 0.0;
    }

    private function configuracionVigente(): ?ConfiguracionDelivery
    {
        $ahora = Carbon::now();

        return ConfiguracionDelivery::query()
            ->where('activo', true)
            ->where(fn ($q) => $q->whereNull('fecha_inicio')->orWhere('fecha_inicio', '<=', $ahora))
            ->where(fn ($q) => $q->whereNull('fecha_fin')->orWhere('fecha_fin', '>=', $ahora))
            ->orderByDesc('id_configuracion_delivery')
            ->first();
    }

    private function distritoParticipa(ConfiguracionDelivery $config, int $distritoId): bool
    {
        $distritos = $config->distritos()->pluck('fk_distrito');

        // Sin distritos listados = la promoción aplica a todos.
        if ($distritos->isEmpty()) {
            return true;
        }

        return $distritos->contains($distritoId);
    }
}
