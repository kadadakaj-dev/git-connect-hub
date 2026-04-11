// @ts-nocheck — Deno Edge Function, not processed by local TS environment (v1.0.0)
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface BookingWithService {
  id: string;
  date: string;
  time_slot: string;
  client_name: string;
  client_email: string;
  client_user_id: string | null;
  cancellation_token: string;
  service: {
    name_sk: string;
    name_en: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth: accept service_role key (cron), or admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === supabaseServiceKey;

    if (!isServiceRole) {
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userError } = await userClient.auth.getUser();

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();

    // Fetch bookings for today + next 2 days to cover both reminder windows
    const todayStr = now.toISOString().split("T")[0];
    const tomorrowStr = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const dayAfterStr = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().split("T")[0];

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        date,
        time_slot,
        client_name,
        client_email,
        client_user_id,
        cancellation_token,
        service:services(name_sk, name_en, duration)
      `)
      .in("date", [todayStr, tomorrowStr, dayAfterStr])
      .in("status", ["pending", "confirmed"]);

    if (bookingsError) {
      throw new Error(`Error fetching bookings: ${bookingsError.message}`);
    }

    const results: { booking_id: string; status: string; reminder?: string }[] = [];

    for (const booking of (bookings as unknown as BookingWithService[]) || []) {
      try {
        const timeStr = booking.time_slot.substring(0, 5); // HH:MM
        const bookingDateTimeStr = `${booking.date}T${timeStr}:00`;
        const bratislavaOffset = getBratislavaOffsetMs(new Date(bookingDateTimeStr));
        const bookingUtc = new Date(new Date(bookingDateTimeStr).getTime() - bratislavaOffset);

        const diffMs = bookingUtc.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // ── 24h reminder: booking is 20-28h away ─────────────────────────────
        if (diffHours > 20 && diffHours <= 28) {
          const { data: existing24h } = await supabase
            .from("booking_reminders")
            .select("id")
            .eq("booking_id", booking.id)
            .eq("reminder_type", "email-24h")
            .maybeSingle();

          if (!existing24h) {
            const { error: emailError } = await supabase.functions.invoke("send-booking-email", {
              body: {
                to: booking.client_email,
                clientName: booking.client_name,
                serviceName: booking.service?.duration
                  ? `${booking.service.name_sk} (${booking.service.duration} min)`
                  : (booking.service?.name_sk || "Služba"),
                date: booking.date,
                time: booking.time_slot,
                cancellationToken: booking.cancellation_token,
                language: "sk",
                template: "reminder-24h",
              },
            });

            if (emailError) {
              console.error(`Error sending 24h reminder for ${booking.id}:`, emailError);
              results.push({ booking_id: booking.id, status: "email_failed", reminder: "24h" });
            } else {
              await supabase.from("booking_reminders").insert({
                booking_id: booking.id,
                reminder_sent_at: new Date().toISOString(),
                reminder_type: "email-24h",
              });
              results.push({ booking_id: booking.id, status: "sent", reminder: "24h" });
            }
          } else {
            results.push({ booking_id: booking.id, status: "already_sent", reminder: "24h" });
          }
          continue;
        }

        // ── 10h final alert: booking is 8-12h away, cancel no longer possible ─
        if (diffHours > 0 && diffHours <= 12) {
          const { data: existing10h } = await supabase
            .from("booking_reminders")
            .select("id")
            .eq("booking_id", booking.id)
            .eq("reminder_type", "email-10h")
            .maybeSingle();

          if (!existing10h) {
            const { error: emailError } = await supabase.functions.invoke("send-booking-email", {
              body: {
                to: booking.client_email,
                clientName: booking.client_name,
                serviceName: booking.service?.duration
                  ? `${booking.service.name_sk} (${booking.service.duration} min)`
                  : (booking.service?.name_sk || "Služba"),
                date: booking.date,
                time: booking.time_slot,
                cancellationToken: booking.cancellation_token,
                language: "sk",
                template: "reminder-10h",
              },
            });

            if (emailError) {
              console.error(`Error sending 10h alert for ${booking.id}:`, emailError);
              results.push({ booking_id: booking.id, status: "email_failed", reminder: "10h" });
            } else {
              await supabase.from("booking_reminders").insert({
                booking_id: booking.id,
                reminder_sent_at: new Date().toISOString(),
                reminder_type: "email-10h",
              });
              results.push({ booking_id: booking.id, status: "sent", reminder: "10h" });
            }
          } else {
            results.push({ booking_id: booking.id, status: "already_sent", reminder: "10h" });
          }
          continue;
        }
      } catch (err) {
        console.error(`Error processing booking ${booking.id}:`, err);
        results.push({ booking_id: booking.id, status: "error" });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-booking-reminder:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

// Helper: get Bratislava UTC offset in ms for a given date (handles CET/CEST)
function getBratislavaOffsetMs(date: Date): number {
  // Use Intl to determine the offset
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Bratislava',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0');
  const bratislavaDate = new Date(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return bratislavaDate.getTime() - date.getTime();
}

serve(handler);
