import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const prompt = `High-end landing page UI design screenshot for a premium physiotherapy & chiropractic clinic called "FYZIO&FIT". 

Design style: Clean "Apple Pro" aesthetic, light mode with baby blue accents.

LAYOUT & STRUCTURE:
- Full page view showing a booking wizard interface
- Top: minimal header with "FYZIO&FIT" logo text in dark navy, thin navigation links
- Main content: clean card-based layout with subtle shadows
- Cards contain: service selection (Fyzioterapia, Chiropraktika, Masáže, Rehabilitácia), date/time picker, pricing info
- Bottom: minimal footer

COLOR SCHEME:
- Light background (#f0f5fa) with white cards
- Baby blue (#4a90d9) accent color for buttons, active states, progress indicators
- Cards: white (#ffffff) with subtle box-shadow (0 4px 6px rgba(0,0,0,0.07))
- Clean borders in light gray (#dde5ef)
- Dark navy (#1a2b42) for headings and important text

VISUAL EFFECTS:
- Clean, minimal card design with subtle shadows
- Soft hover transitions
- No glassmorphism — pure Apple-style clarity

TYPOGRAPHY:
- Inter font family throughout
- Bold headings in dark navy
- Clean body text in muted blue-gray (#6b7c94)

MOOD:
- Clean, professional, trustworthy medical feel
- Light, airy, sophisticated
- Apple-inspired minimalism with baby blue warmth

2k resolution, ultra sharp details, pixel-perfect UI design, professional UX/UI mockup screenshot, Figma-quality render.`;

    console.log("Calling AI image generation...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData) {
      throw new Error("No image generated from AI model");
    }

    // Extract base64 data and upload to storage
    const base64String = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64String), (c) => c.charCodeAt(0));

    const fileName = `preview-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("design-previews")
      .upload(fileName, binaryData, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("design-previews")
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({ success: true, url: urlData.publicUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
