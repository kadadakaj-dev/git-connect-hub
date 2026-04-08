import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/i18n/LanguageContext";
import ClientPortal from "@/pages/ClientPortal";

const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  },
}));

vi.mock("@/hooks/useClientProfile", () => ({
  useClientProfile: () => ({
    data: { full_name: null, avatar_url: null, total_visits: 5 },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useClientBookings", () => ({
  useClientBookings: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useFavoriteServices", () => ({
  useFavoriteServices: () => ({
    data: [],
    isLoading: false,
    toggleFavorite: vi.fn(),
  }),
}));

describe("ClientPortal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          email: "test@example.com",
          email_confirmed_at: "2026-04-08T10:00:00Z",
        },
      },
      error: null,
    });

    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });

    mockSignOut.mockResolvedValue({ error: null });

    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  it("renders user info", async () => {
    // Wrap in render to handle effects
    render(
      <HelmetProvider>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter>
              <ClientPortal />
            </MemoryRouter>
          </QueryClientProvider>
        </LanguageProvider>
      </HelmetProvider>
    );

    expect(await screen.findByText(/test@example.com/i)).toBeInTheDocument();
  });

  it("logs user out", async () => {
    render(
      <HelmetProvider>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter>
              <ClientPortal />
            </MemoryRouter>
          </QueryClientProvider>
        </LanguageProvider>
      </HelmetProvider>
    );

    const logoutBtn = await screen.findByRole("button", { name: "Odhlásiť sa" });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
