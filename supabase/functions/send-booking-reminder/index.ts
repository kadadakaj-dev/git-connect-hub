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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Find bookings for tomorrow that haven't had reminders sent
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        date,
        time_slot,
        client_name,
        client_email,
        service:services(name_sk, name_en)
      `)
      .eq("date", tomorrowStr)
      .in("status", ["pending", "confirmed"])
      .not("id", "in", `(
        SELECT booking_id FROM booking_reminders WHERE reminder_sent_at IS NOT NULL
      )`);

    if (bookingsError) {
      throw new Error(`Error fetching bookings: ${bookingsError.message}`);
    }

    const results: { booking_id: string; status: string }[] = [];

    for (const booking of (bookings as unknown as BookingWithService[]) || []) {
      try {
        // Check if reminder already sent
        const { data: existingReminder } = await supabase
          .from("booking_reminders")
          .select("id")
          .eq("booking_id", booking.id)
          .maybeSingle();

        if (existingReminder) {
          results.push({ booking_id: booking.id, status: "already_sent" });
          continue;
        }

        // Send reminder email via existing email function
        const { error: emailError } = await supabase.functions.invoke(
          "send-booking-email",
          {
            body: {
              to: booking.client_email,
              subject: `Pripomienka: Váš termín zajtra - ${booking.service?.name_sk || "Rezervácia"}`,
              booking_id: booking.id,
              template: "reminder",
              booking_data: {
                client_name: booking.client_name,
                service_name: booking.service?.name_sk || "Služba",
                date: booking.date,
                time_slot: booking.time_slot,
              },
            },
          }
        );

        if (emailError) {
          console.error(`Error sending email for booking ${booking.id}:`, emailError);
          results.push({ booking_id: booking.id, status: "email_failed" });
          continue;
        }

        // Record that reminder was sent
        await supabase.from("booking_reminders").insert({
          booking_id: booking.id,
          reminder_sent_at: new Date().toISOString(),
          reminder_type: "email",
        });

        results.push({ booking_id: booking.id, status: "sent" });
      } catch (err) {
        console.error(`Error processing booking ${booking.id}:`, err);
        results.push({ booking_id: booking.id, status: "error" });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-booking-reminder:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
