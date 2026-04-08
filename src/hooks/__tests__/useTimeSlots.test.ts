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
});
