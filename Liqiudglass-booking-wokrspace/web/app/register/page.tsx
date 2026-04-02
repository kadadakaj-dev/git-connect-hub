"use client";

export const dynamic = "force-static";


import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Heslá sa nezhodujú.");
      return;
    }

    if (password.length < 8) {
      setError("Heslo musí mať aspoň 8 znakov.");
      return;
    }

    setLoading(true);
    try {
      await register({ email, password });
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registrácia zlyhala.";
      if (message.toLowerCase().includes("exists") || message.toLowerCase().includes("already")) {
        setError("Účet s týmto e-mailom už existuje.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 transition-colors duration-500">
      <div className="w-full max-w-sm">

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Registrácia</h1>
          <p className="mt-1 text-sm text-muted-foreground">Vytvorte si účet pre sledovanie rezervácií</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border-gold bg-secondary/30 backdrop-blur-sm p-6 shadow-xl shadow-primary/5">
          <div className="space-y-4">

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.sk"
                className="w-full rounded-xl border border-border bg-input text-foreground px-3.5 py-2.5 text-base sm:text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
                Heslo
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimálne 8 znakov"
                  className="w-full rounded-xl border border-border bg-input text-foreground px-3.5 py-2.5 pr-10 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-foreground">
                Potvrďte heslo
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Zopakujte heslo"
                  className="w-full rounded-xl border border-border bg-input text-foreground px-3.5 py-2.5 pr-10 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-sm text-red-500">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  <UserPlus size={15} />
                  Zaregistrovať sa
                </>
              )}
            </button>

          </div>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground/60">
          Už máte účet?{" "}
          <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
            Prihlásiť sa
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-muted-foreground/60">
          <Link href="/" className="text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
            ← Späť na rezerváciu
          </Link>
        </p>

      </div>
    </main>
  );
}
