import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Confirmation from '../Confirmation';
import { BookingData, Service } from '@/types/booking';

vi.mock('@/i18n/LanguageContext', () => ({
    useLanguage: () => ({
        language: 'sk',
        t: {
            bookingConfirmed: 'Rezervácia potvrdená!',
            appointmentScheduled: 'Váš termín bol úspešne naplánovaný',
            confirmationNumber: 'Číslo potvrdenia',
            confirmed: 'Potvrdené',
            service: 'Služba',
            dateAndTime: 'Dátum a čas',
            location: 'Miesto',
            clinicAddress: 'Krmanová 6, Košice',
            notes: 'Poznámky',
            emailSentTo: 'Potvrdzovací e-mail bol odoslaný na adresu',
            bookAnotherAppointment: 'Rezervovať ďalší termín',
            min: 'min',
        },
    }),
}));

const mockService: Service = {
    id: 'svc-1',
    name: 'Fyzioterapia',
    description: 'Cielené ošetrenie',
    duration: 45,
    price: 85,
    category: 'physiotherapy',
    icon: 'Activity',
};

const mockBookingData: BookingData = {
    service: mockService,
    date: new Date(2027, 5, 15),
    time: '10:30',
    clientName: 'Ján Novák',
    clientEmail: 'jan@test.sk',
    clientPhone: '+421 900 111 222',
    notes: '',
};

describe('Confirmation', () => {
    const onNewBooking = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should display booking confirmed header', () => {
        render(<Confirmation bookingData={mockBookingData} onNewBooking={onNewBooking} />);

        expect(screen.getByText('Rezervácia potvrdená!')).toBeInTheDocument();
        expect(screen.getByText('Váš termín bol úspešne naplánovaný')).toBeInTheDocument();
    });

    it('should display a confirmation code starting with #', () => {
        render(<Confirmation bookingData={mockBookingData} onNewBooking={onNewBooking} />);

        const codeElement = screen.getByText(/^#[A-Z0-9]+$/);
        expect(codeElement).toBeInTheDocument();
        // Confirmation code should be 6 chars after #
        expect(codeElement.textContent!.length).toBe(7); // # + 6 chars
    });

    it('should display service name and price', () => {
        render(<Confirmation bookingData={mockBookingData} onNewBooking={onNewBooking} />);

        expect(screen.getByText('Fyzioterapia')).toBeInTheDocument();
        expect(screen.getByText('85€')).toBeInTheDocument();
    });

    it('should display service duration', () => {
        render(<Confirmation bookingData={mockBookingData} onNewBooking={onNewBooking} />);

        expect(screen.getByText('45 min')).toBeInTheDocument();
    });

    it('should display appointment time', () => {
        render(<Confirmation bookingData={mockBookingData} onNewBooking={onNewBooking} />);

        expect(screen.getByText('10:30')).toBeInTheDocument();
    });

    it('should display client details', () => {
        render(<Confirmation bookingData={mockBookingData} onNewBooking={onNewBooking} />);

        expect(screen.getByText('Ján Novák')).toBeInTheDocument();
        expect(screen.getAllByText('jan@test.sk').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('+421 900 111 222')).toBeInTheDocument();
    });

    it('should display location', () => {
        render(<Confirmation bookingData={mockBookingData} onNewBooking={onNewBooking} />);

        expect(screen.getByText('Krmanová 6, Košice')).toBeInTheDocument();
    });

    it('should display email sent notice with client email', () => {
        render(<Confirmation bookingData={mockBookingData} onNewBooking={onNewBooking} />);

        expect(screen.getByText(/Potvrdzovací e-mail bol odoslaný na adresu/)).toBeInTheDocument();
        // The email should appear in the notice area
        const emailElements = screen.getAllByText('jan@test.sk');
        expect(emailElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should display notes when provided', () => {
        const dataWithNotes = { ...mockBookingData, notes: 'Bolí ma chrbát' };
        render(<Confirmation bookingData={dataWithNotes} onNewBooking={onNewBooking} />);

        expect(screen.getByText('Bolí ma chrbát')).toBeInTheDocument();
    });

    it('should not display notes section when notes are empty', () => {
        render(<Confirmation bookingData={mockBookingData} onNewBooking={onNewBooking} />);

        expect(screen.queryByText('Poznámky')).not.toBeInTheDocument();
    });

    it('should call onNewBooking when "Book Another" button is clicked', () => {
        render(<Confirmation bookingData={mockBookingData} onNewBooking={onNewBooking} />);

        fireEvent.click(screen.getByText('Rezervovať ďalší termín'));
        expect(onNewBooking).toHaveBeenCalledTimes(1);
    });

    it('should render "Add to Calendar" button', () => {
        render(<Confirmation bookingData={mockBookingData} onNewBooking={onNewBooking} />);

        expect(screen.getByText('Google')).toBeInTheDocument();
    });

    it('should open Google Calendar URL when calendar button is clicked', () => {
        const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
        render(<Confirmation bookingData={mockBookingData} onNewBooking={onNewBooking} />);

        fireEvent.click(screen.getAllByText('Google')[0]);

        expect(windowOpenSpy).toHaveBeenCalledTimes(1);
        const calendarUrl = windowOpenSpy.mock.calls[0][0] as string;
        expect(calendarUrl).toContain('calendar.google.com');
        expect(calendarUrl).toContain('FYZIOAFIT');
        expect(calendarUrl).toContain('Krmanov');

        windowOpenSpy.mockRestore();
    });
});
