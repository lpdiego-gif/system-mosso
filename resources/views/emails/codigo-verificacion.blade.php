<!doctype html>
<html>
<body style="font-family: Arial, sans-serif; background:#f9fafb; padding:32px; margin:0;">
    <table role="presentation" width="100%" style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px;">
        <tr>
            <td style="text-align:center; padding-bottom:16px;">
                <span style="font-size:22px; font-weight:800; color:#111827;">MOSSO</span>
            </td>
        </tr>
        <tr>
            <td style="color:#111827; font-size:16px; padding-bottom:16px;">
                Usa este código para terminar de crear tu cuenta en MOSSO:
            </td>
        </tr>
        <tr>
            <td style="text-align:center; padding:16px 0;">
                <span style="display:inline-block; font-size:32px; font-weight:800; letter-spacing:8px; color:#f97316; background:#fff7ed; padding:12px 24px; border-radius:8px;">
                    {{ $codigo }}
                </span>
            </td>
        </tr>
        <tr>
            <td style="color:#6b7280; font-size:13px; padding-top:16px;">
                Este código vence en {{ $minutosValidez }} minutos. Si no solicitaste esta cuenta, puedes ignorar este correo.
            </td>
        </tr>
    </table>
</body>
</html>
