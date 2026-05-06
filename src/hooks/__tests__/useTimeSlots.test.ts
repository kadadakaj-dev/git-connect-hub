import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock supabase with a flexible mock
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
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

function mockChain(result: { data: unknown; error: unknown }) {
  const promise = Promise.resolve(result);
  const chain: Record<string, unknown> = {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  };
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(target: Record<string, unknown>, prop: string) {
      if (prop in target) return target[prop];
      if (['data', 'error'].includes(prop)) return (result as Record<string, unknown>)[prop];
      return () => new Proxy(target, handler);
    },
  };
  return new Proxy(chain, handler);
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
    const date = new Date('2026-12-07T12:00:00');

    mockRpc.mockImplementation(() => mockChain({ data: [], error: null }));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'blocked_dates') return mockChain({ data: { id: 'b1' }, error: null });
      if (table === 'time_slots_config') return mockChain({ data: [], error: null });
      if (table === 'employees_public') return mockChain({ data: [], error: null });
      return mockChain({ data: [], error: null });
    });

    const { result } = renderHook(() => useTimeSlots(date), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('should generate time slots from config', async () => {
    const date = new Date('2026-12-07T12:00:00'); // Monday (far future, past 36h lead time)

    mockRpc.mockImplementation(() => mockChain({ data: [], error: null }));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'blocked_dates') return mockChain({ data: null, error: null });
      if (table === 'time_slots_config') {
        return mockChain({
          data: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00', is_active: true }],
          error: null,
        });
      }
      if (table === 'employees_public') return mockChain({ data: [{ id: 'emp-1' }], error: null });
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
    const date = new Date('2026-12-07T12:00:00');

    mockRpc.mockImplementation(() => mockChain({ data: [{ time_slot: '09:00' }], error: null }));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'blocked_dates') return mockChain({ data: null, error: null });
      if (table === 'time_slots_config') {
        return mockChain({
          data: [{ day_of_week: 1, start_time: '09:00', end_time: '09:30', is_active: true }],
          error: null,
        });
      }
      if (table === 'employees_public') return mockChain({ data: [{ id: 'emp-1' }], error: null });
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

    mockRpc.mockImplementation(() => mockChain({
      data: [{ time_slot: '09:30', booking_duration: 30 }],
      error: null,
    }));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'blocked_dates') return mockChain({ data: null, error: null });
      if (table === 'time_slots_config') {
        return mockChain({
          data: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00', is_active: true }],
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

  it('should mark slots as unavailable when blocked via blocked_slots', async () => {
    const date = new Date('2026-12-07T12:00:00');

    // Simulate RPC returning a block (which has same structure as booking in RPC response)
    mockRpc.mockImplementation(() => mockChain({ 
      data: [{ time_slot: '09:00', booking_duration: 30 }], 
      error: null 
    }));
    
    mockFrom.mockImplementation((table: string) => {
      if (table === 'blocked_dates') return mockChain({ data: null, error: null });
      if (table === 'time_slots_config') {
        return mockChain({
          data: [{ day_of_week: 1, start_time: '09:00', end_time: '09:30', is_active: true }],
          error: null,
        });
      }
      if (table === 'employees_public') return mockChain({ data: [{ id: 'emp-1' }], error: null });
      return mockChain({ data: [], error: null });
    });

    const { result } = renderHook(() => useTimeSlots(date), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      { time: '09:00', available: false, bookedCount: 1, totalCapacity: 1 },
    ]);
  });

  // ── Chiro booking correctness tests ──────────────────────────────────────────

  it('chiro 16:00 booking (booking_duration=60) blocks the 16:30 slot', async () => {
    // booking_duration semantics: ceil(service_duration / 30) * 30
    // Chiro masáž: service duration 50 min → booking_duration 60 (2 grid slots)
    // A booking at 16:00 with booking_duration=60 must make 16:30 unavailable.
    const date = new Date('2026-12-07T12:00:00'); // Monday, far future

    mockRpc.mockImplementation(() => mockChain({
      data: [{ time_slot: '16:00', booking_duration: 60 }],
      error: null,
    }));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'blocked_dates') return mockChain({ data: null, error: null });
      if (table === 'time_slots_config') {
        return mockChain({
          data: [{ day_of_week: 1, start_time: '09:00', end_time: '19:10', is_active: true }],
          error: null,
        });
      }
      if (table === 'employees_public') return mockChain({ data: [{ id: 'emp-1' }], error: null });
      return mockChain({ data: [], error: null });
    });

    // serviceDuration=50 → requiredSlots=2 (50/30 rounded up)
    const { result } = renderHook(() => useTimeSlots(date, 50), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const slot1600 = result.current.data?.find(s => s.time === '16:00');
    const slot1630 = result.current.data?.find(s => s.time === '16:30');
    const slot1700 = result.current.data?.find(s => s.time === '17:00');

    // 16:00 is booked (occupied by the existing booking)
    expect(slot1600?.available).toBe(false);
    // 16:30 falls within the 16:00 booking's block (960 ≤ 990 < 1020) → must be blocked
    expect(slot1630?.available).toBe(false);
    // 17:00 is outside the booking block (1020 is not < 1020) → free
    expect(slot1700?.available).toBe(true);
  });

  it('18:00 slot is available for a 50-min service when config end_time is 19:10', async () => {
    // 18:00 + 50 min = 18:50, closing 19:10 → endMinutes(1130) ≤ closingMinutes(1150) → allowed
    const date = new Date('2026-12-07T12:00:00');

    mockRpc.mockImplementation(() => mockChain({ data: [], error: null }));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'blocked_dates') return mockChain({ data: null, error: null });
      if (table === 'time_slots_config') {
        return mockChain({
          data: [{ day_of_week: 1, start_time: '09:00', end_time: '19:10', is_active: true }],
          error: null,
        });
      }
      if (table === 'employees_public') return mockChain({ data: [{ id: 'emp-1' }], error: null });
      return mockChain({ data: [], error: null });
    });

    const { result } = renderHook(() => useTimeSlots(date, 50), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const slot1800 = result.current.data?.find(s => s.time === '18:00');
    expect(slot1800).toBeDefined();
    expect(slot1800?.available).toBe(true);
  });

  it('18:00 slot is unavailable when config end_time is 18:00', async () => {
    // 18:00 + 15 min = 18:15, closing 18:00 → blocked
    const date = new Date('2026-12-07T12:00:00');

    mockRpc.mockImplementation(() => mockChain({ data: [], error: null }));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'blocked_dates') return mockChain({ data: null, error: null });
      if (table === 'time_slots_config') {
        return mockChain({
          data: [{ day_of_week: 1, start_time: '09:00', end_time: '18:00', is_active: true }],
          error: null,
        });
      }
      if (table === 'employees_public') return mockChain({ data: [{ id: 'emp-1' }], error: null });
      return mockChain({ data: [], error: null });
    });

    const { result } = renderHook(() => useTimeSlots(date, 15), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const slot1800 = result.current.data?.find(s => s.time === '18:00');
    expect(slot1800).toBeUndefined();
  });

  it('uses the latest time_slots_config row per day deterministically', async () => {
    // Older config would allow 18:00, latest config should block it.
    const date = new Date('2026-12-07T12:00:00');

    mockRpc.mockImplementation(() => mockChain({ data: [], error: null }));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'blocked_dates') return mockChain({ data: null, error: null });
      if (table === 'time_slots_config') {
        return mockChain({
          data: [
            {
              id: 'cfg-old',
              day_of_week: 1,
              start_time: '09:00',
              end_time: '19:10',
              is_active: true,
              created_at: '2026-01-01T10:00:00Z',
            },
            {
              id: 'cfg-new',
              day_of_week: 1,
              start_time: '09:00',
              end_time: '18:00',
              is_active: true,
              created_at: '2026-05-01T10:00:00Z',
            },
          ],
          error: null,
        });
      }
      if (table === 'employees_public') return mockChain({ data: [{ id: 'emp-1' }], error: null });
      return mockChain({ data: [], error: null });
    });

    const { result } = renderHook(() => useTimeSlots(date, 15), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const slot1800 = result.current.data?.find(s => s.time === '18:00');
    expect(slot1800).toBeUndefined();
  });

  it('18:30 slot is unavailable for a 50-min service when config end_time is 19:10', async () => {
    // 18:30 + 50 min = 19:20, closing 19:10 → endMinutes(1160) > closingMinutes(1150) → blocked
    const date = new Date('2026-12-07T12:00:00');

    mockRpc.mockImplementation(() => mockChain({ data: [], error: null }));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'blocked_dates') return mockChain({ data: null, error: null });
      if (table === 'time_slots_config') {
        return mockChain({
          data: [{ day_of_week: 1, start_time: '09:00', end_time: '19:10', is_active: true }],
          error: null,
        });
      }
      if (table === 'employees_public') return mockChain({ data: [{ id: 'emp-1' }], error: null });
      return mockChain({ data: [], error: null });
    });

    const { result } = renderHook(() => useTimeSlots(date, 50), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const slot1830 = result.current.data?.find(s => s.time === '18:30');
    expect(slot1830).toBeDefined();
    expect(slot1830?.available).toBe(false);
  });
});
