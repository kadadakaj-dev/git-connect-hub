import "@testing-library/jest-dom";
import { vi } from "vitest";
import process from "node:process";

// Mock Supabase environment variables for tests
// This prevents "Invalid supabaseUrl" errors during initialization
if (typeof process !== "undefined") {
  process.env.VITE_SUPABASE_URL = "https://placeholder-url.supabase.co";
  process.env.VITE_SUPABASE_ANON_KEY = "placeholder-anon-key";
}

// Global window.matchMedia mock
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock resize observer
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Global scrollIntoView mock
globalThis.HTMLElement.prototype.scrollIntoView = vi.fn();
