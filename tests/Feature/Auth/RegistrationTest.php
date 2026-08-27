<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Fortify\Features;
use Tests\Concerns\CreatesDomainTables;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use CreatesDomainTables, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->skipUnlessFortifyHas(Features::registration());

        $this->createDomainTables();
    }

    public function test_registration_screen_redirects_to_cuenta()
    {
        // El registro de clientes vive en /cuenta (dos pasos + código);
        // /register solo redirige ahí.
        $response = $this->get(route('register'));

        $response->assertRedirect(route('cuenta'));
    }

    public function test_new_users_can_register()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        // register.store usa el RegisterResponse propio de Fortify (→ fortify.home),
        // no nuestro LoginResponse. Este endpoint queda deprecado: la vista
        // /register redirige a /cuenta y el registro real de clientes va por
        // ClienteRegistroController.
        $response->assertRedirect(config('fortify.home'));
    }
}
