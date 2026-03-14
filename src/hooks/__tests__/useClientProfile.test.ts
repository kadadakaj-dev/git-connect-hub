import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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

import { useClientProfile, useUpdateClientProfile } from '../useClientProfile';

const mockProfile = {
  id: 'p1',
  user_id: 'user-1',
  full_name: 'Ján Novák',
  phone: '+421900111222',
  avatar_url: null,
  preferred_language: 'sk',
  total_visits: 5,
  email_notifications: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

describe('useClientProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be disabled when userId is undefined', () => {
    const { result } = renderHook(() => useClientProfile(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.isFetching).toBe(false);
  });

  it('should fetch profile by userId', async () => {
    mockFrom.mockReturnValue(mockChain({ data: mockProfile, error: null }));

    const { result } = renderHook(() => useClientProfile('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockProfile);
    expect(mockFrom).toHaveBeenCalledWith('client_profiles');
  });

  it('should return null when profile does not exist', async () => {
    mockFrom.mockReturnValue(mockChain({ data: null, error: null }));

    const { result } = renderHook(() => useClientProfile('user-2'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('should handle fetch error', async () => {
    mockFrom.mockReturnValue(
      mockChain({ data: null, error: { message: 'Unauthorized', code: '401' } })
    );

    const { result } = renderHook(() => useClientProfile('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUpdateClientProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update profile successfully', async () => {
    const updatedProfile = { ...mockProfile, full_name: 'Peter Novák' };
    mockFrom.mockReturnValue(mockChain({ data: updatedProfile, error: null }));

    const { result } = renderHook(() => useUpdateClientProfile(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        userId: 'user-1',
        updates: { full_name: 'Peter Novák' },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(updatedProfile);
  });

  it('should handle update error', async () => {
    mockFrom.mockReturnValue(
      mockChain({ data: null, error: { message: 'Update failed' } })
    );

    const { result } = renderHook(() => useUpdateClientProfile(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        userId: 'user-1',
        updates: { full_name: 'Test' },
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
