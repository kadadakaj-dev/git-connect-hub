import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import GlassBackground from "@/components/GlassBackground";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Mode = "login" | "register" | "reset" | "update";

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
    // Listen for auth state changes (Recovery links redirect here)
    // Registered once on mount and stays active
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, _session) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("update");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session && mode !== "update") {
        const target = (location.state as { from?: { pathname?: string } })?.from
          ?.pathname || "/portal";
        navigate(target, { replace: true });
      }
    };

    check();
  }, [location.state, navigate, mode]);

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

        if (signInError) {
          setError("Nesprávny e-mail alebo heslo");
          return;
        }

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

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            setError("Tento účet už existuje");
          } else {
            setError("Skús to ešte raz");
          }
          return;
        }

        setMessage("Účet bol vytvorený. Skontroluj svoj e-mail");
        return;
      }

      if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/auth`,
          }
        );

        if (resetError) {
          setError("Nesprávne zadaný e-mail");
          return;
        }

        setMessage("Link na obnovu bol odoslaný");
        return;
      }

      if (mode === "update") {
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });

        if (updateError) throw updateError;

        setMessage("Heslo bolo úspešne zmenené. Teraz sa môžeš prihlásiť.");
        setMode("login");
      }
    } catch (err) {
      setError("Skús to ešte raz");
    } finally {
      setLoading(false);
    }
  };

  const texts = {
    login: {
      title: "Prihlásenie",
      subtitle: "Vstup do tvojho klientského priestoru",
      button: "Pokračovať",
    },
    register: {
      title: "Vytvoriť účet",
      subtitle: "Rýchly prístup k rezerváciám a službám",
      button: "Začať",
    },
    reset: {
      title: "Obnova hesla",
      subtitle: "Pošleme ti bezpečný link na nové heslo",
      button: "Odoslať",
    },
    update: {
      title: "Nové heslo",
      subtitle: "Zadaj svoje nové silné heslo",
      button: "Uložiť heslo",
    },
  };

  const currentText = texts[mode];

  return (
    <div className="min-h-app-screen relative flex items-center justify-center px-4 py-10 overflow-hidden">
      <GlassBackground />

      <div className="relative z-10 w-full max-w-[440px] surface-panel shadow-glass-float p-8 sm:p-10 fade-in-up">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-heading font-semibold tracking-tight text-[hsl(var(--soft-navy))] mb-2">
            {currentText.title}
          </h1>
          <p className="text-muted-foreground">
            {currentText.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[hsl(var(--soft-navy))] pl-1">E-mail</label>
            <input
              id="email"
              type="email"
              className="w-full rounded-2xl border border-[var(--glass-border-subtle)] bg-white/64 px-4 py-3 text-[hsl(var(--soft-navy))] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="meno@example.com"
            />
          </div>

          {mode !== "reset" && (
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-[hsl(var(--soft-navy))] pl-1">Heslo</label>
              <input
                id="password"
                type="password"
                className="w-full rounded-2xl border border-[var(--glass-border-subtle)] bg-white/64 px-4 py-3 text-[hsl(var(--soft-navy))] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200/50 bg-red-50/50 px-4 py-3 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-2xl border border-green-200/50 bg-green-50/50 px-4 py-3 text-sm text-green-700 animate-in fade-in slide-in-from-top-1">
              {message}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-[18px] bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] text-white font-semibold shadow-[0_12px_28px_rgba(79,149,213,0.24)] hover:shadow-[0_18px_38px_rgba(79,149,213,0.3)] hover:brightness-[1.03] active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : (
              currentText.button
            )}
          </Button>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <button
            type="button"
            onClick={() => {
              clearFeedback();
              setMode(mode === "login" ? "register" : "login");
            }}
            className="text-[hsl(var(--navy))] font-semibold hover:opacity-70 transition-opacity"
          >
            {mode === "login" ? "Vytvoriť účet" : "Mám účet"}
          </button>

          {mode === "login" && (
            <button
              type="button"
              onClick={() => {
                clearFeedback();
                setMode("reset");
              }}
              className="text-muted-foreground hover:text-[hsl(var(--soft-navy))] transition-colors"
            >
              Zabudnuté heslo
            </button>
          )}

          {mode === "reset" && (
            <button
              type="button"
              onClick={() => {
                clearFeedback();
                setMode("login");
              }}
              className="text-muted-foreground hover:text-[hsl(var(--soft-navy))] transition-colors"
            >
              Späť na prihlásenie
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
