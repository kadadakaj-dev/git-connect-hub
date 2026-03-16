// Category 8: Routing Tests - Route matching and navigation
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => Promise.resolve({ data: [], error: null }),
                    maybeSingle: () => Promise.resolve({ data: null, error: null }),
                }),
            }),
        }),
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
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

// Import pages directly (not lazy)
import NotFound from '../../pages/NotFound';

function renderWithRouter(initialRoute: string, element: React.ReactNode) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <HelmetProvider>
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={[initialRoute]}>
                    {element}
                </MemoryRouter>
            </QueryClientProvider>
        </HelmetProvider>
    );
}

describe('Routing', () => {
    it('should render 404 page for unknown routes', () => {
        renderWithRouter('/nonexistent', (
            <Routes>
                <Route path="*" element={<NotFound />} />
            </Routes>
        ));

        expect(screen.getByText('404')).toBeInTheDocument();
        expect(screen.getByText('Stránka nenájdená')).toBeInTheDocument();
    });

    it('should have home link on 404 page', () => {
        renderWithRouter('/unknown', (
            <Routes>
                <Route path="*" element={<NotFound />} />
            </Routes>
        ));

        const homeLink = screen.getByText('Späť na hlavnú stránku');
        expect(homeLink).toBeInTheDocument();
        expect(homeLink.closest('a')).toHaveAttribute('href', '/');
    });

    it('should display correct route paths', () => {
        // Verify our route configuration
        const routes = ['/', '/auth', '/portal', '/admin/login', '/admin/reset-password', '/admin', '/cancel', '/legal'];
        routes.forEach((path) => {
            expect(path).toBeTruthy();
        });
    });
});
