import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import StorefrontLayout from '@/layouts/storefront-layout';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-base text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-mosso-yellow focus:border-mosso-yellow sm:text-sm';

const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700';

export default function ResetPassword({ token, email, passwordRules }: Props) {
    return (
        <StorefrontLayout>
            <Head title="Restablecer contraseña" />

            <section className="mx-auto flex w-full max-w-md flex-col px-4 py-10 sm:px-6 sm:py-16">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-200/60 sm:p-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-gray-900">
                            Nueva contraseña
                        </h1>
                        <p className="mx-auto mt-1.5 max-w-xs text-sm text-gray-500">
                            Elige una nueva contraseña para{' '}
                            <span className="font-semibold text-gray-900">
                                {email}
                            </span>
                            .
                        </p>
                    </div>

                    <Form
                        {...update.form()}
                        transform={(data) => ({ ...data, token, email })}
                        resetOnSuccess={['password', 'password_confirmation']}
                        disableWhileProcessing
                        className="mt-6 space-y-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div>
                                    <label className={labelClass}>
                                        Nueva contraseña
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        autoFocus
                                        autoComplete="new-password"
                                        placeholder="Mínimo 8 caracteres"
                                        className={inputClass}
                                        {...(passwordRules
                                            ? { passwordrules: passwordRules }
                                            : {})}
                                    />
                                    <InputError
                                        message={errors.password}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Confirmar contraseña
                                    </label>
                                    <input
                                        type="password"
                                        name="password_confirmation"
                                        required
                                        autoComplete="new-password"
                                        placeholder="Repite tu contraseña"
                                        className={inputClass}
                                        {...(passwordRules
                                            ? { passwordrules: passwordRules }
                                            : {})}
                                    />
                                    <InputError
                                        message={errors.password_confirmation}
                                        className="mt-1"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-lg bg-mosso-yellow px-6 py-2 text-sm font-bold text-gray-900 shadow-sm transition-colors hover:bg-mosso-yellow/85 disabled:opacity-60"
                                >
                                    {processing
                                        ? 'Guardando…'
                                        : 'Cambiar contraseña'}
                                </button>
                            </>
                        )}
                    </Form>
                </div>
            </section>
        </StorefrontLayout>
    );
}
