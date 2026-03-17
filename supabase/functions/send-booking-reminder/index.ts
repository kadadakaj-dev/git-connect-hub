// @ts-nocheck — Deno Edge Function, not processed by local TS
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    // This function is triggered by pg_cron (pg_net with anon key).
    // verify_jwt = false in config.toml. We only require a Bearer token.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing Bearer token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("send-booking-reminder: authorized, processing...");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    console.log("Looking for bookings on:", tomorrowStr);

    // Find bookings for tomorrow
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id, date, time_slot, client_name, client_email, client_user_id,
        cancellation_token, service:services(name_sk, name_en)
      `)
      .eq("date", tomorrowStr)
      .in("status", ["pending", "confirmed"]);

    if (bookingsError) {
      throw new Error(`Error fetching bookings: ${bookingsError.message}`);
    }

    console.log(`Found ${bookings?.length || 0} bookings for tomorrow`);
    const results: { booking_id: string; status: string }[] = [];

    for (const booking of (bookings as unknown as BookingWithService[]) || []) {
      try {
        // Check if email reminder already sent (dedup)
        const { data: existingEmailReminder } = await supabase
          .from("booking_reminders")
          .select("id")
          .eq("booking_id", booking.id)
          .eq("reminder_type", "email")
          .maybeSingle();

        if (existingEmailReminder) {
          results.push({ booking_id: booking.id, status: "already_sent" });
          continue;
        }

        // Send reminder email
        const emailResp = await fetch(`${supabaseUrl}/functions/v1/send-booking-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: booking.client_email,
            clientName: booking.client_name,
            serviceName: booking.service?.name_sk || "Služba",
            date: booking.date,
            time: booking.time_slot,
            cancellationToken: booking.cancellation_token,
            language: "sk",
            template: "reminder",
          }),
        });

        if (!emailResp.ok) {
          const errText = await emailResp.text();
          console.error(`Email failed for booking ${booking.id}: ${errText}`);
          results.push({ booking_id: booking.id, status: "email_failed" });
          continue;
        }
        await emailResp.text(); // consume body

        // Record email reminder sent
        await supabase.from("booking_reminders").insert({
          booking_id: booking.id,
          reminder_sent_at: new Date().toISOString(),
          reminder_type: "email",
        });

        // Send push notification if client has a linked user account
        if (booking.client_user_id) {
          const { data: existingPushReminder } = await supabase
            .from("booking_reminders")
            .select("id")
            .eq("booking_id", booking.id)
            .eq("reminder_type", "push")
            .maybeSingle();

          if (!existingPushReminder) {
            try {
              const pushResp = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  user_id: booking.client_user_id,
                  payload: {
                    title: "Pripomienka: Zajtra máte termín",
                    body: `${booking.service?.name_sk || "Služba"} — ${booking.date} o ${booking.time_slot}`,
                    url: "/portal",
                  },
                }),
              });
              await pushResp.text(); // consume body

              await supabase.from("booking_reminders").insert({
                booking_id: booking.id,
                reminder_sent_at: new Date().toISOString(),
                reminder_type: "push",
              });
            } catch (pushErr) {
              // Push failure does NOT block the reminder flow
              console.error(`Push failed for booking ${booking.id}:`, pushErr);
            }
          }
        }

        results.push({ booking_id: booking.id, status: "sent" });
      } catch (err) {
        console.error(`Error processing booking ${booking.id}:`, err);
        results.push({ booking_id: booking.id, status: "error" });
      }
    }

    console.log("Reminder results:", JSON.stringify(results));
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

serve(handler);
