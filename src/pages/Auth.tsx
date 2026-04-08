import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Mode = "login" | "register" | "reset";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const target = (location.state as { from?: { pathname?: string } })?.from
          ?.pathname || "/portal";
        navigate(target, { replace: true });
      }
    };

    check();
  }, [location.state, navigate]);

  const clearFeedback = () => {
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        const target = (location.state as { from?: { pathname?: string } })?.from
          ?.pathname || "/portal";

        navigate(target, { replace: true });
        return;
      }

      if (mode === "register") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/portal`,
          },
        });

        if (signUpError) throw signUpError;

        setMessage(
          "Registrácia prebehla. Ak máš zapnuté potvrdenie e-mailu v Supabase, skontroluj inbox."
        );
        return;
      }

      if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/auth`,
          }
        );

        if (resetError) throw resetError;

        setMessage("Link na reset hesla bol odoslaný na e-mail.");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Nastala neočakávaná chyba.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm bg-white">
        <h1 className="text-2xl font-semibold mb-2">
          {mode === "login" && "Prihlásenie"}
          {mode === "register" && "Registrácia"}
          {mode === "reset" && "Obnova hesla"}
        </h1>

        <p className="text-sm opacity-70 mb-6">
          Klasický e-mail + heslo flow, bez Google Sign-In.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">E-mail</label>
            <input
              type="email"
              className="w-full rounded-xl border px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode !== "reset" && (
            <div>
              <label className="block text-sm mb-1">Heslo</label>
              <input
                type="password"
                className="w-full rounded-xl border px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-4 py-2 border bg-black text-white disabled:opacity-60"
          >
            {loading
              ? "Spracúvam..."
              : mode === "login"
              ? "Prihlásiť sa"
              : mode === "register"
              ? "Vytvoriť účet"
              : "Poslať reset link"}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <button
            type="button"
            onClick={() => {
              clearFeedback();
              setMode("login");
            }}
            className="underline"
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              clearFeedback();
              setMode("register");
            }}
            className="underline"
          >
            Registrácia
          </button>

          <button
            type="button"
            onClick={() => {
              clearFeedback();
              setMode("reset");
            }}
            className="underline"
          >
            Zabudnuté heslo
          </button>
        </div>
      </div>
    </div>
  );
}
