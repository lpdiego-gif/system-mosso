<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ComprobanteMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array<string, mixed>  $datos  ComprobanteService::datos().
     */
    public function __construct(
        public readonly array $datos,
        public readonly string $pdfBinario,
        public readonly ?string $xmlPath = null,
    ) {}

    public function envelope(): Envelope
    {
        $c = $this->datos['comprobante'];

        return new Envelope(
            subject: "Tu comprobante {$c['serie']}-{$c['numero']} — MOSSO",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.comprobante',
            with: ['datos' => $this->datos],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        $c = $this->datos['comprobante'];
        $nombre = "{$c['serie']}-{$c['numero']}";

        $adjuntos = [
            Attachment::fromData(fn () => $this->pdfBinario, "{$nombre}.pdf")
                ->withMime('application/pdf'),
        ];

        if ($this->xmlPath) {
            $adjuntos[] = Attachment::fromPath($this->xmlPath)->as("{$nombre}.xml")->withMime('application/xml');
        }

        return $adjuntos;
    }
}
