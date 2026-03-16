// Category 6: Component Tests - Booking Components (GlassCard, SplashScreen)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import GlassCard from '../../components/booking/GlassCard';
import SplashScreen from '../../components/SplashScreen';
import GlassBackground from '../../components/GlassBackground';

describe('GlassCard', () => {
    it('should render children', () => {
        render(<GlassCard>Hello World</GlassCard>);
        expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
        const { container } = render(<GlassCard className="my-class">Content</GlassCard>);
        expect(container.firstChild).toHaveClass('my-class');
    });

    it('should have surface-card base class', () => {
        const { container } = render(<GlassCard>Content</GlassCard>);
        expect(container.firstChild).toHaveClass('surface-card');
    });

    it('should wrap children in relative z-[2] container', () => {
        const { container } = render(<GlassCard>Inner</GlassCard>);
        const inner = container.querySelector('.relative.z-\\[2\\]');
        expect(inner).toBeInTheDocument();
        expect(inner?.textContent).toBe('Inner');
    });
});

describe('SplashScreen', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Mock matchMedia for prefers-reduced-motion
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should render FYZIO&FIT branding', () => {
        render(<SplashScreen onComplete={vi.fn()} />);
        // Letters are rendered individually via motion.span
        const heading = screen.getByRole('status');
        expect(heading).toBeInTheDocument();
        expect(heading).toHaveAttribute('aria-label', 'Loading FYZIO&FIT');
    });

    it('should call onComplete after 4s animation', () => {
        const onComplete = vi.fn();
        render(<SplashScreen onComplete={onComplete} />);

        expect(onComplete).not.toHaveBeenCalled();

        vi.advanceTimersByTime(4100);
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should render individual letter spans', () => {
        const { container } = render(<SplashScreen onComplete={vi.fn()} />);
        const spans = container.querySelectorAll('h1 span');
        expect(spans.length).toBe(9); // F-Y-Z-I-O-&-F-I-T
    });

    it('should call onComplete faster with prefers-reduced-motion', () => {
        // Override matchMedia to return reduced motion
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation((query: string) => ({
                matches: query === '(prefers-reduced-motion: reduce)',
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });

        const onComplete = vi.fn();
        render(<SplashScreen onComplete={onComplete} />);

        vi.advanceTimersByTime(1300);
        expect(onComplete).toHaveBeenCalledTimes(1);
    });
});

describe('GlassBackground', () => {
    it('should render background blobs', () => {
        const { container } = render(<GlassBackground />);
        const blobs = container.querySelectorAll('.glass-blob');
        expect(blobs.length).toBe(3);
    });

    it('should be fixed positioned and non-interactive', () => {
        const { container } = render(<GlassBackground />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper.className).toContain('fixed');
        expect(wrapper.className).toContain('pointer-events-none');
    });
});
