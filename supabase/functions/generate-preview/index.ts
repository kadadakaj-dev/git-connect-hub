import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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

Design style: "Atmospheric Technical" aesthetic, dark mode.

LAYOUT & STRUCTURE:
- Full page view showing a booking wizard interface
- Top: minimal header with "FYZIO&FIT" logo text in white, thin navigation links
- Main content: bento-grid layout with glassmorphic cards
- Cards contain: service selection (Fyzioterapia, Chiropraktika, Masáže, Rehabilitácia), date/time picker, pricing info
- Bottom: floating minimal navigation bar

COLOR SCHEME:
- Deep zinc-950 (#09090b) background
- Emerald (#10b981) accent color for buttons, active states, progress indicators
- Cards: rgba(255,255,255,0.05) with 12px backdrop blur effect
- Subtle 1px white borders at 10% opacity on cards
- Gradient text on headings: white to zinc-400 (top to bottom)

VISUAL EFFECTS:
- Glassmorphic cards with frosted glass appearance
- Spotlight hover effect visible on one card (radial white glow following cursor position)
- Organic liquid gradient blobs in emerald and charcoal floating in background
- Subtle depth and layering

TYPOGRAPHY:
- Bold sans-serif headings with very tight letter-spacing (-0.05em)
- Monospace font for prices and numerical data
- Clean, minimal body text in zinc-400

MOOD:
- Premium, high-tech medical instrument feel mixed with luxury editorial style
- Dark, atmospheric, sophisticated
- NOT generic healthcare blue - this is emerald/dark luxury

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
