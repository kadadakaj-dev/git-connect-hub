// @ts-expect-error: Deno-specific URL import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error: Deno-specific URL import
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
// @ts-expect-error: Deno-specific URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

// Improved type safety for Deno Edge Runtime in IDE
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface EmailRequest {
  to: string;
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  cancellationToken: string;
  language: "sk" | "en";
  template?: "confirmation" | "reminder" | "admin-notification" | "cancellation-admin" | "cancellation-client";
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
    addToCalendar: "Pridať do kalendára",
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
    addToCalendar: "Add to Calendar",
  },
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function formatDate(dateStr: string, language: "sk" | "en"): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Bratislava",
  };
  return date.toLocaleDateString(language === "sk" ? "sk-SK" : "en-US", options);
}

function generateGoogleCalendarUrl(data: EmailRequest): string {
  const [h, m] = data.time.split(':').map(Number);
  const startDate = new Date(data.date);
  startDate.setHours(h, m, 0, 0);
  
  // Predpokldáme 30 minút ak nie je špecifikované inak (väčšina služieb)
  const endDate = new Date(startDate.getTime() + 30 * 60000);
  
  const formatG = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const title = `FYZIO & FIT: ${data.serviceName}`;
  const details = `Vaša rezervácia pre ${data.clientName}.\nMiesto: Krmanová 6, Košice`;
  const location = "Krmanová 6, 040 01 Košice, Slovensko";
  
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatG(startDate)}/${formatG(endDate)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
}

function generateEmailHtml(data: EmailRequest, baseUrl: string): string {
  const t = translations[data.language];
  const formattedDate = formatDate(data.date, data.language);
  const cancelUrl = `${baseUrl}/cancel?token=${data.cancellationToken}`;
  const isReminder = data.template === "reminder";
  const title = isReminder ? t.reminderTitle : t.confirmationTitle;

  // Liquid Glass Aqua Tokens
  const colors = {
    brandBlue: '#006fb8',
    brandBlueLight: '#00a7ed',
    brandSky: '#89CFF0',
    brandGlow: '#E0F7FA',
    textInk: '#0a0b1e',
    textSlate: '#334155',
    white: '#ffffff',
    error: '#ef4444'
  };

  return `
<!DOCTYPE html>
<html lang="${data.language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${isReminder ? t.reminderSubject : t.subject}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .glass-card { 
      box-shadow: 0 12px 40px rgba(0, 111, 184, 0.1);
      border: 1px solid rgba(0, 111, 184, 0.1);
    }
    @media (max-width: 600px) {
      .container { width: 100% !important; padding: 10px !important; }
      .content { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table class="container" width="600" border="0" cellpadding="0" cellspacing="0" style="width: 600px; margin: 0 auto;">
          <!-- Logo & Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="${baseUrl}/app-icon.png" alt="FYZIO & FIT" width="64" height="64" style="display: block; border-radius: 16px;">
            </td>
          </tr>
          <!-- Main Card -->
          <tr>
            <td class="glass-card" style="background-color: #ffffff; border-radius: 24px; overflow: hidden;">
              <!-- Aqua Header Blob -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, ${colors.brandSky} 0%, ${colors.brandBlueLight} 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.05);">${t.clinicName}</h1>
                  </td>
                </tr>
                <tr>
                  <td class="content" style="padding: 40px 40px 30px 40px;">
                    <h2 style="color: ${colors.textInk}; margin: 0 0 16px 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">${t.greeting}, ${escapeHtml(data.clientName)}!</h2>
                    <p style="color: ${colors.textSlate}; margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; opacity: 0.9;">${title}</p>
                    
                    <!-- Appointment Detail Box -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: ${colors.brandGlow}; border-radius: 16px; margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 24px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-bottom: 16px; border-bottom: 1px solid rgba(0, 111, 184, 0.1);">
                                <div style="color: ${colors.brandBlue}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${t.service}</div>
                                <div style="color: ${colors.textInk}; font-size: 17px; font-weight: 600;">${data.serviceName}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(0, 111, 184, 0.1);">
                                <div style="color: ${colors.brandBlue}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${t.dateTime}</div>
                                <div style="color: ${colors.textInk}; font-size: 17px; font-weight: 600;">${formattedDate} o <span style="color: ${colors.brandBlueLight};">${data.time}</span></div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top: 16px;">
                                <div style="color: ${colors.brandBlue}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${t.location}</div>
                                <div style="color: ${colors.textInk}; font-size: 15px; font-weight: 500;">${t.address}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Actions -->
                    <div style="text-align: center; margin-bottom: 40px;">
                      <a href="${generateGoogleCalendarUrl(data)}" style="display: inline-block; background: linear-gradient(135deg, ${colors.brandBlueLight} 0%, ${colors.brandBlue} 100%); color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 15px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 167, 237, 0.3);">${t.addToCalendar}</a>
                    </div>

                    <!-- Policy Box -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fff8f8; border-left: 4px solid ${colors.error}; border-radius: 4px; margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 20px;">
                          <div style="color: ${colors.error}; font-size: 14px; font-weight: 700; margin-bottom: 8px;">${data.language === 'sk' ? 'Storno podmienky' : 'Cancellation Policy'}</div>
                          <div style="color: ${colors.textSlate}; font-size: 14px; line-height: 1.5; opacity: 0.85;">
                            ${data.language === 'sk' 
                              ? 'Bezplatné zrušenie je možné najneskôr 10 hodín pred termínom. Po tomto čase nás prosím kontaktujte telefonicky (+421 905 307 198).' 
                              : 'Free cancellation is possible up to 10 hours before. After this time, please contact us by phone (+421 905 307 198).'}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <div style="text-align: center;">
                      <a href="${cancelUrl}" style="color: ${colors.error}; text-decoration: none; font-size: 14px; font-weight: 500; border-bottom: 1px solid ${colors.error}; padding-bottom: 2px;">${t.cancelButton}</a>
                    </div>
                  </td>
                </tr>
                <!-- Footer Info -->
                <tr>
                  <td style="background-color: #f1f5f9; padding: 24px; text-align: center;">
                    <div style="color: ${colors.textSlate}; font-size: 13px; opacity: 0.7;">
                      ${t.footer}<br>
                      ${t.clinicName} • ${t.address}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Bottom Links -->
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Tento email bol odoslaný automaticky rezervačným systémom FYZIO & FIT.
              </p>
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
      '• Bezplatné online zrušenie je možné najneskôr 10 hodín pred termínom.',
      '',
      '• Po uplynutí tejto lehoty je zrušenie možné výlučne telefonicky',
      '  na čísle +421 905 307 198, pričom bude účtovaný storno poplatok 10 €.',
    ]
    : [
      '',
      t.footer,
      '',
      'CANCELLATION POLICY:',
      '',
      '• Free online cancellation is available up to 10 hours before your appointment.',
      '',
      '• After this period, cancellation is only possible by phone',
      '  at +421 905 307 198, subject to a €10 cancellation fee.',
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
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body" style="background-color: #ffffff; padding: 20px;">
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
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px; font-weight: 600;">${escapeHtml(admin.clientName)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #dde5ef;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Email</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px;">${escapeHtml(admin.clientEmail)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #dde5ef;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Telefon</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px;">${escapeHtml(admin.clientPhone)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #dde5ef;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Sluzba</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px; font-weight: 600;">${data.serviceName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="detail-border" style="padding: 12px 0;${admin.notes ? ' border-bottom: 1px solid #dde5ef;' : ''}">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Datum a cas</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px; font-weight: 500;">${formattedDate}</span><br>
                        <span class="text-accent" style="color: #2d8a5e; font-size: 16px; font-weight: 700;">${data.time}</span>
                      </td>
                    </tr>
                    ${admin.notes ? `<tr>
                      <td style="padding: 12px 0;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Poznamky</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px;">${escapeHtml(admin.notes || '')}</span>
                      </td>
                    </tr>` : ''}
                  </table>
                </td></tr>
              </table>
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
    `Klient: ${escapeHtml(admin.clientName)}`,
    `Email: ${escapeHtml(admin.clientEmail)}`,
    `Telefon: ${escapeHtml(admin.clientPhone)}`,
    `Sluzba: ${data.serviceName}`,
    `Datum: ${formattedDate}`,
    `Cas: ${data.time}`,
    admin.notes ? `Poznamky: ${escapeHtml(admin.notes)}` : '',
    "========================================",
  ].filter(Boolean).join("\n");
}

function generateReminderHtml(data: EmailRequest, baseUrl: string): string {
  const t = translations[data.language];
  const formattedDate = formatDate(data.date, data.language);
  const cancelUrl = `${baseUrl}/cancel?token=${data.cancellationToken}`;

  const labels = data.language === 'sk' ? {
    reminder: '🔔 PRIPOMIENKA',
    subtitle: 'Váš termín je už zajtra!',
    penaltyTitle: '⚠️ STORNO POPLATOK: 10 €',
    penaltyLine1: 'Zrušenie menej ako 10 hodín pred termínom je možné <strong>len telefonicky</strong>.',
    penaltyLine2: 'Bude Vám účtovaný storno poplatok <strong>10&nbsp;€</strong>.',
    phoneLabel: 'Volajte:',
    onlineCancel: 'Online zrušenie je možné najneskôr 10 hodín pred termínom:',
  } : {
    reminder: '🔔 REMINDER',
    subtitle: 'Your appointment is tomorrow!',
    penaltyTitle: '⚠️ CANCELLATION FEE: €10',
    penaltyLine1: 'Cancellation less than 10 hours before the appointment is only possible <strong>by phone</strong>.',
    penaltyLine2: 'A cancellation fee of <strong>€10</strong> will be charged.',
    phoneLabel: 'Call:',
    onlineCancel: 'Online cancellation is possible up to 10 hours before the appointment:',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.language === 'sk' ? 'Pripomienka termínu' : 'Appointment Reminder'}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 36px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1.5px;">${labels.reminder}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px; font-weight: 400;">${labels.subtitle}</p>
            </td>
          </tr>
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 10px 30px;">
              <h2 style="color: #1a2b42; margin: 0; font-size: 20px; font-weight: 600;">${t.greeting}, ${escapeHtml(data.clientName)}!</h2>
            </td>
          </tr>
          <!-- Booking Details -->
          <tr>
            <td style="padding: 10px 30px 20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; border-radius: 12px;">
                <tr><td style="padding: 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #dde5ef;">
                        <span style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.service}</span><br>
                        <span style="color: #1a2b42; font-size: 16px; font-weight: 600;">${data.serviceName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #dde5ef;">
                        <span style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.dateTime}</span><br>
                        <span style="color: #1a2b42; font-size: 16px; font-weight: 500;">${formattedDate}</span><br>
                        <span style="color: #dc2626; font-size: 18px; font-weight: 700;">${data.time}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0;">
                        <span style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.location}</span><br>
                        <span style="color: #1a2b42; font-size: 16px; font-weight: 500;">${t.address}</span>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <!-- BIG RED PENALTY BANNER -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #dc2626; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 28px 30px; text-align: center;">
                    <p style="color: #ffffff; margin: 0 0 12px 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">${labels.penaltyTitle}</p>
                    <p style="color: rgba(255,255,255,0.9); margin: 0 0 8px 0; font-size: 15px; line-height: 1.6;">${labels.penaltyLine1}</p>
                    <p style="color: rgba(255,255,255,0.9); margin: 0 0 16px 0; font-size: 15px; line-height: 1.6;">${labels.penaltyLine2}</p>
                    <p style="color: rgba(255,255,255,0.7); margin: 0 0 4px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">${labels.phoneLabel}</p>
                    <p style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 1px;">+421 905 307 198</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Online cancel -->
          <tr>
            <td style="padding: 0 30px 10px 30px;">
              <p style="color: #4b5e78; font-size: 14px; margin: 0 0 14px 0; text-align: center;">${labels.onlineCancel}</p>
              <div style="text-align: center;">
                <a href="${cancelUrl}" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600;">${t.cancelButton}</a>
              </div>
            </td>
          </tr>
          <!-- Looking forward -->
          <tr>
            <td style="padding: 20px 30px;">
              <p style="color: #1a2b42; font-size: 18px; font-weight: 600; margin: 0; text-align: center;">${t.footer}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f0f4f8; padding: 20px 30px; text-align: center; border-top: 1px solid #dde5ef;">
              <p style="color: #6b7c94; margin: 0; font-size: 14px;">${t.contact}</p>
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

function generateReminderText(data: EmailRequest, baseUrl: string): string {
  const t = translations[data.language];
  const formattedDate = formatDate(data.date, data.language);
  const cancelUrl = `${baseUrl}/cancel?token=${data.cancellationToken}`;

  const penaltyBlock = data.language === 'sk'
    ? [
      '',
      '════════════════════════════════════════',
      '⚠️  STORNO POPLATOK: 10 €',
      '════════════════════════════════════════',
      '',
      '• Zrušenie menej ako 10 hodín pred termínom',
      '  je možné LEN TELEFONICKY.',
      '• Bude Vám účtovaný storno poplatok 10 €.',
      '',
      'Volajte: +421 905 307 198',
      '',
      '════════════════════════════════════════',
    ]
    : [
      '',
      '════════════════════════════════════════',
      '⚠️  CANCELLATION FEE: €10',
      '════════════════════════════════════════',
      '',
      '• Cancellation less than 10 hours before',
      '  the appointment is only possible BY PHONE.',
      '• A cancellation fee of €10 will be charged.',
      '',
      'Call: +421 905 307 198',
      '',
      '════════════════════════════════════════',
    ];

  return [
    `🔔 ${data.language === 'sk' ? 'PRIPOMIENKA' : 'REMINDER'} - ${t.clinicName}`,
    '========================================',
    `${t.greeting}, ${data.clientName}!`,
    data.language === 'sk' ? 'Váš termín je už zajtra!' : 'Your appointment is tomorrow!',
    '',
    `${t.service}: ${data.serviceName}`,
    `${t.dateTime}: ${formattedDate} ${data.time}`,
    `${t.location}: ${t.address}`,
    ...penaltyBlock,
    '',
    data.language === 'sk' ? 'Online zrušenie (najneskôr 10h pred termínom):' : 'Online cancellation (up to 10h before):',
    cancelUrl,
    '',
    t.footer,
    '',
    t.contact,
  ].join('\n');
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
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body" style="background-color: #ffffff; padding: 20px;">
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
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px; font-weight: 600;">${escapeHtml(admin.clientName)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #fecaca;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Email</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px;">${escapeHtml(admin.clientEmail)}</span>
                      </td>
                    </tr>
                    ${admin.clientPhone ? `<tr>
                      <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #fecaca;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Telefon</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px;">${escapeHtml(admin.clientPhone)}</span>
                      </td>
                    </tr>` : ''}
                    <tr>
                      <td class="detail-border" style="padding: 12px 0; border-bottom: 1px solid #fecaca;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Sluzba</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px; font-weight: 600;">${data.serviceName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0;">
                        <span class="text-muted" style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Datum a cas</span><br>
                        <span class="text-heading" style="color: #1a2b42; font-size: 16px; font-weight: 500;">${formattedDate}</span><br>
                        <span class="text-accent" style="color: #b91c1c; font-size: 16px; font-weight: 700;">${data.time}</span>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
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
    `Klient: ${escapeHtml(admin.clientName)}`,
    `Email: ${escapeHtml(admin.clientEmail)}`,
    admin.clientPhone ? `Telefon: ${escapeHtml(admin.clientPhone)}` : '',
    `Sluzba: ${data.serviceName}`,
    `Datum: ${formattedDate}`,
    `Cas: ${data.time}`,
    "========================================",
  ].filter(Boolean).join("\n");
}

function generateCancellationClientHtml(data: EmailRequest, baseUrl: string): string {
  const formattedDate = formatDate(data.date, data.language);
  const t = translations[data.language];
  const labels = data.language === 'sk' ? {
    title: 'Vaša rezervácia bola zrušená',
    subtitle: 'Potvrdenie o zrušení rezervácie',
    infoText: 'Ak si želáte vytvoriť novú rezerváciu, kliknite na tlačidlo nižšie.',
    ctaButton: 'Vytvoriť novú rezerváciu',
    cancelledLabel: 'ZRUŠENÁ',
  } : {
    title: 'Your booking has been cancelled',
    subtitle: 'Cancellation confirmation',
    infoText: 'If you would like to make a new booking, click the button below.',
    ctaButton: 'Make a new booking',
    cancelledLabel: 'CANCELLED',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${labels.subtitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4a90d9 0%, #6ba3e0 100%); padding: 36px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1.5px;">${t.clinicName}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 15px;">${labels.subtitle}</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1a2b42; margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">${t.greeting}, ${escapeHtml(data.clientName)}!</h2>
              <p style="color: #4b5e78; margin: 0 0 30px 0; font-size: 16px; line-height: 1.5;">${labels.title}</p>
              <!-- Booking Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; border-radius: 12px; margin-bottom: 24px;">
                <tr><td style="padding: 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #dde5ef;">
                        <span style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.service}</span><br>
                        <span style="color: #1a2b42; font-size: 16px; font-weight: 600;">${data.serviceName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #dde5ef;">
                        <span style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.dateTime}</span><br>
                        <span style="color: #1a2b42; font-size: 16px; font-weight: 500; text-decoration: line-through;">${formattedDate}</span><br>
                        <span style="color: #ef4444; font-size: 16px; font-weight: 700; text-decoration: line-through;">${data.time}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #dde5ef;">
                        <span style="color: #6b7c94; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.location}</span><br>
                        <span style="color: #1a2b42; font-size: 16px; font-weight: 500;">${t.address}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0;">
                        <span style="display: inline-block; background-color: #fef2f2; color: #dc2626; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 8px; letter-spacing: 0.5px;">${labels.cancelledLabel}</span>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
              <!-- Info box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-left: 4px solid #4a90d9; border-radius: 0 12px 12px 0; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="color: #1a2b42; margin: 0; font-size: 15px; line-height: 1.6;">${labels.infoText}</p>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <div style="text-align: center;">
                <a href="${baseUrl}" style="display: inline-block; background: linear-gradient(135deg, #4a90d9 0%, #6ba3e0 100%); color: #ffffff; padding: 16px 36px; border-radius: 10px; text-decoration: none; font-size: 16px; font-weight: 600; letter-spacing: 0.3px;">${labels.ctaButton}</a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f0f4f8; padding: 20px 30px; text-align: center; border-top: 1px solid #dde5ef;">
              <p style="color: #6b7c94; margin: 0; font-size: 14px;">${t.contact}</p>
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

function generateCancellationClientText(data: EmailRequest, baseUrl: string): string {
  const formattedDate = formatDate(data.date, data.language);
  const t = translations[data.language];
  const labels = data.language === 'sk' ? {
    title: 'Vaša rezervácia bola zrušená',
    infoText: 'Ak si želáte vytvoriť novú rezerváciu, navštívte:',
  } : {
    title: 'Your booking has been cancelled',
    infoText: 'If you would like to make a new booking, visit:',
  };

  return [
    t.clinicName,
    '========================================',
    `${t.greeting}, ${data.clientName}!`,
    labels.title,
    '',
    `${t.service}: ${data.serviceName}`,
    `${t.dateTime}: ${formattedDate} ${data.time} [ZRUŠENÁ/CANCELLED]`,
    `${t.location}: ${t.address}`,
    '========================================',
    '',
    labels.infoText,
    baseUrl,
    '',
    t.contact,
  ].join('\n');
}

serve(async (req: Request) => {
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const baseUrl = Deno.env.get("SITE_URL") || "https://booking.fyzioafit.sk";

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
    const isCancellationClient = data.template === "cancellation-client";
    const t = translations[data.language];
    const isReminder = data.template === "reminder";

    let subject: string;
    let html: string;
    let textContent: string;

    if (isCancellationClient) {
      subject = data.language === 'sk'
        ? 'Potvrdenie zrušenia rezervácie - FYZIO&FIT'
        : 'Booking Cancellation Confirmation - FYZIO&FIT';
      html = generateCancellationClientHtml(data, baseUrl);
      textContent = generateCancellationClientText(data, baseUrl);
    } else if (isCancellationAdmin) {
      subject = `Zrusena rezervacia: ${data.adminData?.clientName} - ${data.serviceName}`;
      html = generateCancellationAdminHtml(data);
      textContent = generateCancellationAdminText(data);
    } else if (isAdminNotification) {
      subject = `Nova rezervacia: ${data.adminData?.clientName} - ${data.serviceName}`;
      html = generateAdminNotificationHtml(data);
      textContent = generateAdminNotificationText(data);
    } else if (isReminder) {
      subject = data.language === 'sk'
        ? '⚠️ PRIPOMIENKA: Váš termín zajtra - FYZIO&FIT'
        : '⚠️ REMINDER: Your appointment tomorrow - FYZIO&FIT';
      html = generateReminderHtml(data, baseUrl);
      textContent = generateReminderText(data, baseUrl);
    } else {
      subject = t.subject;
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

    // 6. Log attempt to DB (Success)
    try {
      await supabase.from("email_send_log").insert({
        recipient_email: data.to,
        subject: subject,
        status: "sent",
        metadata: { 
          template: data.template || "confirmation",
          serviceName: data.serviceName,
          clientName: data.clientName 
        }
      });
    } catch (logErr) {
      console.error("Failed to log email success to DB:", logErr);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";

    // 7. Log attempt to DB (Error)
    try {
      // Re-initialize supabase if it wasn't yet (safety first)
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const url = Deno.env.get("SUPABASE_URL");
      if (serviceKey && url) {
        const supabaseErrorLog = createClient(url, serviceKey);
        // We use a separate request data extract logic here if body parsing failed
        // But assuming 'data' from try block might not be available, we use safe fallback
        await supabaseErrorLog.from("email_send_log").insert({
          recipient_email: "unknown", // fallback
          subject: "Email Error",
          status: "error",
          error_message: message
        });
      }
    } catch (logErr) {
      console.error("Failed to log email error to DB:", logErr);
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
