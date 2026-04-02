import { create } from "zustand";

type User = {
  userId: string;
  email: string;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
  setUser: (user: User) => void;
  setRememberMe: (rememberMe: boolean) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  rememberMe: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  setRememberMe: (rememberMe) => set({ rememberMe }),
  clearAuth: () => set({ user: null, isAuthenticated: false, rememberMe: false })
}));
