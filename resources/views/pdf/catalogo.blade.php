<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: DejaVu Sans, Helvetica, Arial, sans-serif;
        font-size: 9px;
        color: #222;
        background: #fff;
    }
    .header {
        text-align: center;
        padding-bottom: 14px;
        margin-bottom: 18px;
        border-bottom: 3px solid #f5c842;
    }
    .header h1 {
        font-size: 19px;
        font-weight: bold;
        color: #111;
        letter-spacing: -0.5px;
    }
    .header p { margin-top: 4px; color: #777; font-size: 8px; }
    .grid { width: 100%; border-collapse: collapse; }
    .grid td { width: 33.33%; vertical-align: top; padding: 4px; }
    .card {
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 8px;
        height: 180px;
        overflow: hidden;
    }
    .img-wrap {
        width: 100%;
        height: 75px;
        text-align: center;
        margin-bottom: 6px;
        background: #f9fafb;
        border-radius: 4px;
        overflow: hidden;
    }
    .img-wrap img {
        max-height: 75px;
        max-width: 100%;
    }
    .badge {
        background: #ef4444;
        color: #fff;
        font-size: 7px;
        padding: 1px 5px;
        border-radius: 3px;
        display: inline-block;
        margin-bottom: 3px;
    }
    .nombre {
        font-weight: bold;
        font-size: 8.5px;
        line-height: 1.3;
        color: #111;
    }
    .marca {
        font-size: 7.5px;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 2px 0;
    }
    .precios { margin-top: 5px; }
    .precio-final { font-size: 12px; font-weight: bold; color: #111; }
    .precio-original {
        font-size: 8px;
        color: #bbb;
        text-decoration: line-through;
        margin-left: 4px;
    }
    .footer {
        margin-top: 20px;
        text-align: center;
        font-size: 7.5px;
        color: #aaa;
        border-top: 1px solid #e5e7eb;
        padding-top: 8px;
    }
    .aviso {
        background: #fffbeb;
        border: 1px solid #fde68a;
        color: #92400e;
        border-radius: 6px;
        padding: 6px 10px;
        margin-bottom: 14px;
        font-size: 8px;
        text-align: center;
    }
</style>
</head>
<body>

<div class="header">
    <h1>{{ $titulo }}</h1>
    <p>
        Generado el {{ $fecha }}
        &nbsp;&bull;&nbsp;
        {{ count($productos) }} {{ count($productos) === 1 ? 'producto' : 'productos' }}
    </p>
</div>

@if($truncado ?? false)
<div class="aviso">
    Este PDF muestra los primeros {{ count($productos) }} de {{ $totalReal }} productos que coinciden.
    Aplica un filtro (animal, categoría o búsqueda) para un catálogo más específico.
</div>
@endif

@php
    $chunks = collect($productos)->chunk(3);
@endphp

<table class="grid">
@foreach($chunks as $row)
<tr>
    @foreach($row as $p)
    <td>
        <div class="card">
            <div class="img-wrap">
                @if(!empty($p['imagenSrc']))
                    <img src="{{ $p['imagenSrc'] }}" alt="{{ $p['nombre'] }}">
                @endif
            </div>

            @if($p['porcentajeOff'])
                <span class="badge">-{{ $p['porcentajeOff'] }}%</span>
            @endif

            <div class="nombre">{{ \Illuminate\Support\Str::limit($p['nombre'], 60) }}</div>

            @if(!empty($p['marca']))
                <div class="marca">{{ $p['marca'] }}</div>
            @endif

            <div class="precios">
                <span class="precio-final">S/ {{ number_format($p['precioFinal'], 2) }}</span>
                @if($p['porcentajeOff'])
                    <span class="precio-original">S/ {{ number_format($p['precio'], 2) }}</span>
                @endif
            </div>
        </div>
    </td>
    @endforeach
    @for($pad = $row->count(); $pad < 3; $pad++)
        <td></td>
    @endfor
</tr>
@endforeach
</table>

<div class="footer">
    Precios en soles (S/) sujetos a cambio sin previo aviso &bull; Válido al {{ $fecha }}
</div>

</body>
</html>
