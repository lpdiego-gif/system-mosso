<?php

namespace App\Http\Controllers;

use App\Concerns\PasswordValidationRules;
use App\Mail\CodigoVerificacionMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

/**
 * Registro de clientes desde el storefront (/cuenta). A diferencia de
 * trabajadores (creados solo por un admin) y del /register genérico de
 * Fortify (que no toca `clientes`), aquí un visitante se autorregistra en
 * dos pasos: 1) correo + contraseña, 2) código de 6 dígitos enviado a ese
 * correo. Los datos de persona (nombres, documento, teléfono) no se piden
 * aquí; se completan después.
 */
class ClienteRegistroController extends Controller
{
    use PasswordValidationRules;

    private const MINUTOS_VALIDEZ = 15;

    private const MAX_INTENTOS = 5;

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'password' => $this->passwordRules(),
        ]);

        // El formulario sugiere un nombre a partir del correo y el cliente puede
        // editarlo; si lo deja vacío, caemos a la parte local del correo. En
        // cualquier caso es provisional: se sobrescribe cuando el cliente
        // completa sus datos de persona en "Detalles de la cuenta".
        $nombre = trim((string) ($data['name'] ?? '')) ?: explode('@', $data['email'])[0];

        DB::transaction(function () use ($data, $nombre) {
            $user = User::create([
                'name' => $nombre,
                'email' => $data['email'],
                'password' => $data['password'],
            ]);

            DB::table('clientes')->insert([
                'fk_persona' => null,
                'fk_user' => $user->id,
                'correo' => $data['email'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        $this->enviarCodigo($data['email']);

        return $this->volverPendiente($data['email'], 'Te enviamos un código de verificación a tu correo.');
    }

    public function verificar(Request $request): Response
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'codigo' => ['required', 'string', 'size:6'],
        ]);

        $registro = DB::table('codigos_verificacion')->where('email', $data['email'])->first();

        // Tras 5 intentos fallidos, el código deja de ser válido: mandamos uno
        // nuevo para cortar cualquier fuerza bruta sobre los 6 dígitos.
        if ($registro && $registro->intentos >= self::MAX_INTENTOS) {
            $this->enviarCodigo($data['email']);

            Inertia::flash('registroPendiente', ['email' => $data['email']]);

            throw ValidationException::withMessages([
                'codigo' => 'Demasiados intentos. Te enviamos un código nuevo, revisa tu correo.',
            ]);
        }

        if (! $registro || ! hash_equals($registro->codigo, $data['codigo']) || Carbon::parse($registro->expira_en)->isPast()) {
            DB::table('codigos_verificacion')->where('email', $data['email'])->increment('intentos');

            Inertia::flash('registroPendiente', ['email' => $data['email']]);

            throw ValidationException::withMessages([
                'codigo' => 'El código es inválido o ya expiró. Puedes pedir uno nuevo.',
            ]);
        }

        $user = User::where('email', $data['email'])->firstOrFail();
        $user->forceFill(['email_verified_at' => now()])->save();

        DB::table('codigos_verificacion')->where('email', $data['email'])->delete();

        Auth::login($user);
        $request->session()->regenerate();

        return app(LoginResponseContract::class)->toResponse($request);
    }

    public function reenviar(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', Rule::exists('clientes', 'correo')],
        ]);

        $this->enviarCodigo($data['email']);

        return $this->volverPendiente($data['email'], 'Reenviamos el código a tu correo.');
    }

    private function enviarCodigo(string $email): void
    {
        $codigo = (string) random_int(100000, 999999);

        DB::table('codigos_verificacion')->updateOrInsert(
            ['email' => $email],
            [
                'codigo' => $codigo,
                'intentos' => 0,
                'expira_en' => now()->addMinutes(self::MINUTOS_VALIDEZ),
                'created_at' => now(),
            ],
        );

        Mail::to($email)->send(new CodigoVerificacionMail($codigo, self::MINUTOS_VALIDEZ));
    }

    private function volverPendiente(string $email, string $mensaje): RedirectResponse
    {
        Inertia::flash('registroPendiente', ['email' => $email]);
        Inertia::flash('toast', ['type' => 'success', 'message' => $mensaje]);

        return redirect()->route('cuenta');
    }
}
