// Category 2c: Unit Tests - useFavoriteServices hook
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

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
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

import { useFavoriteServices } from '../useFavoriteServices';

describe('useFavoriteServices', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should be disabled when clientId is undefined', () => {
        const { result } = renderHook(() => useFavoriteServices(undefined), {
            wrapper: createWrapper(),
        });
        expect(result.current.isFetching).toBe(false);
    });

    it('should return empty array when no favorites', async () => {
        mockFrom.mockImplementation((table: string) => {
            if (table === 'favorite_services') return mockChain({ data: [], error: null });
            return mockChain({ data: [], error: null });
        });

        const { result } = renderHook(() => useFavoriteServices('client-1'), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([]);
    });

    it('should fetch favorites with service details', async () => {
        mockFrom.mockImplementation((table: string) => {
            if (table === 'favorite_services') {
                return mockChain({
                    data: [{ id: 'fav-1', client_id: 'client-1', service_id: 'svc-1' }],
                    error: null,
                });
            }
            if (table === 'services') {
                return mockChain({
                    data: [{ id: 'svc-1', name_sk: 'Fyzioterapia', name_en: 'Physiotherapy', duration: 45, price: 85 }],
                    error: null,
                });
            }
            return mockChain({ data: [], error: null });
        });

        const { result } = renderHook(() => useFavoriteServices('client-1'), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toHaveLength(1);
        expect(result.current.data![0].service).toEqual({
            id: 'svc-1',
            name: 'Fyzioterapia',
            duration: 45,
            price: 85,
        });
    });

    it('should handle fetch error', async () => {
        mockFrom.mockImplementation((table: string) => {
            if (table === 'favorite_services') {
                return mockChain({ data: null, error: { message: 'DB error' } });
            }
            return mockChain({ data: [], error: null });
        });

        const { result } = renderHook(() => useFavoriteServices('client-1'), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('should expose toggleFavorite function', () => {
        const { result } = renderHook(() => useFavoriteServices('client-1'), {
            wrapper: createWrapper(),
        });
        expect(typeof result.current.toggleFavorite).toBe('function');
    });
});
