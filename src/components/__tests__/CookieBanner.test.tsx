// Category 5: Component Tests - CookieBanner
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/i18n/LanguageContext', () => ({
    useLanguage: () => ({ language: 'sk', t: {} }),
}));

import CookieBanner from '../../components/CookieBanner';

function renderBanner() {
    return render(
        <MemoryRouter>
            <CookieBanner />
        </MemoryRouter>
    );
}

describe('CookieBanner', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        localStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should not show banner if consent was already accepted', () => {
        localStorage.setItem('cookie-consent', 'accepted');
        renderBanner();
        expect(screen.queryByText('Súhlasím')).not.toBeInTheDocument();
    });

    it('should not show banner if consent was already declined', () => {
        localStorage.setItem('cookie-consent', 'declined');
        renderBanner();
        expect(screen.queryByText('Súhlasím')).not.toBeInTheDocument();
    });

    it('should show banner after delay when no consent stored', async () => {
        renderBanner();
        // Initially not visible
        expect(screen.queryByText('Súhlasím')).not.toBeInTheDocument();

        // Advance timer past the 1000ms delay
        await act(async () => {
            vi.advanceTimersByTime(1100);
        });
        expect(screen.getByText('Súhlasím')).toBeInTheDocument();
    });

    it('should store accepted consent and hide banner', async () => {
        renderBanner();
        await act(async () => {
            vi.advanceTimersByTime(1100);
        });

        fireEvent.click(screen.getByText('Súhlasím'));

        expect(localStorage.getItem('cookie-consent')).toBe('accepted');
        expect(screen.queryByText('Súhlasím')).not.toBeInTheDocument();
    });

    it('should store declined consent and hide banner', async () => {
        renderBanner();
        await act(async () => {
            vi.advanceTimersByTime(1100);
        });

        fireEvent.click(screen.getByText('Odmietnuť'));

        expect(localStorage.getItem('cookie-consent')).toBe('declined');
        expect(screen.queryByText('Súhlasím')).not.toBeInTheDocument();
    });

    it('should have a close button that declines', async () => {
        renderBanner();
        await act(async () => {
            vi.advanceTimersByTime(1100);
        });

        const closeBtn = screen.getByLabelText('Close');
        fireEvent.click(closeBtn);

        expect(localStorage.getItem('cookie-consent')).toBe('declined');
    });

    it('should contain privacy policy link', async () => {
        renderBanner();
        await act(async () => {
            vi.advanceTimersByTime(1100);
        });

        expect(screen.getByText('Viac informácií')).toBeInTheDocument();
    });
});
