// Category 11: Snapshot Tests - Visual regression
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/i18n/LanguageContext', () => ({
    useLanguage: () => ({
        language: 'sk',
        setLanguage: vi.fn(),
        t: { stepOf: 'Krok {current} z {total}' },
    }),
}));

vi.mock('next-themes', () => ({
    useTheme: () => ({
        setTheme: vi.fn(),
        resolvedTheme: 'light',
    }),
}));

import GlassCard from '../../components/booking/GlassCard';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import ThemeToggle from '../../components/ThemeToggle';
import GlassBackground from '../../components/GlassBackground';
import OfflineBanner from '../../components/OfflineBanner';

describe('Snapshot Tests', () => {
    it('should match GlassCard snapshot', () => {
        const { container } = render(<GlassCard className="test-class">Test Content</GlassCard>);
        expect(container.innerHTML).toMatchSnapshot();
    });

    it('should match LanguageSwitcher snapshot', () => {
        const { container } = render(<LanguageSwitcher />);
        expect(container.innerHTML).toMatchSnapshot();
    });

    it('should match ThemeToggle snapshot (light mode)', () => {
        const { container } = render(<ThemeToggle />);
        expect(container.innerHTML).toMatchSnapshot();
    });

    it('should match GlassBackground snapshot', () => {
        const { container } = render(<GlassBackground />);
        expect(container.innerHTML).toMatchSnapshot();
    });

    it('should match OfflineBanner snapshot (offline)', () => {
        Object.defineProperty(navigator, 'onLine', { writable: true, value: false });
        const { container } = render(<OfflineBanner />);
        expect(container.innerHTML).toMatchSnapshot();
    });

    it('should match OfflineBanner snapshot (online)', () => {
        Object.defineProperty(navigator, 'onLine', { writable: true, value: true });
        const { container } = render(<OfflineBanner />);
        expect(container.innerHTML).toMatchSnapshot();
    });
});
