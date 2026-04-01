// Category: Contrast & Font Sharpness Tests
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

// ── Helper: HSL → RGB → Relative Luminance → Contrast Ratio ──
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    return [f(0), f(8), f(4)];
}

function relativeLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
    );
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(l1: number, l2: number): number {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

function hslVarToLuminance(hue: number, sat: number, light: number): number {
    const [r, g, b] = hslToRgb(hue, sat, light);
    return relativeLuminance(r, g, b);
}

// ── Parse HSL CSS variable: "211 42% 23%" → [211, 42, 23] ──
function parseHslVar(value: string): [number, number, number] {
    const parts = value.trim().replace(/%/g, '').split(/\s+/).map(Number);
    return [parts[0], parts[1], parts[2]];
}

// Read and parse CSS variables from index.css
const cssPath = path.resolve(__dirname, '../../index.css');
const cssContent = readFileSync(cssPath, 'utf-8');

function extractCssVar(varName: string): string | null {
    const regex = new RegExp(`--${varName}:\\s*([^;]+);`);
    const match = cssContent.match(regex);
    return match ? match[1].trim() : null;
}

// ── WCAG 2.1 Color Pair Definitions ──
const colorPairs = [
    { name: 'foreground / background', fg: 'foreground', bg: 'background', minRatio: 4.5 },
    { name: 'primary-foreground / primary', fg: 'primary-foreground', bg: 'primary', minRatio: 4.5 },
    { name: 'card-foreground / card', fg: 'card-foreground', bg: 'card', minRatio: 4.5 },
    { name: 'muted-foreground / muted', fg: 'muted-foreground', bg: 'muted', minRatio: 4.5 },
    { name: 'destructive-foreground / destructive', fg: 'destructive-foreground', bg: 'destructive', minRatio: 4.5 },
    { name: 'accent-foreground / accent', fg: 'accent-foreground', bg: 'accent', minRatio: 4.5 },
    { name: 'secondary-foreground / secondary', fg: 'secondary-foreground', bg: 'secondary', minRatio: 4.5 },
    { name: 'navy-foreground / navy', fg: 'navy-foreground', bg: 'navy', minRatio: 4.5 },
    { name: 'success-foreground / success', fg: 'success-foreground', bg: 'success', minRatio: 4.5 },
    { name: 'warning-foreground / warning', fg: 'warning-foreground', bg: 'warning', minRatio: 3.0 },
    // Large text (headings) only needs 3:1
    { name: 'foreground / background (large text)', fg: 'foreground', bg: 'background', minRatio: 3.0 },
    { name: 'muted-foreground / background (large text)', fg: 'muted-foreground', bg: 'background', minRatio: 3.0 },
];

describe('WCAG 2.1 Contrast Ratio Tests', () => {
    colorPairs.forEach(({ name, fg, bg, minRatio }) => {
        it(`${name} should meet WCAG AA ratio ≥ ${minRatio}:1`, () => {
            const fgRaw = extractCssVar(fg);
            const bgRaw = extractCssVar(bg);
            expect(fgRaw, `CSS variable --${fg} not found`).toBeTruthy();
            expect(bgRaw, `CSS variable --${bg} not found`).toBeTruthy();

            const fgHsl = parseHslVar(fgRaw!);
            const bgHsl = parseHslVar(bgRaw!);

            const fgLum = hslVarToLuminance(...fgHsl);
            const bgLum = hslVarToLuminance(...bgHsl);
            const ratio = contrastRatio(fgLum, bgLum);

            expect(ratio).toBeGreaterThanOrEqual(minRatio);
        });
    });

    it('focus-visible ring should be discernible against background', () => {
        // focus ring is rgba(55, 130, 210, 1) → rgb(55,130,210)
        const ringLum = relativeLuminance(55 / 255, 130 / 255, 210 / 255);
        const bgHsl = parseHslVar(extractCssVar('background')!);
        const bgLum = hslVarToLuminance(...bgHsl);
        const ratio = contrastRatio(ringLum, bgLum);
        // Non-text contrast needs ≥ 3:1 per WCAG 1.4.11
        expect(ratio).toBeGreaterThanOrEqual(3.0);
    });

    it('selection highlight should not reduce text readability', () => {
        // Selection bg: rgba(126, 195, 255, 0.18) over white ≈ very light blue
        // Selection fg: hsl(var(--soft-navy)) = same as foreground 211 42% 23%
        const fgHsl = parseHslVar(extractCssVar('soft-navy')!);
        const fgLum = hslVarToLuminance(...fgHsl);
        // Approximate selected background: lerp(white, rgb(126,195,255), 0.18)
        const selBgR = (1 * 0.82 + (126 / 255) * 0.18);
        const selBgG = (1 * 0.82 + (195 / 255) * 0.18);
        const selBgB = (1 * 0.82 + (255 / 255) * 0.18);
        const selBgLum = relativeLuminance(selBgR, selBgG, selBgB);
        const ratio = contrastRatio(fgLum, selBgLum);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
});

describe('Font Sharpness & Typography Tests', () => {
    it('should define a proper system font stack in --font-sans', () => {
        const fontSans = extractCssVar('font-sans');
        expect(fontSans).toBeTruthy();
        // Must include system-ui for native rendering
        expect(fontSans).toContain('system-ui');
        // Must include Apple fonts for macOS subpixel rendering
        expect(fontSans).toContain('-apple-system');
        expect(fontSans).toContain('BlinkMacSystemFont');
        // Must include Segoe UI for Windows ClearType
        expect(fontSans).toContain('Segoe UI');
        // Must end with generic sans-serif fallback
        expect(fontSans).toContain('sans-serif');
    });

    it('should define a display font stack in --font-display', () => {
        const fontDisplay = extractCssVar('font-display');
        expect(fontDisplay).toBeTruthy();
        expect(fontDisplay).toContain('SF Pro Display');
        expect(fontDisplay).toContain('system-ui');
        expect(fontDisplay).toContain('sans-serif');
    });

    it('should apply font-optical-sizing on headings for sharper rendering', () => {
        // headings h1-h4 must have font-optical-sizing: auto
        expect(cssContent).toMatch(/h1.*h4.*\{[^}]*font-optical-sizing:\s*auto/s);
    });

    it('should apply font-semibold on headings h1-h4', () => {
        expect(cssContent).toMatch(/h1.*h4.*\{[^}]*@apply\s+font-semibold/s);
    });

    it('should apply font-bold on headings h5-h6', () => {
        expect(cssContent).toMatch(/h5.*h6.*\{[^}]*@apply\s+font-bold/s);
    });

    it('should set body font-family to var(--font-sans)', () => {
        expect(cssContent).toMatch(/body\s*\{[^}]*font-family:\s*var\(--font-sans\)/s);
    });

    it('should have heading font-family set to var(--font-display)', () => {
        expect(cssContent).toMatch(/h1.*h4.*\{[^}]*font-family:\s*var\(--font-display\)/s);
    });

    it('font stack should include SF Pro Text for body text clarity', () => {
        const fontSans = extractCssVar('font-sans');
        expect(fontSans).toContain('SF Pro Text');
    });

    it('should include Helvetica Neue for cross-platform fallback', () => {
        const fontSans = extractCssVar('font-sans');
        expect(fontSans).toContain('Helvetica Neue');
    });
});

describe('Glass Surface Contrast Tests', () => {
    it('glass-border should have sufficient opacity vs white background', () => {
        // --glass-border: rgba(64, 114, 163, 0.16) — border must be visible
        const match = cssContent.match(/--glass-border:\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        expect(match).toBeTruthy();
        const opacity = parseFloat(match![4]);
        // Border opacity must be ≥ 0.12 to be visually discernible on white
        expect(opacity).toBeGreaterThanOrEqual(0.12);
    });

    it('glass-border-bright should have higher opacity than glass-border', () => {
        const borderMatch = cssContent.match(/--glass-border:\s*rgba\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/);
        const brightMatch = cssContent.match(/--glass-border-bright:\s*rgba\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/);
        expect(borderMatch).toBeTruthy();
        expect(brightMatch).toBeTruthy();
        expect(parseFloat(brightMatch![1])).toBeGreaterThan(parseFloat(borderMatch![1]));
    });

    it('glass-white should provide enough frosted surface contrast', () => {
        // --glass-white: rgba(255, 255, 255, 0.56) - must be ≥ 0.4 for text readability
        const match = cssContent.match(/--glass-white:\s*rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/);
        expect(match).toBeTruthy();
        expect(parseFloat(match![1])).toBeGreaterThanOrEqual(0.4);
    });

    it('glass-white-lg should create near-opaque surface for text', () => {
        const match = cssContent.match(/--glass-white-lg:\s*rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/);
        expect(match).toBeTruthy();
        // Must be ≥ 0.8 for readability on glass surfaces
        expect(parseFloat(match![1])).toBeGreaterThanOrEqual(0.8);
    });

    it('surface-frost gradient should start with sufficient opacity', () => {
        const match = cssContent.match(/--surface-frost:\s*linear-gradient\([^)]*rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/);
        expect(match).toBeTruthy();
        // Frost starting opacity must be ≥ 0.7 for text to remain sharp
        expect(parseFloat(match![1])).toBeGreaterThanOrEqual(0.7);
    });
});

describe('Reduced Motion & Accessibility Fallbacks', () => {
    it('should include prefers-reduced-motion media query', () => {
        expect(cssContent).toContain('prefers-reduced-motion: reduce');
    });

    it('reduced motion should disable all animations', () => {
        expect(cssContent).toMatch(/prefers-reduced-motion:\s*reduce[^}]*animation-duration:\s*0\.01ms/s);
    });

    it('should have @supports fallback for no backdrop-filter', () => {
        expect(cssContent).toContain('@supports not (backdrop-filter: blur(1px))');
    });

    it('fallback background should be near-opaque (≥ 0.9) for readability', () => {
        const match = cssContent.match(/@supports not.*?\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/s);
        expect(match).toBeTruthy();
        expect(parseFloat(match![1])).toBeGreaterThanOrEqual(0.9);
    });
});
