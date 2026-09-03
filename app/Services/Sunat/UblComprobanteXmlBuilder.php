<?php

namespace App\Services\Sunat;

use DOMDocument;
use DOMElement;
use RuntimeException;

/**
 * Arma el XML de un comprobante de pago (Boleta/Factura) en formato SUNAT
 * UBL 2.1 y lo firma con XML-DSig (enveloped signature) usando el
 * certificado de DESARROLLO configurado en `services.sunat.cert_path`.
 *
 * IMPORTANTE: esto es preparación de datos. El certificado es autofirmado,
 * el XML NUNCA se envía a SUNAT/OSE, y no hay validación contra el XSD
 * oficial ni contra el WSDL de SUNAT — solo se garantiza que el documento
 * sea UBL 2.1 bien formado con la estructura real (namespaces, nodos y
 * catálogos SUNAT correctos) para que la fase de envío, cuando exista, no
 * tenga que rehacer el modelo de datos.
 *
 * No usa greenter/greenter: su última versión requiere symfony/validator
 * ^5||^6 (Laravel 13 trae Symfony 7) y `ext-soap` (no instalada), así que
 * `composer require` falla sin forzar upgrades riesgosos. Se construye el
 * XML a mano con DOMDocument, que ya trae C14N() nativo para la firma.
 */
class UblComprobanteXmlBuilder
{
    private const NS_INVOICE = 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2';

    private const NS_CAC = 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2';

    private const NS_CBC = 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2';

    private const NS_EXT = 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2';

    private const NS_DS = 'http://www.w3.org/2000/09/xmldsig#';

    private DOMDocument $doc;

    /**
     * @param  array<string, mixed>  $datos  Shape de ComprobanteService::datos().
     */
    public function build(array $datos, string $certPem): string
    {
        $this->doc = new DOMDocument('1.0', 'UTF-8');

        $invoice = $this->doc->createElementNS(self::NS_INVOICE, 'Invoice');
        $invoice->setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:cac', self::NS_CAC);
        $invoice->setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:cbc', self::NS_CBC);
        $invoice->setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:ext', self::NS_EXT);
        $this->doc->appendChild($invoice);

        $extensions = $this->el('ext:UBLExtensions', null, self::NS_EXT);
        $extension = $this->el('ext:UBLExtension', null, self::NS_EXT);
        $extensionContent = $this->el('ext:ExtensionContent', null, self::NS_EXT);
        $extension->appendChild($extensionContent);
        $extensions->appendChild($extension);
        $invoice->appendChild($extensions);

        $comprobante = $datos['comprobante'];
        $emisor = $datos['emisor'];
        $receptor = $datos['receptor'];
        $totales = $datos['totales'];

        $invoice->appendChild($this->el('cbc:UBLVersionID', '2.1'));
        $invoice->appendChild($this->el('cbc:CustomizationID', '2.0'));
        $invoice->appendChild($this->el('cbc:ID', "{$comprobante['serie']}-{$comprobante['numero']}"));
        $invoice->appendChild($this->el('cbc:IssueDate', $comprobante['fecha_emision']->format('Y-m-d')));
        $invoice->appendChild($this->el('cbc:IssueTime', $comprobante['fecha_emision']->format('H:i:s')));

        $tipo = $this->el('cbc:InvoiceTypeCode', $comprobante['tipo']);
        $tipo->setAttribute('listID', '0101');
        $tipo->setAttribute('listAgencyName', 'PE:SUNAT');
        $tipo->setAttribute('listName', 'Tipo de Documento');
        $invoice->appendChild($tipo);

        $nota = $this->el('cbc:Note', $totales['total_letras']);
        $nota->setAttribute('languageLocaleID', '1000');
        $invoice->appendChild($nota);

        $invoice->appendChild($this->el('cbc:DocumentCurrencyCode', $comprobante['moneda']));

        $invoice->appendChild($this->nodoFirmaUbl($comprobante, $emisor));
        $invoice->appendChild($this->nodoParty('cac:AccountingSupplierParty', $emisor['ruc'], '6', $emisor['nombre_comercial'], $emisor['razon_social'], $emisor));
        $invoice->appendChild($this->nodoParty('cac:AccountingCustomerParty', $receptor['num_doc'], $receptor['tipo_doc'], $receptor['nombre'], $receptor['nombre'], $receptor));

        $pago = $this->el('cac:PaymentTerms', null, self::NS_CAC);
        $pago->appendChild($this->el('cbc:ID', 'FormaPago'));
        $pago->appendChild($this->el('cbc:PaymentMeansID', $comprobante['forma_pago']));
        $invoice->appendChild($pago);

        $invoice->appendChild($this->nodoTaxTotal($totales['igv'], $totales['op_gravadas'], $totales['igv'], $comprobante['moneda']));

        $legal = $this->el('cac:LegalMonetaryTotal', null, self::NS_CAC);
        $legal->appendChild($this->montoNode('cbc:LineExtensionAmount', $totales['op_gravadas'], $comprobante['moneda']));
        $legal->appendChild($this->montoNode('cbc:TaxInclusiveAmount', $totales['total'], $comprobante['moneda']));
        $legal->appendChild($this->montoNode('cbc:PayableAmount', $totales['total'], $comprobante['moneda']));
        $invoice->appendChild($legal);

        foreach ($datos['items'] as $i => $item) {
            $invoice->appendChild($this->nodoInvoiceLine($i + 1, $item, $comprobante['moneda']));
        }

        $this->firmar($extensionContent, $certPem, "{$comprobante['serie']}-{$comprobante['numero']}");

        return $this->doc->saveXML();
    }

    private function nodoFirmaUbl(array $comprobante, array $emisor): DOMElement
    {
        $firma = $this->el('cac:Signature', null, self::NS_CAC);
        $firma->appendChild($this->el('cbc:ID', "{$comprobante['serie']}-{$comprobante['numero']}"));

        $signatory = $this->el('cac:SignatoryParty', null, self::NS_CAC);
        $partyId = $this->el('cac:PartyIdentification', null, self::NS_CAC);
        $partyId->appendChild($this->el('cbc:ID', $emisor['ruc']));
        $signatory->appendChild($partyId);
        $partyName = $this->el('cac:PartyName', null, self::NS_CAC);
        $partyName->appendChild($this->el('cbc:Name', $emisor['razon_social']));
        $signatory->appendChild($partyName);
        $firma->appendChild($signatory);

        $attachment = $this->el('cac:DigitalSignatureAttachment', null, self::NS_CAC);
        $externalRef = $this->el('cac:ExternalReference', null, self::NS_CAC);
        $externalRef->appendChild($this->el('cbc:URI', '#SignatureSP'));
        $attachment->appendChild($externalRef);
        $firma->appendChild($attachment);

        return $firma;
    }

    /**
     * @param  array<string, mixed>  $ubicacion  Necesita direccion_linea/ubigeo (emisor) o direccion (receptor).
     */
    private function nodoParty(string $tag, string $numDoc, string $tipoDoc, string $nombreComercial, string $razonSocial, array $ubicacion): DOMElement
    {
        $wrapper = $this->el($tag, null, self::NS_CAC);
        $party = $this->el('cac:Party', null, self::NS_CAC);

        $partyId = $this->el('cac:PartyIdentification', null, self::NS_CAC);
        $id = $this->el('cbc:ID', $numDoc);
        $id->setAttribute('schemeID', $tipoDoc);
        $id->setAttribute('schemeName', 'Documento de Identidad');
        $id->setAttribute('schemeAgencyName', 'PE:SUNAT');
        $id->setAttribute('schemeURI', 'urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06');
        $partyId->appendChild($id);
        $party->appendChild($partyId);

        $partyName = $this->el('cac:PartyName', null, self::NS_CAC);
        $partyName->appendChild($this->el('cbc:Name', $nombreComercial));
        $party->appendChild($partyName);

        $legalEntity = $this->el('cac:PartyLegalEntity', null, self::NS_CAC);
        $legalEntity->appendChild($this->el('cbc:RegistrationName', $razonSocial));

        $registrationAddress = $this->el('cac:RegistrationAddress', null, self::NS_CAC);
        if (! empty($ubicacion['ubigeo'])) {
            $registrationAddress->appendChild($this->el('cbc:ID', $ubicacion['ubigeo']));
            $registrationAddress->appendChild($this->el('cbc:AddressTypeCode', '0000'));
        }
        $direccionLinea = $ubicacion['direccion_linea'] ?? $ubicacion['direccion'] ?? '';
        if ($direccionLinea !== '') {
            $addressLine = $this->el('cac:AddressLine', null, self::NS_CAC);
            $addressLine->appendChild($this->el('cbc:Line', $direccionLinea));
            $registrationAddress->appendChild($addressLine);
        }
        $country = $this->el('cac:Country', null, self::NS_CAC);
        $country->appendChild($this->el('cbc:IdentificationCode', 'PE'));
        $registrationAddress->appendChild($country);

        $legalEntity->appendChild($registrationAddress);
        $party->appendChild($legalEntity);
        $wrapper->appendChild($party);

        return $wrapper;
    }

    private function nodoTaxTotal(string $totalIgv, string $baseImponible, string $igv, string $moneda): DOMElement
    {
        $taxTotal = $this->el('cac:TaxTotal', null, self::NS_CAC);
        $taxTotal->appendChild($this->montoNode('cbc:TaxAmount', $totalIgv, $moneda));

        $subtotal = $this->el('cac:TaxSubtotal', null, self::NS_CAC);
        $subtotal->appendChild($this->montoNode('cbc:TaxableAmount', $baseImponible, $moneda));
        $subtotal->appendChild($this->montoNode('cbc:TaxAmount', $igv, $moneda));

        $category = $this->el('cac:TaxCategory', null, self::NS_CAC);
        $scheme = $this->el('cac:TaxScheme', null, self::NS_CAC);
        $scheme->appendChild($this->el('cbc:ID', '1000'));
        $scheme->appendChild($this->el('cbc:Name', 'IGV'));
        $scheme->appendChild($this->el('cbc:TaxTypeCode', 'VAT'));
        $category->appendChild($scheme);
        $subtotal->appendChild($category);

        $taxTotal->appendChild($subtotal);

        return $taxTotal;
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function nodoInvoiceLine(int $numero, array $item, string $moneda): DOMElement
    {
        $line = $this->el('cac:InvoiceLine', null, self::NS_CAC);
        $line->appendChild($this->el('cbc:ID', (string) $numero));

        $cantidad = $this->el('cbc:InvoicedQuantity', number_format((float) $item['cantidad'], 2, '.', ''));
        $cantidad->setAttribute('unitCode', $item['unidad']);
        $line->appendChild($cantidad);

        $line->appendChild($this->montoNode('cbc:LineExtensionAmount', $item['valor_venta_linea'], $moneda));

        $pricingRef = $this->el('cac:PricingReference', null, self::NS_CAC);
        $altPrice = $this->el('cac:AlternativeConditionPrice', null, self::NS_CAC);
        $altPrice->appendChild($this->montoNode('cbc:PriceAmount', $item['precio_unitario'], $moneda));
        $altPrice->appendChild($this->el('cbc:PriceTypeCode', '01'));
        $pricingRef->appendChild($altPrice);
        $line->appendChild($pricingRef);

        $line->appendChild($this->nodoTaxTotalLinea($item, $moneda));

        $itemNode = $this->el('cac:Item', null, self::NS_CAC);
        $itemNode->appendChild($this->el('cbc:Description', $item['descripcion']));
        $sellerId = $this->el('cac:SellersItemIdentification', null, self::NS_CAC);
        $sellerId->appendChild($this->el('cbc:ID', $item['codigo']));
        $itemNode->appendChild($sellerId);
        $line->appendChild($itemNode);

        $price = $this->el('cac:Price', null, self::NS_CAC);
        $price->appendChild($this->montoNode('cbc:PriceAmount', $item['valor_unitario'], $moneda));
        $line->appendChild($price);

        return $line;
    }

    private function nodoTaxTotalLinea(array $item, string $moneda): DOMElement
    {
        $taxTotal = $this->el('cac:TaxTotal', null, self::NS_CAC);
        $taxTotal->appendChild($this->montoNode('cbc:TaxAmount', $item['igv_linea'], $moneda));

        $subtotal = $this->el('cac:TaxSubtotal', null, self::NS_CAC);
        $subtotal->appendChild($this->montoNode('cbc:TaxableAmount', $item['valor_venta_linea'], $moneda));
        $subtotal->appendChild($this->montoNode('cbc:TaxAmount', $item['igv_linea'], $moneda));

        $category = $this->el('cac:TaxCategory', null, self::NS_CAC);
        $category->appendChild($this->el('cbc:Percent', '18'));
        $category->appendChild($this->el('cbc:TaxExemptionReasonCode', $item['tip_afectacion']));
        $scheme = $this->el('cac:TaxScheme', null, self::NS_CAC);
        $scheme->appendChild($this->el('cbc:ID', '1000'));
        $scheme->appendChild($this->el('cbc:Name', 'IGV'));
        $scheme->appendChild($this->el('cbc:TaxTypeCode', 'VAT'));
        $category->appendChild($scheme);
        $subtotal->appendChild($category);

        $taxTotal->appendChild($subtotal);

        return $taxTotal;
    }

    private function montoNode(string $tag, string $valor, string $moneda): DOMElement
    {
        $node = $this->el($tag, $valor);
        $node->setAttribute('currencyID', $moneda);

        return $node;
    }

    /**
     * Crea un elemento cbc:* (namespace por defecto de CommonBasicComponents)
     * salvo que se indique otro namespace explícito (cac:*, ext:*).
     */
    private function el(string $tag, ?string $texto = null, ?string $namespace = null): DOMElement
    {
        $namespace ??= self::NS_CBC;
        $node = $this->doc->createElementNS($namespace, $tag);

        if ($texto !== null) {
            $node->appendChild($this->doc->createTextNode($texto));
        }

        return $node;
    }

    /**
     * Firma XML-DSig enveloped: digest SHA-256 del documento SIN el nodo
     * ds:Signature (transform "enveloped-signature"), firma RSA-SHA256 del
     * SignedInfo canonicalizado, certificado del firmante en Base64.
     */
    private function firmar(DOMElement $extensionContent, string $certPem, string $id): void
    {
        $privateKey = openssl_pkey_get_private($certPem);
        $certResource = openssl_x509_read($certPem);

        if ($privateKey === false || $certResource === false) {
            throw new RuntimeException('Certificado de comprobantes inválido o no encontrado (services.sunat.cert_path).');
        }

        openssl_x509_export($certResource, $certPemLimpio);
        $certBase64 = trim(str_replace(
            ['-----BEGIN CERTIFICATE-----', '-----END CERTIFICATE-----', "\r"],
            '',
            $certPemLimpio
        ));

        $signature = $this->doc->createElementNS(self::NS_DS, 'ds:Signature');
        $signature->setAttribute('Id', 'SignatureSP');
        $extensionContent->appendChild($signature);

        $signedInfo = $this->doc->createElementNS(self::NS_DS, 'ds:SignedInfo');
        $canon = $this->doc->createElementNS(self::NS_DS, 'ds:CanonicalizationMethod');
        $canon->setAttribute('Algorithm', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315');
        $signedInfo->appendChild($canon);
        $sigMethod = $this->doc->createElementNS(self::NS_DS, 'ds:SignatureMethod');
        $sigMethod->setAttribute('Algorithm', 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256');
        $signedInfo->appendChild($sigMethod);

        $reference = $this->doc->createElementNS(self::NS_DS, 'ds:Reference');
        $reference->setAttribute('URI', '');
        $transforms = $this->doc->createElementNS(self::NS_DS, 'ds:Transforms');
        $transform = $this->doc->createElementNS(self::NS_DS, 'ds:Transform');
        $transform->setAttribute('Algorithm', 'http://www.w3.org/2000/09/xmldsig#enveloped-signature');
        $transforms->appendChild($transform);
        $reference->appendChild($transforms);
        $digestMethod = $this->doc->createElementNS(self::NS_DS, 'ds:DigestMethod');
        $digestMethod->setAttribute('Algorithm', 'http://www.w3.org/2001/04/xmlenc#sha256');
        $reference->appendChild($digestMethod);
        $digestValue = $this->doc->createElementNS(self::NS_DS, 'ds:DigestValue');
        $reference->appendChild($digestValue);
        $signedInfo->appendChild($reference);
        $signature->appendChild($signedInfo);

        $signatureValue = $this->doc->createElementNS(self::NS_DS, 'ds:SignatureValue');
        $signature->appendChild($signatureValue);

        $keyInfo = $this->doc->createElementNS(self::NS_DS, 'ds:KeyInfo');
        $x509Data = $this->doc->createElementNS(self::NS_DS, 'ds:X509Data');
        $x509Cert = $this->doc->createElementNS(self::NS_DS, 'ds:X509Certificate', $certBase64);
        $x509Data->appendChild($x509Cert);
        $keyInfo->appendChild($x509Data);
        $signature->appendChild($keyInfo);

        // 1) Digest del documento completo SIN el nodo ds:Signature (transform
        // "enveloped-signature" == "canonicaliza todo menos la firma misma").
        $clon = $this->doc->cloneNode(true);
        $xpath = new \DOMXPath($clon);
        $xpath->registerNamespace('ds', self::NS_DS);
        $firmaEnClon = $xpath->query('//ds:Signature[@Id="SignatureSP"]')->item(0);
        $firmaEnClon?->parentNode?->removeChild($firmaEnClon);
        $digest = base64_encode(hash('sha256', $clon->C14N(), true));
        $digestValue->nodeValue = $digest;

        // 2) Firma RSA-SHA256 del SignedInfo ya canonicalizado (con el digest puesto).
        $c14nSignedInfo = $signedInfo->C14N();
        openssl_sign($c14nSignedInfo, $firmaBinaria, $privateKey, OPENSSL_ALGO_SHA256);
        $signatureValue->nodeValue = base64_encode($firmaBinaria);
    }
}
