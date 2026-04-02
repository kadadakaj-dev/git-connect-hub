import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import OverviewStats from '@/components/admin/OverviewStats';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    then: vi.fn(),
  };
  return {
    supabase: mockSupabase as unknown as typeof supabase,
  };
});

// Mock Language Context
vi.mock('@/i18n/LanguageContext', () => ({
  useLanguage: () => ({ language: 'sk' }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const mockBookings = [
  {
    id: '1',
    client_name: 'John Doe',
    date: '2026-04-01',
    time_slot: '09:00',
    status: 'confirmed',
    services: { name_sk: 'Fyzioterapia', price: 65 }
  }
];

describe('OverviewStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stats counts correctly', async () => {
    // Mock the bookings query
    // Use a simpler mock structure to avoid linting and type issues
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockBookings, error: null }),
      }),
    } as unknown as ReturnType<typeof supabase.from>);

    render(<OverviewStats />, { wrapper });

    // Wait for the data to load
    await waitFor(() => expect(screen.getByText('Dnes')).toBeInTheDocument());
    
    expect(screen.getByText('Týždeň')).toBeInTheDocument();
    expect(screen.getByText('Mesiac')).toBeInTheDocument();
    expect(screen.getByText(/Odhad tržieb/i)).toBeInTheDocument();
  });

  it('displays the recent bookings table', async () => {
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockBookings, error: null }),
      }),
    } as unknown as ReturnType<typeof supabase.from>);

    render(<OverviewStats />, { wrapper });

    expect((await screen.findAllByText('John Doe'))[0]).toBeInTheDocument();
    expect(screen.getAllByText('Fyzioterapia')[0]).toBeInTheDocument();
  });
});
