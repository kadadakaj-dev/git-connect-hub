import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

vi.mock('@/i18n/LanguageContext', () => ({
  useLanguage: () => ({ language: 'sk', t: {} }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function mockChain(result: any) {
  const handler: ProxyHandler<any> = {
    get(_: any, prop: string) {
      if (prop === 'then') return undefined;
      if (['data', 'error'].includes(prop)) return result[prop];
      return (..._args: any[]) => new Proxy(result, handler);
    },
  };
  return new Proxy(result, handler);
}

import { useClientBookings } from '../useClientBookings';

describe('useClientBookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be disabled when userId is undefined', () => {
    const { result } = renderHook(() => useClientBookings(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.isFetching).toBe(false);
  });

  it('should return empty array when no bookings exist', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'bookings') return mockChain({ data: [], error: null });
      return mockChain({ data: [], error: null });
    });

    const { result } = renderHook(() => useClientBookings('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('should fetch and combine bookings with services and notes', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'bookings') {
        return mockChain({
          data: [
            {
              id: 'b1',
              date: '2026-03-20',
              time_slot: '10:00',
              status: 'confirmed',
              notes: 'Client note',
              created_at: '2026-03-14T10:00:00Z',
              service_id: 'svc-1',
            },
          ],
          error: null,
        });
      }
      if (table === 'services') {
        return mockChain({
          data: [
            {
              id: 'svc-1',
              name_sk: 'Fyzioterapia',
              name_en: 'Physiotherapy',
              duration: 45,
              price: 85,
            },
          ],
          error: null,
        });
      }
      if (table === 'therapist_notes') {
        return mockChain({
          data: [
            {
              id: 'n1',
              booking_id: 'b1',
              note: 'Therapist observation',
              created_at: '2026-03-20T11:00:00Z',
            },
          ],
          error: null,
        });
      }
      return mockChain({ data: [], error: null });
    });

    const { result } = renderHook(() => useClientBookings('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0]).toEqual({
      id: 'b1',
      date: '2026-03-20',
      time_slot: '10:00',
      status: 'confirmed',
      notes: 'Client note',
      created_at: '2026-03-14T10:00:00Z',
      service: {
        id: 'svc-1',
        name: 'Fyzioterapia',
        duration: 45,
        price: 85,
      },
      therapist_notes: [
        {
          id: 'n1',
          note: 'Therapist observation',
          created_at: '2026-03-20T11:00:00Z',
        },
      ],
    });
  });

  it('should handle bookings error', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'bookings') {
        return mockChain({ data: null, error: { message: 'DB error', code: '500' } });
      }
      return mockChain({ data: [], error: null });
    });

    const { result } = renderHook(() => useClientBookings('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('should handle booking with no matching service', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'bookings') {
        return mockChain({
          data: [
            {
              id: 'b2',
              date: '2026-03-21',
              time_slot: '14:00',
              status: 'confirmed',
              notes: null,
              created_at: '2026-03-14T10:00:00Z',
              service_id: 'missing-svc',
            },
          ],
          error: null,
        });
      }
      if (table === 'services') return mockChain({ data: [], error: null });
      if (table === 'therapist_notes') return mockChain({ data: [], error: null });
      return mockChain({ data: [], error: null });
    });

    const { result } = renderHook(() => useClientBookings('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].service).toBeNull();
    expect(result.current.data![0].therapist_notes).toEqual([]);
  });
});
