import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ClientDetailsForm from '../ClientDetailsForm';
import { BookingData } from '@/types/booking';

vi.mock('@/i18n/LanguageContext', () => ({
    useLanguage: () => ({
        language: 'sk',
        t: {
            fullNamePlaceholder: 'Meno a priezvisko',
            emailPlaceholder: 'vas@email.sk',
            phonePlaceholder: '+421 900 123 456',
            notesPlaceholder: 'Akékoľvek poznámky...',
        },
    }),
}));

const baseBookingData: BookingData = {
    service: null,
    date: null,
    time: null,
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    notes: '',
};

describe('ClientDetailsForm', () => {
    const onUpdate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render all form fields with placeholders', () => {
        render(<ClientDetailsForm bookingData={baseBookingData} errors={{}} onUpdate={onUpdate} />);

        expect(screen.getByPlaceholderText('Meno a priezvisko')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('vas@email.sk')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('+421 900 123 456')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Akékoľvek poznámky...')).toBeInTheDocument();
    });

    it('should call onUpdate when name field changes', () => {
        render(<ClientDetailsForm bookingData={baseBookingData} errors={{}} onUpdate={onUpdate} />);

        fireEvent.change(screen.getByPlaceholderText('Meno a priezvisko'), {
            target: { value: 'Ján Novák' },
        });

        expect(onUpdate).toHaveBeenCalledWith('clientName', 'Ján Novák');
    });

    it('should call onUpdate when email field changes', () => {
        render(<ClientDetailsForm bookingData={baseBookingData} errors={{}} onUpdate={onUpdate} />);

        fireEvent.change(screen.getByPlaceholderText('vas@email.sk'), {
            target: { value: 'jan@test.sk' },
        });

        expect(onUpdate).toHaveBeenCalledWith('clientEmail', 'jan@test.sk');
    });

    it('should call onUpdate when phone field changes', () => {
        render(<ClientDetailsForm bookingData={baseBookingData} errors={{}} onUpdate={onUpdate} />);

        fireEvent.change(screen.getByPlaceholderText('+421 900 123 456'), {
            target: { value: '+421 900 111 222' },
        });

        expect(onUpdate).toHaveBeenCalledWith('clientPhone', '+421 900 111 222');
    });

    it('should call onUpdate when notes field changes', () => {
        render(<ClientDetailsForm bookingData={baseBookingData} errors={{}} onUpdate={onUpdate} />);

        fireEvent.change(screen.getByPlaceholderText('Akékoľvek poznámky...'), {
            target: { value: 'Bolí ma chrbát' },
        });

        expect(onUpdate).toHaveBeenCalledWith('notes', 'Bolí ma chrbát');
    });

    it('should display error messages for fields with errors', () => {
        const errors = {
            clientName: 'Meno je povinné',
            clientEmail: 'E-mail je povinný',
        };

        render(<ClientDetailsForm bookingData={baseBookingData} errors={errors} onUpdate={onUpdate} />);

        expect(screen.getByText('Meno je povinné')).toBeInTheDocument();
        expect(screen.getByText('E-mail je povinný')).toBeInTheDocument();
    });

    it('should display GDPR notice', () => {
        render(<ClientDetailsForm bookingData={baseBookingData} errors={{}} onUpdate={onUpdate} />);

        expect(screen.getByText('GDPR • Vaše údaje sú chránené')).toBeInTheDocument();
    });

    it('should render input with correct autocomplete attributes', () => {
        render(<ClientDetailsForm bookingData={baseBookingData} errors={{}} onUpdate={onUpdate} />);

        expect(screen.getByPlaceholderText('Meno a priezvisko')).toHaveAttribute('autocomplete', 'name');
        expect(screen.getByPlaceholderText('vas@email.sk')).toHaveAttribute('autocomplete', 'email');
        expect(screen.getByPlaceholderText('+421 900 123 456')).toHaveAttribute('autocomplete', 'tel');
    });

    it('should render input with correct types', () => {
        render(<ClientDetailsForm bookingData={baseBookingData} errors={{}} onUpdate={onUpdate} />);

        expect(screen.getByPlaceholderText('Meno a priezvisko')).toHaveAttribute('type', 'text');
        expect(screen.getByPlaceholderText('vas@email.sk')).toHaveAttribute('type', 'email');
        expect(screen.getByPlaceholderText('+421 900 123 456')).toHaveAttribute('type', 'tel');
    });

    it('should display pre-filled values from bookingData', () => {
        const filledData: BookingData = {
            ...baseBookingData,
            clientName: 'Mária',
            clientEmail: 'maria@test.sk',
            clientPhone: '+421 111 222 333',
            notes: 'Poznámka',
        };

        render(<ClientDetailsForm bookingData={filledData} errors={{}} onUpdate={onUpdate} />);

        expect(screen.getByDisplayValue('Mária')).toBeInTheDocument();
        expect(screen.getByDisplayValue('maria@test.sk')).toBeInTheDocument();
        expect(screen.getByDisplayValue('+421 111 222 333')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Poznámka')).toBeInTheDocument();
    });

    it('should apply error styling to fields with errors', () => {
        const errors = { clientName: 'Meno je povinné' };

        render(<ClientDetailsForm bookingData={baseBookingData} errors={errors} onUpdate={onUpdate} />);

        const nameInput = screen.getByPlaceholderText('Meno a priezvisko');
        expect(nameInput).toHaveClass('border-destructive/50');
    });
});
