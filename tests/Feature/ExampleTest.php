<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesDomainTables;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use CreatesDomainTables, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->createDomainTables();
    }

    /**
     * Humo básico: la puerta de acceso pública (/cuenta) responde para un
     * invitado. El home (`/`) necesita el catálogo completo sembrado, así que
     * su cobertura vive en pruebas con sus propias fixtures.
     */
    public function test_the_account_gate_is_reachable_for_guests()
    {
        $this->get(route('cuenta'))->assertOk();
    }
}
