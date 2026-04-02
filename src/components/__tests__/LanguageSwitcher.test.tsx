// Category 5: Component Tests - LanguageSwitcher
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

const mockSetLanguage = vi.fn();
let mockLanguage = 'sk';

vi.mock('@/i18n/LanguageContext', () => ({
    useLanguage: () => ({
        language: mockLanguage,
        setLanguage: mockSetLanguage,
        t: {},
    }),
}));

import LanguageSwitcher from '../../components/LanguageSwitcher';

describe('LanguageSwitcher', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLanguage = 'sk';
    });

    it('should render SK and EN buttons', () => {
        render(<LanguageSwitcher />);
        expect(screen.getByText('SK')).toBeInTheDocument();
        expect(screen.getByText('EN')).toBeInTheDocument();
    });

    it('should switch to EN when EN button clicked', () => {
        render(<LanguageSwitcher />);
        fireEvent.click(screen.getByText('EN'));
        expect(mockSetLanguage).toHaveBeenCalledWith('en');
    });

    it('should switch to SK when SK button clicked', () => {
        mockLanguage = 'en';
        render(<LanguageSwitcher />);
        fireEvent.click(screen.getByText('SK'));
        expect(mockSetLanguage).toHaveBeenCalledWith('sk');
    });

    it('should highlight active language button', () => {
        mockLanguage = 'sk';
        const { container } = render(<LanguageSwitcher />);
        const skButton = screen.getByText('SK');
        // Active button should have bg-navy class
        expect(skButton.className).toContain('bg-navy');
    });

    it('should not highlight inactive language button', () => {
        mockLanguage = 'sk';
        render(<LanguageSwitcher />);
        const enButton = screen.getByText('EN');
        expect(enButton.className).not.toContain('bg-navy');
    });
});
