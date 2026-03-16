import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ProgressBar from '../ProgressBar';
import { BookingStep } from '@/types/booking';

vi.mock('@/i18n/LanguageContext', () => ({
    useLanguage: () => ({
        language: 'sk',
        t: {
            stepOf: 'Krok {current} z {total}',
        },
    }),
}));

const mockSteps: BookingStep[] = [
    { id: 1, title: 'Služba', description: 'Vyberte ošetrenie' },
    { id: 2, title: 'Dátum a čas', description: 'Vyberte termín' },
    { id: 3, title: 'Údaje', description: 'Vaše informácie' },
    { id: 4, title: 'Potvrdiť', description: 'Skontrolovať a rezervovať' },
];

describe('ProgressBar', () => {
    it('should render all step titles on desktop', () => {
        render(<ProgressBar steps={mockSteps} currentStep={0} />);

        expect(screen.getAllByText('Služba').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Dátum a čas').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Údaje').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Potvrdiť').length).toBeGreaterThanOrEqual(1);
    });

    it('should display step numbers', () => {
        render(<ProgressBar steps={mockSteps} currentStep={0} />);

        // Step numbers 1-4 should be visible (at least one instance each)
        expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1);
    });

    it('should style current step with ring', () => {
        const { container } = render(<ProgressBar steps={mockSteps} currentStep={1} />);

        // Current step (index 1) should have ring styling
        const ringElements = container.querySelectorAll('.ring-2');
        expect(ringElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should show completed steps with primary background', () => {
        const { container } = render(<ProgressBar steps={mockSteps} currentStep={2} />);

        // Steps 0 and 1 are completed (index < currentStep)
        const completedSteps = container.querySelectorAll('.bg-primary.text-primary-foreground');
        // At least 2 completed steps on desktop + mobile
        expect(completedSteps.length).toBeGreaterThanOrEqual(2);
    });

    it('should show upcoming steps with muted styling', () => {
        const { container } = render(<ProgressBar steps={mockSteps} currentStep={0} />);

        // Steps 1, 2, 3 are upcoming — they have muted foreground
        const mutedSteps = container.querySelectorAll('.bg-muted.text-muted-foreground');
        expect(mutedSteps.length).toBeGreaterThanOrEqual(3);
    });

    it('should display mobile step counter text', () => {
        render(<ProgressBar steps={mockSteps} currentStep={1} />);

        // Mobile view shows "Krok 2 z 4"
        expect(screen.getByText('Krok 2 z 4')).toBeInTheDocument();
    });

    it('should update mobile counter when step changes', () => {
        const { rerender } = render(<ProgressBar steps={mockSteps} currentStep={0} />);
        expect(screen.getByText('Krok 1 z 4')).toBeInTheDocument();

        rerender(<ProgressBar steps={mockSteps} currentStep={2} />);
        expect(screen.getByText('Krok 3 z 4')).toBeInTheDocument();
    });

    it('should render connector lines between steps', () => {
        const { container } = render(<ProgressBar steps={mockSteps} currentStep={0} />);

        // Should have connector divs (h-px bg-border) between steps
        // 4 steps = 3 connectors on desktop + 3 on mobile = 6
        const connectors = container.querySelectorAll('.h-px');
        expect(connectors.length).toBeGreaterThanOrEqual(3);
    });
});
