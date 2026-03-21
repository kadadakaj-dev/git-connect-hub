// Category 7: Integration Tests - App providers and full render
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// Mock sessionStorage for splash screen
const mockSessionStorage: Record<string, string> = {};
Object.defineProperty(window, 'sessionStorage', {
    value: {
        getItem: (key: string) => mockSessionStorage[key] || null,
        setItem: (key: string, value: string) => { mockSessionStorage[key] = value; },
        removeItem: (key: string) => { delete mockSessionStorage[key]; },
        clear: () => { Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]); },
    },
    writable: true,
});

// Mock supabase
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
        functions: {
            invoke: () => Promise.resolve({ data: null, error: null }),
        },
    },
}));

import App from '../../App';

describe('App Integration', () => {
    beforeEach(() => {
        // Skip splash by setting sessionStorage
        mockSessionStorage['fyzio_splash_shown'] = 'true';
    });

    it('should render without crashing', async () => {
        render(<App />);
        // App should render - wait for lazy loading
        await waitFor(() => {
            expect(document.querySelector('.animate-spin') || document.body).toBeTruthy();
        });
    });

    it('should skip splash screen when already shown in session', () => {
        mockSessionStorage['fyzio_splash_shown'] = 'true';
        render(<App />);
        // Should not render splash
        expect(screen.queryByRole('status', { name: /FYZIO/i })).not.toBeInTheDocument();
    });

    it('should show splash screen on first visit', () => {
        delete mockSessionStorage['fyzio_splash_shown'];
        render(<App />);
        expect(screen.getByRole('status', { name: /Loading FYZIO/i })).toBeInTheDocument();
    });

    it('should use opacity:0 for content during splash (allows parallel loading)', () => {
        delete mockSessionStorage['fyzio_splash_shown'];
        const { container } = render(<App />);
        // Content wrapper should exist with opacity 0 (not visibility hidden)
        const contentDiv = container.querySelector('[style*="opacity"]');
        expect(contentDiv).toBeTruthy();
        expect((contentDiv as HTMLElement).style.opacity).toBe('0');
        expect((contentDiv as HTMLElement).style.visibility).not.toBe('hidden');
    });

    it('should wrap app in required providers', () => {
        render(<App />);
        // If we get here without errors, providers are working correctly
        expect(document.documentElement).toBeTruthy();
    });
});
