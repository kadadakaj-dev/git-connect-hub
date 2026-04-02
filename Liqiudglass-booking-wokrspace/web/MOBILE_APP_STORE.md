# Mobile Optimization + App Store Readiness

## Mobile-first implementation status
- Viewport meta + theme colors configured in `app/layout.tsx`.
- 44px+ touch targets on critical interactions.
- Fast tap response (`touch-action: manipulation`, no highlight delay).
- No horizontal scroll (`overflow-x: hidden`, max-width constraints).
- Responsive image usage via Next `<Image />`.
- Deep-link install/launch handling in app runtime (`appinstalled`, `launchQueue`).

## PWA to native stores
### Option 1 — Wrap with Capacitor
```bash
npm install -g @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
npx cap open ios
```

### Option 2 — Microsoft Store distribution
- Use generated PWA package (PWABuilder or equivalent).
- Ensure manifest includes app name, icons, screenshots.
- This repo already includes screenshot/icon manifest fields as baseline.

## Performance targets (mobile)
- Target load time: < 3s on 4G.
- Keep JS minimal (Next app routing + static generation).
- Use image optimization (`next/image`).
- Validate using Chrome DevTools throttling and Lighthouse.

## Mobile testing checklist
- BrowserStack real-device smoke tests (iOS + Android).
- Chrome DevTools device emulation (touch + viewport).
- Offline functionality checks (`/~offline` route).
- Touch event checks for all primary CTAs.

## App store requirements checklist
- Privacy policy URL
- Terms of service URL
- Support email
- App description + keywords
- 4–8 screenshots per platform
- Icons: 192x192 and 512x512

## ASO playbook
- Perform keyword research on booking intent terms.
- Optimize short and long description for conversion.
- Track install-to-signup conversion.
- Monitor user reviews and respond quickly.
- Ship frequent, quality updates.

## Push notifications
- Request permission only after explicit user intent.
- Send timely, relevant reminders.
- Respect user preferences and allow opt-out.
