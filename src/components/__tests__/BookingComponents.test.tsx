// Category 6: Component Tests - Booking Components (GlassCard, SplashScreen)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
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
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should render FYZIO&FIT branding', () => {
        render(<SplashScreen onComplete={vi.fn()} />);
        expect(screen.getByText('FYZIO&FIT')).toBeInTheDocument();
    });

    it('should call onComplete after animation', () => {
        const onComplete = vi.fn();
        render(<SplashScreen onComplete={onComplete} />);

        expect(onComplete).not.toHaveBeenCalled();

        vi.advanceTimersByTime(700);
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should start fading at 320ms', async () => {
        render(<SplashScreen onComplete={vi.fn()} />);
        const overlay = screen.getByText('FYZIO&FIT').closest('.fixed');

        await act(async () => {
            vi.advanceTimersByTime(350);
        });
        expect(overlay?.className).toContain('opacity-0');
    });

    it('should render progress bar', () => {
        const { container } = render(<SplashScreen onComplete={vi.fn()} />);
        const progressBar = container.querySelector('.rounded-full.overflow-hidden');
        expect(progressBar).toBeInTheDocument();
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
