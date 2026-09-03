<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use RuntimeException;

/**
 * Genera un certificado autofirmado de DESARROLLO para firmar el XML UBL 2.1
 * del comprobante (ver ComprobanteService). NUNCA se envía a SUNAT ni sirve
 * para producción — es solo para que el nodo <ds:Signature> del XML exista
 * y sea criptográficamente válido contra sí mismo mientras no haya un
 * certificado real de SUNAT/PSE.
 */
class GenerarCertificadoComprobanteDev extends Command
{
    protected $signature = 'comprobante:cert-dev {--force : Sobrescribir el certificado si ya existe}';

    protected $description = 'Genera (o regenera) el certificado autofirmado de desarrollo para firmar comprobantes';

    public function handle(): int
    {
        $ruta = (string) config('services.sunat.cert_path');

        if ($ruta === '') {
            $this->error('Falta SUNAT_CERT_PATH / services.sunat.cert_path en la config.');

            return self::FAILURE;
        }

        if (file_exists($ruta) && ! $this->option('force')) {
            $this->warn("Ya existe un certificado en {$ruta}. Usa --force para regenerarlo.");

            return self::SUCCESS;
        }

        $directorio = dirname($ruta);
        if (! is_dir($directorio)) {
            mkdir($directorio, 0755, true);
        }

        $config = $this->opcionesOpenssl();

        $privateKey = openssl_pkey_new([
            ...$config,
            'private_key_bits' => 2048,
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
        ]);

        if ($privateKey === false) {
            throw new RuntimeException('No se pudo generar la llave privada: '.openssl_error_string());
        }

        $dn = [
            'countryName' => 'PE',
            'organizationName' => 'MOSSO (certificado de DESARROLLO, no válido para SUNAT)',
            'commonName' => 'MOSSO Comprobantes - DEV',
        ];

        $csr = openssl_csr_new($dn, $privateKey, [...$config, 'digest_alg' => 'sha256']);

        if ($csr === false) {
            throw new RuntimeException('No se pudo generar el CSR: '.openssl_error_string());
        }

        // Autofirmado, 10 años (es de desarrollo, no rota por vencimiento real).
        $cert = openssl_csr_sign($csr, null, $privateKey, 3650, [...$config, 'digest_alg' => 'sha256']);

        if ($cert === false) {
            throw new RuntimeException('No se pudo autofirmar el certificado: '.openssl_error_string());
        }

        if (! openssl_x509_export($cert, $certPem)) {
            throw new RuntimeException('No se pudo exportar el certificado: '.openssl_error_string());
        }

        // El 4° parámetro (config) también hace falta acá en Windows/XAMPP —
        // sin él, openssl_pkey_export() falla en silencio (devuelve false) y
        // el .pem terminaba con el certificado pero SIN la llave privada.
        if (! openssl_pkey_export($privateKey, $keyPem, null, $config)) {
            throw new RuntimeException('No se pudo exportar la llave privada: '.openssl_error_string());
        }

        file_put_contents($ruta, $certPem.$keyPem);
        chmod($ruta, 0600);

        $this->info("Certificado de desarrollo generado en {$ruta}.");
        $this->warn('Es autofirmado y NO sirve para enviar comprobantes reales a SUNAT.');

        return self::SUCCESS;
    }

    /**
     * En XAMPP/Windows, `openssl_pkey_new()` falla si no encuentra un
     * `openssl.cnf` válido (el default de PHP suele apuntar a una ruta que
     * no existe en Windows). Se busca uno real conocido del propio XAMPP;
     * en Linux (el contenedor Docker) no hace falta nada de esto.
     */
    private function opcionesOpenssl(): array
    {
        if ($confEnv = env('OPENSSL_CONF')) {
            return ['config' => $confEnv];
        }

        foreach ([
            'C:\\xampp\\php\\extras\\ssl\\openssl.cnf',
            'C:\\xampp\\apache\\conf\\openssl.cnf',
        ] as $candidato) {
            if (file_exists($candidato)) {
                return ['config' => $candidato];
            }
        }

        return [];
    }
}
