// @ts-nocheck — Deno Edge Function, not processed by local TS
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://booking-fyzioafit.lovable.app',
  'https://id-preview--fd3f243b-3bec-4856-9798-dbbe3c83ea8d.lovable.app',
  'https://fd3f243b-3bec-4856-9798-dbbe3c83ea8d.lovableproject.com',
]

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://booking-fyzioafit.lovable.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user with their token
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Delete user data in order (respecting foreign keys)
    // 1. Delete favorite_services via client_profiles
    const { data: profile } = await adminClient
      .from("client_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      await adminClient.from("favorite_services").delete().eq("client_id", profile.id);
    }

    // 2. Delete therapist_notes for user's bookings
    const { data: bookings } = await adminClient
      .from("bookings")
      .select("id")
      .eq("client_user_id", user.id);

    if (bookings && bookings.length > 0) {
      const bookingIds = bookings.map((b) => b.id);
      await adminClient.from("therapist_notes").delete().in("booking_id", bookingIds);
      await adminClient.from("booking_reminders").delete().in("booking_id", bookingIds);
    }

    // 3. Delete bookings
    await adminClient.from("bookings").delete().eq("client_user_id", user.id);

    // 4. Delete client_profiles
    await adminClient.from("client_profiles").delete().eq("user_id", user.id);

    // 5. Delete avatar files from storage
    if (profile) {
      const { data: files } = await adminClient.storage.from("avatars").list(user.id);
      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${user.id}/${f.name}`);
        await adminClient.storage.from("avatars").remove(filePaths);
      }
    }

    // 6. Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      throw deleteError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete account" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
