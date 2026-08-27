<?php

namespace Tests\Feature\Mail;

use App\Mail\CodigoVerificacionMail;
use Illuminate\Mail\Transport\ResendTransport;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * En producción los correos (p.ej. el código de verificación de clientes) se
 * envían con Resend: `MAIL_MAILER=resend` + `RESEND_API_KEY`. El transporte lo
 * trae Laravel; `resend/resend-php` (en composer.json) es el SDK que usa.
 */
class ResendMailerTest extends TestCase
{
    public function test_el_mailer_resend_esta_cableado(): void
    {
        config(['services.resend.key' => 're_test_key']);

        $transport = Mail::mailer('resend')->getSymfonyTransport();

        $this->assertInstanceOf(ResendTransport::class, $transport);
    }

    public function test_el_codigo_de_verificacion_se_puede_enviar_por_cualquier_transporte(): void
    {
        Mail::fake();

        Mail::to('cliente@example.com')->send(new CodigoVerificacionMail('123456', 15));

        Mail::assertSent(CodigoVerificacionMail::class, fn ($mail) => $mail->codigo === '123456');
    }
}
