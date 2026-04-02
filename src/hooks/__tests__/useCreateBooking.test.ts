import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock supabase
const mockInvoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// Import after mocks
import { useCreateBooking } from '../useCreateBooking';

describe('useCreateBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call create-booking edge function with correct payload', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true, booking: { id: '123', date: '2026-03-15', time_slot: '10:00', status: 'confirmed' } },
      error: null,
    });

    const { result } = renderHook(() => useCreateBooking(), { wrapper: createWrapper() });

    result.current.mutate({
      serviceId: 'svc-1',
      date: new Date('2026-03-15'),
      timeSlot: '10:00',
      clientName: 'Test User',
      clientEmail: 'test@example.com',
      clientPhone: '+421900000000',
      notes: 'Test note',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockInvoke).toHaveBeenCalledWith('create-booking', {
      body: {
        service_id: 'svc-1',
        date: '2026-03-15',
        time_slot: '10:00',
        client_name: 'Test User',
        client_email: 'test@example.com',
        client_phone: '+421900000000',
        notes: 'Test note',
        client_request_id: undefined,
        employee_id: null,
      },
    });

    expect(result.current.data).toEqual({
      success: true,
      booking: { id: '123', date: '2026-03-15', time_slot: '10:00', status: 'confirmed' },
    });
  });

  it('should handle edge function error', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    const { result } = renderHook(() => useCreateBooking(), { wrapper: createWrapper() });

    result.current.mutate({
      serviceId: 'svc-1',
      date: new Date('2026-03-15'),
      timeSlot: '10:00',
      clientName: 'Test',
      clientEmail: 'test@test.com',
      clientPhone: '+421900000000',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Server error');
  });

  it('should extract a clean message from 429 edge function responses', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: new Response(
          JSON.stringify({ error: 'Too many requests, please try again later' }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        ),
      },
    });

    const { result } = renderHook(() => useCreateBooking(), { wrapper: createWrapper() });

    result.current.mutate({
      serviceId: 'svc-1',
      date: new Date('2026-03-15'),
      timeSlot: '10:00',
      clientName: 'Test',
      clientEmail: 'test@test.com',
      clientPhone: '+421900000000',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Too many requests, please try again later');
  });

  it('should handle business logic error from response', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: false, error: 'Time slot already booked' },
      error: null,
    });

    const { result } = renderHook(() => useCreateBooking(), { wrapper: createWrapper() });

    result.current.mutate({
      serviceId: 'svc-1',
      date: new Date('2026-03-15'),
      timeSlot: '10:00',
      clientName: 'Test',
      clientEmail: 'test@test.com',
      clientPhone: '+421900000000',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Time slot already booked');
  });

  it('should send null for empty notes', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true, booking: { id: '456', date: '2026-03-15', time_slot: '11:00', status: 'confirmed' } },
      error: null,
    });

    const { result } = renderHook(() => useCreateBooking(), { wrapper: createWrapper() });

    result.current.mutate({
      serviceId: 'svc-1',
      date: new Date('2026-03-15'),
      timeSlot: '11:00',
      clientName: 'Test',
      clientEmail: 'test@test.com',
      clientPhone: '+421900000000',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockInvoke).toHaveBeenCalledWith('create-booking', expect.objectContaining({
      body: expect.objectContaining({ notes: null }),
    }));
  });
});
