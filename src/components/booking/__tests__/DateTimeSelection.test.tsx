import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import DateTimeSelection from '../DateTimeSelection';

// Mock useTimeSlots
const mockUseTimeSlots = vi.fn();
vi.mock('@/hooks/useTimeSlots', () => ({
    useTimeSlots: (...args: any[]) => mockUseTimeSlots(...args),
}));

vi.mock('@/i18n/LanguageContext', () => ({
    useLanguage: () => ({
        language: 'sk',
        t: {
            selectDateToViewSlots: 'Vyberte dátum na zobrazenie dostupných časov',
            noSlotsAvailable: 'Pre tento deň nie sú dostupné žiadne termíny.',
        },
    }),
}));

vi.mock('../TimeSlotSkeleton', () => ({
    default: () => <div data-testid="time-slot-skeleton">Loading slots...</div>,
}));

const mockSlots = [
    { time: '08:00', available: true, bookedCount: 0, totalCapacity: 1 },
    { time: '08:30', available: true, bookedCount: 0, totalCapacity: 1 },
    { time: '09:00', available: false, bookedCount: 1, totalCapacity: 1 },
    { time: '12:00', available: true, bookedCount: 0, totalCapacity: 1 },
    { time: '13:00', available: true, bookedCount: 0, totalCapacity: 1 },
];

describe('DateTimeSelection', () => {
    const onDateSelect = vi.fn();
    const onTimeSelect = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseTimeSlots.mockReturnValue({ data: [], isLoading: false });
    });

    it('should render calendar with SK day labels', () => {
        render(
            <DateTimeSelection
                selectedDate={null}
                selectedTime={null}
                onDateSelect={onDateSelect}
                onTimeSelect={onTimeSelect}
            />
        );

        expect(screen.getByText('Po')).toBeInTheDocument();
        expect(screen.getByText('Ut')).toBeInTheDocument();
        expect(screen.getByText('St')).toBeInTheDocument();
        expect(screen.getByText('Št')).toBeInTheDocument();
        expect(screen.getByText('Pi')).toBeInTheDocument();
        expect(screen.getByText('So')).toBeInTheDocument();
        expect(screen.getByText('Ne')).toBeInTheDocument();
    });

    it('should show "select date" message when no date is selected', () => {
        render(
            <DateTimeSelection
                selectedDate={null}
                selectedTime={null}
                onDateSelect={onDateSelect}
                onTimeSelect={onTimeSelect}
            />
        );

        expect(screen.getByText('Vyberte dátum na zobrazenie dostupných časov')).toBeInTheDocument();
    });

    it('should show loading skeleton when slots are loading', () => {
        const futureDate = new Date(2027, 5, 15); // Far future Tuesday
        mockUseTimeSlots.mockReturnValue({ data: [], isLoading: true });

        render(
            <DateTimeSelection
                selectedDate={futureDate}
                selectedTime={null}
                onDateSelect={onDateSelect}
                onTimeSelect={onTimeSelect}
            />
        );

        expect(screen.getByTestId('time-slot-skeleton')).toBeInTheDocument();
    });

    it('should show "no slots" message when no slots at all', () => {
        const futureDate = new Date(2027, 5, 15);
        mockUseTimeSlots.mockReturnValue({ data: [], isLoading: false });

        render(
            <DateTimeSelection
                selectedDate={futureDate}
                selectedTime={null}
                onDateSelect={onDateSelect}
                onTimeSelect={onTimeSelect}
            />
        );

        expect(screen.getByText('Pre tento deň nie sú dostupné žiadne termíny.')).toBeInTheDocument();
    });

    it('should still show booked slots when all slots are unavailable', () => {
        const futureDate = new Date(2027, 5, 15);
        const allBookedSlots = [{ time: '09:00', available: false, bookedCount: 1, totalCapacity: 1 }];
        mockUseTimeSlots.mockReturnValue({ data: allBookedSlots, isLoading: false });

        render(
            <DateTimeSelection
                selectedDate={futureDate}
                selectedTime={null}
                onDateSelect={onDateSelect}
                onTimeSelect={onTimeSelect}
            />
        );

        // Should show the slot (red), not the "no slots" message
        expect(screen.getByText('09:00')).toBeInTheDocument();
        expect(screen.getByText('09:00')).toHaveClass('bg-red-500/30');
        expect(screen.queryByText('Pre tento deň nie sú dostupné žiadne termíny.')).not.toBeInTheDocument();
    });

    it('should render morning and afternoon slot groups', () => {
        const futureDate = new Date(2027, 5, 15);
        mockUseTimeSlots.mockReturnValue({ data: mockSlots, isLoading: false });

        render(
            <DateTimeSelection
                selectedDate={futureDate}
                selectedTime={null}
                onDateSelect={onDateSelect}
                onTimeSelect={onTimeSelect}
            />
        );

        expect(screen.getByText('Dopoludnia')).toBeInTheDocument();
        expect(screen.getByText('Popoludní')).toBeInTheDocument();
    });

    it('should render time slot buttons', () => {
        const futureDate = new Date(2027, 5, 15);
        mockUseTimeSlots.mockReturnValue({ data: mockSlots, isLoading: false });

        render(
            <DateTimeSelection
                selectedDate={futureDate}
                selectedTime={null}
                onDateSelect={onDateSelect}
                onTimeSelect={onTimeSelect}
            />
        );

        expect(screen.getByText('08:00')).toBeInTheDocument();
        expect(screen.getByText('08:30')).toBeInTheDocument();
        expect(screen.getByText('12:00')).toBeInTheDocument();
        expect(screen.getByText('13:00')).toBeInTheDocument();
    });

    it('should call onTimeSelect when an available slot is clicked', () => {
        const futureDate = new Date(2027, 5, 15);
        mockUseTimeSlots.mockReturnValue({ data: mockSlots, isLoading: false });

        render(
            <DateTimeSelection
                selectedDate={futureDate}
                selectedTime={null}
                onDateSelect={onDateSelect}
                onTimeSelect={onTimeSelect}
            />
        );

        fireEvent.click(screen.getByText('08:00'));
        expect(onTimeSelect).toHaveBeenCalledWith('08:00');
    });

    it('should disable unavailable time slots', () => {
        const futureDate = new Date(2027, 5, 15);
        mockUseTimeSlots.mockReturnValue({ data: mockSlots, isLoading: false });

        render(
            <DateTimeSelection
                selectedDate={futureDate}
                selectedTime={null}
                onDateSelect={onDateSelect}
                onTimeSelect={onTimeSelect}
            />
        );

        const unavailableSlot = screen.getByText('09:00');
        expect(unavailableSlot).toBeDisabled();
    });

    it('should highlight selected time slot', () => {
        const futureDate = new Date(2027, 5, 15);
        mockUseTimeSlots.mockReturnValue({ data: mockSlots, isLoading: false });

        render(
            <DateTimeSelection
                selectedDate={futureDate}
                selectedTime="08:00"
                onDateSelect={onDateSelect}
                onTimeSelect={onTimeSelect}
            />
        );

        const selectedSlot = screen.getByText('08:00');
        expect(selectedSlot).toHaveClass('bg-primary');
    });

    it('should show multi-slot info for services longer than 30min', () => {
        const futureDate = new Date(2027, 5, 15);
        mockUseTimeSlots.mockReturnValue({ data: mockSlots, isLoading: false });

        render(
            <DateTimeSelection
                selectedDate={futureDate}
                selectedTime={null}
                onDateSelect={onDateSelect}
                onTimeSelect={onTimeSelect}
                serviceDuration={60}
            />
        );

        expect(screen.getByText(/Služba zaberie 2 po sebe idúcich slotov \(60 min\)/)).toBeInTheDocument();
    });

    it('should render month navigation buttons', () => {
        render(
            <DateTimeSelection
                selectedDate={null}
                selectedTime={null}
                onDateSelect={onDateSelect}
                onTimeSelect={onTimeSelect}
            />
        );

        // There should be previous and next month buttons
        const buttons = screen.getAllByRole('button');
        // At least 2 navigation buttons exist among all buttons
        expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('should show booked slots with red styling', () => {
        const futureDate = new Date(2027, 5, 15);
        const slotsWithBookedAndUnavailable = [
            { time: '08:00', available: true, bookedCount: 0, totalCapacity: 1 },
            { time: '09:00', available: false, bookedCount: 1, totalCapacity: 1 }, // booked
            { time: '09:30', available: false, bookedCount: 0, totalCapacity: 1 }, // unavailable but not booked
        ];
        mockUseTimeSlots.mockReturnValue({ data: slotsWithBookedAndUnavailable, isLoading: false });

        render(
            <DateTimeSelection
                selectedDate={futureDate}
                selectedTime={null}
                onDateSelect={onDateSelect}
                onTimeSelect={onTimeSelect}
            />
        );

        const bookedSlot = screen.getByText('09:00');
        expect(bookedSlot).toBeDisabled();
        expect(bookedSlot).toHaveClass('bg-red-500/30');
        expect(bookedSlot).toHaveClass('border-red-500/50');
        expect(bookedSlot).not.toHaveClass('opacity-25');

        const unavailableSlot = screen.getByText('09:30');
        expect(unavailableSlot).toBeDisabled();
        expect(unavailableSlot).toHaveClass('opacity-25');
        expect(unavailableSlot).not.toHaveClass('bg-red-500/30');
    });

    it('should disable Sundays in the calendar', () => {
        mockUseTimeSlots.mockReturnValue({ data: [], isLoading: false });

        render(
            <DateTimeSelection
                selectedDate={null}
                selectedTime={null}
                onDateSelect={onDateSelect}
                onTimeSelect={onTimeSelect}
            />
        );

        // Sundays should be disabled — we can check by finding all disabled buttons
        // that are calendar day buttons (they contain a number)
        const allButtons = screen.getAllByRole('button');
        const disabledDayButtons = allButtons.filter(
            (btn) => (btn as HTMLButtonElement).disabled && /^\d+$/.test(btn.textContent || '')
        );
        // At least some days should be disabled (Sundays + past dates)
        expect(disabledDayButtons.length).toBeGreaterThan(0);
    });
});
