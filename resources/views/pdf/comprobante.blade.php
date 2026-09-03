<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>{{ $datos['comprobante']['serie'] }}-{{ $datos['comprobante']['numero'] }}</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: DejaVu Sans, Helvetica, Arial, sans-serif; font-size: 9.5px; color: #27272a; }

    .cabecera { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .cabecera td { vertical-align: top; }
    .logo { width: 60%; padding-right: 12px; }
    .logo img { max-height: 70px; max-width: 220px; }
    .emisor-nombre { font-size: 13px; font-weight: bold; margin-top: 4px; }
    .emisor-datos { margin-top: 4px; font-size: 8.5px; color: #52525b; line-height: 1.5; }

    .doc-recuadro { width: 40%; border: 1.5px solid #27272a; border-radius: 4px; padding: 10px; text-align: center; }
    .doc-recuadro .ruc { font-size: 10px; font-weight: bold; }
    .doc-recuadro .tipo { font-size: 11px; font-weight: bold; margin-top: 6px; text-transform: uppercase; }
    .doc-recuadro .numero { font-size: 13px; font-weight: bold; margin-top: 6px; }

    .receptor { width: 100%; border: 1px solid #e4e4e7; border-radius: 4px; padding: 8px 10px; margin-bottom: 10px; }
    .receptor table { width: 100%; }
    .receptor td { font-size: 9px; padding: 1.5px 0; }
    .receptor td.label { width: 110px; color: #71717a; }

    .items { width: 100%; border-collapse: collapse; margin-top: 4px; }
    .items thead th {
        background: #27272a; color: #fff; font-size: 8px; text-transform: uppercase;
        letter-spacing: 0.4px; text-align: left; padding: 5px 6px;
    }
    .items thead th.num { text-align: right; }
    .items tbody td { padding: 5px 6px; font-size: 8.8px; border-bottom: 1px solid #f4f4f5; }
    .items tbody td.num { text-align: right; white-space: nowrap; }

    .pie-tabla { width: 100%; margin-top: 10px; }
    .pie-tabla td { vertical-align: top; }
    .bancos { width: 58%; }
    .bancos h4 { font-size: 8.5px; text-transform: uppercase; color: #71717a; margin-bottom: 4px; }
    .banco-item { font-size: 8.5px; margin-bottom: 6px; line-height: 1.5; }
    .banco-item strong { color: #18181b; }

    .totales { width: 42%; float: right; border-collapse: collapse; }
    .totales td { padding: 2.5px 0; font-size: 9px; }
    .totales td.label { color: #52525b; }
    .totales td.valor { text-align: right; }
    .totales tr.total td { border-top: 1.5px solid #27272a; padding-top: 6px; font-size: 11px; font-weight: bold; }

    .letras { clear: both; margin-top: 10px; font-size: 9px; font-style: italic; }

    .footer { margin-top: 26px; border-top: 1px solid #e4e4e7; padding-top: 8px; font-size: 8px; color: #a1a1aa; }
    .footer .qr { float: right; text-align: center; }
    .footer .qr img { width: 70px; height: 70px; }
    .footer .leyenda { max-width: 70%; }
    .footer .pendiente { color: #b45309; font-weight: bold; }
</style>
</head>
<body>

@php
    $emisor = $datos['emisor'];
    $receptor = $datos['receptor'];
    $c = $datos['comprobante'];
    $t = $datos['totales'];
@endphp

<table class="cabecera">
    <tr>
        <td class="logo">
            @if($logoDataUri)
                <img src="{{ $logoDataUri }}" alt="{{ $emisor['nombre_comercial'] }}">
            @endif
            <div class="emisor-nombre">{{ $emisor['razon_social'] }}</div>
            <div class="emisor-datos">
                {{ $emisor['direccion_linea'] }}@if($emisor['distrito']), {{ $emisor['distrito'] }}, {{ $emisor['provincia'] }}, {{ $emisor['departamento'] }}@endif<br>
                @if(!empty($emisor['telefono']))Telf.: {{ $emisor['telefono'] }}<br>@endif
                @if(!empty($emisor['celular']))Cel.: {{ $emisor['celular'] }}<br>@endif
                @if(!empty($emisor['email']))e-mail: {{ $emisor['email'] }}<br>@endif
                @if(!empty($emisor['website']))website: {{ $emisor['website'] }}@endif
            </div>
        </td>
        <td class="doc-recuadro">
            <div class="ruc">R.U.C. {{ $emisor['ruc'] }}</div>
            <div class="tipo">{{ $c['tipo'] === '01' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA' }}</div>
            <div class="numero">{{ $c['serie'] }}-{{ $c['numero'] }}</div>
        </td>
    </tr>
</table>

<div class="receptor">
    <table>
        <tr>
            <td class="label">{{ $c['tipo'] === '01' ? 'RUC' : ($receptor['tipo_doc'] === '1' ? 'DNI' : 'Documento') }}:</td>
            <td>{{ $receptor['num_doc'] }}</td>
            <td class="label">Fecha emisión:</td>
            <td>{{ $c['fecha_emision']->format('d/m/Y') }}</td>
        </tr>
        <tr>
            <td class="label">{{ $c['tipo'] === '01' ? 'Razón social' : 'Cliente' }}:</td>
            <td colspan="3">{{ $receptor['nombre'] }}</td>
        </tr>
        @if(!empty($receptor['direccion']))
        <tr>
            <td class="label">Dirección:</td>
            <td colspan="3">{{ $receptor['direccion'] }}</td>
        </tr>
        @endif
        <tr>
            <td class="label">Forma de pago:</td>
            <td>{{ strtoupper($c['forma_pago']) }}</td>
            <td class="label">Moneda:</td>
            <td>SOLES</td>
        </tr>
    </table>
</div>

<table class="items">
    <thead>
        <tr>
            <th style="width:5%;">Ítem</th>
            <th style="width:12%;">Código</th>
            <th style="width:33%;">Descripción</th>
            <th class="num" style="width:8%;">Cant.</th>
            <th style="width:8%;">U.M.</th>
            <th class="num" style="width:12%;">P. Unit.</th>
            <th class="num" style="width:10%;">Dscto.</th>
            <th class="num" style="width:12%;">Total</th>
        </tr>
    </thead>
    <tbody>
        @foreach($datos['items'] as $i => $item)
        <tr>
            <td>{{ $i + 1 }}</td>
            <td>{{ $item['codigo'] }}</td>
            <td>{{ $item['descripcion'] }}</td>
            <td class="num">{{ $item['cantidad'] }}</td>
            <td>{{ $item['unidad'] }}</td>
            <td class="num">S/ {{ $item['precio_unitario'] }}</td>
            <td class="num">{{ $item['descuento_linea'] > 0 ? '−S/ '.$item['descuento_linea'] : '—' }}</td>
            <td class="num">S/ {{ $item['total_linea'] }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

<table class="pie-tabla">
    <tr>
        <td class="bancos">
            @if($cuentasBancarias->isNotEmpty())
                <h4>Cuentas bancarias</h4>
                @foreach($cuentasBancarias as $banco => $cuentas)
                    @foreach($cuentas as $cuenta)
                        <div class="banco-item">
                            <strong>{{ $banco }}</strong> — {{ $cuenta->tipo_cuenta }} {{ $cuenta->moneda }}: {{ $cuenta->numero_cuenta }}
                            @if($cuenta->cci)<br>CCI: {{ $cuenta->cci }}@endif
                        </div>
                    @endforeach
                @endforeach
            @endif
        </td>
        <td>
            <table class="totales">
                <tr><td class="label">Op. Gravada</td><td class="valor">S/ {{ $t['op_gravadas'] }}</td></tr>
                <tr><td class="label">Op. Exonerada</td><td class="valor">S/ {{ $t['op_exoneradas'] }}</td></tr>
                <tr><td class="label">Op. Inafecta</td><td class="valor">S/ {{ $t['op_inafectas'] }}</td></tr>
                @if((float) $t['descuento_global'] > 0)
                <tr><td class="label">Descuento global</td><td class="valor">−S/ {{ $t['descuento_global'] }}</td></tr>
                @endif
                <tr><td class="label">IGV 18%</td><td class="valor">S/ {{ $t['igv'] }}</td></tr>
                <tr class="total"><td class="label">Importe total</td><td class="valor">S/ {{ $t['total'] }}</td></tr>
            </table>
        </td>
    </tr>
</table>

<div class="letras">{{ $t['total_letras'] }}</div>

<div class="footer">
    @if($qrDataUri)
        <div class="qr"><img src="{{ $qrDataUri }}" alt="QR"></div>
    @endif
    <div class="leyenda">
        Representación impresa de la {{ strtolower($c['tipo_nombre']) }}.
        @if($c['estado_sunat'] !== 'aceptado')
            <br><span class="pendiente">Pendiente de envío a SUNAT.</span>
        @endif
    </div>
</div>

</body>
</html>
