<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Pedido #{{ str_pad((string) $pedido['id_pedido'], 6, '0', STR_PAD_LEFT) }}</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: DejaVu Sans, Helvetica, Arial, sans-serif;
        font-size: 10px;
        color: #27272a;
        background: #fff;
    }
    .banda {
        background: #1c1917;
        color: #fff;
        padding: 16px 22px;
    }
    .banda table { width: 100%; border-collapse: collapse; }
    .banda .empresa-nombre { font-size: 16px; font-weight: bold; letter-spacing: -0.2px; }
    .banda .empresa-datos { margin-top: 3px; font-size: 8.5px; color: #d6d3d1; line-height: 1.5; }
    .banda .doc-titulo { font-size: 13px; font-weight: bold; color: #f5c842; text-align: right; }
    .banda .doc-numero { margin-top: 3px; font-size: 15px; font-weight: bold; text-align: right; }
    .banda .doc-fecha { margin-top: 3px; font-size: 8.5px; color: #d6d3d1; text-align: right; }

    .contenido { padding: 18px 22px; }

    .estado {
        display: inline-block;
        margin-top: 10px;
        padding: 3px 10px;
        border-radius: 3px;
        font-size: 8.5px;
        font-weight: bold;
        color: #fff;
        background: #57534e;
    }

    .cajas { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .cajas td { width: 50%; vertical-align: top; padding: 0; }
    .cajas td:first-child { padding-right: 8px; }
    .cajas td:last-child { padding-left: 8px; }
    .caja {
        border: 1px solid #e7e5e4;
        border-radius: 5px;
        padding: 10px 12px;
        height: 100%;
    }
    .caja h3 {
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: #a8a29e;
        margin-bottom: 6px;
        border-bottom: 1px solid #f4f4f5;
        padding-bottom: 4px;
    }
    .caja p { font-size: 9.5px; line-height: 1.55; color: #3f3f46; }
    .caja p strong { color: #18181b; }

    .items { width: 100%; border-collapse: collapse; margin-top: 18px; }
    .items thead th {
        background: #f5f5f4;
        color: #57534e;
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        text-align: left;
        padding: 7px 8px;
        border-bottom: 2px solid #e7e5e4;
    }
    .items thead th.num { text-align: right; }
    .items tbody td {
        padding: 7px 8px;
        font-size: 9.5px;
        border-bottom: 1px solid #f4f4f5;
        vertical-align: top;
    }
    .items tbody td.num { text-align: right; white-space: nowrap; }
    .items tbody tr:last-child td { border-bottom: none; }
    .items .producto-nombre { font-weight: bold; color: #18181b; }
    .items .producto-desc { color: #a8a29e; font-size: 8.5px; }

    .totales { width: 100%; margin-top: 4px; }
    .totales-tabla { width: 230px; float: right; border-collapse: collapse; }
    .totales-tabla td { padding: 4px 0; font-size: 9.5px; }
    .totales-tabla td.label { color: #71717a; }
    .totales-tabla td.valor { text-align: right; font-weight: bold; color: #27272a; }
    .totales-tabla tr.total td { border-top: 2px solid #1c1917; padding-top: 8px; }
    .totales-tabla tr.total td.label { font-size: 11px; color: #18181b; font-weight: bold; }
    .totales-tabla tr.total td.valor { font-size: 13px; color: #18181b; }

    .clear { clear: both; }

    .footer {
        margin-top: 40px;
        border-top: 1px solid #e7e5e4;
        padding-top: 10px;
        text-align: center;
        font-size: 8px;
        color: #a8a29e;
    }
</style>
</head>
<body>

<div class="banda">
    <table>
        <tr>
            <td style="width: 60%;">
                <div class="empresa-nombre">{{ $empresa?->nombre_comercial ?? $empresa?->razon_social ?? 'Mosso' }}</div>
                <div class="empresa-datos">
                    @if(!empty($empresa?->ruc)) RUC {{ $empresa->ruc }}<br>@endif
                    @if(!empty($empresa?->direccion)) {{ $empresa->direccion }}{{ !empty($empresa->distrito) ? ', '.$empresa->distrito : '' }}<br>@endif
                    @if(!empty($empresa?->telefono) || !empty($empresa?->correo))
                        {{ collect([$empresa->telefono ?? null, $empresa->correo ?? null])->filter()->join(' &bull; ') }}
                    @endif
                </div>
            </td>
            <td style="width: 40%;">
                <div class="doc-titulo">
                    @if(!empty($pedido['comprobante']['tipo']))
                        {{ strtoupper($pedido['comprobante']['tipo']) }}
                    @else
                        PEDIDO
                    @endif
                </div>
                <div class="doc-numero">
                    @if(!empty($pedido['comprobante']['serie']))
                        {{ $pedido['comprobante']['serie'] }}-{{ $pedido['comprobante']['numero'] }}
                    @else
                        #{{ str_pad((string) $pedido['id_pedido'], 6, '0', STR_PAD_LEFT) }}
                    @endif
                </div>
                <div class="doc-fecha">
                    {{ $pedido['fecha_pedido'] ? \Illuminate\Support\Carbon::parse($pedido['fecha_pedido'])->format('d/m/Y H:i') : '—' }}
                </div>
            </td>
        </tr>
    </table>
</div>

<div class="contenido">
    <span class="estado">{{ $pedido['estado'] ?? 'Sin estado' }}</span>

    <table class="cajas">
        <tr>
            <td>
                <div class="caja">
                    <h3>Cliente</h3>
                    <p><strong>{{ $pedido['cliente']['nombre'] }}</strong></p>
                    @if(!empty($pedido['cliente']['documento']))<p>Doc: {{ $pedido['cliente']['documento'] }}</p>@endif
                    @if(!empty($pedido['cliente']['correo']))<p>{{ $pedido['cliente']['correo'] }}</p>@endif
                    @if(!empty($pedido['cliente']['telefono']))<p>{{ $pedido['cliente']['telefono'] }}</p>@endif
                </div>
            </td>
            <td>
                <div class="caja">
                    <h3>Entrega y pago</h3>
                    <p><strong>{{ $pedido['tipo_entrega'] ?? '—' }}</strong></p>
                    @if(!empty($pedido['direccion_envio']))
                        <p>
                            {{ $pedido['direccion_envio']['direccion'] }}
                            @if(!empty($pedido['direccion_envio']['distrito'])), {{ $pedido['direccion_envio']['distrito'] }}@endif
                        </p>
                        @if(!empty($pedido['direccion_envio']['referencia']))<p>Ref: {{ $pedido['direccion_envio']['referencia'] }}</p>@endif
                    @endif
                    <p>Pago: {{ $pedido['forma_pago'] ?? '—' }}
                        @if(!empty($pedido['pago']['estado'])) &bull; {{ ucfirst($pedido['pago']['estado']) }}@endif
                    </p>
                </div>
            </td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th style="width: 46%;">Producto</th>
                <th class="num" style="width: 10%;">Cant.</th>
                <th class="num" style="width: 18%;">P. unit.</th>
                <th class="num" style="width: 12%;">Dscto.</th>
                <th class="num" style="width: 14%;">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($detalles as $d)
            <tr>
                <td>
                    <div class="producto-nombre">{{ $d['producto'] ?? 'Producto eliminado' }}</div>
                </td>
                <td class="num">{{ $d['cantidad'] }}</td>
                <td class="num">S/ {{ number_format($d['precio_unitario'], 2) }}</td>
                <td class="num">{{ $d['descuento_unitario'] > 0 ? '−S/ '.number_format($d['descuento_unitario'], 2) : '—' }}</td>
                <td class="num">S/ {{ number_format($d['subtotal'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totales">
        <tr>
            <td>
                <table class="totales-tabla">
                    <tr>
                        <td class="label">Subtotal</td>
                        <td class="valor">S/ {{ number_format($pedido['subtotal'], 2) }}</td>
                    </tr>
                    @if($pedido['descuento_total'] > 0)
                    <tr>
                        <td class="label">Descuento</td>
                        <td class="valor">−S/ {{ number_format($pedido['descuento_total'], 2) }}</td>
                    </tr>
                    @endif
                    <tr>
                        <td class="label">IGV</td>
                        <td class="valor">S/ {{ number_format($pedido['igv'], 2) }}</td>
                    </tr>
                    <tr class="total">
                        <td class="label">Total</td>
                        <td class="valor">S/ {{ number_format($pedido['total'], 2) }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    <div class="clear"></div>

    <div class="footer">
        Documento generado el {{ $generadoEl }} &bull; Panel administrativo Mosso &bull; Uso interno
    </div>
</div>

</body>
</html>
