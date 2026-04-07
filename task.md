# Project Status & Tasks

## Completed
- [x] Implement 36h lead time rule logic (Bratislava timezone).
- [x] Integrate 36h rule into frontend hooks (`useTimeSlots`, `useCreateBooking`).
- [x] Implement backend enforcement in `create-booking` Edge Function.
- [x] Create integration tests for 36h rule (`booking-36h-rule.test.ts`).
- [x] Create Playwright E2E tests for 36h rule (`booking-36h-rule.spec.ts`).
- [x] Verify rule in CI environment.
- [x] Fix broken UI tests (`GlassCard`, `GlassBackground`).
- [x] Update snapshots for premium design changes.

## In Progress
- [ ] Regression testing for additional booking scenarios.

## Backlog
- [ ] Regression testing for administrative features.
- [ ] Performance profiling for booking wizard.
- [ ] Accessibility (A11Y) audit for booking flow.
