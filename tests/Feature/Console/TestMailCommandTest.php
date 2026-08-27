<?php

namespace Tests\Feature\Console;

use App\Mail\CodigoVerificacionMail;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TestMailCommandTest extends TestCase
{
    public function test_envia_un_correo_de_prueba_al_destinatario_dado(): void
    {
        Mail::fake();

        $this->artisan('mosso:test-mail', ['email' => 'destino@example.com'])
            ->assertSuccessful();

        Mail::assertSent(CodigoVerificacionMail::class, fn ($mail) => $mail->hasTo('destino@example.com'));
    }

    public function test_sin_destinatario_usa_mail_from_address(): void
    {
        Mail::fake();
        config(['mail.from.address' => 'from@example.com']);

        $this->artisan('mosso:test-mail')->assertSuccessful();

        Mail::assertSent(CodigoVerificacionMail::class, fn ($mail) => $mail->hasTo('from@example.com'));
    }

    public function test_falla_si_no_hay_destinatario_ni_from(): void
    {
        config(['mail.from.address' => null]);

        $this->artisan('mosso:test-mail')->assertFailed();
    }
}
