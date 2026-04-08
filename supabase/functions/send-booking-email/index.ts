// @ts-expect-error: Deno-specific URL import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error: Deno-specific URL import
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
// @ts-expect-error: Deno-specific URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { 
  EmailRequest, 
  generateEmailHtml, 
  generateEmailText, 
  generateAdminNotificationHtml, 
  generateAdminNotificationText,
  generateReminderHtml,
  generateReminderText,
  generateCancellationAdminHtml,
  generateCancellationAdminText,
  generateCancellationClientHtml,
  generateCancellationClientText,
  generateSubject,
  formatDate
} from "./templates.ts";

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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseServiceKey) throw new Error("Missing service key");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${supabaseServiceKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const data: EmailRequest = await req.json();
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    if (!smtpPassword) throw new Error("SMTP_PASSWORD not configured");

    const baseUrl = Deno.env.get("SITE_URL") || "https://booking.fyzioafit.sk";

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
    const isReminder = data.template === "reminder";

    const subject = generateSubject(data);
    let html: string;
    let textContent: string;

    if (isCancellationClient) {
      html = generateCancellationClientHtml(data, baseUrl);
      textContent = generateCancellationClientText(data, baseUrl);
    } else if (isCancellationAdmin) {
      html = generateCancellationAdminHtml(data);
      textContent = generateCancellationAdminText(data);
    } else if (isAdminNotification) {
      html = generateAdminNotificationHtml(data);
      textContent = generateAdminNotificationText(data);
    } else if (isReminder) {
      html = generateReminderHtml(data, baseUrl);
      textContent = generateReminderText(data, baseUrl);
    } else {
      html = generateEmailHtml(data, baseUrl);
      textContent = generateEmailText(data, baseUrl);
    }

    await client.send({
      from: "FYZIOAFIT <booking@fyzioafit.sk>",
      to: data.to,
      subject: subject,
      content: textContent,
      html: html,
    });

    await client.close();

    await supabase.from("email_send_log").insert({
        recipient_email: data.to,
        subject: subject,
        status: "sent",
        metadata: { template: data.template || "confirmation", serviceName: data.serviceName }
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders });
  }
});
