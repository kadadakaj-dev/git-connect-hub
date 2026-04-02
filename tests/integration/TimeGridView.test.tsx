import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import TimeGridView from '@/components/admin/calendar/TimeGridView';
import { CalendarEvent } from '@/components/admin/calendar/types';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Phone: () => <div data-testid="phone-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  GripVertical: () => <div data-testid="grip-icon" />,
}));

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'John Doe',
    date: '2026-04-01',
    startTime: '09:00',
    duration: 60,
    therapistId: 'therapist-1',
    type: 'booking',
    status: 'confirmed',
    clientPhone: '+421900111222',
    clientEmail: 'john@example.com',
    serviceName: 'Fyzioterapia',
    notes: '',
  },
  {
    id: '2',
    title: 'Short Event',
    date: '2026-04-01',
    startTime: '10:30',
    duration: 30, // < 60 min
    therapistId: 'therapist-1',
    type: 'booking',
    status: 'confirmed',
    clientPhone: '+421900333444',
    clientEmail: 'short@example.com',
    serviceName: 'Masáž',
    notes: '',
  }
];

describe('TimeGridView', () => {
  const defaultProps = {
    language: 'sk' as const,
    activeDays: [new Date('2026-04-01')],
    events: mockEvents,
    selectedTherapist: 'therapist-1',
    viewMode: 'day' as const,
    blockedDates: [],
    zoom: 1,
    onCreateEvent: vi.fn(),
    onEditEvent: vi.fn(),
    onDragStart: vi.fn(),
    onDropOnGrid: vi.fn(),
    onResizeStart: vi.fn(),
  };

  it('renders events correctly', () => {
    render(<TimeGridView {...defaultProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // Short Event has duration 30, so it shows service name in compact view
    expect(screen.getByText('Masáž')).toBeInTheDocument();
  });

  it('shows contact details for events >= 60 minutes', () => {
    render(<TimeGridView {...defaultProps} />);
    // John Doe has 60 min
    expect(screen.getByText('+421900111222')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('hides contact details for events < 60 minutes', () => {
    render(<TimeGridView {...defaultProps} />);
    // Short Event has 30 min
    expect(screen.queryByText('+421900333444')).not.toBeInTheDocument();
  });

  it('hides email on mobile/small screens via CSS classes', () => {
    render(<TimeGridView {...defaultProps} />);
    const emailElement = screen.getByText('john@example.com').closest('span');
    expect(emailElement).toHaveClass('hidden');
    expect(emailElement).toHaveClass('md:flex');
  });
});
