

# Plan: 3 Improvements

## 1. Email Templates -- White Backgrounds

**Problem**: The React Email auth templates (signup, recovery, magic-link, invite, email-change, reauthentication) use `#f7f9fc` as body background which is fine in light mode, but in dark mode the CSS overrides set backgrounds to dark colors (`#18181b`, `#242427`). The user wants ALL backgrounds to be white, no dark mode overrides.

Similarly, the `send-booking-email` edge function HTML templates use dark mode CSS media queries that turn backgrounds black.

**Changes**:
- **6 auth email templates** (`supabase/functions/_shared/email-templates/*.tsx`): Remove the dark mode `<style>` block entirely. Set `main.backgroundColor = '#ffffff'`. Keep card/content/footer backgrounds as white-friendly light colors.
- **`send-booking-email/index.ts`**: Remove all `@media (prefers-color-scheme: dark)` CSS blocks from all 3 HTML generators (`generateEmailHtml`, `generateAdminNotificationHtml`, `generateCancellationAdminHtml`). Set outer body background to `#ffffff`.
- Redeploy `auth-email-hook` and `send-booking-email` edge functions.

## 2. Reminder Email 20h Before Appointment

**Problem**: Current `send-booking-reminder` runs daily and checks for "tomorrow's" bookings. The user wants reminders sent 20 hours before the reserved time.

**Changes**:
- Update `send-booking-reminder/index.ts` to calculate the window: bookings where `booking_datetime - now() <= 20 hours` AND `booking_datetime - now() > 0`. Instead of filtering by `date = tomorrow`, query bookings where `date` is today or tomorrow, then filter in code by checking if the booking datetime is within the 20h window.
- The cron job should run more frequently (every hour instead of once daily) to catch bookings accurately within the 20h window. This will be set via SQL update to the existing cron job.
- Redeploy `send-booking-reminder`.

## 3. Calendar Zoom + Day Number Click Navigation

**Problem**: Admin calendar (especially week view) is hard to read on smaller screens. User wants a zoom control at the bottom of the calendar and the ability to click day numbers to switch to day view.

**Changes**:

### A. Zoom Control (bottom of calendar)
- Add zoom state to `CalendarView.tsx` (range: 0.6 to 1.6, default 1.0)
- Render a floating zoom bar at the bottom of the calendar card with `-` / `+` buttons and a magnifying glass icon
- Apply `transform: scale(zoom)` with `transform-origin: top left` to the calendar content area, adjusting the container width/height accordingly via `width: ${100/zoom}%`
- Smooth CSS transition on scale changes

### B. Day number click -> switch to Day view
- **TimeGridView.tsx**: Make the day number in the header clickable. On click, call a new `onDayClick(date)` callback.
- **MonthView.tsx**: Make day numbers clickable to navigate to that day view.
- **CalendarView.tsx**: Add `onDayClick` prop threading. When clicked, set `viewMode = 'day'` and `currentDate = clickedDate`.
- **CalendarHeader**: No changes needed (view mode already controlled externally).

### Technical Details

Files modified:
1. `supabase/functions/_shared/email-templates/signup.tsx` -- remove dark mode styles, white bg
2. `supabase/functions/_shared/email-templates/recovery.tsx` -- same
3. `supabase/functions/_shared/email-templates/magic-link.tsx` -- same
4. `supabase/functions/_shared/email-templates/invite.tsx` -- same
5. `supabase/functions/_shared/email-templates/email-change.tsx` -- same
6. `supabase/functions/_shared/email-templates/reauthentication.tsx` -- same
7. `supabase/functions/send-booking-email/index.ts` -- remove dark mode CSS from all HTML generators, white body bg
8. `supabase/functions/send-booking-reminder/index.ts` -- 20h window logic
9. `src/components/admin/CalendarView.tsx` -- add zoom state, zoom UI, day click handler
10. `src/components/admin/calendar/TimeGridView.tsx` -- add onDayClick prop, clickable day numbers
11. `src/components/admin/calendar/MonthView.tsx` -- clickable day numbers
12. Deploy edge functions: `auth-email-hook`, `send-booking-email`, `send-booking-reminder`
13. Update cron job to run hourly for 20h reminder accuracy

