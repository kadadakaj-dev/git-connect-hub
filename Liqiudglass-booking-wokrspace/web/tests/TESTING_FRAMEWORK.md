# PWA Testing Framework (20 Areas)

This suite provides runnable baseline coverage for all requested PWA domains in `tests/pwa/pwa-framework.spec.ts`.

## Run

```bash
pnpm -C apps/web test
pnpm -C apps/web test:coverage
pnpm -C apps/web test:special
pnpm -C apps/web test:e2e
```

## Covered areas
1. Architecture
2. AI Chat
3. Offline Sync
4. Search
5. Notifications
6. Auth
7. Collaboration
8. Visualization
9. Voice
10. Payments
11. Performance
12. Security
13. Accessibility
14. AI Generation
15. i18n
16. Analytics
17. E2E integration reference
18. Deployment checks
19. Mobile budgets
20. Scaling


## Special hidden-weakness test
- `tests/pwa/special-weakness-detection.spec.ts` simuluje skryté zlyhania: NaN/Infinity poisoning, XSS payloady, replay v offline queue, stabilita sortu, chýbajúce i18n kľúče a prototype pollution.
