// Category 1b: Unit Tests - getBookingDuration pure function
import { describe, it, expect } from 'vitest';
import { getBookingDuration } from '@/lib/booking-utils';

describe('getBookingDuration', () => {
    it('should return 30 for 30 minutes', () => {
        expect(getBookingDuration(30)).toBe(30);
    });

    it('should return exact value for 45 minutes', () => {
        expect(getBookingDuration(45)).toBe(45);
    });

    it('should return 60 for exactly 60 minutes', () => {
        expect(getBookingDuration(60)).toBe(60);
    });

    it('should return exact value for 15 minutes', () => {
        expect(getBookingDuration(15)).toBe(15);
    });

    it('should return exact value for 1 minute', () => {
        expect(getBookingDuration(1)).toBe(1);
    });

    it('should return exact value for 61-90 minutes', () => {
        expect(getBookingDuration(61)).toBe(61);
        expect(getBookingDuration(75)).toBe(75);
        expect(getBookingDuration(90)).toBe(90);
    });

    it('should return exact value for 91-120 minutes', () => {
        expect(getBookingDuration(91)).toBe(91);
        expect(getBookingDuration(120)).toBe(120);
    });
});
