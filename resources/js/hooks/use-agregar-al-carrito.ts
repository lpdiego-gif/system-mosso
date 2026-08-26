import { useState } from 'react';

export function useAgregarAlCarrito(productoId: number) {
    const [agregando, setAgregando] = useState(false);
    const [agregado, setAgregado] = useState(false);

    const agregar = async () => {
        setAgregando(true);
        try {
            const csrf =
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const res = await fetch('/carrito/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ producto_id: productoId, cantidad: 1 }),
            });
            if (res.ok) {
                const data = (await res.json()) as { cantidad: number };
                window.dispatchEvent(
                    new CustomEvent('cart-updated', { detail: { cantidad: data.cantidad } }),
                );
                setAgregado(true);
                setTimeout(() => setAgregado(false), 1500);
            }
        } finally {
            setAgregando(false);
        }
    };

    return { agregar, agregando, agregado };
}
