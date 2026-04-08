import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

type AdminProtectedRouteProps = {
  children: ReactNode;
};

const ADMIN_EMAIL = "booking@fyzioafit.sk";

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        console.error("AdminProtectedRoute: getSession error:", error.message);
        setSession(null);
        return;
      }
      setSession(data.session ?? null);
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-medium animate-pulse text-primary/70">Overujem oprávnenia…</div>
        </div>
      </div>
    );
  }

  // Not logged in -> Auth
  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Logged in but NOT Admin -> Home
  if (session.user.email !== ADMIN_EMAIL) {
    console.warn(`Unauthorized access attempt to /admin by ${session.user.email}`);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
