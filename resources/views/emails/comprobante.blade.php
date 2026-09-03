<!doctype html>
<html>
<body style="font-family: Arial, sans-serif; background:#f9fafb; padding:32px; margin:0;">
    <table role="presentation" width="100%" style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px;">
        <tr>
            <td style="text-align:center; padding-bottom:16px;">
                <span style="font-size:22px; font-weight:800; color:#111827;">{{ $datos['emisor']['nombre_comercial'] }}</span>
            </td>
        </tr>
        <tr>
            <td style="color:#111827; font-size:16px; padding-bottom:8px;">
                ¡Gracias por tu compra! Adjuntamos tu comprobante electrónico.
            </td>
        </tr>
        <tr>
            <td style="padding:16px 0;">
                <table role="presentation" width="100%" style="background:#f9fafb; border-radius:8px; padding:16px; font-size:14px; color:#374151;">
                    <tr>
                        <td style="padding:4px 0;">{{ $datos['comprobante']['tipo_nombre'] }}</td>
                        <td style="padding:4px 0; text-align:right; font-weight:700;">{{ $datos['comprobante']['serie'] }}-{{ $datos['comprobante']['numero'] }}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 0;">Fecha</td>
                        <td style="padding:4px 0; text-align:right;">{{ $datos['comprobante']['fecha_emision']->format('d/m/Y') }}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 0; font-weight:700;">Total</td>
                        <td style="padding:4px 0; text-align:right; font-weight:700;">S/ {{ $datos['totales']['total'] }}</td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="color:#6b7280; font-size:13px; padding-top:8px;">
                El PDF adjunto es la representación impresa de tu {{ strtolower($datos['comprobante']['tipo_nombre']) }} electrónica.
            </td>
        </tr>
    </table>
</body>
</html>
