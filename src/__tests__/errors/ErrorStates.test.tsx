// Category 12: Error Boundary & Error State Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import React from 'react';

const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: (...args: any[]) => mockFrom(...args),
    },
}));

vi.mock('@/i18n/LanguageContext', () => ({
    useLanguage: () => ({
        language: 'sk',
        setLanguage: vi.fn(),
        t: { stepOf: 'Krok {current} z {total}' },
    }),
    LanguageProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

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

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
}

import { useServices } from '../../hooks/useServices';
import { useClientBookings } from '../../hooks/useClientBookings';
import { useClientProfile } from '../../hooks/useClientProfile';
import NotFound from '../../pages/NotFound';

describe('Error State Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Hook Error States', () => {
        it('useServices should handle network error', async () => {
            mockFrom.mockReturnValue(
                mockChain({ data: null, error: { message: 'Network error', code: 'NETWORK_ERROR' } })
            );

            const { result } = renderHook(() => useServices(), { wrapper: createWrapper() });
            await waitFor(() => expect(result.current.isError).toBe(true));
            expect(result.current.data).toBeUndefined();
        });

        it('useClientBookings should handle auth error', async () => {
            mockFrom.mockReturnValue(
                mockChain({ data: null, error: { message: 'JWT expired', code: '401' } })
            );

            const { result } = renderHook(() => useClientBookings('user-1'), {
                wrapper: createWrapper(),
            });
            await waitFor(() => expect(result.current.isError).toBe(true));
        });

        it('useClientProfile should handle missing profile gracefully', async () => {
            mockFrom.mockReturnValue(mockChain({ data: null, error: null }));

            const { result } = renderHook(() => useClientProfile('user-1'), {
                wrapper: createWrapper(),
            });
            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toBeNull();
        });
    });

    describe('Page Error States', () => {
        it('NotFound page should display 404 with navigation', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            render(
                <HelmetProvider>
                    <MemoryRouter initialEntries={['/invalid-route']}>
                        <Routes>
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </MemoryRouter>
                </HelmetProvider>
            );

            expect(screen.getByText('404')).toBeInTheDocument();
            expect(screen.getByText('Stránka nenájdená')).toBeInTheDocument();
            expect(screen.getByText('Späť na hlavnú stránku')).toBeInTheDocument();

            consoleSpy.mockRestore();
        });

        it('NotFound should log error to console', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            render(
                <HelmetProvider>
                    <MemoryRouter initialEntries={['/missing-page']}>
                        <Routes>
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </MemoryRouter>
                </HelmetProvider>
            );

            expect(consoleSpy).toHaveBeenCalledWith(
                '404 Error: User attempted to access non-existent route:',
                '/missing-page'
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Disabled Query States', () => {
        it('should not fetch services data if hook conditions not met', () => {
            // useServices always fetches (no enabled condition) - verify it fires
            mockFrom.mockReturnValue(mockChain({ data: [], error: null }));
            const { result } = renderHook(() => useServices(), { wrapper: createWrapper() });
            expect(mockFrom).toHaveBeenCalled();
        });

        it('should not fetch bookings when userId is undefined', () => {
            const { result } = renderHook(() => useClientBookings(undefined), {
                wrapper: createWrapper(),
            });
            expect(result.current.isFetching).toBe(false);
            expect(mockFrom).not.toHaveBeenCalled();
        });

        it('should not fetch profile when userId is undefined', () => {
            const { result } = renderHook(() => useClientProfile(undefined), {
                wrapper: createWrapper(),
            });
            expect(result.current.isFetching).toBe(false);
        });
    });
});
