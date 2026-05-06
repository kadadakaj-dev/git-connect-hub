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
    {
        id: 'svc-55',
        name: 'Chiro masáž',
        description: 'Klasická masáž chrbta a ramien',
        duration: 55,
        price: 55,
        category: 'chiropractic',
        icon: 'Bone',
    },
];

vi.mock('@/hooks/useServices', () => ({
    useServices: () => ({
        data: mockServices,
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

vi.mock('../DateTimeSelection', () => ({
    default: ({
        onDateSelect,
        onTimeSelect,
    }: {
        onDateSelect: (date: Date) => void;
        onTimeSelect: (time: string) => void;
    }) => (
        <div>
            <button data-testid="mock-date-select" onClick={() => onDateSelect(new Date('2026-12-07T12:00:00'))}>
                select-date
            </button>
            <button data-testid="mock-time-select" onClick={() => onTimeSelect('10:00')}>
                select-time
            </button>
        </div>
    ),
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
        window.history.replaceState({}, '', '/');
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
        expect(screen.getByText('65€')).toBeInTheDocument();
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

    it('preselects service from query param and unlocks datetime section', async () => {
        window.history.replaceState({}, '', '/?service=svc-1');
        const { container } = render(<BookingWizard />);

        await waitFor(() => {
            const sections = container.querySelectorAll('section');
            expect(sections[1].className).not.toContain('pointer-events-none');
        });

        expect(screen.getByTestId('service-svc-1')).toHaveAttribute('aria-pressed', 'true');
        expect(window.location.search).toBe('');
    });

    it('submits the selected service id from service card selection', async () => {
        mockMutateAsync.mockResolvedValue({
            success: true,
            booking: { id: 'bk-1', date: '2026-12-07', time_slot: '10:00', status: 'confirmed' },
        });

        render(<BookingWizard />);

        fireEvent.click(screen.getByTestId('service-svc-55'));
        fireEvent.click(screen.getByTestId('mock-date-select'));
        fireEvent.click(screen.getByTestId('mock-time-select'));

        fireEvent.change(screen.getByTestId('input-clientName'), { target: { value: 'Erik Test' } });
        fireEvent.change(screen.getByTestId('input-clientEmail'), { target: { value: 'erik@test.com' } });
        fireEvent.change(screen.getByTestId('input-clientPhone'), { target: { value: '+421900123456' } });

        fireEvent.click(screen.getByText('Rezervovať'));

        await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());

        expect(mockMutateAsync).toHaveBeenCalledWith(
            expect.objectContaining({
                serviceId: 'svc-55',
                timeSlot: '10:00',
                clientName: 'Erik Test',
                clientEmail: 'erik@test.com',
                clientPhone: '+421900123456',
            })
        );
    });
});
