import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  clientName: string
  serviceName: string
  date: string
  time: string
  cancellationToken: string
  language: 'sk' | 'en'
  template?: 'confirmation' | 'reminder'
}

const translations = {
  sk: {
    subject: 'Potvrdenie rezervácie - FYZIO&FIT',
    reminderSubject: 'Pripomienka: Váš termín zajtra - FYZIO&FIT',
    greeting: 'Dobrý deň',
    confirmationTitle: 'Vaša rezervácia bola úspešne vytvorená',
    reminderTitle: 'Pripomíname vám zajtrajší termín',
    service: 'Služba',
    dateTime: 'Dátum a čas',
    location: 'Miesto',
    address: 'Košice',
    cancelText: 'Ak potrebujete zrušiť rezerváciu, kliknite na nasledujúci odkaz:',
    cancelButton: 'Zrušiť rezerváciu',
    footer: 'Tešíme sa na vašu návštevu!',
    clinicName: 'FYZIO&FIT',
    contact: 'Kontakt: info@chiropraxiakosice.eu',
  },
  en: {
    subject: 'Booking Confirmation - FYZIO&FIT',
    reminderSubject: 'Reminder: Your appointment tomorrow - FYZIO&FIT',
    greeting: 'Hello',
    confirmationTitle: 'Your booking has been successfully created',
    reminderTitle: 'Reminder about your appointment tomorrow',
    service: 'Service',
    dateTime: 'Date & Time',
    location: 'Location',
    address: 'Košice',
    cancelText: 'If you need to cancel your booking, click the following link:',
    cancelButton: 'Cancel Booking',
    footer: 'We look forward to seeing you!',
    clinicName: 'FYZIO&FIT',
    contact: 'Contact: info@chiropraxiakosice.eu',
  },
}

function formatDate(dateStr: string, language: 'sk' | 'en'): string {
  const date = new Date(dateStr)
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  return date.toLocaleDateString(language === 'sk' ? 'sk-SK' : 'en-US', options)
}

function generateEmailHtml(data: EmailRequest, baseUrl: string): string {
  const t = translations[data.language]
  const formattedDate = formatDate(data.date, data.language)
  const cancelUrl = `${baseUrl}/cancel?token=${data.cancellationToken}`
  const isReminder = data.template === 'reminder'
  const title = isReminder ? t.reminderTitle : t.confirmationTitle

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isReminder ? (t.reminderSubject) : t.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f5fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f5fa; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4a90d9 0%, #6ba3e0 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">${t.clinicName}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1a2b42; margin: 0 0 10px 0; font-size: 20px;">${t.greeting}, ${data.clientName}!</h2>
              <p style="color: #4b5e78; margin: 0 0 30px 0; font-size: 16px;">${title}</p>
              
              <!-- Booking Details -->
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
              </table>
              
              <!-- Cancel Section -->
              <p style="color: #6b7c94; font-size: 14px; margin: 0 0 15px 0;">${t.cancelText}</p>
              <a href="${cancelUrl}" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">${t.cancelButton}</a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f8fc; padding: 20px 30px; text-align: center; border-top: 1px solid #dde5ef;">
              <p style="color: #4a90d9; margin: 0 0 10px 0; font-size: 16px; font-weight: 500;">${t.footer}</p>
              <p style="color: #6b7c94; margin: 0; font-size: 14px;">${t.contact}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const data: EmailRequest = await req.json()
    console.log('Sending booking email to:', data.to, 'template:', data.template || 'confirmation')

    const smtpPassword = Deno.env.get('SMTP_PASSWORD')
    if (!smtpPassword) {
      throw new Error('SMTP_PASSWORD not configured')
    }

    // Use SUPABASE_URL to derive base URL, fallback to published URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const baseUrl = 'https://booking-black.lovable.app'

    const client = new SMTPClient({
      connection: {
        hostname: 'smtp.m1.websupport.sk',
        port: 465,
        tls: true,
        auth: {
          username: 'info@chiropraxiakosice.eu',
          password: smtpPassword,
        },
      },
    })

    const t = translations[data.language]
    const isReminder = data.template === 'reminder'
    const subject = isReminder ? t.reminderSubject : t.subject
    const html = generateEmailHtml(data, baseUrl)

    await client.send({
      from: 'FYZIO&FIT <info@chiropraxiakosice.eu>',
      to: data.to,
      subject: subject,
      html: html,
    })

    await client.close()

    console.log('Email sent successfully to:', data.to)

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error sending email:', error)
    const message = error instanceof Error ? error.message : 'Failed to send email'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
