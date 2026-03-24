import { describe, expect, it } from 'vitest';
import { getSlotUnavailableClass } from './slotStyles';

describe('getSlotUnavailableClass', () => {
    it('uses a subtle red highlight for booked unavailable slots', () => {
        expect(
            getSlotUnavailableClass({
                time: '10:00',
                available: false,
                bookedCount: 1,
                totalCapacity: 1,
            }),
        ).toContain('bg-red-500/12');

        expect(
            getSlotUnavailableClass({
                time: '10:00',
                available: false,
                bookedCount: 1,
                totalCapacity: 1,
            }),
        ).toContain('border-red-400/35');
    });

    it('keeps non-booked unavailable slots muted', () => {
        expect(
            getSlotUnavailableClass({
                time: '10:30',
                available: false,
                bookedCount: 0,
                totalCapacity: 1,
            }),
        ).toContain('opacity-25');
    });
});