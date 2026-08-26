import { Head, Link, router } from '@inertiajs/react';
import { Loader2, MoreVertical, Pencil, Plus, Scissors, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { ServicioAdminRow } from '@/types/servicio';

interface Props {
    servicios: ServicioAdminRow[];
}

export default function Index({ servicios }: Props) {
    const [eliminando, setEliminando] = useState<ServicioAdminRow | null>(null);
    const [procesando, setProcesando] = useState(false);

    function confirmarEliminar() {
        if (!eliminando) {
            return;
        }

        setProcesando(true);
        router.delete(route('admin.servicios.destroy', eliminando.id_servicio), {
            preserveScroll: true,
            onFinish: () => {
                setProcesando(false);
                setEliminando(null);
            },
        });
    }

    return (
        <>
            <Head title="Servicios" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                            <Scissors className="h-6 w-6 text-indigo-500" />
                            Servicios
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Administra los servicios (grooming, veterinaria, etc.) que se muestran en el Portal Web.
                        </p>
                    </div>
                    <Button asChild className="gap-2 self-start sm:self-auto">
                        <Link href={route('admin.servicios.create')}>
                            <Plus className="h-4 w-4" /> Nuevo servicio
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-16">Imagen</TableHead>
                                <TableHead className="font-semibold">Negocio</TableHead>
                                <TableHead className="font-semibold">Servicio</TableHead>
                                <TableHead className="font-semibold">Tipo</TableHead>
                                <TableHead className="font-semibold">Estado</TableHead>
                                <TableHead className="w-12 text-center font-semibold">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {servicios.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                        Aún no hay servicios registrados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                servicios.map((s) => (
                                    <TableRow key={s.id_servicio} className="hover:bg-muted/40">
                                        <TableCell>
                                            <div className="h-10 w-10 overflow-hidden rounded-md bg-muted">
                                                {s.imagen && <img src={s.imagen} alt="" className="h-full w-full object-cover" />}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground">{s.nombre_negocio}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{s.nombre_servicio}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{s.tipo_servicio}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {s.activo ? (
                                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Activo</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">Inactivo</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('admin.servicios.edit', s.id_servicio)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                        onClick={() => setEliminando(s)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <AlertDialog open={eliminando !== null} onOpenChange={(o) => !o && setEliminando(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            ¿Eliminar servicio?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Vas a eliminar <strong>{eliminando?.nombre_servicio}</strong> de {eliminando?.nombre_negocio}. Se
                            eliminarán también sus horarios, imágenes, beneficios y redes sociales. Esta acción no se puede
                            deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={procesando}
                            onClick={(e) => {
                                e.preventDefault();
                                confirmarEliminar();
                            }}
                            className="gap-2 bg-destructive hover:bg-destructive/90"
                        >
                            {procesando && <Loader2 className="h-4 w-4 animate-spin" />}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
