export interface EmailRequest {
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

export const translations = {
  sk: {
    subject: "Potvrdenie rezervácie",
    reminderSubject: "Pripomienka termínu",
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
    clinicName: "FYZIOAFIT",
    contact: "Kontakt: booking@fyzioafit.sk",
    addToCalendar: "Pridať do kalendára",
    cancelPolicyTitle: "Storno podmienky",
    cancelPolicy: "Bezplatné zrušenie je možné najneskôr 10 hodín pred termínom. Po uplynutí tejto doby bude účtovaný storno poplatok 10 €. V prípade nutnosti nás kontaktujte telefonicky (+421 905 307 198).",
  },
  en: {
    subject: "Booking Confirmation",
    reminderSubject: "Appointment Reminder",
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
    clinicName: "FYZIOAFIT",
    contact: "Contact: booking@fyzioafit.sk",
    addToCalendar: "Add to Calendar",
    cancelPolicyTitle: "Cancellation Policy",
    cancelPolicy: "Free cancellation is possible up to 10 hours before the appointment. After this time, a cancellation fee of €10 will be charged. If necessary, please contact us by phone (+421 905 307 198).",
  },
};

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function trimHtml(html: string): string {
  return html
    .split('\n')
    .map(line => line.trimEnd())
    .filter(line => line.trim() !== '')
    .join('\n');
}

export function formatDate(dateStr: string, language: "sk" | "en"): string {
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

export function generateGoogleCalendarUrl(data: EmailRequest): string {
  const [h, m] = data.time.split(':').map(Number);
  const startDate = new Date(data.date);
  startDate.setHours(h, m, 0, 0);
  
  const endDate = new Date(startDate.getTime() + 30 * 60000);
  
  const formatG = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const title = `FYZIOAFIT: ${data.serviceName}`;
  const details = `Vaša rezervácia pre ${data.clientName}.\nMiesto: Krmanová 6, Košice`;
  const location = "Krmanová 6, 040 01 Košice, Slovensko";
  
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatG(startDate)}/${formatG(endDate)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
}

export function generateSubject(data: EmailRequest): string {
  const isCancellationClient = data.template === "cancellation-client";
  const isCancellationAdmin = data.template === "cancellation-admin";
  const isAdminNotification = data.template === "admin-notification";
  const isReminder = data.template === "reminder";
  const serviceName = escapeHtml(data.serviceName || (data.language === 'sk' ? 'Naša služba' : 'Our Service'));
  
  if (isCancellationClient) {
    return `Zrušenie: ${serviceName} - FYZIOAFIT`;
  } else if (isCancellationAdmin) {
    return `ZRUŠENÁ: ${serviceName} | ${data.adminData?.clientName || 'Klient'}`;
  } else if (isAdminNotification) {
    return `[REZERVÁCIA] ${serviceName} - ${data.adminData?.clientName || 'Klient'}`;
  } else if (isReminder) {
    return `Pripomienka: ${serviceName} - FYZIOAFIT`;
  } else {
    return `Potvrdenie: ${serviceName} - FYZIOAFIT`;
  }
}

export function generateEmailHtml(data: EmailRequest, baseUrl: string): string {
  const t = translations[data.language];
  const formattedDate = formatDate(data.date, data.language);
  const cancelUrl = `${baseUrl}/cancel?token=${data.cancellationToken}`;
  const isReminder = data.template === "reminder";
  const title = isReminder ? t.reminderTitle : t.confirmationTitle;
  const serviceName = escapeHtml(data.serviceName || (data.language === 'sk' ? 'Naša služba' : 'Our Service'));

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
  <title>${serviceName} | ✅</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .glass-card { 
      box-shadow: 0 12px 40px rgba(0, 111, 184, 0.1);
      border: 1px solid rgba(0, 111, 184, 0.1);
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" border="0" cellpadding="0" cellspacing="0" style="width: 600px; margin: 0 auto;">
          <tr>
            <td class="glass-card" style="background-color: #ffffff; border-radius: 24px; overflow: hidden;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, ${colors.brandSky} 0%, ${colors.brandBlueLight} 100%); padding: 45px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">${serviceName}</h1>
                    <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0; font-size: 15px; font-weight: 500; letter-spacing: 0.5px;">FYZIOAFIT Booking System</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 40px 30px 40px;">
                    <h2 style="color: ${colors.textInk}; margin: 0 0 16px 0; font-size: 22px; font-weight: 700;">${t.greeting}, ${escapeHtml(data.clientName)}!</h2>
                    <p style="color: ${colors.textSlate}; margin: 0 0 32px 0; font-size: 16px; line-height: 1.6;">${title}</p>
                    
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: ${colors.brandGlow}; border-radius: 16px; margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 24px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-bottom: 16px; border-bottom: 1px solid rgba(0, 111, 184, 0.1);">
                                <div style="color: ${colors.brandBlue}; font-size: 11px; font-weight: 700; text-transform: uppercase;">${t.service}</div>
                                <div style="color: ${colors.textInk}; font-size: 17px; font-weight: 600;">${serviceName}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(0, 111, 184, 0.1);">
                                <div style="color: ${colors.brandBlue}; font-size: 11px; font-weight: 700; text-transform: uppercase;">${t.dateTime}</div>
                                <div style="color: ${colors.textInk}; font-size: 17px; font-weight: 600;">${formattedDate} o <span style="color: ${colors.brandBlueLight};">${data.time}</span></div>
                              </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 16px;">
                                <div style="color: ${colors.brandBlue}; font-size: 11px; font-weight: 700; text-transform: uppercase;">${t.location}</div>
                                <div style="color: ${colors.textInk}; font-size: 15px; font-weight: 500;">${t.address}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <div style="text-align: center; margin-bottom: 40px;">
                      <a href="${generateGoogleCalendarUrl(data)}" style="display: inline-block; background: linear-gradient(135deg, ${colors.brandBlueLight} 0%, ${colors.brandBlue} 100%); color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 15px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 167, 237, 0.25);">${t.addToCalendar}</a>
                    </div>

                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fff8f8; border-left: 4px solid #ef4444; border-radius: 4px; margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 20px;">
                          <div style="color: #ef4444; font-size: 14px; font-weight: 700; margin-bottom: 8px;">${t.cancelPolicyTitle}</div>
                          <div style="color: #334155; font-size: 14px; line-height: 1.5;">${t.cancelPolicy}</div>
                        </td>
                      </tr>
                    </table>

                    <div style="text-align: center;">
                      <a href="${cancelUrl}" style="color: ${colors.error}; text-decoration: none; font-size: 14px; font-weight: 500; border-bottom: 1px solid ${colors.error}; opacity: 0.8;">${t.cancelButton}</a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px; text-align: center; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                    <div style="color: #64748b; font-size: 13px; line-height: 1.6;">
                      ${t.footer}<br>
                      <strong>${t.clinicName}</strong> • ${t.address}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0; letter-spacing: 0.2px;">
                Tento luxusný e-mail bol odoslaný automaticky rezervačným systémom FYZIOAFIT.
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

export function generateEmailText(data: EmailRequest, baseUrl: string): string {
  const t = translations[data.language];
  const formattedDate = formatDate(data.date, data.language);
  const cancelUrl = `${baseUrl}/cancel?token=${data.cancellationToken}`;
  const isReminder = data.template === "reminder";
  const title = isReminder ? t.reminderTitle : t.confirmationTitle;
  const serviceName = escapeHtml(data.serviceName || (data.language === 'sk' ? 'Naša služba' : 'Our Service'));

  return [
    `✅ ${serviceName.toUpperCase()}`,
    `FYZIOAFIT Booking System`,
    "----------------------------------------",
    `${t.greeting}, ${data.clientName}!`,
    title,
    "",
    `${t.service}: ${serviceName}`,
    `${t.dateTime}: ${formattedDate} ${data.time}`,
    `${t.location}: ${t.address}`,
    "----------------------------------------",
    "",
    `⚠ ${t.cancelPolicyTitle}`,
    t.cancelPolicy,
    "----------------------------------------",
    "",
    t.cancelText,
    cancelUrl,
    "",
    t.contact,
  ].join("\n");
}

export function generateAdminNotificationHtml(data: EmailRequest): string {
  const formattedDate = formatDate(data.date, "sk");
  const admin = data.adminData!;
  const dashboardUrl = "https://fyzioafit.sk/admin";
  const serviceName = escapeHtml(data.serviceName || 'Nová služba');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nová rezervácia | 📅</title>
</head>
<body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); border: 1px solid #eef2f6;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e704a 0%, #34d399 100%); padding: 45px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">${serviceName}</h1>
              <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0; font-size: 15px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Nová rezervácia</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <tr><td style="padding: 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                        <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Klient</span><br>
                        <span style="color: #1a2b42; font-size: 16px; font-weight: 600;">${escapeHtml(admin?.clientName || 'Neznámy klient')}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                        <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Email</span><br>
                        <span style="color: #1a2b42; font-size: 16px;">${escapeHtml(admin?.clientEmail || '-')}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                        <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Služba</span><br>
                        <span style="color: #1a2b42; font-size: 16px; font-weight: 600;">${serviceName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0;">
                        <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Dátum a čas</span><br>
                        <span style="color: #1e704a; font-size: 17px; font-weight: 700;">${formattedDate} o ${data.time}</span>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 40px; text-align: center;">
              <a href="${dashboardUrl}" style="display: inline-block; padding: 16px 32px; background-color: #1e293b; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 10px rgba(30, 41, 59, 0.2);">Otvoriť Admin Panel</a>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; margin: 0; font-size: 14px; font-weight: 600;">FYZIOAFIT Booking System</p>
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

export function generateAdminNotificationText(data: EmailRequest): string {
  const formattedDate = formatDate(data.date, "sk");
  const admin = data.adminData!;
  const serviceName = escapeHtml(data.serviceName || 'Nová služba');

  return [
    `REZERVÁCIA: ${serviceName.toUpperCase()}`,
    "========================================",
    `Klient: ${escapeHtml(admin?.clientName || 'Neznámy klient')}`,
    `Email: ${escapeHtml(admin?.clientEmail || '-')}`,
    `Tel: ${escapeHtml(admin?.clientPhone || '-')}`,
    `Služba: ${serviceName}`,
    `Dátum: ${formattedDate}`,
    `Čas: ${data.time}`,
    "========================================",
  ].join("\n");
}

export function generateReminderHtml(data: EmailRequest, baseUrl: string): string {
  const t = translations[data.language];
  const formattedDate = formatDate(data.date, data.language);
  const cancelUrl = `${baseUrl}/cancel?token=${data.cancellationToken}`;
  const serviceName = escapeHtml(data.serviceName || (data.language === 'sk' ? 'Naša služba' : 'Our Service'));

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pripomienka | 🔔</title>
</head>
<body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(185, 28, 28, 0.1); border: 1px solid #fee2e2;">
          <tr>
            <td style="background: linear-gradient(135deg, #991b1b 0%, #ef4444 100%); padding: 45px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">${serviceName}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Pripomienka termínu</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1a2b42; margin: 0 0 20px 0; font-size: 20px; font-weight: 700;">${t.greeting}, ${escapeHtml(data.clientName)}!</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffafb; border-radius: 12px; margin-bottom: 30px; border: 1px solid #fee2e2;">
                <tr><td style="padding: 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #fee2e2;">
                        <span style="color: #991b1b; font-size: 11px; text-transform: uppercase; font-weight: 700;">${t.service}</span><br>
                        <span style="color: #1a2b42; font-size: 17px; font-weight: 600;">${serviceName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0;">
                        <span style="color: #991b1b; font-size: 11px; text-transform: uppercase; font-weight: 700;">${t.dateTime}</span><br>
                        <span style="color: #b91c1c; font-size: 18px; font-weight: 800;">${formattedDate} o ${data.time}</span>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fff8f8; border-left: 4px solid #ef4444; border-radius: 4px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="color: #ef4444; font-size: 14px; font-weight: 700; margin-bottom: 8px;">${t.cancelPolicyTitle}</div>
                    <div style="color: #334155; font-size: 14px; line-height: 1.5;">${t.cancelPolicy}</div>
                  </td>
                </tr>
              </table>
              <div style="text-align: center;">
                <a href="${cancelUrl}" style="color: #ef4444; font-size: 14px; font-weight: 700; text-decoration: none; border-bottom: 1px solid #ef4444; padding-bottom: 2px;">${t.cancelButton}</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fef2f2; padding: 25px 30px; text-align: center;">
              <p style="color: #991b1b; margin: 0; font-size: 13px; font-weight: 500;"><strong>${t.clinicName}</strong> • ${t.address}</p>
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

export function generateReminderText(data: EmailRequest, baseUrl: string): string {
  const t = translations[data.language];
  const formattedDate = formatDate(data.date, data.language);
  const serviceName = escapeHtml(data.serviceName || (data.language === 'sk' ? 'Naša služba' : 'Our Service'));

  return [
    `🔔 PRIPOMIENKA: ${serviceName.toUpperCase()}`,
    "========================================",
    `${t.greeting}, ${data.clientName}!`,
    "",
    `${t.service}: ${serviceName}`,
    `${t.dateTime}: ${formattedDate} o ${data.time}`,
    "----------------------------------------",
    "",
    `⚠ ${t.cancelPolicyTitle}`,
    t.cancelPolicy,
    "----------------------------------------",
    "",
    t.cancelText,
    "",
    t.contact,
  ].join("\n");
}

export function generateCancellationAdminHtml(data: EmailRequest): string {
  const formattedDate = formatDate(data.date, "sk");
  const admin = data.adminData!;
  const dashboardUrl = "https://fyzioafit.sk/admin";
  const serviceName = escapeHtml(data.serviceName || 'Zrušená služba');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zrušená | ❌</title>
</head>
<body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); border: 1px solid #fecaca;">
          <tr>
            <td style="background: linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%); padding: 45px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">${serviceName}</h1>
              <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0; font-size: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Zrušená rezervácia</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff5f5; border-radius: 12px; border: 1px solid #fecaca;">
                <tr><td style="padding: 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #fecaca;">
                        <span style="color: #991b1b; font-size: 11px; text-transform: uppercase; font-weight: 700;">Klient</span><br>
                        <span style="color: #1a2b42; font-size: 16px; font-weight: 600;">${escapeHtml(admin?.clientName || 'Neznámy klient')}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #fecaca;">
                        <span style="color: #991b1b; font-size: 11px; text-transform: uppercase; font-weight: 700;">Služba</span><br>
                        <span style="color: #1a2b42; font-size: 16px; font-weight: 600;">${serviceName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0;">
                        <span style="color: #991b1b; font-size: 11px; text-transform: uppercase; font-weight: 700;">Pôvodný termín</span><br>
                        <span style="color: #7f1d1d; font-size: 17px; font-weight: 800; text-decoration: line-through;">${formattedDate} o ${data.time}</span>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 40px; text-align: center;">
              <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 28px; background-color: #7f1d1d; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px;">Otvoriť Admin Panel</a>
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

export function generateCancellationAdminText(data: EmailRequest): string {
  const formattedDate = formatDate(data.date, "sk");
  const admin = data.adminData!;
  const serviceName = escapeHtml(data.serviceName || 'Zrušená služba');

  return [
    `❌ ZRUŠENÁ REZERVÁCIA: ${serviceName.toUpperCase()}`,
    "========================================",
    `Klient: ${escapeHtml(admin?.clientName || 'Neznámy klient')}`,
    `Termín bol zrušený.`,
    "========================================",
  ].join("\n");
}

export function generateCancellationClientHtml(data: EmailRequest, baseUrl: string): string {
  const formattedDate = formatDate(data.date, data.language);
  const t = translations[data.language];
  const serviceName = escapeHtml(data.serviceName || (data.language === 'sk' ? 'Naša služba' : 'Our Service'));
  
  const labels = data.language === 'sk' ? {
    title: 'Vaša rezervácia bola zrušená',
    subtitle: 'ZRUŠENÁ REZERVÁCIA',
    ctaButton: 'Vytvoriť novú rezerváciu',
  } : {
    title: 'Your booking has been cancelled',
    subtitle: 'CANCELLED BOOKING',
    ctaButton: 'Make a new booking',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zrušenie | ❌</title>
</head>
<body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(74, 144, 217, 0.1); border: 1px solid #eef2f6;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #60a5fa 100%); padding: 45px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">${serviceName}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">${labels.subtitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1a2b42; margin: 0 0 10px 0; font-size: 20px; font-weight: 700;">${t.greeting}, ${escapeHtml(data.clientName)}!</h2>
              <p style="color: #475569; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">${labels.title}</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 40px; border: 1px solid #e2e8f0;">
                <tr><td style="padding: 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 12px 0;">
                        <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700;">${t.service}</span><br>
                        <span style="color: #1a2b42; font-size: 17px; font-weight: 600;">${serviceName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-top: 1px solid #e2e8f0;">
                        <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700;">${t.dateTime}</span><br>
                        <span style="color: #b91c1c; font-size: 16px; font-weight: 600; text-decoration: line-through;">${formattedDate} o ${data.time}</span>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fff8f8; border-left: 4px solid #ef4444; border-radius: 4px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="color: #ef4444; font-size: 14px; font-weight: 700; margin-bottom: 8px;">${t.cancelPolicyTitle}</div>
                    <div style="color: #334155; font-size: 14px; line-height: 1.5;">${t.cancelPolicy}</div>
                  </td>
                </tr>
              </table>
              <div style="text-align: center;">
                <a href="${baseUrl}" style="display: inline-block; background-color: #1e40af; color: #ffffff; padding: 16px 36px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 10px rgba(30, 64, 175, 0.2);">${labels.ctaButton}</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 25px 30px; text-align: center;">
              <p style="color: #64748b; margin: 0; font-size: 13px; font-weight: 500;">${t.contact}</p>
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

export function generateCancellationClientText(data: EmailRequest, baseUrl: string): string {
  const t = translations[data.language];
  const serviceName = escapeHtml(data.serviceName || (data.language === 'sk' ? 'Naša služba' : 'Our Service'));

  return [
    `❌ ZRUŠENÉ: ${serviceName.toUpperCase()}`,
    "=========================================",
    `${t.greeting}, ${data.clientName}!`,
    `Vaša rezervácia na ${serviceName} bola zrušená.`,
    "",
    `⚠ ${t.cancelPolicyTitle}`,
    t.cancelPolicy,
    "----------------------------------------",
    "",
    `Novú rezerváciu si môžete vytvoriť tu: ${baseUrl}`,
    "",
    t.contact,
  ].join("\n");
}
