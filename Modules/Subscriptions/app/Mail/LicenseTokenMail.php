<?php

namespace Modules\Subscriptions\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Modules\Subscriptions\Models\LicenseToken;

class LicenseTokenMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $activationUrl;

    public function __construct(public readonly LicenseToken $licenseToken)
    {
        $this->activationUrl = route('subscriptions.activate', ['token' => $licenseToken->token]);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Activación de licencia — ' . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.license-token',
        );
    }
}
