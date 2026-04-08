import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
  },
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
  });

  it("redirects guest to /auth", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(
      <MemoryRouter initialEntries={["/portal"]}>
        <Routes>
          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <div>SECRET PORTAL</div>
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<div>AUTH PAGE</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("AUTH PAGE")).toBeInTheDocument();
    });
  });

  it("renders protected content when session exists", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "1", email: "a@b.com" } } },
    });

    render(
      <MemoryRouter initialEntries={["/portal"]}>
        <Routes>
          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <div>SECRET PORTAL</div>
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<div>AUTH PAGE</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("SECRET PORTAL")).toBeInTheDocument();
    });
  });
});
