<?php

namespace Tests\Feature\Auth;

use App\Mail\CodigoVerificacionMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\CreatesDomainTables;
use Tests\TestCase;

/**
 * Autorregistro de clientes desde /cuenta (ClienteRegistroController): dos pasos
 * (correo + contraseña -> código de 6 dígitos). Cubre en particular el nombre
 * provisional sugerido a partir del correo.
 */
class ClienteRegistroTest extends TestCase
{
    use CreatesDomainTables, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->createDomainTables();
        $this->withoutMiddleware(ThrottleRequests::class);
        Mail::fake();
    }

    public function test_registro_crea_user_y_cliente_y_envia_codigo(): void
    {
        $response = $this->post(route('cliente.registro.store'), [
            'email' => 'nuevo@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertRedirect(route('cuenta'));

        $user = User::where('email', 'nuevo@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNull($user->email_verified_at);
        $this->assertDatabaseHas('clientes', ['fk_user' => $user->id, 'fk_persona' => null]);
        $this->assertDatabaseHas('codigos_verificacion', ['email' => 'nuevo@example.com']);
        Mail::assertSent(CodigoVerificacionMail::class);
    }

    public function test_usa_el_nombre_enviado_por_el_formulario(): void
    {
        $this->post(route('cliente.registro.store'), [
            'name' => 'Diego Pérez',
            'email' => 'diego@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $this->assertSame('Diego Pérez', User::where('email', 'diego@example.com')->value('name'));
    }

    public function test_sin_nombre_cae_a_la_parte_local_del_correo(): void
    {
        $this->post(route('cliente.registro.store'), [
            'email' => 'juan.perez@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $this->assertSame('juan.perez', User::where('email', 'juan.perez@example.com')->value('name'));
    }

    public function test_verificar_con_codigo_correcto_autentica_y_marca_verificado(): void
    {
        $this->post(route('cliente.registro.store'), [
            'email' => 'v@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $codigo = DB::table('codigos_verificacion')->where('email', 'v@example.com')->value('codigo');

        $response = $this->post(route('cliente.registro.verificar'), [
            'email' => 'v@example.com',
            'codigo' => $codigo,
        ]);

        $this->assertAuthenticated();
        $this->assertNotNull(User::where('email', 'v@example.com')->value('email_verified_at'));
        $this->assertDatabaseMissing('codigos_verificacion', ['email' => 'v@example.com']);
        $response->assertRedirect(route('mi-cuenta', absolute: false));
    }

    public function test_verificar_con_codigo_invalido_falla(): void
    {
        $this->post(route('cliente.registro.store'), [
            'email' => 'x@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $this->post(route('cliente.registro.verificar'), [
            'email' => 'x@example.com',
            'codigo' => '000000',
        ])->assertSessionHasErrors('codigo');

        $this->assertGuest();
    }

    public function test_tras_cinco_intentos_fallidos_se_regenera_el_codigo(): void
    {
        $this->post(route('cliente.registro.store'), [
            'email' => 'bruta@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $codigoOriginal = DB::table('codigos_verificacion')->where('email', 'bruta@example.com')->value('codigo');

        for ($i = 0; $i < 5; $i++) {
            $this->post(route('cliente.registro.verificar'), [
                'email' => 'bruta@example.com',
                'codigo' => '999999',
            ]);
        }

        // El sexto intento avisa y ya hay un código nuevo (aunque adivinaran el viejo).
        $this->post(route('cliente.registro.verificar'), [
            'email' => 'bruta@example.com',
            'codigo' => $codigoOriginal,
        ])->assertSessionHasErrors('codigo');

        $this->assertGuest();
        $this->assertNotSame(
            $codigoOriginal,
            DB::table('codigos_verificacion')->where('email', 'bruta@example.com')->value('codigo'),
        );
        Mail::assertSent(CodigoVerificacionMail::class, 2); // registro + regeneración
    }
}
