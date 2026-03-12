import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock supabase
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockNeq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

// Mock language context
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

import { useServices } from '../useServices';

describe('useServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 'svc-1',
          name_sk: 'Fyzioterapia',
          name_en: 'Physiotherapy',
          description_sk: 'Popis SK',
          description_en: 'Desc EN',
          duration: 45,
          price: 85,
          category: 'physiotherapy',
          icon: 'Activity',
          is_active: true,
          sort_order: 0,
        },
        {
          id: 'svc-2',
          name_sk: 'Chiropraktika',
          name_en: 'Chiropractic',
          description_sk: 'Popis 2 SK',
          description_en: 'Desc 2 EN',
          duration: 30,
          price: 75,
          category: 'chiropractic',
          icon: 'Bone',
          is_active: true,
          sort_order: 1,
        },
      ],
      error: null,
    });

    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it('should fetch and map services with SK language', async () => {
    const { result } = renderHook(() => useServices(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('services');
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0]).toEqual({
      id: 'svc-1',
      name: 'Fyzioterapia',
      description: 'Popis SK',
      duration: 45,
      price: 85,
      category: 'physiotherapy',
      icon: 'Activity',
    });
  });

  it('should convert price to number', async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 'svc-1',
          name_sk: 'Test',
          name_en: 'Test',
          description_sk: 'D',
          description_en: 'D',
          duration: 30,
          price: '99.50',
          category: 'physiotherapy',
          icon: 'X',
          is_active: true,
          sort_order: 0,
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useServices(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].price).toBe(99.5);
    expect(typeof result.current.data![0].price).toBe('number');
  });

  it('should handle fetch error', async () => {
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: 'DB error', code: '500' },
    });

    const { result } = renderHook(() => useServices(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('should return empty array when no data', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useServices(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
