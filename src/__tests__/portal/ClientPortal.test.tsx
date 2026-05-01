import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/i18n/LanguageContext";
import ClientPortal from "@/pages/ClientPortal";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("lucide-react", () => ({
  LogOut: () => <div />,
  Calendar: () => <div />,
  Clock: () => <div />,
  CheckCircle2: () => <div />,
  Clock3: () => <div />,
  XCircle: () => <div />,
  Heart: () => <div />,
  User: () => <div />,
  Camera: () => <div />,
  ChevronRight: () => <div />,
  Settings2: () => <div />,
  Phone: () => <div />,
  Edit2: () => <div />,
  Trash2: () => <div />,
  Loader2: () => <div />,
  Star: () => <div />,
  Plus: () => <div />,
  History: () => <div />,
  FileText: () => <div />,
  ShieldCheck: () => <div />,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h1>{children}</h1>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h1>{children}</h1>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/components/GlassBackground", () => ({
  default: () => <div data-testid="glass-background" />,
}));

const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignOut = vi.fn();

// Mocks defined in vi.mock factories due to hoisting

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  },
}));

vi.mock("@/hooks/useClientProfile", () => {
  const profileData = { 
    full_name: "Test User", 
    phone: "+421900000000", 
    avatar_url: null, 
    total_visits: 5 
  };
  return {
    useClientProfile: () => ({
      data: profileData,
      isLoading: false,
    }),
    useUpdateClientProfile: () => ({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    }),
  };
});

vi.mock("@/hooks/useClientBookings", () => {
  const futureBookingDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const bookingsData = [
    {
      id: "booking-1",
      date: futureBookingDate,
      time_slot: "10:00",
      status: "confirmed",
      service: { name: "Physiotherapy" },
      created_at: "2026-04-08T08:00:00Z",
    },
  ];
  return {
    useClientBookings: () => ({
      data: bookingsData,
      isLoading: false,
    }),
    useCancelBooking: () => ({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    }),
  };
});

vi.mock("@/hooks/useFavoriteServices", () => {
  const favoritesData = [
    {
      service_id: "serv-1",
      service: { id: "serv-1", name: "Physiotherapy", duration: 30, price: 50 }
    }
  ];
  return {
    useFavoriteServices: () => ({
      data: favoritesData,
      isLoading: false,
      toggleFavorite: vi.fn(),
    }),
  };
});

describe("ClientPortal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Shim ResizeObserver for Radix UI components
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

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

    expect(await screen.findByText(/Test User/i)).toBeInTheDocument();
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

    const logoutBtn = await screen.findByTitle(/Odhlásiť sa|Sign Out/i);
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  it("opens profile edit dialog and updates profile", async () => {
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

    const editBtn = await screen.findByTitle("Upraviť profil");
    fireEvent.click(editBtn);

    expect(await screen.findByRole("heading", { name: /Upraviť profil/i })).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Celé meno/i);
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });

    fireEvent.click(screen.getByRole("button", { name: "Uložiť zmeny" }));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Upraviť profil" })).not.toBeInTheDocument();
    });
  });

  it("opens cancel booking dialog and cancels booking", async () => {
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

    const cancelBtn = await screen.findByTitle(/Zrušiť termín/i);
    fireEvent.click(cancelBtn);

    expect(await screen.findByText(/Naozaj chcete zrušiť tento termín/i)).toBeInTheDocument();

    const buttons = screen.getAllByRole("button", { name: /Zrušiť termín/i });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(screen.queryByText(/Naozaj chcete zrušiť tento termín/i)).not.toBeInTheDocument();
    });
  });
});
