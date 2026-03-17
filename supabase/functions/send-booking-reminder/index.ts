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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth: accept service_role, anon key (cron via pg_net), or admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === supabaseServiceKey;

    // For cron: pg_net sends the anon key. We compare directly.
    // The anon key is a JWT with role=anon, so we can also decode it to check.
    let isAnonKey = token === supabaseAnonKey;
    if (!isAnonKey) {
      // Also accept if the token decodes to a Supabase anon JWT (role: "anon")
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.role === "anon" && payload.ref === "bqoeopfgivbvyhonkree") {
          isAnonKey = true;
        }
      } catch { /* not a JWT */ }
    }

    if (!isServiceRole && !isAnonKey) {
      // Try as authenticated admin user
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

      const adminCheck = createClient(supabaseUrl, supabaseServiceKey);
      const { data: isAdmin } = await adminCheck.rpc("has_role", {
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

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Find bookings for tomorrow
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
        service:services(name_sk, name_en)
      `)
      .eq("date", tomorrowStr)
      .in("status", ["pending", "confirmed"]);

    if (bookingsError) {
      throw new Error(`Error fetching bookings: ${bookingsError.message}`);
    }

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
        const { error: emailError } = await supabase.functions.invoke(
          "send-booking-email",
          {
            body: {
              to: booking.client_email,
              clientName: booking.client_name,
              serviceName: booking.service?.name_sk || "Služba",
              date: booking.date,
              time: booking.time_slot,
              cancellationToken: booking.cancellation_token,
              language: "sk",
              template: "reminder",
            },
          }
        );

        if (emailError) {
          console.error(`Error sending email for booking ${booking.id}:`, emailError);
          results.push({ booking_id: booking.id, status: "email_failed" });
          continue;
        }

        // Record email reminder sent
        await supabase.from("booking_reminders").insert({
          booking_id: booking.id,
          reminder_sent_at: new Date().toISOString(),
          reminder_type: "email",
        });

        // Send push notification if the client has a linked user account
        if (booking.client_user_id) {
          const { data: existingPushReminder } = await supabase
            .from("booking_reminders")
            .select("id")
            .eq("booking_id", booking.id)
            .eq("reminder_type", "push")
            .maybeSingle();

          if (!existingPushReminder) {
            try {
              await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
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

              await supabase.from("booking_reminders").insert({
                booking_id: booking.id,
                reminder_sent_at: new Date().toISOString(),
                reminder_type: "push",
              });
            } catch (pushErr) {
              // Push failure does NOT block the reminder flow
              console.error(`Push notification failed for booking ${booking.id}:`, pushErr);
            }
          }
        }

        results.push({ booking_id: booking.id, status: "sent" });
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

serve(handler);
