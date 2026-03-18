// @ts-nocheck — Deno Edge Function, not processed by local TS
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  cancellationToken: string;
  language: "sk" | "en";
  template?: "confirmation" | "reminder" | "admin-notification" | "cancellation-admin";
  adminData?: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    notes: string | null;
  };
}

const translations = {
  sk: {
    subject: "Potvrdenie rezervácie - FYZIO&FIT",
    reminderSubject: "Pripomienka: Váš termín zajtra - FYZIO&FIT",
    greeting: "Dobrý deň",
    confirmationTitle: "Vaša rezervácia bola úspešne vytvorená",
    reminderTitle: "Pripomíname vám zajtrajší termín",
    service: "Služba",
    dateTime: "Dátum a čas",
    location: "Miesto",
    address: "Krmanová 6, Košice",
    cancelText: "Ak potrebujete zrušiť rezerváciu, kliknite na nasledujúci odkaz:",
    cancelButton: "Zrušiť rezerváciu",
    footer: "Tešíme sa na vašu návštevu!",
    clinicName: "FYZIO&FIT",
    contact: "Kontakt: booking@fyzioafit.sk",
  },
  en: {
    subject: "Booking Confirmation - FYZIO&FIT",
    reminderSubject: "Reminder: Your appointment tomorrow - FYZIO&FIT",
    greeting: "Hello",
    confirmationTitle: "Your booking has been successfully created",
    reminderTitle: "Reminder about your appointment tomorrow",
    service: "Service",
    dateTime: "Date & Time",
    location: "Location",
    address: "Krmanová 6, Košice",
    cancelText: "If you need to cancel your booking, click the following link:",
    cancelButton: "Cancel Booking",
    footer: "We look forward to seeing you!",
    clinicName: "FYZIO&FIT",
    contact: "Contact: booking@fyzioafit.sk",
  },
};

function formatDate(dateStr: string, language: "sk" | "en"): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Bratislava", // DÔLEŽITÉ: Supabase beží v UTC, toto zaručí správny SK dátum
  };
  return date.toLocaleDateString(language === "sk" ? "sk-SK" : "en-US", options);
}

function generateEmailHtml(data: EmailRequest, baseUrl: string): string {
  const t = translations[data.language];
  const formattedDate = formatDate(data.date, data.language);
  const cancelUrl = `${baseUrl}/cancel?token=${data.cancellationToken}`;
  const isReminder = data.template === "reminder";
  const title = isReminder ? t.reminderTitle : t.confirmationTitle;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${isReminder ? t.reminderSubject : t.subject}</title>
  <style>
    :root { color-scheme: light dark; }
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #18181b !important; }
      .email-card { background-color: #242427 !important; box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; border: 1px solid #3f3f46 !important; }
      .detail-box { background-color: #2f2f36 !important; }
      .detail-border { border-color: #3f3f46 !important; }
      .text-heading { color: #e4e4e7 !important; }
      .text-body { color: #d4d4d8 !important; }
      .text-muted { color: #a1a1aa !important; }
      .text-accent { color: #6ba3e0 !important; }
      .cancel-section { background-color: #2e1616 !important; border-color: #7f1d1d !important; }
      .cancel-heading { color: #f87171 !important; }
      .footer-section { background-color: #1e1e22 !important; border-color: #3f3f46 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body" style="background-color: #f7f9fc; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" class="email-card" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4a90d9 0%, #6ba3e0 100%); padding: 36px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1.5px;">${t.clinicName}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 class="text-heading" style="color: #1a2b42; margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">${t.greeting}, ${data.clientName}!</h2>
              <p class="text-body" style="color: #4b5e78; margin: 0 0 30px 0; font-size: 16px; line-height: 1.5;">${title}</p>
              <!-- Booking Details -->
              <table width="100%" cellpadding="0" cellspacing="0" class="detail-box" style="background-color: #f0f4f8; border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #dde5ef;">
                          <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.service}</span><br>
                          <span class="text-heading" style="color: #1a2b42; font-size: 16px; font-weight: 600;">${data.serviceName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #dde5ef;">
                          <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.dateTime}</span><br>
                          <span class="text-heading" style="color: #1a2b42; font-size: 16px; font-weight: 500;">${formattedDate}</span><br>
                          <span class="text-accent" style="color: #4a90d9; font-size: 16px; font-weight: 700;">${data.time}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.location}</span><br>
                          <span class="text-heading" style="color: #1a2b42; font-size: 16px; font-weight: 500;">${t.address}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Looking forward -->
              <p class="text-heading" style="color: #1a2b42; font-size: 18px; font-weight: 600; margin: 0 0 28px 0; text-align: center;">${t.footer}</p>
              <!-- Cancel Section - Alert style with left border -->
              <table width="100%" cellpadding="0" cellspacing="0" class="cancel-section" style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.7;">
                    <p class="cancel-heading" style="margin: 0 0 14px 0; font-weight: 700; font-size: 15px; color: #dc2626;">${data.language === 'sk' ? 'Storno podmienky' : 'Cancellation policy'}</p>
                    <p class="text-body" style="margin: 0 0 10px 0; color: #4b5e78;">• ${data.language === 'sk' ? 'Rezerváciu je možné zrušiť online najneskôr 12 hodín pred termínom.' : 'You can cancel online up to 12 hours before your appointment.'}</p>
                    <p class="text-body" style="margin: 0; color: #4b5e78;">• ${data.language === 'sk'
      ? 'Menej ako 12 hodín pred termínom je zrušenie možné, len telefonicky: <strong>+421 905 307 198</strong> ale bude Vám účtovaný storno poplatok 10&nbsp;€.'
      : 'Less than 12 hours before, cancellation is only possible by phone: <strong>+421 905 307 198</strong> and a cancellation fee of €10 will be charged.'}</p>
                  </td>
                </tr>
              </table>
              <div style="text-align: center;">
                <a href="${cancelUrl}" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 0.3px;">${t.cancelButton}</a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td class="footer-section" style="background-color: #f0f4f8; padding: 20px 30px; text-align: center; border-top: 1px solid #dde5ef;">
              <p class="text-muted" style="color: #6b7c94; margin: 0; font-size: 14px;">${t.contact}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function generateEmailText(data: EmailRequest, baseUrl: string): string {
  const t = translations[data.language];
  const formattedDate = formatDate(data.date, data.language);
  const cancelUrl = `${baseUrl}/cancel?token=${data.cancellationToken}`;
  const isReminder = data.template === "reminder";
  const title = isReminder ? t.reminderTitle : t.confirmationTitle;

  const cancelPolicy = data.language === 'sk'
    ? [
      '',
      t.footer,
      '',
      'STORNO PODMIENKY:',
      '',
      '• Rezerváciu je možné zrušiť online najneskôr 12 hodín pred termínom.',
      '',
      '• Menej ako 12 hodín pred termínom je zrušenie možné,',
      '  len telefonicky: +421 905 307 198 ale bude Vám účtovaný storno poplatok 10 €.',
    ]
    : [
      '',
      t.footer,
      '',
      'CANCELLATION POLICY:',
      '',
      '• You can cancel online up to 12 hours before your appointment.',
      '',
      '• Less than 12 hours before, cancellation is only possible',
      '  by phone: +421 905 307 198 and a cancellation fee of €10 will be charged.',
    ];

  return [
    t.clinicName,
    "----------------------------------------",
    `${t.greeting}, ${data.clientName}!`,
    title,
    "",
    `${t.service}: ${data.serviceName}`,
    `${t.dateTime}: ${formattedDate} ${data.time}`,
    `${t.location}: ${t.address}`,
    "----------------------------------------",
    ...cancelPolicy,
    '',
    t.cancelText,
    cancelUrl,
    "",
    t.contact,
  ].join("\n");
}

function generateAdminNotificationHtml(data: EmailRequest): string {
  const formattedDate = formatDate(data.date, "sk");
  const admin = data.adminData!;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Nova rezervacia - FYZIO&FIT</title>
  <style>
    :root { color-scheme: light dark; }
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #18181b !important; }
      .email-card { background-color: #242427 !important; box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; border: 1px solid #3f3f46 !important; }
      .detail-box { background-color: #2f2f36 !important; }
      .detail-border { border-color: #3f3f46 !important; }
      .text-heading { color: #e4e4e7 !important; }
      .text-body { color: #d4d4d8 !important; }
      .text-muted { color: #a1a1aa !important; }
      .text-accent { color: #6dd49e !important; }
      .footer-section { background-color: #1e1e22 !important; border-color: #3f3f46 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body" style="background-color: #f7f9fc; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" class="email-card" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #2d8a5e 0%, #40b07a 100%); padding: 36px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 1px;">Nova rezervacia</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0; font-size: 14px; font-weight: 400;">FYZIO&FIT Booking System</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" class="detail-box" style="background-color: #f0f4f8; border-radius: 12px;">
                <tr><td style="padding: 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #dde5ef;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Klient</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px; font-weight: 600;">${admin.clientName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #dde5ef;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Email</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px;">${admin.clientEmail}</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #dde5ef;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Telefon</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px;">${admin.clientPhone}</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #dde5ef;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Sluzba</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px; font-weight: 600;">${data.serviceName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #dde5ef;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Datum a cas</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px; font-weight: 500;">${formattedDate}</span><br>
                        <span class="text-accent" style="color: #2d8a5e; font-size: 16px; font-weight: 700;">${data.time}</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="detail-border" style="padding: 12px 0;${admin.notes ? ' border-bottom: 1px solid #dde5ef;' : ''}">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Miesto</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px; font-weight: 500;">Krmanová 6, Košice</span>
                      </td>
                    </tr>
                    ${admin.notes ? `<tr>
                      <td style="padding: 12px 0;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Poznamky</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px;">${admin.notes}</span>
                      </td>
                    </tr>` : ''}
                  </table>
                </td></tr>
              </table>
              <!-- Admin Dashboard Button -->
              <div style="text-align: center; padding: 0 30px 30px;">
                <a href="https://booking-fyzioafit.lovable.app/admin" style="display: inline-block; background: linear-gradient(135deg, #2d8a5e 0%, #40b07a 100%); color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">Otvoriť Admin Dashboard</a>
              </div>
            </td>
          </tr>
          <tr>
            <td class="footer-section" style="background-color: #f0f4f8; padding: 20px 30px; text-align: center; border-top: 1px solid #dde5ef;">
              <p class="text-muted" style="color: #6b7c94; margin: 0; font-size: 13px;">Tento email bol automaticky vygenerovany rezervacnym systemom FYZIO&FIT.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function generateAdminNotificationText(data: EmailRequest): string {
  const formattedDate = formatDate(data.date, "sk");
  const admin = data.adminData!;

  return [
    "NOVA REZERVACIA - FYZIO&FIT",
    "========================================",
    `Klient: ${admin.clientName}`,
    `Email: ${admin.clientEmail}`,
    `Telefon: ${admin.clientPhone}`,
    `Sluzba: ${data.serviceName}`,
    `Datum: ${formattedDate}`,
    `Cas: ${data.time}`,
    `Miesto: Krmanová 6, Košice`,
    admin.notes ? `Poznamky: ${admin.notes}` : '',
    "========================================",
  ].filter(Boolean).join("\n");
}

function generateCancellationAdminHtml(data: EmailRequest): string {
  const formattedDate = formatDate(data.date, "sk");
  const admin = data.adminData!;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Zrusena rezervacia - FYZIO&FIT</title>
  <style>
    :root { color-scheme: light dark; }
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #18181b !important; }
      .email-card { background-color: #242427 !important; box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; border: 1px solid #3f3f46 !important; }
      .detail-box { background-color: #2e1616 !important; }
      .detail-border { border-color: #5c2020 !important; }
      .text-heading { color: #e4e4e7 !important; }
      .text-body { color: #d4d4d8 !important; }
      .text-muted { color: #a1a1aa !important; }
      .text-accent { color: #f87171 !important; }
      .footer-section { background-color: #1e1e22 !important; border-color: #3f3f46 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body" style="background-color: #f7f9fc; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" class="email-card" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #b91c1c 0%, #ef4444 100%); padding: 36px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 1px;">Zrusena rezervacia</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0; font-size: 14px; font-weight: 400;">FYZIO&FIT Booking System</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" class="detail-box" style="background-color: #fef2f2; border-radius: 12px;">
                <tr><td style="padding: 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #fecaca;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Klient</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px; font-weight: 600;">${admin.clientName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #fecaca;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Email</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px;">${admin.clientEmail}</span>
                      </td>
                    </tr>
                    ${admin.clientPhone ? `<tr>
                      <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #fecaca;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Telefon</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px;">${admin.clientPhone}</span>
                      </td>
                    </tr>` : ''}
                    <tr>
                      <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #fecaca;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Sluzba</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px; font-weight: 600;">${data.serviceName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #fecaca;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Datum a cas</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px; font-weight: 500;">${formattedDate}</span><br>
                        <span class="text-accent" style="color: #b91c1c; font-size: 16px; font-weight: 700;">${data.time}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Miesto</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px; font-weight: 500;">Krmanová 6, Košice</span>
                      </td>
                    </tr>
              <!-- Admin Dashboard Button -->
              <div style="text-align: center; padding: 0 30px 30px;">
                <a href="https://booking-fyzioafit.lovable.app/admin" style="display: inline-block; background: linear-gradient(135deg, #4a90d9 0%, #6ba3e0 100%); color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">Otvoriť Admin Dashboard</a>
              </div>
            </td>
          </tr>
          <tr>
            <td class="footer-section" style="background-color: #f0f4f8; padding: 20px 30px; text-align: center; border-top: 1px solid #dde5ef;">
              <p class="text-muted" style="color: #6b7c94; margin: 0; font-size: 13px;">Tento email bol automaticky vygenerovany rezervacnym systemom FYZIO&FIT.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function generateCancellationAdminText(data: EmailRequest): string {
  const formattedDate = formatDate(data.date, "sk");
  const admin = data.adminData!;

  return [
    "ZRUSENA REZERVACIA - FYZIO&FIT",
    "========================================",
    `Klient: ${admin.clientName}`,
    `Email: ${admin.clientEmail}`,
    admin.clientPhone ? `Telefon: ${admin.clientPhone}` : '',
    `Sluzba: ${data.serviceName}`,
    `Datum: ${formattedDate}`,
    `Cas: ${data.time}`,
    `Miesto: Krmanová 6, Košice`,
    "========================================",
  ].filter(Boolean).join("\n");
}

serve(async (req) => {
  // CORS Preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Bezpečnejšia kontrola prostredia bez "!"
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseServiceKey) {
      console.error("Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Autorizačná kontrola
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${supabaseServiceKey}`) {
      console.warn("Unauthorized request attempt");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Extrakcia dát
    const data: EmailRequest = await req.json();
    console.log("Sending booking email to:", data.to, "template:", data.template || "confirmation");

    // 4. Overenie hesla pre SMTP
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    if (!smtpPassword) {
      console.error("Server configuration error: SMTP_PASSWORD is missing");
      throw new Error("SMTP_PASSWORD not configured");
    }

    const baseUrl = Deno.env.get("SITE_URL") || "https://booking-fyzioafit.lovable.app";

    // 5. Inicializácia klienta a odoslanie
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.m1.websupport.sk",
        port: 465,
        tls: true,
        auth: {
          username: "booking@fyzioafit.sk",
          password: smtpPassword,
        },
      },
    });

    const isAdminNotification = data.template === "admin-notification";
    const isCancellationAdmin = data.template === "cancellation-admin";
    const t = translations[data.language];
    const isReminder = data.template === "reminder";

    let subject: string;
    let html: string;
    let textContent: string;

    if (isCancellationAdmin) {
      subject = `Zrusena rezervacia: ${data.adminData?.clientName} - ${data.serviceName}`;
      html = generateCancellationAdminHtml(data);
      textContent = generateCancellationAdminText(data);
    } else if (isAdminNotification) {
      subject = `Nova rezervacia: ${data.adminData?.clientName} - ${data.serviceName}`;
      html = generateAdminNotificationHtml(data);
      textContent = generateAdminNotificationText(data);
    } else {
      subject = isReminder ? t.reminderSubject : t.subject;
      html = generateEmailHtml(data, baseUrl);
      textContent = generateEmailText(data, baseUrl);
    }

    await client.send({
      from: "FYZIO&FIT <booking@fyzioafit.sk>",
      to: data.to,
      subject: subject,
      content: textContent,
      html: html,
    });

    await client.close();

    console.log("Email sent successfully to:", data.to);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
