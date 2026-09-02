import { usePage } from '@inertiajs/react';
import { whatsappUrl } from '@/lib/whatsapp';
import type { EmpresaPublica } from '@/types/empresa';

interface PageProps {
  empresa: EmpresaPublica | null;
  [key: string]: unknown;
}

/** Botón flotante de WhatsApp, visible en toda la tienda pública (montado en StorefrontLayout). */
export default function WhatsappFlotante() {
  const { empresa } = usePage<PageProps>().props;
  const telefono = empresa?.telefono || '+51 999 123 456';

  return (
    <a
      href={whatsappUrl(telefono, 'Hola, tengo una consulta sobre MOSSO.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatear por WhatsApp"
      className="group fixed right-5 bottom-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 transition-transform duration-200 hover:scale-105 sm:right-6 sm:bottom-6"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-40 group-hover:hidden" />
      <WhatsappIcon />
    </a>
  );
}

function WhatsappIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="relative">
      <path d="M12.04 2.5c-5.26 0-9.54 4.28-9.54 9.54 0 1.68.44 3.32 1.28 4.76L2.5 21.5l4.83-1.27a9.5 9.5 0 0 0 4.71 1.25h.01c5.26 0 9.54-4.28 9.54-9.54s-4.28-9.44-9.55-9.44Zm5.6 13.6c-.24.67-1.4 1.28-1.93 1.36-.5.08-1.12.11-1.8-.11a15 15 0 0 1-1.9-.71 12.6 12.6 0 0 1-4.7-4.16c-.35-.47-1.16-1.55-1.16-2.96 0-1.4.73-2.09 1-2.38.24-.27.53-.34.71-.34s.36 0 .52.01c.17.01.39-.06.61.47.24.58.8 2 .87 2.14.07.15.12.32.02.51-.09.19-.14.3-.28.46-.14.16-.29.36-.42.48-.14.13-.28.28-.12.55.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.55.73 1.82.87.27.13.44.2.51.32.07.11.07.65-.17 1.32Z" />
    </svg>
  );
}
