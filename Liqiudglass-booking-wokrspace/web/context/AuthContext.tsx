"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useAuthStore } from "../lib/auth-store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "dev-api-key";

type LoginPayload = {
  email: string;
  password: string;
  rememberMe: boolean;
  twoFaCode?: string;
};

type OAuthProvider = "google" | "github" | "apple";

type RegisterPayload = {
  email: string;
  password: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  loading: boolean;
  user: { userId: string; email: string } | null;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  loginWithOAuth: (provider: OAuthProvider) => Promise<void>;
  logout: () => Promise<void>;
  setupBiometric: () => Promise<{ fallback: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Fetch a CSRF token from the API and store it in memory */
async function fetchCsrfToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/csrf`, {
    credentials: "include",
    headers: { "x-api-key": API_KEY }
  });
  const data = await res.json();
  return data.csrfToken as string;
}

import { getSupabaseClient } from "../utils/supabase/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, setUser, setRememberMe, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check current session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({ userId: session.user.id, email: session.user.email! });
      } else {
        clearAuth();
      }
      setLoading(false);
    };

    void initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ userId: session.user.id, email: session.user.email! });
      } else {
        clearAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setUser, clearAuth]);

  const register = useCallback(
    async (payload: RegisterPayload) => {
      if (!supabase) throw new Error("Supabase client not initialized");
      const { error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password
      });
      if (error) throw error;
    },
    [supabase]
  );

  const login = useCallback(
    async (payload: LoginPayload) => {
      if (!supabase) throw new Error("Supabase client not initialized");
      const { error } = await supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password
      });
      if (error) throw error;
      setRememberMe(payload.rememberMe);
    },
    [supabase, setRememberMe]
  );

  const loginWithOAuth = useCallback(
    async (provider: OAuthProvider) => {
      if (!supabase) throw new Error("Supabase client not initialized");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    },
    [supabase]
  );

  const logout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    clearAuth();
  }, [supabase, clearAuth]);

  const setupBiometric = useCallback(async () => {
    // Biometric setup remains mostly the same but needs to point to correct endpoint if still used
    // For now, keeping it as a stub or keeping existing if it works independently
    return { fallback: "password" };
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      loading,
      user,
      register,
      login,
      loginWithOAuth,
      logout,
      setupBiometric
    }),
    [isAuthenticated, loading, login, loginWithOAuth, logout, register, setupBiometric, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
