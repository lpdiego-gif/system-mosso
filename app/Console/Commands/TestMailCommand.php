<?php

namespace App\Console\Commands;

use App\Mail\CodigoVerificacionMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Envía un correo de prueba (el mismo `CodigoVerificacionMail` que reciben los
 * clientes al registrarse, con un código ficticio) para comprobar que la config
 * de correo funciona sin tener que registrar una cuenta.
 *
 *   php artisan mosso:test-mail                 -> a MAIL_FROM_ADDRESS
 *   php artisan mosso:test-mail tu@correo.com
 *
 * Con MAIL_MAILER=log el correo queda en storage/logs/laravel.log.
 * Con MAIL_MAILER=resend se envía de verdad (necesita RESEND_API_KEY y, salvo
 * que uses onboarding@resend.dev hacia tu propio correo, un dominio verificado).
 */
class TestMailCommand extends Command
{
    protected $signature = 'mosso:test-mail
        {email? : Destinatario (por defecto: MAIL_FROM_ADDRESS)}
        {--mailer= : Forzar un mailer concreto (log, resend, smtp...)}';

    protected $description = 'Envía un correo de prueba para verificar la configuración de correo';

    public function handle(): int
    {
        $to = $this->argument('email') ?: config('mail.from.address');
        $mailer = $this->option('mailer') ?: config('mail.default');

        if (! $to) {
            $this->error('No hay destinatario: pasa un correo o define MAIL_FROM_ADDRESS.');

            return self::FAILURE;
        }

        $this->components->twoColumnDetail('Mailer', $mailer);
        $this->components->twoColumnDetail('De', config('mail.from.address').' ('.config('mail.from.name').')');
        $this->components->twoColumnDetail('Para', $to);

        if ($mailer === 'resend' && ! config('services.resend.key')) {
            $this->warn('MAIL_MAILER=resend pero RESEND_API_KEY está vacío — el envío va a fallar.');
        }

        try {
            Mail::mailer($mailer)->to($to)->send(new CodigoVerificacionMail('123456', 15));
        } catch (Throwable $e) {
            $this->error('Falló el envío: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info($mailer === 'log'
            ? 'Correo "enviado" al log — revisa storage/logs/laravel.log.'
            : 'Correo enviado. Revisa la bandeja de '.$to.'.');

        return self::SUCCESS;
    }
}
