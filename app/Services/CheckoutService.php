<?php

namespace App\Services;

use App\Models\Carrito;
use App\Models\CarritoDetalle;
use App\Models\Cliente;
use App\Models\Producto;
use App\Models\Comprobante;
use App\Models\Pago;
use App\Models\Pedido;
use App\Models\PedidoDetalle;
use App\Models\PedidoRecojoTercero;
use App\Models\Producto;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Orquesta el checkout: recalcula el carrito contra la BD, arma el pedido y su
 * intento de pago, y —tras confirmar el cobro con Culqi— descuenta stock y
 * genera el comprobante. Todo lo sensible (precios, stock, envío, totales) se
 * recalcula aquí; nunca se confía en lo que envía el frontend.
 */
class CheckoutService
{
    /** IGV Perú. Los precios de `productos.precio` ya lo incluyen. */
    public const IGV_RATE = 0.18;

    public function __construct(
        private DeliveryService $delivery,
    ) {}

    // ---------------------------------------------------------------- Resumen

    /**
     * Relee el carrito del cliente y recalcula cada línea con el precio y el
     * descuento vigentes en BD.
     *
     * @return array{items: array<int, array<string, mixed>>, subtotal: float, descuento_total: float, problemas: array<int, string>}
     */
    public function resumenCarrito(Cliente $cliente): array
    {
        $carrito = Carrito::where('fk_cliente', $cliente->id_cliente)->first();

        $detalles = $carrito
            ? CarritoDetalle::where('fk_carrito', $carrito->id_carrito)
                ->with(['producto.marca', 'producto.descuentoActivo'])
                ->get()
            : collect();

        $items = [];
        $problemas = [];
        $subtotal = 0.0;
        $descuentoTotal = 0.0;

        foreach ($detalles as $d) {
            $producto = $d->producto;

            if (! $producto) {
                $problemas[] = 'Un producto de tu carrito ya no está disponible.';

                continue;
            }

            $activo = (int) $producto->fk_estado === 1;
            $precioLista = (float) $producto->precio;
            $descUnit = $producto->descuentoUnitario();
            $precioFinal = round($precioLista - $descUnit, 2);
            $cantidad = (int) $d->cantidad;
            $lineaSubtotal = round($precioFinal * $cantidad, 2);

            if (! $activo) {
                $problemas[] = "«{$producto->nombre}» ya no está disponible.";
            } elseif ((int) $producto->stock < $cantidad) {
                $problemas[] = "No hay stock suficiente de «{$producto->nombre}» (disponible: {$producto->stock}).";
            }

            $subtotal += round($precioLista * $cantidad, 2);
            $descuentoTotal += round($descUnit * $cantidad, 2);

            $items[] = [
                'id_producto' => $producto->id_producto,
                'nombre' => $producto->nombre,
                'marca' => $producto->marca?->nombre,
                'imagen' => Producto::urlImagen($producto->imagen_principal),
                'cantidad' => $cantidad,
                'precio_unitario' => $precioLista,
                'descuento_unitario' => $descUnit,
                'precio_final' => $precioFinal,
                'subtotal' => $lineaSubtotal,
                'stock' => (int) $producto->stock,
                'activo' => $activo,
            ];
        }

        return [
            'items' => $items,
            'subtotal' => round($subtotal, 2),
            'descuento_total' => round($descuentoTotal, 2),
            'problemas' => $problemas,
        ];
    }

    /**
     * IGV contenido y total final.
     *
     * @return array{base: float, igv: float, total: float}
     */
    public function totales(float $subtotal, float $descuentoTotal, float $costoEnvio): array
    {
        $base = round($subtotal - $descuentoTotal, 2);
        $igv = round($base - ($base / (1 + self::IGV_RATE)), 2);
        $total = round($base + $costoEnvio, 2);

        return ['base' => $base, 'igv' => $igv, 'total' => $total];
    }

    // ------------------------------------------------------------ Crear pedido

    /**
     * ¿El cliente ya tiene sus datos personales completos?
     */
    public function datosCompletos(Cliente $cliente): bool
    {
        if (! $cliente->fk_persona) {
            return false;
        }

        $p = DB::table('personas')->where('id_persona', $cliente->fk_persona)->first();

        if (! $p) {
            return false;
        }

        foreach (['fk_tipo_documento', 'num_documento', 'nombres', 'apellido_paterno', 'telefono'] as $campo) {
            if (blank($p->{$campo})) {
                return false;
            }
        }

        return true;
    }

    /**
     * Crea el pedido en estado "Pendiente de pago" + su intento de pago.
     * Lanza ValidationException si algo del carrito o de los datos no valida.
     *
     * @param  array<string, mixed>  $datos  Ya validados por IniciarCheckoutRequest.
     */
    public function crearPedidoPendiente(Cliente $cliente, array $datos): Pedido
    {
        return DB::transaction(function () use ($cliente, $datos) {
            $resumen = $this->resumenCarrito($cliente);

            if (empty($resumen['items'])) {
                throw ValidationException::withMessages(['carrito' => 'Tu carrito está vacío.']);
            }

            if (! empty($resumen['problemas'])) {
                throw ValidationException::withMessages(['carrito' => $resumen['problemas'][0]]);
            }

            // Limpia intentos previos abandonados de este cliente (pedido en
            // "Pendiente de pago" cuyo pago nunca se completó). Evita acumular
            // pedidos huérfanos cada vez que se reintenta el checkout.
            $this->descartarPedidosPendientes($cliente);

            $esFactura = ($datos['comprobante'] ?? 'boleta') === 'factura';

            // 1) Datos del comprador (sólo si aún no los tiene).
            if (! $this->datosCompletos($cliente)) {
                $this->guardarDatosComprador($cliente, $datos);
                $cliente->refresh();
            }

            // 2) Facturación.
            if ($esFactura) {
                $this->guardarFacturacion($cliente, $datos['razon_social'] ?? null, $datos['ruc'] ?? null);
            }

            // 3) Entrega.
            $tipoEntrega = DB::table('tipo_entregas')->where('id_tipo_entrega', $datos['fk_tipo_entrega'])->first();

            if (! $tipoEntrega) {
                throw ValidationException::withMessages(['fk_tipo_entrega' => 'Selecciona un método de entrega válido.']);
            }

            $fkDireccionEnvio = null;
            $costoEnvio = $this->delivery->costoTienda();

            if ($tipoEntrega->requiere_direccion) {
                [$fkDireccionEnvio, $distritoId] = $this->resolverDireccionEnvio($cliente, $datos);
                $costoEnvio = $this->delivery->cotizar($distritoId, $resumen['subtotal'] - $resumen['descuento_total'])['costo_envio'];
            }

            // 4) Totales (recalculados en servidor).
            $totales = $this->totales($resumen['subtotal'], $resumen['descuento_total'], $costoEnvio);

            // 5) Pedido + detalle.
            $pedido = Pedido::create([
                'fk_cliente' => $cliente->id_cliente,
                'fk_direccion_envio' => $fkDireccionEnvio,
                'fk_tipo_entrega' => (int) $datos['fk_tipo_entrega'],
                'fk_forma_pago' => $this->formaPagoId(),
                'fk_estado_pedido' => $this->estadoPedidoId('Pendiente de pago'),
                'subtotal' => $resumen['subtotal'],
                'descuento_total' => $resumen['descuento_total'],
                'igv' => $totales['igv'],
                'total' => $totales['total'],
                'fecha_pedido' => Carbon::now(),
            ]);

            foreach ($resumen['items'] as $item) {
                PedidoDetalle::create([
                    'fk_pedido' => $pedido->id_pedido,
                    'fk_producto' => $item['id_producto'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'descuento_unitario' => $item['descuento_unitario'],
                    'subtotal' => $item['subtotal'],
                ]);
            }

            // 6) Quién recibe.
            if (($datos['receptor'] ?? 'yo') === 'otra') {
                PedidoRecojoTercero::create([
                    'fk_pedido' => $pedido->id_pedido,
                    'fk_tipo_documento' => (int) $datos['receptor_fk_tipo_documento'],
                    'num_documento' => $datos['receptor_num_documento'],
                    'nombres' => $datos['receptor_nombres'],
                    'apellidos' => $datos['receptor_apellidos'],
                    'telefono' => $datos['receptor_telefono'] ?? null,
                ]);
            }

            // 7) Intento de pago.
            Pago::create([
                'fk_pedido' => $pedido->id_pedido,
                'fk_forma_pago' => $this->formaPagoId(),
                'monto' => $totales['total'],
                'moneda' => 'PEN',
                'estado' => 'pendiente',
                'referencia' => (string) Str::uuid(),
            ]);

            return $pedido->fresh();
        });
    }

    // ---------------------------------------------------------- Confirmar pago

    /**
     * Marca el pago como pagado, descuenta stock y genera el comprobante.
     * Idempotente: si el pago ya está "pagado", no hace nada.
     */
    public function confirmarPago(Pedido $pedido, string $idTransaccionCulqi, ?string $tipoComprobante = null): void
    {
        DB::transaction(function () use ($pedido, $idTransaccionCulqi, $tipoComprobante) {
            $pedido = Pedido::whereKey($pedido->id_pedido)->lockForUpdate()->firstOrFail();
            $pago = Pago::where('fk_pedido', $pedido->id_pedido)->lockForUpdate()->firstOrFail();

            if ($pago->estado === 'pagado') {
                return;
            }

            // Re-validación de stock con bloqueo, justo antes de descontar.
            $detalles = PedidoDetalle::where('fk_pedido', $pedido->id_pedido)->get();

            foreach ($detalles as $detalle) {
                $producto = Producto::whereKey($detalle->fk_producto)->lockForUpdate()->first();

                if (! $producto || (int) $producto->fk_estado !== 1) {
                    throw ValidationException::withMessages([
                        'carrito' => 'Un producto del pedido dejó de estar disponible. No se realizó ningún cobro.',
                    ]);
                }

                if ((int) $producto->stock < (int) $detalle->cantidad) {
                    throw ValidationException::withMessages([
                        'carrito' => "Se agotó el stock de «{$producto->nombre}» mientras pagabas. No se realizó ningún cobro.",
                    ]);
                }
            }

            foreach ($detalles as $detalle) {
                Producto::whereKey($detalle->fk_producto)->decrement('stock', (int) $detalle->cantidad);
            }

            $pago->update([
                'estado' => 'pagado',
                'id_transaccion_culqi' => $idTransaccionCulqi,
                'fecha_pago' => Carbon::now(),
            ]);

            $pedido->update(['fk_estado_pedido' => $this->estadoPedidoId('Pagado')]);

            $this->generarComprobante($pedido, $tipoComprobante);

            // Vaciar el carrito del cliente.
            $carrito = Carrito::where('fk_cliente', $pedido->fk_cliente)->first();
            if ($carrito) {
                CarritoDetalle::where('fk_carrito', $carrito->id_carrito)->delete();
            }
        });
    }

    /**
     * Reclama el pago para cobrarlo: transición atómica `pendiente|fallido` →
     * `autorizado` bajo bloqueo, para que dos requests simultáneos no generen
     * dos cargos en Culqi.
     *
     * @return 'listo'|'ya_pagado'|'en_proceso'
     */
    public function reclamarParaCobro(Pedido $pedido): string
    {
        return DB::transaction(function () use ($pedido) {
            $pago = Pago::where('fk_pedido', $pedido->id_pedido)->lockForUpdate()->firstOrFail();

            if ($pago->estado === 'pagado') {
                return 'ya_pagado';
            }

            if ($pago->estado === 'autorizado') {
                return 'en_proceso';
            }

            $pago->update(['estado' => 'autorizado']);

            return 'listo';
        });
    }

    /**
     * Borra los pedidos "Pendiente de pago" del cliente cuyo pago sigue sin
     * completarse (pendiente/fallido/autorizado). Un pedido ya pagado nunca se
     * toca. El borrado en cascada de la BD elimina detalle, pago y recojo.
     */
    private function descartarPedidosPendientes(Cliente $cliente): void
    {
        $estadoPendiente = $this->estadoPedidoId('Pendiente de pago');

        Pedido::where('fk_cliente', $cliente->id_cliente)
            ->where('fk_estado_pedido', $estadoPendiente)
            ->whereDoesntHave('pago', fn ($q) => $q->where('estado', 'pagado'))
            ->get()
            ->each(fn (Pedido $p) => $p->delete());
    }

    /**
     * Revisa (sin bloquear) si algún producto del pedido ya no tiene stock o
     * dejó de estar activo. Devuelve el mensaje del primer problema, o null si
     * todo está en orden. Se usa antes de cobrar en Culqi.
     */
    public function stockInsuficiente(Pedido $pedido): ?string
    {
        $detalles = PedidoDetalle::where('fk_pedido', $pedido->id_pedido)->get();

        foreach ($detalles as $detalle) {
            $producto = Producto::find($detalle->fk_producto);

            if (! $producto || (int) $producto->fk_estado !== 1) {
                return 'Un producto del pedido dejó de estar disponible. No se realizó ningún cobro.';
            }

            if ((int) $producto->stock < (int) $detalle->cantidad) {
                return "Se agotó el stock de «{$producto->nombre}». No se realizó ningún cobro.";
            }
        }

        return null;
    }

    public function marcarPagoFallido(Pedido $pedido): void
    {
        Pago::where('fk_pedido', $pedido->id_pedido)
            ->where('estado', '!=', 'pagado')
            ->update(['estado' => 'fallido']);
    }

    // --------------------------------------------------------------- Internos

    /**
     * @param  array<string, mixed>  $datos
     */
    private function guardarDatosComprador(Cliente $cliente, array $datos): void
    {
        $campos = [
            'fk_tipo_documento' => (int) $datos['fk_tipo_documento'],
            'num_documento' => $datos['num_documento'],
            'nombres' => $datos['nombres'],
            'apellido_paterno' => $datos['apellido_paterno'],
            'apellido_materno' => $datos['apellido_materno'] ?? null,
            'telefono' => $datos['telefono'],
            'updated_at' => now(),
        ];

        // Reutiliza la persona si el documento ya existe (mismo criterio que
        // MiCuentaDetallesController): así un cliente que también es trabajador
        // no duplica su fila en `personas`.
        $existente = DB::table('personas')
            ->where('num_documento', $campos['num_documento'])
            ->where('fk_tipo_documento', $campos['fk_tipo_documento'])
            ->lockForUpdate()
            ->first();

        if ($existente) {
            $yaEsOtroCliente = DB::table('clientes')
                ->where('fk_persona', $existente->id_persona)
                ->where('id_cliente', '!=', $cliente->id_cliente)
                ->exists();

            if ($yaEsOtroCliente) {
                throw ValidationException::withMessages([
                    'num_documento' => 'Ese número de documento ya está registrado en otra cuenta.',
                ]);
            }

            $idPersona = $existente->id_persona;
            DB::table('personas')->where('id_persona', $idPersona)->update($campos);
        } elseif ($cliente->fk_persona) {
            $idPersona = $cliente->fk_persona;
            DB::table('personas')->where('id_persona', $idPersona)->update($campos);
        } else {
            $idPersona = DB::table('personas')->insertGetId([...$campos, 'created_at' => now()]);
        }

        DB::table('clientes')->where('id_cliente', $cliente->id_cliente)->update([
            'fk_persona' => $idPersona,
            'updated_at' => now(),
        ]);

        // Refresca users.name (traía el nombre provisional del registro rápido).
        // NO se toca users.email: se mantiene separado de clientes.correo.
        DB::table('users')->where('id', $cliente->fk_user)->update([
            'name' => trim($datos['nombres'].' '.$datos['apellido_paterno']),
            'updated_at' => now(),
        ]);
    }

    private function guardarFacturacion(Cliente $cliente, ?string $razonSocial, ?string $ruc): void
    {
        DB::table('clientes')->where('id_cliente', $cliente->id_cliente)->update([
            'razon_social' => $razonSocial,
            'ruc' => $ruc,
            'updated_at' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $datos
     * @return array{0: int, 1: int} [fk_direccion, id_distrito]
     */
    private function resolverDireccionEnvio(Cliente $cliente, array $datos): array
    {
        if (($datos['direccion_modo'] ?? 'nueva') === 'guardada') {
            $cd = DB::table('cliente_direcciones as cd')
                ->join('direcciones as d', 'd.id_direccion', '=', 'cd.fk_direccion')
                ->where('cd.fk_cliente', $cliente->id_cliente)
                ->where('cd.fk_direccion', (int) $datos['id_direccion'])
                ->select('d.id_direccion', 'd.fk_distrito')
                ->first();

            if (! $cd) {
                throw ValidationException::withMessages(['id_direccion' => 'La dirección seleccionada no es válida.']);
            }

            return [(int) $cd->id_direccion, (int) $cd->fk_distrito];
        }

        $distritoId = (int) $datos['fk_distrito'];

        $idDireccion = DB::table('direcciones')->insertGetId([
            'direccion' => $datos['direccion'],
            'referencia' => $datos['referencia'] ?? null,
            'fk_distrito' => $distritoId,
        ]);

        $sinDirecciones = ! DB::table('cliente_direcciones')->where('fk_cliente', $cliente->id_cliente)->exists();

        DB::table('cliente_direcciones')->insert([
            'fk_cliente' => $cliente->id_cliente,
            'fk_direccion' => $idDireccion,
            'alias' => $datos['alias'] ?? 'Envío',
            'es_principal' => $sinDirecciones ? 1 : 0,
        ]);

        return [$idDireccion, $distritoId];
    }

    private function generarComprobante(Pedido $pedido, ?string $tipoComprobante): void
    {
        $empresa = DB::table('empresa')->first();

        if (! $empresa) {
            Log::warning('Checkout: pedido pagado sin comprobante (no hay datos de empresa)', [
                'pedido' => $pedido->id_pedido,
            ]);

            return;
        }

        if (Comprobante::where('fk_pedido', $pedido->id_pedido)->exists()) {
            return;
        }

        $esFactura = $tipoComprobante === 'factura'
            || (bool) DB::table('clientes')->where('id_cliente', $pedido->fk_cliente)->value('ruc');

        $nombreTipo = $esFactura ? 'Factura' : 'Boleta';
        $serie = $esFactura ? 'F001' : 'B001';

        $fkTipo = DB::table('tipo_comprobante')->where('nombre', $nombreTipo)->value('id_tipo_comprobante');

        $ultimo = Comprobante::where('serie', $serie)->lockForUpdate()
            ->orderByRaw('CAST(numero AS UNSIGNED) DESC')
            ->value('numero');

        $numero = str_pad((string) (((int) $ultimo) + 1), 8, '0', STR_PAD_LEFT);

        Comprobante::create([
            'fk_pedido' => $pedido->id_pedido,
            'fk_tipo_comprobante' => $fkTipo,
            'fk_empresa' => $empresa->id_empresa,
            'serie' => $serie,
            'numero' => $numero,
            'fecha_emision' => Carbon::now(),
        ]);
    }

    private function estadoPedidoId(string $nombre): int
    {
        $id = DB::table('estados_pedido')->where('nombre', $nombre)->value('id_estado_pedido');

        if (! $id) {
            throw ValidationException::withMessages([
                'estado' => "Falta el estado de pedido «{$nombre}» en el catálogo.",
            ]);
        }

        return (int) $id;
    }

    private function formaPagoId(): int
    {
        $id = DB::table('forma_pagos')->where('nombre', 'Tarjeta (Culqi)')->value('id_forma_pago')
            ?? DB::table('forma_pagos')->where('nombre', 'like', '%Culqi%')->value('id_forma_pago')
            ?? DB::table('forma_pagos')->orderBy('id_forma_pago')->value('id_forma_pago');

        if (! $id) {
            throw ValidationException::withMessages(['forma_pago' => 'Falta la forma de pago en el catálogo.']);
        }

        return (int) $id;
    }
}
