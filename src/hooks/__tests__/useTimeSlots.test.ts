import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock supabase with chainable API
const mockResults: Record<string, any> = {};

function createChain(tableName: string) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(() => mockResults[`${tableName}_maybeSingle`] || { data: null, error: null }),
    then: undefined as any,
  };
}

let chainInstances: Record<string, ReturnType<typeof createChain>> = {};

const mockFrom = vi.fn((table: string) => {
  if (!chainInstances[table]) {
    chainInstances[table] = createChain(table);
  }
  const chain = chainInstances[table];
  
  // Make chainable methods resolve with table-specific results
  const proxy = {
    select: vi.fn((...args: any[]) => {
      return {
        eq: vi.fn((...eqArgs: any[]) => {
          return {
            eq: vi.fn((...eq2Args: any[]) => {
              return {
                order: vi.fn(() => mockResults[table] || { data: [], error: null }),
              };
            }),
            neq: vi.fn((...neqArgs: any[]) => mockResults[`${table}_bookings`] || { data: [], error: null }),
            maybeSingle: vi.fn(() => mockResults[`${table}_maybeSingle`] || { data: null, error: null }),
          };
        }),
        maybeSingle: vi.fn(() => mockResults[`${table}_maybeSingle`] || { data: null, error: null }),
      };
    }),
  };
  return proxy;
});

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

describe('useTimeSlots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chainInstances = {};
    // Reset results
    Object.keys(mockResults).forEach(k => delete mockResults[k]);
  });

  it('should be disabled when selectedDate is null', () => {
    const { result } = renderHook(() => useTimeSlots(null), { wrapper: createWrapper() });
    expect(result.current.isFetching).toBe(false);
  });

  it('should return empty array for blocked dates', async () => {
    // Monday March 16, 2026
    const date = new Date('2026-03-16T12:00:00');

    mockResults['blocked_dates_maybeSingle'] = { data: { id: 'blocked-1' }, error: null };
    mockResults['time_slots_config'] = { data: [], error: null };
    mockResults['bookings_bookings'] = { data: [], error: null };
    mockResults['employees'] = { data: [], error: null };

    const { result } = renderHook(() => useTimeSlots(date), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('should generate time slots from config when date is not blocked', async () => {
    const date = new Date('2026-03-16T12:00:00'); // Monday

    mockResults['blocked_dates_maybeSingle'] = { data: null, error: null };
    mockResults['time_slots_config'] = {
      data: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00', is_active: true }],
      error: null,
    };
    mockResults['bookings_bookings'] = { data: [], error: null };
    mockResults['employees'] = { data: [{ id: 'emp-1' }], error: null };

    // Override mockFrom for this specific test to handle parallel Promise.all calls
    const blocked = Promise.resolve({ data: null, error: null });
    const config = Promise.resolve({
      data: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00', is_active: true }],
      error: null,
    });
    const bookings = Promise.resolve({ data: [], error: null });
    const employees = Promise.resolve({ data: [{ id: 'emp-1' }], error: null });

    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'blocked_dates') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(() => blocked) })) })) };
      }
      if (table === 'time_slots_config') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => config) })) })) };
      }
      if (table === 'bookings') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ neq: vi.fn(() => bookings) })) })) };
      }
      if (table === 'employees') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => employees) })) };
      }
      return { select: vi.fn(() => ({ eq: vi.fn(() => ({ data: [], error: null })) })) };
    });

    const { result } = renderHook(() => useTimeSlots(date), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data).toEqual([
      { time: '09:00', available: true, bookedCount: 0, totalCapacity: 1 },
      { time: '09:30', available: true, bookedCount: 0, totalCapacity: 1 },
    ]);
  });
});
