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
  template?: "confirmation" | "reminder" | "admin-notification";
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
    address: "Košice",
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
    address: "Košice",
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
  <title>${isReminder ? t.reminderSubject : t.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f5fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f5fa; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4a90d9 0%, #6ba3e0 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">${t.clinicName}</h1>
            </td>
          </tr><!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1a2b42; margin: 0 0 10px 0; font-size: 20px;">${t.greeting}, ${data.clientName}!</h2>
              <p style="color: #4b5e78; margin: 0 0 30px 0; font-size: 16px;">${title}</p><!-- Booking Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f8fc; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #dde5ef;">
                          <span style="color: #6b7c94; font-size: 14px;">${t.service}</span><br>
                          <span style="color: #1a2b42; font-size: 16px; font-weight: 500;">${data.serviceName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #dde5ef;">
                          <span style="color: #6b7c94; font-size: 14px;">${t.dateTime}</span><br>
                          <span style="color: #1a2b42; font-size: 16px; font-weight: 500;">${formattedDate}</span><br>
                          <span style="color: #4a90d9; font-size: 16px; font-weight: 600;">${data.time}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="color: #6b7c94; font-size: 14px;">${t.location}</span><br>
                          <span style="color: #1a2b42; font-size: 16px; font-weight: 500;">${t.address}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table><!-- Looking forward -->
              <p style="color: #1a2b42; font-size: 18px; font-weight: 600; margin: 0 0 25px 0; text-align: center;">${t.footer}</p><!-- Cancel Section -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff8f0; border: 1px solid #fde0b0; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 24px; color: #92400e; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6;">
                    <p style="margin: 0 0 16px 0; font-weight: 600;">${data.language === 'sk' ? 'Storno podmienky:' : 'Cancellation policy:'}</p>
                    <p style="margin: 0 0 14px 0;">• ${data.language === 'sk' ? 'Rezerváciu je možné zrušiť online najneskôr 12 hodín pred termínom.' : 'You can cancel online up to 12 hours before your appointment.'}</p>
                    <p style="margin: 0 0 14px 0;">• ${data.language === 'sk'
      ? 'Menej ako 12 hodín pred termínom je zrušenie možné,<br>len telefonicky: <strong>+421 905 307 198</strong>'
      : 'Less than 12 hours before — cancellation only<br>by phone: <strong>+421 905 307 198</strong>'}</p>
                    <p style="margin: 0; font-weight: 600; color: #b91c1c;">• ${data.language === 'sk'
      ? 'V prípade nezrušenej rezervácie Vám bude pri ďalšej návšteve<br>účtovaný storno poplatok 10&nbsp;€.'
      : 'A no-show fee of €10 will be charged at your next visit<br>for uncancelled reservations.'}</p>
                  </td>
                </tr>
              </table>
              <div style="text-align: center;">
                <a href="${cancelUrl}" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">${t.cancelButton}</a>
              </div>
            </td>
          </tr><!-- Footer -->
          <tr>
            <td style="background-color: #f5f8fc; padding: 20px 30px; text-align: center; border-top: 1px solid #dde5ef;">
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
      '  len telefonicky: +421 905 307 198',
      '',
      '• V prípade nezrušenej rezervácie Vám bude pri ďalšej návšteve',
      '  účtovaný storno poplatok 10 €.',
    ]
    : [
      '',
      t.footer,
      '',
      'CANCELLATION POLICY:',
      '',
      '• You can cancel online up to 12 hours before your appointment.',
      '',
      '• Less than 12 hours before — cancellation only',
      '  by phone: +421 905 307 198',
      '',
      '• A no-show fee of €10 will be charged at your next visit',
      '  for uncancelled reservations.',
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
  <title>Nova rezervacia - FYZIO&FIT</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f5fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f5fa; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
          <tr>
            <td style="background: linear-gradient(135deg, #2d6a4f 0%, #40916c 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Nova rezervacia</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">FYZIO&FIT Booking System</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f8fc; border-radius: 8px;">
                <tr><td style="padding: 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #dde5ef;">
                        <span style="color: #6b7c94; font-size: 13px;">Klient</span><br>
                        <span style="color: #1a2b42; font-size: 15px; font-weight: 600;">${admin.clientName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #dde5ef;">
                        <span style="color: #6b7c94; font-size: 13px;">Email</span><br>
                        <span style="color: #1a2b42; font-size: 15px;">${admin.clientEmail}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #dde5ef;">
                        <span style="color: #6b7c94; font-size: 13px;">Telefon</span><br>
                        <span style="color: #1a2b42; font-size: 15px;">${admin.clientPhone}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #dde5ef;">
                        <span style="color: #6b7c94; font-size: 13px;">Sluzba</span><br>
                        <span style="color: #1a2b42; font-size: 15px; font-weight: 500;">${data.serviceName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #dde5ef;">
                        <span style="color: #6b7c94; font-size: 13px;">Datum a cas</span><br>
                        <span style="color: #1a2b42; font-size: 15px; font-weight: 500;">${formattedDate}</span><br>
                        <span style="color: #2d6a4f; font-size: 15px; font-weight: 600;">${data.time}</span>
                      </td>
                    </tr>
                    ${admin.notes ? `<tr>
                      <td style="padding: 8px 0;">
                        <span style="color: #6b7c94; font-size: 13px;">Poznamky</span><br>
                        <span style="color: #1a2b42; font-size: 15px;">${admin.notes}</span>
                      </td>
                    </tr>` : ''}
                  </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f5f8fc; padding: 16px 30px; text-align: center; border-top: 1px solid #dde5ef;">
              <p style="color: #6b7c94; margin: 0; font-size: 13px;">Tento email bol automaticky vygenerovany rezervacnym systemom FYZIO&FIT.</p>
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
    admin.notes ? `Poznamky: ${admin.notes}` : '',
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
    const t = translations[data.language];
    const isReminder = data.template === "reminder";

    let subject: string;
    let html: string;
    let textContent: string;

    if (isAdminNotification) {
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
