import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import React from 'react';
import BookingWizard from '../BookingWizard';
import { Service } from '@/types/booking';

// Mock useLanguage
vi.mock('@/i18n/LanguageContext', () => ({
    useLanguage: () => ({
        language: 'sk',
        t: {
            clinicName: 'FYZIOAFIT',
            clinicSubtitle: 'Rezervujte si termín',
            selectService: 'Vyberte službu',
            fullNamePlaceholder: 'Meno a priezvisko',
            emailPlaceholder: 'vas@email.sk',
            phonePlaceholder: '+421 900 123 456',
            notesPlaceholder: 'Akékoľvek poznámky...',
            selectDateToViewSlots: 'Vyberte dátum na zobrazenie dostupných časov',
            noSlotsAvailable: 'Žiadne termíny.',
            bookingConfirmed: 'Rezervácia potvrdená!',
            appointmentScheduled: 'Váš termín bol úspešne naplánovaný',
            confirmationNumber: 'Číslo potvrdenia',
            bookAnotherAppointment: 'Rezervovať ďalší termín',
            bookingSuccess: 'Rezervácia úspešne potvrdená!',
            service: 'Služba',
            min: 'min',
            emailSentTo: 'Potvrdzovací e-mail bol odoslaný na adresu',
            notes: 'Poznámky',
            errors: {
                nameRequired: 'Meno je povinné',
                emailRequired: 'E-mail je povinný',
                emailInvalid: 'Zadajte platný e-mail',
                phoneRequired: 'Telefónne číslo je povinné',
            },
            stepOf: 'Krok {current} z {total}',
        },
    }),
}));

// Mock hooks
const mockMutateAsync = vi.fn();
vi.mock('@/hooks/useCreateBooking', () => ({
    useCreateBooking: () => ({
        mutateAsync: mockMutateAsync,
        isPending: false,
    }),
}));

const mockServices: Service[] = [
    {
        id: 'svc-1',
        name: 'Fyzioterapia',
        description: 'Cielené ošetrenie',
        duration: 30,
        price: 65,
        category: 'physiotherapy',
        icon: 'Heart',
    },
];

vi.mock('@/hooks/useServices', () => ({
    useServices: () => ({
        data: [
            {
                id: 'svc-1',
                name: 'Fyzioterapia',
                description: 'Cielené ošetrenie',
                duration: 30,
                price: 65,
                category: 'physiotherapy',
                icon: 'Heart',
            },
        ],
        isLoading: false,
        error: null,
    }),
}));

vi.mock('@/hooks/useTimeSlots', () => ({
    useTimeSlots: () => ({
        data: [
            { time: '09:00', available: true, bookedCount: 0, totalCapacity: 1 },
            { time: '10:00', available: true, bookedCount: 0, totalCapacity: 1 },
        ],
        isLoading: false,
    }),
}));

// Mock child components that are heavy
vi.mock('@/components/GlassBackground', () => ({
    default: () => null,
}));

vi.mock('../BookingHeader', () => ({
    default: () => <div data-testid="booking-header">Header</div>,
}));

vi.mock('@/components/Footer', () => ({
    default: () => <div data-testid="footer">Footer</div>,
}));

// Need to mock framer-motion so sections aren't pointer-events: none
vi.mock('framer-motion', () => ({
    motion: {
        div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
            <div ref={ref} {...props} />
        )),
        section: React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>((props, ref) => (
            <section ref={ref} {...props} />
        )),
        span: React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>((props, ref) => (
            <span ref={ref} {...props} />
        )),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
describe('BookingWizard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.scrollTo
        vi.spyOn(window, 'scrollTo').mockImplementation(() => { });
    });

    it('should render the wizard with step sections', () => {
        render(<BookingWizard />);

        expect(screen.getByText('Vyberte službu')).toBeInTheDocument();
        expect(screen.getByText('Vyberte dátum')).toBeInTheDocument();
        expect(screen.getByText('Vyberte čas')).toBeInTheDocument();
    });

    it('should display services in step 1', () => {
        render(<BookingWizard />);

        expect(screen.getAllByText('Fyzioterapia')[0]).toBeInTheDocument();
        expect(screen.getByText('65 €')).toBeInTheDocument();
    });

    it('should show submit button text', () => {
        render(<BookingWizard />);

        expect(screen.getByText('Rezervovať')).toBeInTheDocument();
    });

    it('should not create booking when submit clicked without filling fields', async () => {
        render(<BookingWizard />);

        const submitButton = screen.getByText('Rezervovať');
        fireEvent.click(submitButton);

        expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('should render header and footer', () => {
        render(<BookingWizard />);

        expect(screen.getByTestId('booking-header')).toBeInTheDocument();
        expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
});

