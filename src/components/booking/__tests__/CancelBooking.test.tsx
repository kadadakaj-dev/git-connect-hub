import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import CancelBooking from '../../../pages/CancelBooking';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();
vi.mock('react-router-dom', () => ({
    useSearchParams: () => [mockSearchParams],
    useNavigate: () => mockNavigate,
}));

// Mock supabase functions
const mockInvoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        functions: {
            invoke: (...args: any[]) => mockInvoke(...args),
        },
    },
}));

vi.mock('@/i18n/LanguageContext', () => ({
    useLanguage: () => ({
        language: 'sk',
        t: {
            clinicName: 'FYZIO&FIT',
        },
    }),
}));

// Mock dependent components
vi.mock('@/components/seo/PageMeta', () => ({
    default: () => null,
}));

vi.mock('@/components/GlassBackground', () => ({
    default: () => null,
}));

vi.mock('@/components/booking/GlassCard', () => ({
    default: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock('@/components/LanguageSwitcher', () => ({
    default: () => <div data-testid="language-switcher" />,
}));

const mockBooking = {
    date: '2027-06-15',
    time_slot: '10:30',
    client_name: 'Ján Novák',
    service_name_sk: 'Fyzioterapia',
    service_name_en: 'Physiotherapy',
};

describe('CancelBooking', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSearchParams.delete('token');
    });

    it('should show error when no token is provided', () => {
        render(<CancelBooking />);

        expect(screen.getByText('Neplatný odkaz na zrušenie')).toBeInTheDocument();
    });

    it('should show loading state while verifying booking', () => {
        mockSearchParams.set('token', 'test-token');
        // Never resolve to keep it in loading state
        mockInvoke.mockReturnValue(new Promise(() => { }));

        render(<CancelBooking />);

        expect(screen.getByText('Overujem rezerváciu...')).toBeInTheDocument();
    });

    it('should show confirmation dialog when booking is found', async () => {
        mockSearchParams.set('token', 'valid-token');
        mockInvoke.mockResolvedValue({
            data: { success: true, booking: mockBooking },
            error: null,
        });

        render(<CancelBooking />);

        await waitFor(() => {
            expect(screen.getByText('Chcete zrušiť túto rezerváciu?')).toBeInTheDocument();
        });

        expect(screen.getByText('Táto akcia je nezvratná')).toBeInTheDocument();
        expect(screen.getByText('Áno, zrušiť rezerváciu')).toBeInTheDocument();
        expect(screen.getByText('Nie, ponechať')).toBeInTheDocument();
    });

    it('should show booking details in confirm state', async () => {
        mockSearchParams.set('token', 'valid-token');
        mockInvoke.mockResolvedValue({
            data: { success: true, booking: mockBooking },
            error: null,
        });

        render(<CancelBooking />);

        await waitFor(() => {
            expect(screen.getByText('Ján Novák')).toBeInTheDocument();
        });

        expect(screen.getByText('Fyzioterapia')).toBeInTheDocument();
        expect(screen.getByText('10:30')).toBeInTheDocument();
    });

    it('should show already_cancelled state', async () => {
        mockSearchParams.set('token', 'cancelled-token');
        mockInvoke.mockResolvedValue({
            data: {
                success: false,
                error: 'Booking is already cancelled',
                booking: mockBooking,
            },
            error: null,
        });

        render(<CancelBooking />);

        await waitFor(() => {
            expect(screen.getByText('Rezervácia už bola zrušená')).toBeInTheDocument();
        });
    });

    it('should navigate home when "keep" button is clicked', async () => {
        mockSearchParams.set('token', 'valid-token');
        mockInvoke.mockResolvedValue({
            data: { success: true, booking: mockBooking },
            error: null,
        });

        render(<CancelBooking />);

        await waitFor(() => {
            expect(screen.getByText('Nie, ponechať')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Nie, ponechať'));
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should show success after cancellation', async () => {
        mockSearchParams.set('token', 'valid-token');

        // First call: get-booking-by-token
        mockInvoke.mockResolvedValueOnce({
            data: { success: true, booking: mockBooking },
            error: null,
        });

        render(<CancelBooking />);

        await waitFor(() => {
            expect(screen.getByText('Áno, zrušiť rezerváciu')).toBeInTheDocument();
        });

        // Second call: cancel-booking
        mockInvoke.mockResolvedValueOnce({
            data: { success: true, booking: mockBooking },
            error: null,
        });

        fireEvent.click(screen.getByText('Áno, zrušiť rezerváciu'));

        await waitFor(() => {
            expect(screen.getByText('Rezervácia zrušená')).toBeInTheDocument();
        });
        expect(screen.getByText('Vaša rezervácia bola úspešne zrušená')).toBeInTheDocument();
    });

    it('should show TOO_LATE_TO_CANCEL error', async () => {
        mockSearchParams.set('token', 'valid-token');

        mockInvoke.mockResolvedValueOnce({
            data: { success: true, booking: mockBooking },
            error: null,
        });

        render(<CancelBooking />);

        await waitFor(() => {
            expect(screen.getByText('Áno, zrušiť rezerváciu')).toBeInTheDocument();
        });

        mockInvoke.mockResolvedValueOnce({
            data: { success: false, error: 'TOO_LATE_TO_CANCEL', booking: mockBooking },
            error: null,
        });

        fireEvent.click(screen.getByText('Áno, zrušiť rezerváciu'));

        await waitFor(() => {
            expect(screen.getByText('Zrušenie online nie je možné')).toBeInTheDocument();
        });
        expect(screen.getByText(/12 hodín/)).toBeInTheDocument();
        expect(screen.getByText(/\+421 905 307 198/)).toBeInTheDocument();
    });

    it('should show error state on network error', async () => {
        mockSearchParams.set('token', 'bad-token');
        mockInvoke.mockRejectedValue(new Error('Network error'));

        render(<CancelBooking />);

        await waitFor(() => {
            expect(screen.getByText('Rezervácia nebola nájdená')).toBeInTheDocument();
        });
    });
});
