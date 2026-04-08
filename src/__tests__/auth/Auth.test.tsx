import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Auth from "@/pages/Auth";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockGetSession = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
    },
  },
}));

describe("Auth page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it("renders login by default", async () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Prihlásenie" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pokračovať" })).toBeInTheDocument();
  });

  it("switches to registration mode", async () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: "Vytvoriť účet" }));
    expect(await screen.findByRole("heading", { name: "Vytvoriť účet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Začať" })).toBeInTheDocument();
  });

  it("logs in user successfully", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    fireEvent.change(await screen.findByLabelText("E-mail"), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Heslo"), {
      target: { value: "secret123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Pokračovať" }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "secret123",
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/portal", { replace: true });
  });

  it("shows login error", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: new Error("Invalid login credentials"),
    });

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    fireEvent.change(await screen.findByLabelText("E-mail"), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Heslo"), {
      target: { value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Pokračovať" }));

    expect(await screen.findByText(/Nesprávny e-mail alebo heslo/i)).toBeInTheDocument();
  });

  it("registers user successfully", async () => {
    mockSignUp.mockResolvedValue({ error: null });

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: "Vytvoriť účet" }));

    fireEvent.change(await screen.findByLabelText("E-mail"), {
      target: { value: "new@example.com" },
    });

    fireEvent.change(await screen.findByLabelText("Heslo"), {
      target: { value: "secret123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Začať" }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled();
    });

    expect(
      await screen.findByText(/Účet bol vytvorený/i)
    ).toBeInTheDocument();
  });

  it("sends reset password email", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: "Zabudnuté heslo" }));

    fireEvent.change(await screen.findByLabelText("E-mail"), {
      target: { value: "reset@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Odoslať" }));

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalled();
    });

    expect(
      await screen.findByText(/Link na obnovu bol odoslaný/i)
    ).toBeInTheDocument();
  });
});
