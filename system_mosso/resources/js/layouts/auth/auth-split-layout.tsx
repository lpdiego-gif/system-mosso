import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';
import { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

const DecorativeIcons = ({ isLoaded }: { isLoaded: boolean }) => {
    if (!isLoaded) {
        return (
            <>
                <Skeleton className="absolute top-27 left-25 size-10 rounded-full bg-amber-200/50" />
                <Skeleton className="absolute bottom-16 right-12 size-10 rounded-full bg-amber-200/50" />
                <Skeleton className="absolute top-1/3 right-8 size-8 rounded-full bg-amber-200/40" />
            </>
        );
    }

    return (
        <>
            <div className="absolute top-27 left-25 text-amber-500/30 text-4xl rotate-[-15deg] select-none pointer-events-none animate-pulse">
                🐾
            </div>
            <div className="absolute bottom-16 right-12 text-amber-500/30 text-4xl rotate-[20deg] select-none pointer-events-none animate-pulse">
                🦴
            </div>
            <div className="absolute top-1/3 right-8 text-amber-500/20 text-3xl rotate-[10deg] select-none pointer-events-none">
                🐾
            </div>
        </>
    );
};

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col justify-between p-12 lg:flex dark:border-r overflow-hidden select-none"
                style={{ backgroundColor: '#FAF5EF' }}>
                <DecorativeIcons isLoaded={isLoaded} />
                <Link href={home()} className="relative z-30 flex items-center text-lg font-bold text-zinc-900">
                    <AppLogoIcon className="mr-2 size-8 fill-current text-amber-500" />
                    {name}
                </Link>

                <div className="relative z-20 my-auto flex flex-col items-center text-center w-full max-w-md mx-auto pt-6">
                    {!isLoaded ? (
                        <div className="space-y-3 mb-8 w-full flex flex-col items-center">
                            <Skeleton className="h-8 w-3/4 rounded-lg bg-amber-200/60" />
                            <Skeleton className="h-8 w-1/2 rounded-lg bg-amber-200/60" />
                            <Skeleton className="h-4 w-5/6 rounded-md bg-amber-200/40 mt-4" />
                        </div>
                    ) : (
                        <div className="space-y-3 mb-8 w-full transition-opacity duration-300">
                            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 leading-tight">
                                Todo para tu engreído, <br />
                                <span className="text-amber-500">en un solo lugar</span>
                            </h2>
                            <p className="text-sm text-zinc-600 font-medium leading-relaxed">
                                Alimentos, accesorios, higiene y mucho más para consentir a tu mascota.
                            </p>
                        </div>
                    )}

                    <div className="relative w-full max-w-sm flex justify-center items-center min-h-[260px]">
                        {!isLoaded && (
                            <Skeleton className="h-[220px] w-[260px] rounded-2xl bg-amber-200/50" />
                        )}

                        <img src="/image/logo-full.png" alt="Mascotas"
                            onLoad={() => setIsLoaded(true)}
                            className={`w-full max-w-[320px] object-contain drop-shadow-md transition-all duration-500 animate-[bounce_4s_infinite_ease-in-out] ${
                                isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute'
                            }`}
                        />
                    </div>
                </div>

                <div className="relative z-20 text-xs text-zinc-400 font-medium">
                    © {new Date().getFullYear()} {name}. Todos los derechos reservados.
                </div>
            </div>
            <div className="flex w-full items-center justify-center lg:p-8">
                <Card className="w-full max-w-md shadow-lg rounded-xl border-border">
                    <CardHeader className="space-y-4 px-6 pt-6 text-center">
                        <Link
                            href={home()}
                            className="relative z-20 flex items-center justify-center lg:hidden"
                        >
                            <AppLogoIcon className="h-10 w-auto fill-current text-foreground sm:h-12" />
                        </Link>
                        
                        <div className="flex flex-col gap-1.5 text-center">
                            <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">
                                {title}
                            </CardTitle>
                            {description && (
                                <CardDescription className="text-sm text-balance text-muted-foreground">
                                    {description}
                                </CardDescription>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="px-6 pb-6">
                        {children}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
