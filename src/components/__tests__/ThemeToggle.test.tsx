// Category 5: Component Tests - ThemeToggle
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

const mockSetTheme = vi.fn();
let mockResolvedTheme = 'light';

vi.mock('next-themes', () => ({
    useTheme: () => ({
        setTheme: mockSetTheme,
        resolvedTheme: mockResolvedTheme,
    }),
}));

import ThemeToggle from '../../components/ThemeToggle';

describe('ThemeToggle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockResolvedTheme = 'light';
    });

    it('should render the toggle button', () => {
        render(<ThemeToggle />);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });

    it('should show correct aria-label for light mode', () => {
        mockResolvedTheme = 'light';
        render(<ThemeToggle />);
        expect(screen.getByLabelText('Prepnúť na tmavý režim')).toBeInTheDocument();
    });

    it('should show correct aria-label for dark mode', () => {
        mockResolvedTheme = 'dark';
        render(<ThemeToggle />);
        expect(screen.getByLabelText('Prepnúť na svetlý režim')).toBeInTheDocument();
    });

    it('should toggle from light to dark on click', () => {
        mockResolvedTheme = 'light';
        render(<ThemeToggle />);
        fireEvent.click(screen.getByRole('button'));
        expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should toggle from dark to light on click', () => {
        mockResolvedTheme = 'dark';
        render(<ThemeToggle />);
        fireEvent.click(screen.getByRole('button'));
        expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
});
