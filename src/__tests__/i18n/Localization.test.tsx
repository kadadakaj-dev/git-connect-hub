// Category 13: i18n/Localization Tests
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import React from 'react';
import { LanguageProvider, useLanguage } from '../../i18n/LanguageContext';
import { translations } from '../../i18n/translations';

function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(LanguageProvider, null, children);
}

describe('i18n - LanguageContext', () => {
    it('should default to Slovak language', () => {
        const { result } = renderHook(() => useLanguage(), { wrapper });
        expect(result.current.language).toBe('sk');
    });

    it('should provide SK translations by default', () => {
        const { result } = renderHook(() => useLanguage(), { wrapper });
        expect(result.current.t).toBe(translations.sk);
    });

    it('should switch to English', () => {
        const { result } = renderHook(() => useLanguage(), { wrapper });

        act(() => {
            result.current.setLanguage('en');
        });

        expect(result.current.language).toBe('en');
        expect(result.current.t).toBe(translations.en);
    });

    it('should switch back to Slovak', () => {
        const { result } = renderHook(() => useLanguage(), { wrapper });

        act(() => {
            result.current.setLanguage('en');
        });
        act(() => {
            result.current.setLanguage('sk');
        });

        expect(result.current.language).toBe('sk');
        expect(result.current.t).toBe(translations.sk);
    });

    it('should work without provider (default context)', () => {
        // useLanguage has a default context value to prevent crashes
        const { result } = renderHook(() => useLanguage());
        expect(result.current.language).toBe('sk');
        expect(result.current.t).toBeDefined();
    });
});

describe('i18n - Translations structure', () => {
    it('should have SK and EN translation sets', () => {
        expect(translations.sk).toBeDefined();
        expect(translations.en).toBeDefined();
    });

    it('should have matching keys in SK and EN', () => {
        const skKeys = Object.keys(translations.sk);
        const enKeys = Object.keys(translations.en);

        skKeys.forEach((key) => {
            expect(enKeys).toContain(key);
        });
    });

    it('should have clinic name in both languages', () => {
        expect(translations.sk.clinicName).toBe('FYZIOAFIT');
        expect(translations.en.clinicName).toBe('FYZIOAFIT');
    });

    it('should have step definitions in both languages', () => {
        expect(translations.sk.steps).toBeDefined();
        expect(translations.en.steps).toBeDefined();
    });

    it('should have stepOf template string', () => {
        expect(translations.sk.stepOf).toContain('{current}');
        expect(translations.sk.stepOf).toContain('{total}');
        expect(translations.en.stepOf).toContain('{current}');
        expect(translations.en.stepOf).toContain('{total}');
    });
});

describe('i18n - Component Integration', () => {
    it('should render translated content based on language context', () => {
        function TestComponent() {
            const { t, language } = useLanguage();
            return React.createElement('div', null,
                React.createElement('span', { 'data-testid': 'lang' }, language),
                React.createElement('span', { 'data-testid': 'name' }, t.clinicName)
            );
        }

        render(React.createElement(LanguageProvider, null,
            React.createElement(TestComponent)
        ));

        expect(screen.getByTestId('lang').textContent).toBe('sk');
        expect(screen.getByTestId('name').textContent).toBe('FYZIOAFIT');
    });

    it('should update component when language changes', () => {
        function TestComponent() {
            const { t, language, setLanguage } = useLanguage();
            return React.createElement('div', null,
                React.createElement('span', { 'data-testid': 'subtitle' }, t.clinicSubtitle),
                React.createElement('button', { onClick: () => setLanguage('en') }, 'Switch to EN')
            );
        }

        render(React.createElement(LanguageProvider, null,
            React.createElement(TestComponent)
        ));

        // Initially Slovak
        expect(screen.getByTestId('subtitle').textContent).toBe(translations.sk.clinicSubtitle);

        // Switch to English
        fireEvent.click(screen.getByText('Switch to EN'));
        expect(screen.getByTestId('subtitle').textContent).toBe(translations.en.clinicSubtitle);
    });
});

