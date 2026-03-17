// @ts-nocheck — Deno Edge Function, not processed by local TS
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

interface PushRequest {
  user_id?: string;
  payload: PushPayload;
}

interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  keys: string;
  user_id: string | null;
}

async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<Response> {
  const endpoint = new URL(subscription.endpoint);
  const audience = `${endpoint.protocol}//${endpoint.host}`;

  const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      x: base64UrlEncode(publicKeyBytes.slice(1, 33)),
      y: base64UrlEncode(publicKeyBytes.slice(33, 65)),
      d: base64UrlEncode(privateKeyBytes),
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: vapidSubject,
  };

  const encodedHeader = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const encodedPayload = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(jwtPayload))
  );
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const rawSignature = derToRaw(new Uint8Array(signature));
  const encodedSignature = base64UrlEncode(rawSignature);
  const jwt = `${unsignedToken}.${encodedSignature}`;

  const body = JSON.stringify(payload);

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
      "Content-Type": "application/json",
      TTL: "86400",
      Urgency: "normal",
    },
    body,
  });

  return response;
}

function derToRaw(der: Uint8Array): Uint8Array {
  const raw = new Uint8Array(64);
  let offset = 2;
  offset++;
  let rLen = der[offset++];
  const rOffset = rLen === 33 ? offset + 1 : offset;
  const rSize = rLen === 33 ? 32 : rLen;
  raw.set(der.slice(rOffset, rOffset + rSize), 32 - rSize);
  offset += rLen;
  offset++;
  let sLen = der[offset++];
  const sOffset = sLen === 33 ? offset + 1 : offset;
  const sSize = sLen === 33 ? 32 : sLen;
  raw.set(der.slice(sOffset, sOffset + sSize), 64 - sSize);
  return raw;
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncode(data: Uint8Array | ArrayBuffer): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:booking@fyzioafit.sk";

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ─── Auth: require service-role or admin ───
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
      // Verify the caller is an admin user
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

    // ─── Parse request body ───
    const { user_id, payload } = (await req.json()) as PushRequest;

    if (!payload?.title || !payload?.body) {
      return new Response(
        JSON.stringify({ error: "payload.title and payload.body are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ─── Fetch subscriptions ───
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase.from("push_subscriptions").select("*");
    if (user_id) {
      query = query.eq("user_id", user_id);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      throw new Error(`Error fetching subscriptions: ${subError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, failed: 0, cleaned: 0, message: "No subscriptions found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ─── Send push to each subscription ───
    let sent = 0;
    let failed = 0;
    const staleEndpoints: string[] = [];

    for (const sub of subscriptions as PushSubscriptionRow[]) {
      let keys: { p256dh: string; auth: string };
      try {
        keys = typeof sub.keys === "string" ? JSON.parse(sub.keys) : sub.keys;
      } catch {
        console.error(`Invalid keys JSON for subscription ${sub.id}`);
        staleEndpoints.push(sub.endpoint);
        failed++;
        continue;
      }

      if (!keys?.p256dh || !keys?.auth) {
        console.error(`Missing p256dh or auth for subscription ${sub.id}`);
        staleEndpoints.push(sub.endpoint);
        failed++;
        continue;
      }

      try {
        const response = await sendWebPush(
          { endpoint: sub.endpoint, keys },
          payload,
          vapidPublicKey,
          vapidPrivateKey,
          vapidSubject
        );

        if (response.ok || response.status === 201) {
          sent++;
        } else if (response.status === 404 || response.status === 410) {
          console.log(`Subscription ${sub.id} gone (${response.status}), marking for cleanup`);
          staleEndpoints.push(sub.endpoint);
          failed++;
        } else {
          const errorText = await response.text();
          console.error(`Push failed for ${sub.id}: ${response.status} ${errorText}`);
          failed++;
        }
      } catch (err) {
        console.error(`Network error sending push to ${sub.id}:`, err);
        failed++;
      }
    }

    // ─── Cleanup stale subscriptions ───
    let cleaned = 0;
    if (staleEndpoints.length > 0) {
      const { count } = await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", staleEndpoints);
      cleaned = count ?? staleEndpoints.length;
      console.log(`Cleaned ${cleaned} stale push subscriptions`);
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed, cleaned, total: subscriptions.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-push-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
