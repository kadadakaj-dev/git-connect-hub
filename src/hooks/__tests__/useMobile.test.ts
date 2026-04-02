// Category 2: Unit Tests - useIsMobile hook
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '../use-mobile';

describe('useIsMobile', () => {
    let listeners: Array<() => void> = [];
    let mqlInstance: any;

    beforeEach(() => {
        listeners = [];
        mqlInstance = {
            matches: false,
            media: '(max-width: 767px)',
            onchange: null,
            addEventListener: vi.fn((_, cb) => listeners.push(cb)),
            removeEventListener: vi.fn((_, cb) => {
                listeners = listeners.filter((l) => l !== cb);
            }),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        };

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn(() => mqlInstance),
        });
    });

    afterEach(() => {
        listeners = [];
    });

    it('should return false for desktop viewport', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);
    });

    it('should return true for mobile viewport', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(true);
    });

    it('should return false for exactly 768px (not mobile)', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, value: 768 });
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);
    });

    it('should return true for 767px (is mobile)', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, value: 767 });
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(true);
    });

    it('should update when viewport changes', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);

        act(() => {
            Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
            listeners.forEach((cb) => cb());
        });

        expect(result.current).toBe(true);
    });

    it('should clean up event listener on unmount', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
        const { unmount } = renderHook(() => useIsMobile());
        unmount();
        expect(mqlInstance.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
});
