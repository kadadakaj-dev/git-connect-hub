// Category 5: Component Tests - OfflineBanner
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import OfflineBanner from '../../components/OfflineBanner';

describe('OfflineBanner', () => {
    beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { writable: true, value: true });
    });

    it('should not render when online', () => {
        Object.defineProperty(navigator, 'onLine', { writable: true, value: true });
        const { container } = render(<OfflineBanner />);
        expect(container.firstChild).toBeNull();
    });

    it('should render when offline', () => {
        Object.defineProperty(navigator, 'onLine', { writable: true, value: false });
        render(<OfflineBanner />);
        expect(screen.getByText(/Ste offline/)).toBeInTheDocument();
    });

    it('should show banner when going offline', () => {
        Object.defineProperty(navigator, 'onLine', { writable: true, value: true });
        render(<OfflineBanner />);
        expect(screen.queryByText(/Ste offline/)).not.toBeInTheDocument();

        Object.defineProperty(navigator, 'onLine', { writable: true, value: false });
        fireEvent(window, new Event('offline'));

        expect(screen.getByText(/Ste offline/)).toBeInTheDocument();
    });

    it('should hide banner when coming back online', () => {
        Object.defineProperty(navigator, 'onLine', { writable: true, value: false });
        render(<OfflineBanner />);
        expect(screen.getByText(/Ste offline/)).toBeInTheDocument();

        Object.defineProperty(navigator, 'onLine', { writable: true, value: true });
        fireEvent(window, new Event('online'));

        expect(screen.queryByText(/Ste offline/)).not.toBeInTheDocument();
    });

    it('should have sticky positioning', () => {
        Object.defineProperty(navigator, 'onLine', { writable: true, value: false });
        render(<OfflineBanner />);
        const banner = screen.getByText(/Ste offline/).closest('div');
        expect(banner?.className).toContain('sticky');
    });
});
