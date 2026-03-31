import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock supabase with a flexible mock
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

import { useTimeSlots } from '../useTimeSlots';

function mockChain(result: any) {
  const chain: any = {};
  const handler = {
    get(_: any, prop: string) {
      if (prop === 'then') return undefined;
      if (['data', 'error'].includes(prop)) return result[prop];
      return (..._args: any[]) => new Proxy(result, handler);
    },
  };
  return new Proxy(result, handler);
}

describe('useTimeSlots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be disabled when selectedDate is null', () => {
    const { result } = renderHook(() => useTimeSlots(null), { wrapper: createWrapper() });
    expect(result.current.isFetching).toBe(false);
  });

  it('should return empty array for blocked dates', async () => {
    const date = new Date('2026-03-16T12:00:00');

    mockFrom.mockImplementation((table: string) => {
      if (table === 'blocked_dates') return mockChain({ data: { id: 'b1' }, error: null });
      if (table === 'time_slots_config') return mockChain({ data: [], error: null });
      if (table === 'bookings') return mockChain({ data: [], error: null });
      if (table === 'employees') return mockChain({ data: [], error: null });
      return mockChain({ data: [], error: null });
    });

    const { result } = renderHook(() => useTimeSlots(date), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('should generate time slots from config', async () => {
    const date = new Date('2026-12-07T12:00:00'); // Monday (far future, past 36h lead time)

    mockFrom.mockImplementation((table: string) => {
      if (table === 'blocked_dates') return mockChain({ data: null, error: null });
      if (table === 'time_slots_config') {
        return mockChain({
          data: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00', is_active: true }],
          error: null,
        });
      }
      if (table === 'bookings') return mockChain({ data: [], error: null });
      if (table === 'employees') return mockChain({ data: [{ id: 'emp-1' }], error: null });
      return mockChain({ data: [], error: null });
    });

    const { result } = renderHook(() => useTimeSlots(date), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      { time: '09:00', available: true, bookedCount: 0, totalCapacity: 1 },
      { time: '09:30', available: true, bookedCount: 0, totalCapacity: 1 },
    ]);
  });

  it('should mark slots as unavailable when fully booked', async () => {
    const date = new Date('2026-03-16T12:00:00');

    mockFrom.mockImplementation((table: string) => {
      if (table === 'blocked_dates') return mockChain({ data: null, error: null });
      if (table === 'time_slots_config') {
        return mockChain({
          data: [{ day_of_week: 1, start_time: '09:00', end_time: '09:30', is_active: true }],
          error: null,
        });
      }
      if (table === 'bookings') return mockChain({ data: [{ time_slot: '09:00' }], error: null });
      if (table === 'employees') return mockChain({ data: [{ id: 'emp-1' }], error: null });
      return mockChain({ data: [], error: null });
    });

    const { result } = renderHook(() => useTimeSlots(date), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      { time: '09:00', available: false, bookedCount: 1, totalCapacity: 1 },
    ]);
  });

  it('should carry occupied state to the starting slot for multi-slot services', async () => {
    const date = new Date('2026-12-07T12:00:00');

    mockFrom.mockImplementation((table: string) => {
      if (table === 'blocked_dates') return mockChain({ data: null, error: null });
      if (table === 'time_slots_config') {
        return mockChain({
          data: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00', is_active: true }],
          error: null,
        });
      }
      if (table === 'bookings') {
        return mockChain({
          data: [{ time_slot: '09:30', booking_duration: 30 }],
          error: null,
        });
      }
      if (table === 'employees_public') return mockChain({ data: [{ id: 'emp-1' }], error: null });
      return mockChain({ data: [], error: null });
    });

    const { result } = renderHook(() => useTimeSlots(date, 60), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      { time: '09:00', available: false, bookedCount: 1, totalCapacity: 1 },
      { time: '09:30', available: false, bookedCount: 1, totalCapacity: 1 },
    ]);
  });
});
