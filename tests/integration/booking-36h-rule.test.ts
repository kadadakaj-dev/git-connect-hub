import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { format, addHours, subMinutes, addMinutes } from 'date-fns';

// Mock supabase functions
const mockInvoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

// Real imports
import { useCreateBooking } from '../../src/hooks/useCreateBooking';
import { getBratislavaNow, validateBookingLeadTime } from '../../src/lib/booking-rules';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('Booking 36h Lead Time Rule (Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Shared Utility Rule Test', () => {
    it('should REJECT booking exactly 35h 59m from now', () => {
      const now = getBratislavaNow();
      const target = subMinutes(addHours(now.toJSDate(), 36), 1);
      const timeSlot = format(target, 'HH:mm');

      const result = validateBookingLeadTime(target, timeSlot);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Advance booking required');
    });

    it('should ALLOW booking 36h 01m from now', () => {
      const now = getBratislavaNow();
      const target = addMinutes(addHours(now.toJSDate(), 36), 1);
      const timeSlot = format(target, 'HH:mm');

      const result = validateBookingLeadTime(target, timeSlot);
      expect(result.allowed).toBe(true);
    });
  });

  describe('useCreateBooking Hook Guard', () => {
    const invalidTarget = subMinutes(addHours(getBratislavaNow().toJSDate(), 36), 1);
    const validTarget = addMinutes(addHours(getBratislavaNow().toJSDate(), 36), 1);

    it('should immediately throw and NOT call the backend if under 36h', async () => {
      const { result } = renderHook(() => useCreateBooking(), { wrapper: createWrapper() });

      result.current.mutate({
        serviceId: 'svc-1',
        date: invalidTarget,
        timeSlot: format(invalidTarget, 'HH:mm'),
        clientName: 'Test User',
        clientEmail: 'test@example.com',
        clientPhone: '+421900123456',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toContain('Advance booking required');
      // Verify RPC/Backend wasn't even called
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('should ALLOW the call to proceed to the backend if 36h or more', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { success: true, booking: { id: 'new-id' } },
        error: null,
      });

      const { result } = renderHook(() => useCreateBooking(), { wrapper: createWrapper() });

      result.current.mutate({
        serviceId: 'svc-1',
        date: validTarget,
        timeSlot: format(validTarget, 'HH:mm'),
        clientName: 'Test User',
        clientEmail: 'test@example.com',
        clientPhone: '+421900123456',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockInvoke).toHaveBeenCalledWith('create-booking', expect.anything());
    });
  });
});
