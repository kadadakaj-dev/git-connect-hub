import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Preview = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-preview");
      if (fnError) throw fnError;
      if (data?.url) {
        setImageUrl(data.url);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Chyba pri generovaní");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center p-8">
      <h1 className="text-3xl font-heading font-semibold mb-2">Atmospheric Technical — Preview</h1>
      <p className="text-zinc-400 mb-8">
        Vygenerovaný AI preview nového dizajnu. Po schválení prejdem na implementáciu.
      </p>

      {!imageUrl && !loading && (
        <button
          onClick={generatePreview}
          className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors"
        >
          Generovať Preview
        </button>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400">Generujem preview pomocou AI... (môže to trvať 30-60s)</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 max-w-lg text-center">
          {error}
          <button
            onClick={generatePreview}
            className="mt-3 block mx-auto px-6 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
          >
            Skúsiť znova
          </button>
        </div>
      )}

      {imageUrl && (
        <div className="w-full max-w-5xl">
          <img
            src={imageUrl}
            alt="Atmospheric Technical dizajn preview"
            loading="lazy"
            decoding="async"
            className="w-full rounded-2xl border border-white/10 shadow-2xl"
          />
          <p className="text-center text-zinc-500 mt-4 text-sm">
            Toto je AI-generovaný preview. Skutočná implementácia bude interaktívna a responsívna.
          </p>
        </div>
      )}
    </div>
  );
};

export default Preview;
