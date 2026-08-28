import { Form, Head } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import StorefrontLayout from '@/layouts/storefront-layout';
import { store } from '@/routes/two-factor/login';

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');

    const authConfigContent = useMemo<{
        title: string;
        description: string;
        toggleText: string;
    }>(() => {
        if (showRecoveryInput) {
            return {
                title: 'Código de recuperación',
                description:
                    'Confirma el acceso a tu cuenta ingresando uno de tus códigos de recuperación de emergencia.',
                toggleText: 'usar un código de autenticación',
            };
        }

        return {
            title: 'Código de autenticación',
            description:
                'Ingresa el código de autenticación que genera tu app de autenticación.',
            toggleText: 'usar un código de recuperación',
        };
    }, [showRecoveryInput]);

    const toggleRecoveryMode = (clearErrors: () => void): void => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode('');
    };

    return (
        <StorefrontLayout>
            <Head title="Verificación en dos pasos" />

            <section className="mx-auto w-full max-w-md px-4 py-10 sm:px-6 sm:py-16">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-200/60 sm:p-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-gray-900">
                            {authConfigContent.title}
                        </h1>
                        <p className="mx-auto mt-1.5 max-w-xs text-sm text-gray-500">
                            {authConfigContent.description}
                        </p>
                    </div>

                    <div className="mt-6 space-y-6">
                        <Form
                            {...store.form()}
                            className="space-y-4"
                            resetOnError
                            resetOnSuccess={!showRecoveryInput}
                        >
                            {({ errors, processing, clearErrors }) => (
                                <>
                                    {showRecoveryInput ? (
                                        <>
                                            <Input
                                                name="recovery_code"
                                                type="text"
                                                placeholder="Ingresa el código de recuperación"
                                                autoFocus={showRecoveryInput}
                                                required
                                            />
                                            <InputError
                                                message={errors.recovery_code}
                                            />
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center space-y-3 text-center">
                                            <div className="flex w-full items-center justify-center">
                                                <InputOTP
                                                    name="code"
                                                    maxLength={OTP_MAX_LENGTH}
                                                    value={code}
                                                    onChange={(value) =>
                                                        setCode(value)
                                                    }
                                                    disabled={processing}
                                                    pattern={REGEXP_ONLY_DIGITS}
                                                    autoFocus
                                                >
                                                    <InputOTPGroup>
                                                        {Array.from(
                                                            {
                                                                length: OTP_MAX_LENGTH,
                                                            },
                                                            (_, index) => (
                                                                <InputOTPSlot
                                                                    key={index}
                                                                    index={
                                                                        index
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </InputOTPGroup>
                                                </InputOTP>
                                            </div>
                                            <InputError message={errors.code} />
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={processing}
                                    >
                                        Continuar
                                    </Button>

                                    <div className="text-center text-sm text-gray-500">
                                        <span>o puedes </span>
                                        <button
                                            type="button"
                                            className="cursor-pointer font-semibold text-gray-900 underline underline-offset-4 transition-colors hover:text-mosso-yellow"
                                            onClick={() =>
                                                toggleRecoveryMode(clearErrors)
                                            }
                                        >
                                            {authConfigContent.toggleText}
                                        </button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </div>
                </div>
            </section>
        </StorefrontLayout>
    );
}
