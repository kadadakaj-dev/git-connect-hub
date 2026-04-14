/**
 * Welcome Page Animation Tests
 *
 * Verifies that:
 * - GlassBackground renders 3 animated blobs (covered in BookingComponents.test.tsx too)
 * - ServiceSelection items appear inside the stagger container and remain interactive
 * - BookingWizard sections start dimmed / pointer-events-none and unlock progressively
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import GlassBackground from '../../GlassBackground';
import ServiceSelection from '../ServiceSelection';
import BookingWizard from '../BookingWizard';
import { Service } from '@/types/booking';

// ── Shared mocks ─────────────────────────────────────────────────────────────

vi.mock('@/i18n/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'sk',
    t: {
      selectService: 'Vyberte službu',
      expressLabel: 'Expresný termín',
      expressSurcharge: 'k cene služby',
      min: 'min',
      errors: {
        nameRequired: 'Meno je povinné',
        emailRequired: 'E-mail je povinný',
        emailInvalid: 'Zadajte platný e-mail',
        phoneRequired: 'Telefónne číslo je povinné',
      },
      bookingSuccess: 'Rezervácia potvrdená!',
      bookingErrors: {},
    },
  }),
}));

const mockUseServices = vi.fn();
vi.mock('@/hooks/useServices', () => ({
  useServices: () => mockUseServices(),
}));

vi.mock('@/hooks/useCreateBooking', () => ({
  useCreateBooking: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../ServiceSkeleton', () => ({
  default: () => <div data-testid="service-skeleton">Loading...</div>,
}));

vi.mock('../DateTimeSelection', () => ({
  default: () => <div data-testid="datetime-selection">DateTimeMock</div>,
}));

vi.mock('../Confirmation', () => ({
  default: () => <div data-testid="confirmation">ConfirmationMock</div>,
}));

vi.mock('../../Footer', () => ({
  default: () => <footer data-testid="footer" />,
}));

vi.mock('../../booking/BookingHeader', () => ({
  default: () => <header data-testid="booking-header" />,
}));

const EXPRESS_SERVICE_ID = 'b15733f3-274d-497b-8074-dca4d0daf6a3';

const mockServices: Service[] = [
  {
    id: 'svc-1',
    name: 'Fyzioterapia',
    description: 'Cielené ošetrenie',
    duration: 30,
    price: 65,
    category: 'physiotherapy',
    icon: 'Activity',
  },
  {
    id: 'svc-2',
    name: 'Chiropraktika',
    description: 'Korekcia chrbtice',
    duration: 45,
    price: 85,
    category: 'chiropractic',
    icon: 'Bone',
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

// ── GlassBackground ──────────────────────────────────────────────────────────

describe('GlassBackground — animation assets', () => {
  it('renders a single fixed full-screen backdrop element', () => {
    const { container } = render(<GlassBackground />);
    expect(container.children).toHaveLength(1);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('fixed');
    expect(wrapper.className).toContain('inset-0');
  });

  it('renders as a single root element (pure CSS implementation)', () => {
    const { container } = render(<GlassBackground />);
    expect(container.children).toHaveLength(1);
  });

  it('wrapper is fixed and pointer-events-none so it never blocks interaction', () => {
    const { container } = render(<GlassBackground />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('fixed');
    expect(wrapper.className).toContain('pointer-events-none');
  });
});

// ── ServiceSelection — stagger entrance ──────────────────────────────────────

describe('ServiceSelection — stagger entrance animation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders all regular service buttons (stagger has real targets)', () => {
    mockUseServices.mockReturnValue({ data: mockServices, isLoading: false, error: null });
    const { container } = render(<ServiceSelection selectedService={null} onSelect={vi.fn()} />);
    const buttons = container.querySelectorAll('button[data-testid^="service-"]');
    expect(buttons.length).toBe(2);
  });

  it('express service renders as tel: link inside stagger container', () => {
    mockUseServices.mockReturnValue({ data: mockServices, isLoading: false, error: null });
    render(<ServiceSelection selectedService={null} onSelect={vi.fn()} />);
    const link = screen.getByText('+421 905 307 198').closest('a');
    expect(link).toHaveAttribute('href', 'tel:+421905307198');
  });

  it('service buttons remain clickable after stagger animation completes', () => {
    mockUseServices.mockReturnValue({ data: mockServices, isLoading: false, error: null });
    const onSelect = vi.fn();
    render(<ServiceSelection selectedService={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('service-svc-1'));
    expect(onSelect).toHaveBeenCalledWith(mockServices[0]);
  });

  it('clicking second service calls onSelect with correct item', () => {
    mockUseServices.mockReturnValue({ data: mockServices, isLoading: false, error: null });
    const onSelect = vi.fn();
    render(<ServiceSelection selectedService={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('service-svc-2'));
    expect(onSelect).toHaveBeenCalledWith(mockServices[1]);
  });

  it('selected service button gets border-primary class', () => {
    mockUseServices.mockReturnValue({ data: mockServices, isLoading: false, error: null });
    render(<ServiceSelection selectedService={mockServices[0]} onSelect={vi.fn()} />);
    const btn = screen.getByTestId('service-svc-1');
    expect(btn).toHaveClass('border-primary');
  });
});

// ── BookingWizard — progressive section reveal ───────────────────────────────

describe('BookingWizard — staggered section entrance & progressive reveal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseServices.mockReturnValue({ data: mockServices, isLoading: false, error: null });
  });

  it('all 4 step labels are present in the DOM on initial render', () => {
    render(<BookingWizard />);
    expect(screen.getByText('Vyberte službu')).toBeInTheDocument();
    expect(screen.getByText('Vyberte dátum')).toBeInTheDocument();
    expect(screen.getByText('Vyberte čas')).toBeInTheDocument();
    expect(screen.getByText('Vyplňte Vaše údaje')).toBeInTheDocument();
  });

  it('datetime section (step 2+3) starts as pointer-events-none', () => {
    const { container } = render(<BookingWizard />);
    const sections = container.querySelectorAll('section');
    expect(sections[1].className).toContain('pointer-events-none');
  });

  it('client details section (step 4) starts as pointer-events-none', () => {
    const { container } = render(<BookingWizard />);
    const sections = container.querySelectorAll('section');
    expect(sections[2].className).toContain('pointer-events-none');
  });

  it('datetime section unlocks (removes pointer-events-none) after service selection', async () => {
    const { container } = render(<BookingWizard />);
    fireEvent.click(screen.getByTestId('service-svc-1'));
    await waitFor(() => {
      const sections = container.querySelectorAll('section');
      expect(sections[1].className).not.toContain('pointer-events-none');
    });
  });

  it('submit button is in the DOM from the start (visible with entrance animation)', () => {
    render(<BookingWizard />);
    const btn = screen.getByRole('button', { name: /rezervova|book|odosla|confirm/i });
    expect(btn).toBeInTheDocument();
  });

  it('submit button is disabled when no service and datetime selected', () => {
    render(<BookingWizard />);
    const btn = screen.getByRole('button', { name: /rezervova|book|odosla|confirm/i });
    expect(btn).toBeDisabled();
  });
});
