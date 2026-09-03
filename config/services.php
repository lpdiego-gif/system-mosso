<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    | Culqi (pasarela de pago). La clave secreta SÓLO se usa desde el backend;
    | la pública se entrega al frontend para abrir el checkout de Culqi.
    | Mientras 'secret_key' esté vacío, el checkout deshabilita el pago en línea.
    */
    'culqi' => [
        'public_key' => env('CULQI_PUBLIC_KEY'),
        'secret_key' => env('CULQI_SECRET_KEY'),
        'api_url' => env('CULQI_API_URL', 'https://api.culqi.com/v2'),
    ],

    /*
     * Comprobante electrónico (SUNAT UBL 2.1) — SOLO preparación de datos:
     * el XML se firma con este certificado de DESARROLLO autofirmado (nunca
     * se envía a SUNAT). Generar el certificado con `php artisan
     * comprobante:cert-dev`. Ver App\Services\ComprobanteService.
     */
    'sunat' => [
        'modo' => env('SUNAT_MODO', 'demo'),
        'cert_path' => env('SUNAT_CERT_PATH', storage_path('app/certs/dev.pem')),
    ],

];
