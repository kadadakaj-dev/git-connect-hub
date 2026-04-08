// Category 1b: Unit Tests - getBookingDuration pure function
import { describe, it, expect } from 'vitest';
import { getBookingDuration } from '@/lib/booking-utils';

describe('getBookingDuration', () => {
    it('should return 30 for 30 minutes', () => {
        expect(getBookingDuration(30)).toBe(30);
    });

    it('should round up 45 minutes to 60', () => {
        expect(getBookingDuration(45)).toBe(60);
    });

    it('should return 60 for exactly 60 minutes', () => {
        expect(getBookingDuration(60)).toBe(60);
    });

    it('should round up 15 minutes to 30', () => {
        expect(getBookingDuration(15)).toBe(30);
    });

    it('should round up 1 minute to 30', () => {
        expect(getBookingDuration(1)).toBe(30);
    });

    it('should return 90 for 61-90 minutes', () => {
        expect(getBookingDuration(61)).toBe(90);
        expect(getBookingDuration(75)).toBe(90);
        expect(getBookingDuration(90)).toBe(90);
    });

    it('should return 120 for 91-120 minutes', () => {
        expect(getBookingDuration(91)).toBe(120);
        expect(getBookingDuration(120)).toBe(120);
    });
});
