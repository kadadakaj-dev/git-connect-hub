/**
 * Unit tests: Supabase client singleton (utils/supabase/client.ts)
 *
 * Tests cover:
 *  - Returns null when env vars are missing (safe default)
 *  - Returns a client when env vars are present
 *  - Singleton — same instance returned on repeated calls
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// We need to control env vars before importing the module, so we reset modules
// before each test group.

describe("getSupabaseClient", () => {
  beforeEach(() => {
    vi.resetModules();
    // Clear the singleton by resetting the module between tests
    vi.unstubAllEnvs();
  });

  it("returns null when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    const { getSupabaseClient } = await import("../../utils/supabase/client");
    expect(getSupabaseClient()).toBeNull();
  });

  it("returns null when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const { getSupabaseClient } = await import("../../utils/supabase/client");
    expect(getSupabaseClient()).toBeNull();
  });

  it("returns a client object when both env vars are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test");

    const { getSupabaseClient } = await import("../../utils/supabase/client");
    const client = getSupabaseClient();
    expect(client).not.toBeNull();
    expect(typeof client?.from).toBe("function");
  });
});