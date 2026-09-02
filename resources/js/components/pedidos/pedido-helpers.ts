/** Color de la insignia de estado, compartido por Index/Show/Drawer de Pedidos. */
export const ESTADO_TONO: Record<string, string> = {
    'Pendiente de pago': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    Pagado: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
    'En preparación': 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
    Enviado: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
    Entregado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    Cancelado: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
    Devuelto: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
};
