// Category 10: Accessibility (a11y) Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/i18n/LanguageContext', () => ({
    useLanguage: () => ({
        language: 'sk',
        setLanguage: vi.fn(),
        t: { stepOf: 'Krok {current} z {total}' },
    }),
}));

const mockSetTheme = vi.fn();
vi.mock('next-themes', () => ({
    useTheme: () => ({
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
    }),
}));

import ThemeToggle from '../../components/ThemeToggle';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import OfflineBanner from '../../components/OfflineBanner';
import GlassCard from '../../components/booking/GlassCard';
import Footer from '../../components/Footer';

describe('Accessibility Tests', () => {
    describe('ThemeToggle a11y', () => {
        it('should have aria-label for screen readers', () => {
            render(<ThemeToggle />);
            expect(screen.getByRole('button')).toHaveAttribute('aria-label');
        });

        it('should be focusable', () => {
            render(<ThemeToggle />);
            const button = screen.getByRole('button');
            button.focus();
            expect(document.activeElement).toBe(button);
        });

        it('should have focus-visible ring styles', () => {
            render(<ThemeToggle />);
            const button = screen.getByRole('button');
            expect(button.className).toContain('focus-visible:ring');
        });
    });

    describe('LanguageSwitcher a11y', () => {
        it('should render clickable buttons', () => {
            render(<LanguageSwitcher />);
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBe(2);
        });

        it('should have focus-visible styles', () => {
            render(<LanguageSwitcher />);
            const buttons = screen.getAllByRole('button');
            buttons.forEach((btn) => {
                expect(btn.className).toContain('focus-visible:ring');
            });
        });
    });

    describe('OfflineBanner a11y', () => {
        it('should use semantic text and icon', () => {
            Object.defineProperty(navigator, 'onLine', { writable: true, value: false });
            render(<OfflineBanner />);
            const banner = screen.getByText(/Ste offline/);
            expect(banner).toBeInTheDocument();
            // Banner uses destructive colors for visibility
            const container = banner.closest('div');
            expect(container?.className).toContain('bg-destructive');
        });
    });

    describe('Footer a11y', () => {
        it('should have semantic footer element', () => {
            render(
                <MemoryRouter>
                    <Footer />
                </MemoryRouter>
            );
            expect(document.querySelector('footer')).toBeInTheDocument();
        });

        it('should have aria-labels on social links', () => {
            render(
                <MemoryRouter>
                    <Footer />
                </MemoryRouter>
            );
            expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
            expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
        });

        it('should have noopener noreferrer on external links', () => {
            render(
                <MemoryRouter>
                    <Footer />
                </MemoryRouter>
            );
            const instagramLink = screen.getByLabelText('Instagram');
            expect(instagramLink).toHaveAttribute('rel', 'noopener noreferrer');
            expect(instagramLink).toHaveAttribute('target', '_blank');
        });
    });

    describe('GlassCard a11y', () => {
        it('should pass through content to screen readers', () => {
            render(<GlassCard><h2>Important Info</h2></GlassCard>);
            expect(screen.getByRole('heading', { name: 'Important Info' })).toBeInTheDocument();
        });
    });

    describe('Keyboard Navigation', () => {
        it('should have outline-none with focus-visible ring pattern', () => {
            render(<ThemeToggle />);
            const button = screen.getByRole('button');
            expect(button.className).toContain('outline-none');
            expect(button.className).toContain('focus-visible:ring');
        });
    });

    describe('Color Contrast', () => {
        it('should use destructive scheme for offline banner (high contrast)', () => {
            Object.defineProperty(navigator, 'onLine', { writable: true, value: false });
            render(<OfflineBanner />);
            const container = screen.getByText(/Ste offline/).closest('div');
            expect(container?.className).toContain('bg-destructive');
            expect(container?.className).toContain('text-destructive-foreground');
        });
    });
});
