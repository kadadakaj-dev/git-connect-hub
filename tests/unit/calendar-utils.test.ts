import { describe, it, expect } from 'vitest';
import { getDayEventsWithPositions } from '@/components/admin/calendar/utils';
import { CalendarEvent } from '@/components/admin/calendar/types';

describe('getDayEventsWithPositions', () => {
  const dateStr = '2026-04-01';
  const mainTherapistId = 'ce777223-62f0-47ec-9b37-30a26d999610';

  it('should give 100% width to a single event', () => {
    const events: CalendarEvent[] = [
      {
        id: '1',
        title: 'Test Event',
        date: dateStr,
        startTime: '09:00',
        duration: 60,
        therapistId: mainTherapistId,
        type: 'booking',
        status: 'confirmed',
        notes: ''
      }
    ];

    const positioned = getDayEventsWithPositions(events, dateStr, mainTherapistId);
    expect(positioned).toHaveLength(1);
    expect(positioned[0].style.width).toContain('100%');
  });

  it('should split width 50/50 for two overlapping events', () => {
    const events: CalendarEvent[] = [
      {
        id: '1',
        title: 'Event 1',
        date: dateStr,
        startTime: '09:00',
        duration: 60,
        therapistId: mainTherapistId,
        type: 'booking',
        status: 'confirmed',
        notes: ''
      },
      {
        id: '2',
        title: 'Event 2',
        date: dateStr,
        startTime: '09:15', // Overlaps with Event 1
        duration: 60,
        therapistId: '5c1c02af-cbbc-47a8-b7c7-1387aa53a7bc', // Technical slot 2
        employeeName: 'Personál FYZIOA&FIT (2)',
        type: 'booking',
        status: 'confirmed',
        notes: ''
      }
    ];

    const positioned = getDayEventsWithPositions(events, dateStr, mainTherapistId);
    expect(positioned).toHaveLength(2);
    // Both should have width calc(50% - 4px)
    expect(positioned[0].style.width).toContain('50%');
    expect(positioned[1].style.width).toContain('50%');
    // One should be at 0% left, other at 50% left
    expect(positioned[0].style.left).toContain('0%');
    expect(positioned[1].style.left).toContain('50%');
  });

  it('should split width 33.3% for three overlapping events', () => {
    const events: CalendarEvent[] = [
      { id: '1', title: 'E1', date: dateStr, startTime: '10:00', duration: 60, therapistId: mainTherapistId, type: 'booking', status: 'confirmed', notes: '' },
      { id: '2', title: 'E2', date: dateStr, startTime: '10:00', duration: 60, therapistId: 'slot2', employeeName: 'Personál FYZIOA&FIT (2)', type: 'booking', status: 'confirmed', notes: '' },
      { id: '3', title: 'E3', date: dateStr, startTime: '10:00', duration: 60, therapistId: 'slot3', employeeName: 'Personál FYZIOA&FIT (3)', type: 'booking', status: 'confirmed', notes: '' }
    ];

    const positioned = getDayEventsWithPositions(events, dateStr, mainTherapistId);
    expect(positioned).toHaveLength(3);
    
    const expectedWidth = 100 / 3; // 33.333%
    expect(positioned[0].style.width).toContain(`${expectedWidth}%`);
    expect(positioned[1].style.width).toContain(`${expectedWidth}%`);
    expect(positioned[2].style.width).toContain(`${expectedWidth}%`);

    expect(positioned[0].style.left).toContain('0%');
    expect(positioned[1].style.left).toContain(`${expectedWidth}%`);
    expect(positioned[2].style.left).toContain(`${expectedWidth * 2}%`);
  });
});
