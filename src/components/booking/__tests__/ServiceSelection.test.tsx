import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ServiceSelection from '../ServiceSelection';
import { Service } from '@/types/booking';

// Mock useServices hook
const mockUseServices = vi.fn();
vi.mock('@/hooks/useServices', () => ({
    useServices: () => mockUseServices(),
}));

vi.mock('@/i18n/LanguageContext', () => ({
    useLanguage: () => ({
        language: 'sk',
        t: {
            selectService: 'Vyberte službu',
            chooseServiceSubtitle: 'Vyberte si ošetrenie',
            expressLabel: 'Expresný termín',
            expressDesc: 'Do 36h · víkendy · sviatky',
            expressSurcharge: 'k cene služby',
            expressCta: 'Zavolajte nám',
            min: 'min',
            categories: { physiotherapy: 'Fyzioterapia', chiropractic: 'Chiropraktika' },
        },
    }),
}));

// Mock ServiceSkeleton
vi.mock('../ServiceSkeleton', () => ({
    default: () => <div data-testid="service-skeleton">Loading...</div>,
}));

const EXPRESS_SERVICE_ID = 'b15733f3-274d-497b-8074-dca4d0daf6a3';
const EXPRESS_PHONE_CLEAN = '+421905307198';

const mockServices: Service[] = [
    {
        id: 'svc-1',
        name: 'Vstupné vyšetrenie',
        description: 'Komplexné vyšetrenie',
        duration: 45,
        price: 85,
        category: 'physiotherapy',
        icon: 'Activity',
    },
    {
        id: 'svc-2',
        name: 'Fyzioterapia',
        description: 'Cielené ošetrenie',
        duration: 30,
        price: 65,
        category: 'physiotherapy',
        icon: 'Heart',
    },
    {
        id: EXPRESS_SERVICE_ID,
        name: 'Express',
        description: 'Expresné ošetrenie',
        duration: 30,
        price: 15,
        category: 'physiotherapy',
        icon: 'Zap',
    },
];

describe('ServiceSelection', () => {
    const onSelect = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.location to prevent JSDOM navigation warnings
        vi.stubGlobal('location', {
            ...window.location,
            assign: vi.fn(),
            href: '',
        });
    });

    it('should show loading skeleton while fetching services', () => {
        mockUseServices.mockReturnValue({ data: undefined, isLoading: true, error: null });
        render(<ServiceSelection selectedService={null} onSelect={onSelect} />);
        expect(screen.getByTestId('service-skeleton')).toBeInTheDocument();
    });

    it('should show error message when services fail to load', () => {
        mockUseServices.mockReturnValue({ data: undefined, isLoading: false, error: new Error('fail') });
        render(<ServiceSelection selectedService={null} onSelect={onSelect} />);
        expect(screen.getByText('Služby nie sú momentálne dostupné')).toBeInTheDocument();
    });

    it('should show error when services array is empty', () => {
        mockUseServices.mockReturnValue({ data: [], isLoading: false, error: null });
        render(<ServiceSelection selectedService={null} onSelect={onSelect} />);
        expect(screen.getByText('Služby nie sú momentálne dostupné')).toBeInTheDocument();
    });

    it('should render all regular services as buttons', () => {
        mockUseServices.mockReturnValue({ data: mockServices, isLoading: false, error: null });
        render(<ServiceSelection selectedService={null} onSelect={onSelect} />);

        expect(screen.getByText('Vstupné vyšetrenie')).toBeInTheDocument();
        // Regular services should be buttons, Express is an anchor (a)
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(2);
    });

    it('should call onSelect when a regular service is clicked', () => {
        mockUseServices.mockReturnValue({ data: mockServices, isLoading: false, error: null });
        render(<ServiceSelection selectedService={null} onSelect={onSelect} />);

        fireEvent.click(screen.getByText('Vstupné vyšetrenie'));
        expect(onSelect).toHaveBeenCalledWith(mockServices[0]);
    });

    it('should visually indicate the selected service', () => {
        mockUseServices.mockReturnValue({ data: mockServices, isLoading: false, error: null });
        render(<ServiceSelection selectedService={mockServices[0]} onSelect={onSelect} />);

        const selectedButton = screen.getByText('Vstupné vyšetrenie').closest('button');
        expect(selectedButton).toHaveClass('border-primary');
    });

    it('should render express service as a telephone link', () => {
        mockUseServices.mockReturnValue({ data: mockServices, isLoading: false, error: null });
        render(<ServiceSelection selectedService={null} onSelect={onSelect} />);

        // Express service renders as a link with tel: href
        const expressLink = screen.getByText('+421 905 307 198').closest('a');
        expect(expressLink).toBeInTheDocument();
        expect(expressLink).toHaveAttribute('href', `tel:${EXPRESS_PHONE_CLEAN}`);
    });

    it('should display express badge text', () => {
        mockUseServices.mockReturnValue({ data: mockServices, isLoading: false, error: null });
        render(<ServiceSelection selectedService={null} onSelect={onSelect} />);

        expect(screen.getByText(/Expresný termín/)).toBeInTheDocument();
    });

    it('should display service prices', () => {
        mockUseServices.mockReturnValue({ data: mockServices, isLoading: false, error: null });
        render(<ServiceSelection selectedService={null} onSelect={onSelect} />);

        expect(screen.getByText('85 €')).toBeInTheDocument();
        expect(screen.getByText('65 €')).toBeInTheDocument();
    });

    it('should display service duration info', () => {
        mockUseServices.mockReturnValue({ data: mockServices, isLoading: false, error: null });
        render(<ServiceSelection selectedService={null} onSelect={onSelect} />);

        expect(screen.getByText(/45min/)).toBeInTheDocument();
        const thirtyMinElements = screen.getAllByText(/30min/);
        expect(thirtyMinElements.length).toBeGreaterThanOrEqual(2);
    });

    it('should not call onSelect when express service is clicked', () => {
        mockUseServices.mockReturnValue({ data: mockServices, isLoading: false, error: null });
        render(<ServiceSelection selectedService={null} onSelect={onSelect} />);

        const expressLink = screen.getByText('+421 905 307 198').closest('a')!;
        fireEvent.click(expressLink);
        expect(onSelect).not.toHaveBeenCalled();
    });
});
