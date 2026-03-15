

## Analysis of 4 Issues

### Issue 1 & 2: Mobile calendar — month title hidden after auto-scroll

**Root cause:** When a service is selected, `scrollIntoView({ block: 'start' })` scrolls the dateTime section to the top, but the sticky `BookingHeader` (h-14 + pt-3 = ~80px) overlaps it. The current `scroll-mt-28` (112px) isn't enough because the section header ("Vyberte dátum / Vyberte čas") sits above the card, pushing the month title further down.

**Fix:** Increase `scroll-mt` from `scroll-mt-28` to `scroll-mt-20` (80px) won't help — the issue is the step header row above the GlassCard adds ~40px. Change to `scroll-mt-24 sm:scroll-mt-20` and use `block: 'nearest'` or increase scroll margin further to `scroll-mt-20` (since 28 = 112px is already big). 

Actually looking more carefully: the header is sticky at top with `pt-3` (12px) + `h-14` (56px) = 68px. The `scroll-mt-28` = 112px should be enough. The real issue is the section itself — the step headers + gap add height. Let me recalculate: `scroll-mt-28` works for the section div, but the month name is inside the GlassCard which is ~50px below the section top. So total offset needed = 68 (header) + clear space. The `scroll-mt-28` (112px) minus 68px header = 44px visible above card, which should show "Vyberte dátum". The month title inside the card is another ~16px down. This should be visible.

Wait — screenshots show the issue. The real problem might be that `scroll-mt` needs to be larger. Change to `scroll-mt-32` (128px).

**File:** `src/components/booking/BookingWizard.tsx` line 158 — change `scroll-mt-28 sm:scroll-mt-24` to `scroll-mt-36 sm:scroll-mt-28`

### Issue 3: Admin booking dialog not opening

**Root cause:** The `BookingDetailsDialog` returns `null` when `booking` is falsy (line 42-44), but it's always rendered. The dialog `open` prop is `!!selectedBooking`. When clicking Eye, `setSelectedBooking(booking)` is called. This should work.

However, looking more carefully at the component — it returns `null` BEFORE rendering the `<Dialog>`. This means when `booking` is null, there's no Dialog in the DOM at all. When `selectedBooking` changes from null to a booking, React mounts a NEW Dialog component. This could cause issues with Radix Dialog's internal state management. 

**Fix:** Always render the Dialog shell, gate content on `booking` existing:
```tsx
return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      {booking && ( /* content */ )}
    </DialogContent>
  </Dialog>
);
```

**File:** `src/components/admin/BookingDetailsDialog.tsx`

### Issue 4: Email shows "=20" characters

**Root cause:** The denomailer SMTP client is configured with `debug: { encodeLB: true }` (line 228-230 of `send-booking-email/index.ts`). This enables Quoted-Printable encoding of line breaks, which also encodes spaces as `=20`. Some email clients don't decode QP properly, showing raw `=20` characters.

**Fix:** Remove the `debug` config entirely from the SMTPClient constructor. Then redeploy the edge function.

**File:** `supabase/functions/send-booking-email/index.ts` — remove lines 227-230 (`debug: { encodeLB: true }`)

---

### Summary of changes

| # | Issue | File | Change |
|---|-------|------|--------|
| 1 | Calendar hidden on mobile scroll | `BookingWizard.tsx` | Increase `scroll-mt` values |
| 2 | Admin dialog won't open | `BookingDetailsDialog.tsx` | Always render Dialog, gate content inside |
| 3 | Email "=20" encoding | `send-booking-email/index.ts` | Remove `debug: { encodeLB: true }` + redeploy |

