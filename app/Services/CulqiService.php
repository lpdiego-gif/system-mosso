<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Cliente mínimo de la API de cargos de Culqi. La clave secreta se lee de
 * config('services.culqi.secret_key') y NUNCA sale del backend.
 *
 * Flujo: el frontend obtiene un token de tarjeta con la clave pública y lo
 * envía al backend; aquí se crea el cargo real contra Culqi.
 */
class CulqiService
{
    public function configurado(): bool
    {
        return ! empty(config('services.culqi.secret_key'))
            && ! empty(config('services.culqi.public_key'));
    }

    public function publicKey(): ?string
    {
        return config('services.culqi.public_key');
    }

    /**
     * Crea un cargo en Culqi.
     *
     * @param  int  $montoCentimos  Monto en céntimos (S/ 10.50 => 1050).
     * @param  array<string, string>  $metadata
     * @return array{ok: bool, id: ?string, mensaje: ?string}
     */
    public function cobrar(
        string $token,
        int $montoCentimos,
        string $email,
        string $descripcion,
        array $metadata = []
    ): array {
        if (! $this->configurado()) {
            return ['ok' => false, 'id' => null, 'mensaje' => 'La pasarela de pago no está configurada.'];
        }

        $url = rtrim((string) config('services.culqi.api_url'), '/').'/charges';

        try {
            $respuesta = Http::withToken(config('services.culqi.secret_key'))
                ->acceptJson()
                ->asJson()
                ->timeout(30)
                ->post($url, [
                    'amount' => $montoCentimos,
                    'currency_code' => 'PEN',
                    'email' => $email,
                    'source_id' => $token,
                    'description' => mb_substr($descripcion, 0, 80),
                    'metadata' => $metadata,
                ]);
        } catch (Throwable $e) {
            Log::error('Culqi: error de red al crear cargo', ['error' => $e->getMessage()]);

            return ['ok' => false, 'id' => null, 'mensaje' => 'No pudimos contactar a la pasarela de pago. Intenta nuevamente.'];
        }

        $data = $respuesta->json();

        if ($respuesta->successful() && ! empty($data['id'])) {
            return ['ok' => true, 'id' => $data['id'], 'mensaje' => null];
        }

        $mensaje = $data['user_message']
            ?? $data['merchant_message']
            ?? 'El pago fue rechazado. Verifica los datos de tu tarjeta e intenta nuevamente.';

        Log::warning('Culqi: cargo rechazado', ['status' => $respuesta->status(), 'body' => $data]);

        return ['ok' => false, 'id' => null, 'mensaje' => $mensaje];
    }

    /**
     * Crea una Order en Culqi. Necesaria para habilitar Yape (y otros métodos
     * distintos de tarjeta) en Culqi Checkout Custom: su `id` se pasa en
     * `settings.order` del checkout del frontend.
     *
     * @param  array{first_name: string, last_name: string, phone_number: string, email: string}  $cliente
     * @param  array<string, string>  $metadata
     * @return array{ok: bool, id: ?string, mensaje: ?string}
     */
    public function crearOrden(
        int $montoCentimos,
        string $descripcion,
        array $cliente,
        string $orderNumber,
        array $metadata = []
    ): array {
        if (! $this->configurado()) {
            return ['ok' => false, 'id' => null, 'mensaje' => 'La pasarela de pago no está configurada.'];
        }

        $url = rtrim((string) config('services.culqi.api_url'), '/').'/orders';

        try {
            $respuesta = Http::withToken(config('services.culqi.secret_key'))
                ->acceptJson()
                ->asJson()
                ->timeout(30)
                ->post($url, [
                    'amount' => $montoCentimos,
                    'currency_code' => 'PEN',
                    'description' => mb_substr($descripcion, 0, 80),
                    'order_number' => $orderNumber,
                    'client_details' => $cliente,
                    'expiration_date' => now()->addHours(2)->timestamp,
                    'confirm' => false,
                    'metadata' => $metadata,
                ]);
        } catch (Throwable $e) {
            Log::error('Culqi: error de red al crear orden', ['error' => $e->getMessage()]);

            return ['ok' => false, 'id' => null, 'mensaje' => 'No pudimos contactar a la pasarela de pago. Intenta nuevamente.'];
        }

        $data = $respuesta->json();

        if ($respuesta->successful() && ! empty($data['id'])) {
            return ['ok' => true, 'id' => $data['id'], 'mensaje' => null];
        }

        Log::warning('Culqi: orden rechazada', ['status' => $respuesta->status(), 'body' => $data]);

        return [
            'ok' => false,
            'id' => null,
            'mensaje' => $data['user_message'] ?? $data['merchant_message'] ?? 'No se pudo iniciar el pago con Yape.',
        ];
    }

    /**
     * Consulta el estado de una Order de Culqi. Tras un pago con Yape exitoso en
     * el checkout, `state` pasa a `paid`.
     *
     * @return array{ok: bool, state: ?string, raw: array<string, mixed>}
     */
    public function obtenerOrden(string $orderId): array
    {
        $url = rtrim((string) config('services.culqi.api_url'), '/').'/orders/'.$orderId;

        try {
            $respuesta = Http::withToken(config('services.culqi.secret_key'))
                ->acceptJson()
                ->timeout(30)
                ->get($url);
        } catch (Throwable $e) {
            Log::error('Culqi: error de red al consultar orden', ['error' => $e->getMessage(), 'orden' => $orderId]);

            return ['ok' => false, 'state' => null, 'raw' => []];
        }

        $data = $respuesta->json() ?? [];

        return [
            'ok' => $respuesta->successful(),
            'state' => $data['state'] ?? null,
            'raw' => $data,
        ];
    }
}
