// Category 1: Unit Tests - Utility Functions
import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn (className utility)', () => {
    it('should merge single class', () => {
        expect(cn('text-red-500')).toBe('text-red-500');
    });

    it('should merge multiple classes', () => {
        expect(cn('p-4', 'text-sm')).toBe('p-4 text-sm');
    });

    it('should handle conditional classes', () => {
        const isActive = true;
        const isDisabled = false;
        expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
    });

    it('should handle undefined and null values', () => {
        expect(cn('base', undefined, null, 'extra')).toBe('base extra');
    });

    it('should resolve tailwind conflicts (last wins)', () => {
        expect(cn('p-4', 'p-8')).toBe('p-8');
    });

    it('should resolve conflicting text colors', () => {
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle empty input', () => {
        expect(cn()).toBe('');
    });

    it('should handle array inputs via clsx', () => {
        expect(cn(['p-4', 'text-sm'])).toBe('p-4 text-sm');
    });

    it('should handle object inputs via clsx', () => {
        expect(cn({ 'p-4': true, 'text-sm': false, 'font-bold': true })).toBe('p-4 font-bold');
    });

    it('should merge complex responsive classes', () => {
        expect(cn('sm:p-4 md:p-6', 'sm:p-8')).toBe('md:p-6 sm:p-8');
    });
});
