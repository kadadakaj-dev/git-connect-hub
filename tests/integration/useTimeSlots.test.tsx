import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTimeSlots } from '@/hooks/useTimeSlots';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock Supabase client properly by defining mocks inside the factory
vi.mock('@/integrations/supabase/client', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    rpc: vi.fn(),
    then: vi.fn(),
  };
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: mockSupabase as any,
  };
});

// Import the mocked supabase to use in tests
import { supabase } from '@/integrations/supabase/client';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useTimeSlots Integration', () => {
  const mainPersonId = 'ce777223-62f0-47ec-9b37-30a26d999610';
  const testDate = new Date('2026-05-10'); // Future date

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSuccessfulResponses = () => {
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'blocked_dates') return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }) };
      if (table === 'time_slots_config') return { select: () => ({ eq: () => Promise.resolve({ data: [{ day_of_week: 0, start_time: '09:00', end_time: '10:00', is_active: true }] }) }) };
      if (table === 'employees_public') return { select: () => ({ eq: () => Promise.resolve({ data: [{ id: mainPersonId }, { id: '5c1c02af-cbbc-47a8-b7c7-1387aa53a7bc' }, { id: '06acd843-2d63-4273-b352-14efae698b17' }] }) }) };
      return supabase;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any);
  };

  it('should return 1 slot capacity for a specific therapist', async () => {
    mockSuccessfulResponses();
    vi.mocked(supabase.rpc).mockResolvedValue({ 
      data: [], 
      error: null, 
      count: 0, 
      status: 200, 
      statusText: 'OK' 
    });

    const { result } = renderHook(() => useTimeSlots(testDate, 30, mainPersonId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5000 });

    const slots = result.current.data;
    expect(slots?.[0].totalCapacity).toBe(1);
    expect(slots?.[0].available).toBe(true);
  });

  it('should be unavailable when 1 slot is booked for the specific therapist', async () => {
    mockSuccessfulResponses();
    vi.mocked(supabase.rpc).mockResolvedValue({ 
      data: [
        { time_slot: '09:00', booking_duration: 30 }
      ],
      error: null,
      count: 1,
      status: 200,
      statusText: 'OK'
    });

    const { result } = renderHook(() => useTimeSlots(testDate, 30, mainPersonId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5000 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slot0900 = result.current.data?.find((s: any) => s.time === '09:00');
    expect(slot0900?.available).toBe(false);
    expect(slot0900?.bookedCount).toBe(1);
  });


});
