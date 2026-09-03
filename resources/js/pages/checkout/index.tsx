import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import StorefrontLayout from '@/layouts/storefront-layout';
import type {
    CheckoutIndexProps,
    CotizacionEnvio,
    CulqiCheckoutConstructor,
} from '@/types/checkout';

declare global {
    interface Window {
        CulqiCheckout?: CulqiCheckoutConstructor;
    }
}

// Culqi Checkout Custom — reemplaza a `checkout.culqi.com/js/v4` (deprecado).
const CULQI_SCRIPT = 'https://js.culqi.com/checkout-js';
const IGV_RATE = 0.18;

const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-mosso-yellow focus:border-mosso-yellow disabled:bg-gray-50 disabled:text-gray-400';

const soles = (n: number) => `S/ ${n.toFixed(2)}`;

export default function CheckoutIndex(props: CheckoutIndexProps) {
    const {
        resumen,
        comprador,
        facturacion,
        tiposDocumento,
        tipoEntregas,
        direcciones,
        zonasEnvio,
        empresa,
        culqiPublicKey,
        culqiConfigurado,
    } = props;

    // --- Estado del formulario ---
    const [comprobante, setComprobante] = useState<'boleta' | 'factura'>(
        'boleta',
    );
    const [razonSocial, setRazonSocial] = useState(
        facturacion.razon_social ?? '',
    );
    const [ruc, setRuc] = useState(facturacion.ruc ?? '');

    const p = comprador.persona;
    const [nombres, setNombres] = useState(p?.nombres ?? '');
    const [apellidoPaterno, setApellidoPaterno] = useState(
        p?.apellido_paterno ?? '',
    );
    const [apellidoMaterno, setApellidoMaterno] = useState(
        p?.apellido_materno ?? '',
    );
    const [fkTipoDocumento, setFkTipoDocumento] = useState(
        p?.fk_tipo_documento
            ? String(p.fk_tipo_documento)
            : String(tiposDocumento[0]?.id_tipo_documento ?? ''),
    );
    const [numDocumento, setNumDocumento] = useState(p?.num_documento ?? '');
    const [telefono, setTelefono] = useState(p?.telefono ?? '');

    const [tipoEntregaId, setTipoEntregaId] = useState<number | null>(
        tipoEntregas[0]?.id_tipo_entrega ?? null,
    );

    const direccionPrincipal =
        direcciones.find((d) => d.es_principal === 1) ?? direcciones[0];
    // Si la dirección principal (o la primera) no tiene envío disponible, se
    // preselecciona la primera que sí lo tenga en vez de dejar elegida una
    // dirección deshabilitada.
    const direccionInicial =
        direccionPrincipal?.envio_disponible === 1
            ? direccionPrincipal
            : (direcciones.find((d) => d.envio_disponible === 1) ?? direccionPrincipal);
    const [direccionModo, setDireccionModo] = useState<'guardada' | 'nueva'>(
        direcciones.length > 0 ? 'guardada' : 'nueva',
    );
    const [idDireccion, setIdDireccion] = useState<number | null>(
        direccionInicial?.id_direccion ?? null,
    );

    const [deptSel, setDeptSel] = useState('');
    const [provSel, setProvSel] = useState('');
    const [distSel, setDistSel] = useState('');
    const [direccionTexto, setDireccionTexto] = useState('');
    const [referencia, setReferencia] = useState('');
    const [alias, setAlias] = useState('');

    const [receptor, setReceptor] = useState<'yo' | 'otra'>('yo');
    const [rNombres, setRNombres] = useState('');
    const [rApellidos, setRApellidos] = useState('');
    const [rTipoDoc, setRTipoDoc] = useState(
        String(tiposDocumento[0]?.id_tipo_documento ?? ''),
    );
    const [rNumDoc, setRNumDoc] = useState('');
    const [rTelefono, setRTelefono] = useState('');

    const [cotizacion, setCotizacion] = useState<{
        distritoId: number;
        data: CotizacionEnvio | null;
    } | null>(null);
    const [procesando, setProcesando] = useState(false);
    const [culqiListo, setCulqiListo] = useState(
        () => typeof window !== 'undefined' && !!window.CulqiCheckout,
    );
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Datos que devuelve /checkout/iniciar; una vez presentes se muestra el
    // modal de MOSSO para elegir el método de pago.
    const [inicio, setInicio] = useState<{
        pedido_id: number;
        monto_centimos: number;
        email: string;
    } | null>(null);

    const provinciasFiltradas = useMemo(
        () => zonasEnvio.find((dep) => dep.id_departamento === Number(deptSel))?.provincias ?? [],
        [zonasEnvio, deptSel],
    );
    const distritosFiltrados = useMemo(
        () => provinciasFiltradas.find((pr) => pr.id_provincia === Number(provSel))?.distritos ?? [],
        [provinciasFiltradas, provSel],
    );

    const tipoEntregaSel = tipoEntregas.find(
        (t) => t.id_tipo_entrega === tipoEntregaId,
    );
    const requiereDireccion = tipoEntregaSel?.requiere_direccion === 1;

    const distritoActivoId = useMemo(() => {
        if (!requiereDireccion) {
            return null;
        }

        if (direccionModo === 'guardada') {
            return (
                direcciones.find((d) => d.id_direccion === idDireccion)
                    ?.id_distrito ?? null
            );
        }

        return distSel ? Number(distSel) : null;
    }, [requiereDireccion, direccionModo, direcciones, idDireccion, distSel]);

    // --- Cotización de envío (el backend es la fuente autoritativa) ---
    useEffect(() => {
        if (!requiereDireccion || !distritoActivoId) {
            return;
        }

        let cancelado = false;

        axios
            .get<CotizacionEnvio>(`/checkout/envio/${distritoActivoId}`)
            .then((r) => {
                if (!cancelado) {
                    setCotizacion({
                        distritoId: distritoActivoId,
                        data: r.data,
                    });
                }
            })
            .catch(() => {
                if (!cancelado) {
                    setCotizacion({ distritoId: distritoActivoId, data: null });
                }
            });

        return () => {
            cancelado = true;
        };
    }, [requiereDireccion, distritoActivoId]);

    // --- Culqi Checkout Custom: carga del script ---
    useEffect(() => {
        if (!culqiConfigurado || culqiListo) {
            return;
        }

        const marcar = () => setCulqiListo(true);

        const existente = document.querySelector<HTMLScriptElement>(
            `script[src="${CULQI_SCRIPT}"]`,
        );

        if (existente) {
            existente.addEventListener('load', marcar);

            return () => existente.removeEventListener('load', marcar);
        }

        const s = document.createElement('script');

        s.src = CULQI_SCRIPT;
        s.async = true;
        s.addEventListener('load', marcar);
        s.addEventListener('error', () =>
            toast.error('No se pudo cargar la pasarela de pago.'),
        );
        document.body.appendChild(s);

        return () => s.removeEventListener('load', marcar);
    }, [culqiConfigurado, culqiListo]);

    // --- Totales (solo para mostrar; el backend recalcula) ---
    const cotizacionVigente =
        cotizacion && cotizacion.distritoId === distritoActivoId
            ? cotizacion.data
            : null;
    const base = resumen.subtotal - resumen.descuento_total;
    const igvMostrado = base - base / (1 + IGV_RATE);
    const costoEnvio = !requiereDireccion
        ? 0
        : (cotizacionVigente?.costo_envio ?? null);
    const total = base + (costoEnvio ?? 0);

    const pedidoIdRef = useRef<number | null>(null);

    // Los <select> entregan strings; el backend espera enteros. Se convierte
    // explícitamente aquí (los vacíos quedan como null, no como 0).
    const int = (v: string | number | null | undefined): number | null => {
        if (v === null || v === undefined || v === '') {
            return null;
        }

        const n = Number(v);

        return Number.isFinite(n) ? n : null;
    };

    const construirPayload = () => ({
        comprobante,
        razon_social: comprobante === 'factura' ? razonSocial.trim() : null,
        ruc: comprobante === 'factura' ? ruc.trim() : null,
        ...(comprador.datos_completos
            ? {}
            : {
                  fk_tipo_documento: int(fkTipoDocumento),
                  num_documento: numDocumento.trim(),
                  nombres: nombres.trim(),
                  apellido_paterno: apellidoPaterno.trim(),
                  apellido_materno: apellidoMaterno.trim() || null,
                  telefono: telefono.trim(),
              }),
        fk_tipo_entrega: tipoEntregaId,
        ...(requiereDireccion
            ? {
                  direccion_modo: direccionModo,
                  id_direccion:
                      direccionModo === 'guardada' ? int(idDireccion) : null,
                  fk_distrito: direccionModo === 'nueva' ? int(distSel) : null,
                  direccion:
                      direccionModo === 'nueva' ? direccionTexto.trim() : null,
                  referencia:
                      direccionModo === 'nueva'
                          ? referencia.trim() || null
                          : null,
                  alias:
                      direccionModo === 'nueva' ? alias.trim() || null : null,
              }
            : {}),
        receptor,
        ...(receptor === 'otra'
            ? {
                  receptor_nombres: rNombres.trim(),
                  receptor_apellidos: rApellidos.trim(),
                  receptor_fk_tipo_documento: int(rTipoDoc),
                  receptor_num_documento: rNumDoc.trim(),
                  receptor_telefono: rTelefono.trim(),
              }
            : {}),
    });

    const scrollAlPrimerError = (campos: string[]) => {
        const primero = campos[0];

        if (!primero) {
            return;
        }

        document
            .querySelector(`[data-campo="${primero}"]`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const irAPagar = async () => {
        if (procesando) {
            return;
        }

        if (resumen.problemas.length > 0) {
            toast.error(resumen.problemas[0]);

            return;
        }

        if (!culqiConfigurado || !culqiListo) {
            toast.error('El pago en línea no está disponible en este momento.');

            return;
        }

        if (!tipoEntregaId) {
            setErrors({ fk_tipo_entrega: 'Selecciona un método de entrega.' });
            toast.error('Selecciona un método de entrega.');

            return;
        }

        setProcesando(true);
        setErrors({});

        try {
            const r = await axios.post('/checkout/iniciar', construirPayload());
            const data = r.data as {
                pedido_id: number;
                monto_centimos: number;
                email: string;
            };

            pedidoIdRef.current = data.pedido_id;
            setInicio(data); // abre el modal MOSSO de selección de método
        } catch (e) {
            if (axios.isAxiosError(e) && e.response?.status === 422) {
                console.error(
                    'Checkout 422 — errores de validación:',
                    e.response.data,
                );

                const errs: Record<string, string[]> =
                    e.response.data?.errors ?? {};
                const flat: Record<string, string> = {};

                Object.keys(errs).forEach((k) => {
                    flat[k] = errs[k][0];
                });

                setErrors(flat);
                scrollAlPrimerError(Object.keys(flat));

                toast.error(
                    Object.values(flat)[0] ??
                        e.response.data?.message ??
                        'Revisa los datos resaltados del formulario.',
                );
            } else {
                console.error('Checkout — error al iniciar el pago:', e);
                toast.error('No se pudo iniciar el pago. Intenta nuevamente.');
            }
        } finally {
            setProcesando(false);
        }
    };

    const cancelarMetodo = () => {
        setInicio(null);
        setProcesando(false);
    };

    const abrirCulqi = async (metodo: 'tarjeta' | 'yape') => {
        if (!inicio || !window.CulqiCheckout) {
            toast.error(
                'No se pudo cargar la pasarela de pago. Recarga la página.',
            );

            return;
        }

        setProcesando(true);

        let orderId: string | undefined;

        if (metodo === 'yape') {
            try {
                const r = await axios.post(
                    `/checkout/${inicio.pedido_id}/orden`,
                );
                orderId = (r.data as { order_id: string }).order_id;
            } catch (e) {
                setProcesando(false);
                const msg = axios.isAxiosError(e)
                    ? (e.response?.data?.message ?? '')
                    : '';
                toast.error(msg || 'No se pudo iniciar el pago con Yape.');

                return;
            }
        }

        setInicio(null); // cierra el modal MOSSO; se abre el de Culqi

        const culqi = new window.CulqiCheckout(culqiPublicKey ?? '', {
            settings: {
                title: 'MOSSO',
                currency: 'PEN',
                amount: inicio.monto_centimos,
                ...(orderId ? { order: orderId } : {}),
            },
            client: { email: inicio.email },
            options: {
                lang: 'es',
                installments: false,
                modal: true,
                paymentMethods: {
                    tarjeta: metodo === 'tarjeta',
                    yape: metodo === 'yape',
                    billetera: false,
                    bancaMovil: false,
                    agente: false,
                    cuotealo: false,
                },
                paymentMethodsSort: [metodo],
            },
        });

        culqi.culqi = () => {
            if (culqi.token) {
                culqi.close();
                router.post(
                    `/checkout/${pedidoIdRef.current}/pagar`,
                    { culqi_token: culqi.token.id, comprobante },
                    { onFinish: () => setProcesando(false) },
                );

                return;
            }

            if (culqi.order) {
                culqi.close();
                router.post(
                    `/checkout/${pedidoIdRef.current}/pagar`,
                    { culqi_order_id: culqi.order.id, comprobante },
                    { onFinish: () => setProcesando(false) },
                );

                return;
            }

            if (culqi.error) {
                toast.error(
                    culqi.error.user_message ??
                        culqi.error.merchant_message ??
                        'El pago no pudo completarse.',
                );
            }

            setProcesando(false);
        };

        culqi.open();
    };

    const err = (k: string) => errors[k];

    return (
        <StorefrontLayout>
            <Head title="Proceder al pago" />

            <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6">
                <nav className="mb-4 flex items-center gap-1.5 text-sm text-gray-500">
                    <Link href="/" className="hover:text-mosso-yellow">
                        Inicio
                    </Link>
                    <span className="text-gray-300">/</span>
                    <Link href="/carrito" className="hover:text-mosso-yellow">
                        Carrito
                    </Link>
                    <span className="text-gray-300">/</span>
                    <span className="font-medium text-gray-900">
                        Proceder al pago
                    </span>
                </nav>

                <h1 className="text-2xl font-black text-gray-900">
                    Proceder al pago
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Completa la información para procesar tu pedido.
                </p>

                {resumen.problemas.length > 0 && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <ul className="list-disc space-y-1 pl-5">
                            {resumen.problemas.map((m, i) => (
                                <li key={i}>{m}</li>
                            ))}
                        </ul>
                        <Link
                            href="/carrito"
                            className="mt-2 inline-block font-semibold underline"
                        >
                            Volver al carrito
                        </Link>
                    </div>
                )}

                <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
                    {/* ---------------- Columna izquierda ---------------- */}
                    <div className="space-y-5">
                        {/* 1. Comprador */}
                        <Bloque numero={1} titulo="¿Quién hace el pedido?">
                            {comprador.datos_completos && (
                                <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                    <LockIcon />
                                    <span>
                                        Tus datos provienen de tu cuenta.
                                        Edítalos en{' '}
                                        <Link
                                            href="/mi-cuenta/detalles"
                                            className="font-semibold underline"
                                        >
                                            Mi cuenta › Detalles de la cuenta
                                        </Link>
                                        .
                                    </span>
                                </div>
                            )}

                            <Campo label="Correo electrónico">
                                <input
                                    className={inputClass}
                                    value={comprador.correo}
                                    readOnly
                                />
                            </Campo>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Campo
                                    label="Nombres"
                                    error={err('nombres')}
                                    campo="nombres"
                                >
                                    <input
                                        className={inputClass}
                                        value={nombres}
                                        onChange={(e) =>
                                            setNombres(e.target.value)
                                        }
                                        readOnly={comprador.datos_completos}
                                    />
                                </Campo>
                                <Campo
                                    label="Apellido paterno"
                                    error={err('apellido_paterno')}
                                    campo="apellido_paterno"
                                >
                                    <input
                                        className={inputClass}
                                        value={apellidoPaterno}
                                        onChange={(e) =>
                                            setApellidoPaterno(e.target.value)
                                        }
                                        readOnly={comprador.datos_completos}
                                    />
                                </Campo>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <Campo
                                    label="Apellido materno"
                                    error={err('apellido_materno')}
                                    campo="apellido_materno"
                                >
                                    <input
                                        className={inputClass}
                                        value={apellidoMaterno}
                                        onChange={(e) =>
                                            setApellidoMaterno(e.target.value)
                                        }
                                        readOnly={comprador.datos_completos}
                                    />
                                </Campo>
                                <Campo
                                    label="Tipo de documento"
                                    error={err('fk_tipo_documento')}
                                    campo="fk_tipo_documento"
                                >
                                    <select
                                        className={inputClass}
                                        value={fkTipoDocumento}
                                        onChange={(e) =>
                                            setFkTipoDocumento(e.target.value)
                                        }
                                        disabled={comprador.datos_completos}
                                    >
                                        {tiposDocumento.map((t) => (
                                            <option
                                                key={t.id_tipo_documento}
                                                value={t.id_tipo_documento}
                                            >
                                                {t.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </Campo>
                                <Campo
                                    label="N° de documento"
                                    error={err('num_documento')}
                                    campo="num_documento"
                                >
                                    <input
                                        className={inputClass}
                                        value={numDocumento}
                                        onChange={(e) =>
                                            setNumDocumento(e.target.value)
                                        }
                                        readOnly={comprador.datos_completos}
                                    />
                                </Campo>
                            </div>

                            <Campo
                                label="Teléfono"
                                error={err('telefono')}
                                campo="telefono"
                            >
                                <input
                                    className={inputClass}
                                    value={telefono}
                                    onChange={(e) =>
                                        setTelefono(e.target.value)
                                    }
                                    readOnly={comprador.datos_completos}
                                />
                            </Campo>
                        </Bloque>

                        {/* 2. Comprobante */}
                        <Bloque numero={2} titulo="Datos de facturación">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <OpcionTarjeta
                                    activa={comprobante === 'boleta'}
                                    onClick={() => setComprobante('boleta')}
                                    titulo="Boleta electrónica"
                                    subtitulo="Para consumo final"
                                />
                                <OpcionTarjeta
                                    activa={comprobante === 'factura'}
                                    onClick={() => setComprobante('factura')}
                                    titulo="Factura electrónica"
                                    subtitulo="Para empresas"
                                />
                            </div>

                            {comprobante === 'boleta' ? (
                                <p className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                                    La boleta electrónica será enviada a tu
                                    correo registrado.
                                </p>
                            ) : (
                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Campo
                                        label="Razón social"
                                        error={err('razon_social')}
                                        campo="razon_social"
                                    >
                                        <input
                                            className={inputClass}
                                            value={razonSocial}
                                            onChange={(e) =>
                                                setRazonSocial(e.target.value)
                                            }
                                        />
                                    </Campo>
                                    <Campo
                                        label="RUC"
                                        error={err('ruc')}
                                        campo="ruc"
                                    >
                                        <input
                                            className={inputClass}
                                            value={ruc}
                                            inputMode="numeric"
                                            maxLength={11}
                                            onChange={(e) =>
                                                setRuc(
                                                    e.target.value.replace(
                                                        /\D/g,
                                                        '',
                                                    ),
                                                )
                                            }
                                        />
                                    </Campo>
                                </div>
                            )}
                        </Bloque>

                        {/* 3. Método de entrega */}
                        <Bloque numero={3} titulo="Método de entrega">
                            <div
                                data-campo="fk_tipo_entrega"
                                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                            >
                                {tipoEntregas.map((t) => (
                                    <OpcionTarjeta
                                        key={t.id_tipo_entrega}
                                        activa={
                                            tipoEntregaId === t.id_tipo_entrega
                                        }
                                        onClick={() =>
                                            setTipoEntregaId(t.id_tipo_entrega)
                                        }
                                        titulo={t.nombre}
                                        subtitulo={
                                            t.requiere_direccion === 1
                                                ? 'Recibe tu pedido en la dirección que elijas'
                                                : 'Retira tu pedido en nuestra tienda'
                                        }
                                    />
                                ))}
                            </div>
                            {err('fk_tipo_entrega') && (
                                <p className="mt-2 text-xs text-red-500">
                                    {err('fk_tipo_entrega')}
                                </p>
                            )}
                        </Bloque>

                        {/* 4. Datos de envío / retiro */}
                        <Bloque
                            numero={4}
                            titulo={
                                requiereDireccion
                                    ? 'Datos de envío'
                                    : 'Retiro en tienda'
                            }
                        >
                            {requiereDireccion ? (
                                <>
                                    {direcciones.length > 0 && (
                                        <div className="mb-4 flex gap-4 text-sm">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    checked={
                                                        direccionModo ===
                                                        'guardada'
                                                    }
                                                    onChange={() =>
                                                        setDireccionModo(
                                                            'guardada',
                                                        )
                                                    }
                                                />
                                                Usar una dirección guardada
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    checked={
                                                        direccionModo ===
                                                        'nueva'
                                                    }
                                                    onChange={() =>
                                                        setDireccionModo(
                                                            'nueva',
                                                        )
                                                    }
                                                />
                                                Agregar nueva dirección
                                            </label>
                                        </div>
                                    )}

                                    {direccionModo === 'guardada' ? (
                                        <div
                                            data-campo="id_direccion"
                                            className="space-y-2"
                                        >
                                            {direcciones.map((d) => {
                                                const disponible =
                                                    d.envio_disponible === 1;

                                                return (
                                                    <button
                                                        key={d.id_direccion}
                                                        type="button"
                                                        disabled={!disponible}
                                                        onClick={() =>
                                                            setIdDireccion(
                                                                d.id_direccion,
                                                            )
                                                        }
                                                        className={`block w-full rounded-xl border p-3 text-left text-sm transition-colors ${
                                                            !disponible
                                                                ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60'
                                                                : idDireccion ===
                                                                    d.id_direccion
                                                                  ? 'border-mosso-yellow bg-amber-50/60'
                                                                  : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <span className="font-semibold text-gray-900">
                                                            {d.alias || 'Dirección'}
                                                        </span>
                                                        {d.es_principal === 1 && (
                                                            <span className="ml-2 rounded-full bg-mosso-yellow/20 px-2 py-0.5 text-[11px] font-bold">
                                                                Principal
                                                            </span>
                                                        )}
                                                        <span className="mt-1 block text-gray-600">
                                                            {d.direccion}
                                                        </span>
                                                        <span className="block text-xs text-gray-400">
                                                            {d.distrito},{' '}
                                                            {d.provincia},{' '}
                                                            {d.departamento}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                            {err('id_direccion') && (
                                                <p className="text-xs text-red-500">
                                                    {err('id_direccion')}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                                <Campo label="Departamento">
                                                    <select
                                                        className={inputClass}
                                                        value={deptSel}
                                                        onChange={(e) => {
                                                            setDeptSel(
                                                                e.target.value,
                                                            );
                                                            setProvSel('');
                                                            setDistSel('');
                                                        }}
                                                    >
                                                        <option value="">
                                                            Selecciona…
                                                        </option>
                                                        {zonasEnvio.map(
                                                            (d) => (
                                                                <option
                                                                    key={
                                                                        d.id_departamento
                                                                    }
                                                                    value={
                                                                        d.id_departamento
                                                                    }
                                                                >
                                                                    {d.nombre}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </Campo>
                                                <Campo label="Provincia">
                                                    <select
                                                        className={inputClass}
                                                        value={provSel}
                                                        disabled={!deptSel}
                                                        onChange={(e) => {
                                                            setProvSel(
                                                                e.target.value,
                                                            );
                                                            setDistSel('');
                                                        }}
                                                    >
                                                        <option value="">
                                                            Selecciona…
                                                        </option>
                                                        {provinciasFiltradas.map(
                                                            (pr) => (
                                                                <option
                                                                    key={
                                                                        pr.id_provincia
                                                                    }
                                                                    value={
                                                                        pr.id_provincia
                                                                    }
                                                                >
                                                                    {pr.nombre}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </Campo>
                                                <Campo
                                                    label="Distrito"
                                                    error={err('fk_distrito')}
                                                    campo="fk_distrito"
                                                >
                                                    <select
                                                        className={inputClass}
                                                        value={distSel}
                                                        disabled={!provSel}
                                                        onChange={(e) =>
                                                            setDistSel(
                                                                e.target.value,
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            Selecciona…
                                                        </option>
                                                        {distritosFiltrados.map(
                                                            (d) => (
                                                                <option
                                                                    key={
                                                                        d.id_distrito
                                                                    }
                                                                    value={
                                                                        d.id_distrito
                                                                    }
                                                                >
                                                                    {d.nombre}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </Campo>
                                            </div>
                                            <Campo
                                                label="Dirección"
                                                error={err('direccion')}
                                                campo="direccion"
                                            >
                                                <input
                                                    className={inputClass}
                                                    value={direccionTexto}
                                                    maxLength={150}
                                                    placeholder="Av. La Marina 1234"
                                                    onChange={(e) =>
                                                        setDireccionTexto(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </Campo>
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <Campo label="Referencia (opcional)">
                                                    <input
                                                        className={inputClass}
                                                        value={referencia}
                                                        maxLength={150}
                                                        onChange={(e) =>
                                                            setReferencia(
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Campo>
                                                <Campo label="Alias (opcional)">
                                                    <input
                                                        className={inputClass}
                                                        value={alias}
                                                        maxLength={50}
                                                        placeholder="Casa, trabajo…"
                                                        onChange={(e) =>
                                                            setAlias(
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Campo>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="rounded-xl border border-gray-200 p-4 text-sm">
                                    {empresa ? (
                                        <>
                                            <p className="font-semibold text-gray-900">
                                                {empresa.nombre_comercial}
                                            </p>
                                            {empresa.direccion ? (
                                                <p className="mt-1 text-gray-600">
                                                    {empresa.direccion}
                                                    {empresa.distrito
                                                        ? `, ${empresa.distrito}`
                                                        : ''}
                                                </p>
                                            ) : (
                                                <p className="mt-1 text-amber-600">
                                                    Dirección de tienda por
                                                    configurar.
                                                </p>
                                            )}
                                            {empresa.telefono && (
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Tel: {empresa.telefono}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-amber-600">
                                            Dirección de tienda por configurar.
                                            Podrás coordinar el retiro tras la
                                            compra.
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-green-600">
                                        Retiro sin costo de envío.
                                    </p>
                                </div>
                            )}
                        </Bloque>

                        {/* 5. Quién recibe */}
                        <Bloque numero={5} titulo="¿Quién recibirá el pedido?">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <OpcionTarjeta
                                    activa={receptor === 'yo'}
                                    onClick={() => setReceptor('yo')}
                                    titulo="Yo recibiré el pedido"
                                    subtitulo="Se usan tus datos de comprador"
                                />
                                <OpcionTarjeta
                                    activa={receptor === 'otra'}
                                    onClick={() => setReceptor('otra')}
                                    titulo="Otra persona"
                                    subtitulo="Ingresa sus datos de contacto"
                                />
                            </div>

                            {receptor === 'otra' && (
                                <div className="mt-4 space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <Campo
                                            label="Nombres"
                                            error={err('receptor_nombres')}
                                            campo="receptor_nombres"
                                        >
                                            <input
                                                className={inputClass}
                                                value={rNombres}
                                                onChange={(e) =>
                                                    setRNombres(e.target.value)
                                                }
                                            />
                                        </Campo>
                                        <Campo
                                            label="Apellidos"
                                            error={err('receptor_apellidos')}
                                            campo="receptor_apellidos"
                                        >
                                            <input
                                                className={inputClass}
                                                value={rApellidos}
                                                onChange={(e) =>
                                                    setRApellidos(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Campo>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <Campo
                                            label="Tipo de documento"
                                            error={err(
                                                'receptor_fk_tipo_documento',
                                            )}
                                        >
                                            <select
                                                className={inputClass}
                                                value={rTipoDoc}
                                                onChange={(e) =>
                                                    setRTipoDoc(e.target.value)
                                                }
                                            >
                                                {tiposDocumento.map((t) => (
                                                    <option
                                                        key={
                                                            t.id_tipo_documento
                                                        }
                                                        value={
                                                            t.id_tipo_documento
                                                        }
                                                    >
                                                        {t.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </Campo>
                                        <Campo
                                            label="N° de documento"
                                            error={err(
                                                'receptor_num_documento',
                                            )}
                                        >
                                            <input
                                                className={inputClass}
                                                value={rNumDoc}
                                                onChange={(e) =>
                                                    setRNumDoc(e.target.value)
                                                }
                                            />
                                        </Campo>
                                        <Campo
                                            label="Teléfono"
                                            error={err('receptor_telefono')}
                                            campo="receptor_telefono"
                                        >
                                            <input
                                                className={inputClass}
                                                value={rTelefono}
                                                onChange={(e) =>
                                                    setRTelefono(e.target.value)
                                                }
                                            />
                                        </Campo>
                                    </div>
                                </div>
                            )}
                        </Bloque>
                    </div>

                    {/* ---------------- Columna derecha ---------------- */}
                    <div className="lg:sticky lg:top-24 lg:h-fit">
                        <div className="rounded-2xl border border-gray-100 bg-white p-6">
                            <h2 className="text-lg font-bold text-gray-900">
                                Resumen de tu pedido
                            </h2>

                            <ul className="mt-4 space-y-3">
                                {resumen.items.map((item) => (
                                    <li
                                        key={item.id_producto}
                                        className="flex gap-3"
                                    >
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                                            {item.imagen ? (
                                                <img
                                                    src={item.imagen}
                                                    alt={item.nombre}
                                                    className="max-h-full max-w-full object-contain"
                                                />
                                            ) : null}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-2 text-sm font-medium text-gray-900">
                                                {item.nombre}
                                            </p>
                                            {item.marca && (
                                                <p className="text-[11px] tracking-wide text-gray-400 uppercase">
                                                    {item.marca}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400">
                                                {item.cantidad} ×{' '}
                                                {soles(item.precio_final)}
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-sm font-bold text-gray-900">
                                            {soles(item.subtotal)}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>
                                        Subtotal ({resumen.items.length}{' '}
                                        productos)
                                    </span>
                                    <span>{soles(resumen.subtotal)}</span>
                                </div>
                                {resumen.descuento_total > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Descuentos</span>
                                        <span>
                                            -{soles(resumen.descuento_total)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Envío</span>
                                    <span>
                                        {!requiereDireccion ? (
                                            'Gratis'
                                        ) : costoEnvio === null ? (
                                            <span className="text-gray-400">
                                                Elige un distrito
                                            </span>
                                        ) : cotizacionVigente?.gratis ? (
                                            <span className="font-semibold text-green-600">
                                                GRATIS
                                            </span>
                                        ) : (
                                            soles(costoEnvio)
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>IGV incluido (18%)</span>
                                    <span>{soles(igvMostrado)}</span>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-gray-900">
                                <span className="font-bold">Total</span>
                                <span className="text-2xl font-black">
                                    {soles(total)}
                                </span>
                            </div>

                            {Object.keys(errors).length > 0 && (
                                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                    <p className="font-semibold">
                                        Revisa los datos resaltados:
                                    </p>
                                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                                        {Object.values(errors).map((m, i) => (
                                            <li key={i}>{m}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={irAPagar}
                                disabled={
                                    procesando ||
                                    !culqiConfigurado ||
                                    resumen.problemas.length > 0
                                }
                                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-mosso-yellow py-3.5 text-sm font-bold text-gray-900 transition-colors hover:bg-mosso-yellow/85 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <LockIcon />
                                {procesando
                                    ? 'Procesando…'
                                    : !culqiConfigurado
                                      ? 'Pago no disponible'
                                      : !culqiListo
                                        ? 'Cargando pasarela…'
                                        : 'Ir a pagar'}
                            </button>

                            {!culqiConfigurado && (
                                <p className="mt-2 text-center text-xs text-amber-600">
                                    Falta configurar las credenciales de Culqi.
                                </p>
                            )}
                            <p className="mt-2 text-center text-xs text-gray-400">
                                Pago 100% seguro con Culqi
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {inicio && (
                <SelectorMetodoPago
                    total={total}
                    procesando={procesando}
                    onElegir={abrirCulqi}
                    onCancelar={cancelarMetodo}
                />
            )}
        </StorefrontLayout>
    );
}

/* ------------------------- Selector de método de pago ------------------------- */

function SelectorMetodoPago({
    total,
    procesando,
    onElegir,
    onCancelar,
}: {
    total: number;
    procesando: boolean;
    onElegir: (metodo: 'tarjeta' | 'yape') => void;
    onCancelar: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
        >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">
                        Elige cómo pagar
                    </h2>
                    <button
                        type="button"
                        onClick={onCancelar}
                        aria-label="Cerrar"
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                    Total a pagar:{' '}
                    <span className="font-bold text-gray-900">
                        {soles(total)}
                    </span>
                </p>

                <div className="mt-5 space-y-3">
                    <button
                        type="button"
                        disabled={procesando}
                        onClick={() => onElegir('tarjeta')}
                        className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-4 text-left transition-colors hover:border-mosso-yellow hover:bg-amber-50/60 disabled:opacity-50"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <rect
                                    x="2"
                                    y="5"
                                    width="20"
                                    height="14"
                                    rx="2"
                                />
                                <path d="M2 10h20" />
                            </svg>
                        </span>
                        <span>
                            <span className="block text-sm font-semibold text-gray-900">
                                Tarjeta de crédito o débito
                            </span>
                            <span className="block text-xs text-gray-500">
                                Visa, Mastercard, Amex, Diners
                            </span>
                        </span>
                    </button>

                    <button
                        type="button"
                        disabled={procesando}
                        onClick={() => onElegir('yape')}
                        className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-4 text-left transition-colors hover:border-mosso-yellow hover:bg-amber-50/60 disabled:opacity-50"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#742284] text-sm font-black text-white">
                            Y
                        </span>
                        <span>
                            <span className="block text-sm font-semibold text-gray-900">
                                Yape
                            </span>
                            <span className="block text-xs text-gray-500">
                                Paga con el código de aprobación de tu app
                            </span>
                        </span>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onCancelar}
                    className="mt-4 w-full text-center text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}

/* ---------------------------------- UI ---------------------------------- */

function Bloque({
    numero,
    titulo,
    children,
}: {
    numero: number;
    titulo: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mosso-yellow text-xs font-black text-gray-900">
                    {numero}
                </span>
                {titulo}
            </h2>
            <div className="space-y-4">{children}</div>
        </section>
    );
}

function Campo({
    label,
    error,
    campo,
    children,
}: {
    label: string;
    error?: string;
    campo?: string;
    children: ReactNode;
}) {
    return (
        <div data-campo={campo}>
            <label className="mb-1 block text-sm font-medium text-gray-700">
                {label}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

function OpcionTarjeta({
    activa,
    onClick,
    titulo,
    subtitulo,
}: {
    activa: boolean;
    onClick: () => void;
    titulo: string;
    subtitulo: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                activa
                    ? 'border-mosso-yellow bg-amber-50/60'
                    : 'border-gray-200 hover:border-gray-300'
            }`}
        >
            <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    activa ? 'border-mosso-yellow' : 'border-gray-300'
                }`}
            >
                {activa && (
                    <span className="h-2 w-2 rounded-full bg-mosso-yellow" />
                )}
            </span>
            <span>
                <span className="block text-sm font-semibold text-gray-900">
                    {titulo}
                </span>
                <span className="block text-xs text-gray-500">{subtitulo}</span>
            </span>
        </button>
    );
}

function LockIcon() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}
