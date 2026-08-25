import { useCallback, useEffect, useState } from 'react';
import type { ProductoCard } from '@/types/producto';

const KEY = 'mosso_favoritos';
const EV  = 'mosso:favoritos-updated';

function leer(): ProductoCard[] {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as ProductoCard[]) : [];
    } catch {
        return [];
    }
}

function guardar(items: ProductoCard[]): void {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EV));
}

export function useFavoritos() {
    const [favoritos, setFavoritos] = useState<ProductoCard[]>([]);

    // Carga desde localStorage solo en el cliente (evita mismatch SSR)
    useEffect(() => {
        setFavoritos(leer());
        const sync = () => setFavoritos(leer());
        window.addEventListener(EV, sync);
        return () => window.removeEventListener(EV, sync);
    }, []);

    const toggle = useCallback((producto: ProductoCard) => {
        const actual   = leer();
        const existe   = actual.some((p) => p.id === producto.id);
        const siguiente = existe
            ? actual.filter((p) => p.id !== producto.id)
            : [producto, ...actual];
        guardar(siguiente);
        setFavoritos(siguiente);
    }, []);

    const esFavorito = useCallback(
        (id: number) => favoritos.some((p) => p.id === id),
        [favoritos],
    );

    return { favoritos, toggle, esFavorito, total: favoritos.length };
}
