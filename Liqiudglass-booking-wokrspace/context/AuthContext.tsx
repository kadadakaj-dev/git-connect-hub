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
import { useAuthStore } from "@/lib/auth-store";

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

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/csrf`, {
    credentials: "include",
    headers: { "x-api-key": API_KEY }
  });
  const data = await res.json();
  return data.csrfToken as string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, setUser, setRememberMe, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const csrfTokenRef = useRef<string | null>(null);
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);

  const getCsrfToken = useCallback(async () => {
    if (!csrfTokenRef.current) {
      csrfTokenRef.current = await fetchCsrfToken();
    }
    return csrfTokenRef.current;
  }, []);

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const csrf = await getCsrfToken();
      return fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          "content-type": "application/json",
          "x-api-key": API_KEY,
          "x-csrf-token": csrf,
          ...(options.headers ?? {})
        }
      });
    },
    [getCsrfToken]
  );

  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      try {
        const res = await fetch(`${API_BASE}/auth/verify`, {
          credentials: "include",
          headers: { "x-api-key": API_KEY }
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // No valid session
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void checkSession();
    return () => { cancelled = true; };
  }, [setUser]);

  const runRefresh = useCallback(async () => {
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          "x-api-key": API_KEY,
          "x-csrf-token": csrf
        }
      });
      if (!res.ok) { clearAuth(); return; }
      const verify = await fetch(`${API_BASE}/auth/verify`, {
        credentials: "include",
        headers: { "x-api-key": API_KEY }
      });
      if (verify.ok) {
        const data = await verify.json();
        setUser(data.user);
      }
    } catch {
      clearAuth();
    }
  }, [clearAuth, getCsrfToken, setUser]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      void runRefresh();
      scheduleRefresh();
    }, 12 * 60 * 1000);
  }, [runRefresh]);

  useEffect(() => {
    if (isAuthenticated) scheduleRefresh();
    return () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); };
  }, [isAuthenticated, scheduleRefresh]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authFetch(`${API_BASE}/auth/register`, {
      method: "POST", body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.message ?? "Registration failed");
    }
    const verify = await fetch(`${API_BASE}/auth/verify`, {
      credentials: "include", headers: { "x-api-key": API_KEY }
    });
    const verified = await verify.json();
    setUser(verified.user);
  }, [authFetch, setUser]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authFetch(`${API_BASE}/auth/login`, {
      method: "POST", body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Login failed");
    const verify = await fetch(`${API_BASE}/auth/verify`, {
      credentials: "include", headers: { "x-api-key": API_KEY }
    });
    const verified = await verify.json();
    setUser(verified.user);
    setRememberMe(payload.rememberMe);
  }, [authFetch, setUser, setRememberMe]);

  const loginWithOAuth = useCallback(async (provider: OAuthProvider) => {
    const response = await authFetch(`${API_BASE}/auth/oauth`, {
      method: "POST",
      body: JSON.stringify({
        provider, providerAccountId: `mock-${provider}-id`,
        email: `${provider}.demo@booking.local`
      })
    });
    if (!response.ok) throw new Error("OAuth failed");
    const verify = await fetch(`${API_BASE}/auth/verify`, {
      credentials: "include", headers: { "x-api-key": API_KEY }
    });
    const verified = await verify.json();
    setUser(verified.user);
    setRememberMe(true);
  }, [authFetch, setUser, setRememberMe]);

  const logout = useCallback(async () => {
    try { await authFetch(`${API_BASE}/auth/logout`, { method: "POST" }); } catch { /* best effort */ }
    clearAuth();
    csrfTokenRef.current = null;
  }, [authFetch, clearAuth]);

  const setupBiometric = useCallback(async () => {
    if (!user) throw new Error("Not authenticated");
    let credentialId = "fallback-credential";
    if (window.PublicKeyCredential && navigator.credentials) {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      try {
        const credential = (await navigator.credentials.create({
          publicKey: {
            challenge, rp: { name: "Papi Hair Design" },
            user: { id: new TextEncoder().encode(user.userId), name: user.email, displayName: user.email },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }],
            timeout: 60000, authenticatorSelection: { userVerification: "preferred" }
          }
        })) as PublicKeyCredential | null;
        if (credential) credentialId = credential.id;
      } catch { credentialId = "fallback-password"; }
    }
    const response = await authFetch(`${API_BASE}/auth/biometric`, {
      method: "POST", body: JSON.stringify({ userId: user.userId, credentialId })
    });
    if (!response.ok) throw new Error("Biometric setup failed");
    return response.json();
  }, [authFetch, user]);

  const value = useMemo(() => ({
    isAuthenticated, loading, user, register, login, loginWithOAuth, logout, setupBiometric
  }), [isAuthenticated, loading, login, loginWithOAuth, logout, register, setupBiometric, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
