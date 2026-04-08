# QA Test Cases — FYZIOAFIT Booking System

> **Project**: FYZIOAFIT physiotherapy booking (Lovable.dev + Supabase)
> **Scope**: Only what is explicitly visible, configured, or present in the codebase.
> **Out of scope**: Internal DB schema, direct SQL testing, infrastructure, server-side unit tests, admin module deep testing.
> **Language**: Default Slovak (sk), secondary English (en). Tests written for SK unless stated.

---

## 1. SERVICE SELECTION

### TC-1.1 — Services load and display correctly

- **Priority**: P0 (Critical)
- **Preconditions**: Network available; Supabase `services` table has active services.
- **Steps**:
  1. Open `/` (homepage).
  2. Wait for splash screen to finish.
  3. Observe the service list in Step 1.
- **Expected Result**: Active services display with localized name (SK default), description, duration (e.g. `60min`), and price (e.g. `50 €`). Inactive services are not shown. Services appear sorted by `sort_order`.

### TC-1.2 — Loading skeleton shown while services fetch

- **Priority**: P1 (High)
- **Preconditions**: Slow or throttled network.
- **Steps**:
  1. Open `/` with network throttled to Slow 3G.
  2. Observe Step 1 area before data loads.
- **Expected Result**: Six placeholder skeleton cards render with staggered fade-in animation (80ms delay between cards).

### TC-1.3 — Error state when services fail to load

- **Priority**: P1
- **Preconditions**: Supabase unreachable or returns error.
- **Steps**:
  1. Disable network or block Supabase domain.
  2. Open `/`.
- **Expected Result**: Message "Služby nie sú momentálne dostupné" is displayed instead of the service list.

### TC-1.4 — Select a regular service

- **Priority**: P0
- **Preconditions**: Services loaded successfully.
- **Steps**:
  1. Click on any non-express service card.
- **Expected Result**: Selected card highlights with blue border and glow shadow. Radio indicator fills blue. Only one service can be selected at a time. Date/Time section (Step 2–3) becomes enabled (no longer dimmed/pointer-events-none).

### TC-1.5 — Switching service selection

- **Priority**: P1
- **Preconditions**: A service is already selected.
- **Steps**:
  1. Click a different service card.
- **Expected Result**: Previous selection deselects. New card highlights. Only one radio active.

### TC-1.6 — Express service shows special styling and phone CTA

- **Priority**: P1
- **Preconditions**: Express service (ID `3caf6d26-cc3b-4126-8cef-dea395f3fa83`) is active.
- **Steps**:
  1. Scroll to express service card.
  2. Observe its UI.
  3. Click "Zavolajte nám" button.
- **Expected Result**: Card has sky-blue gradient, ⚡ badge saying "Expresný termín", "+15 €" surcharge label, and description "Do 36h · víkendy · sviatky". The CTA button opens `tel:+421905307198` (phone dialer).

### TC-1.7 — Service displays in English when language switched

- **Priority**: P2 (Medium)
- **Preconditions**: Language switcher available.
- **Steps**:
  1. Switch language to EN.
  2. Observe service list.
- **Expected Result**: Service names and descriptions switch to English (`name_en`, `description_en`). Express label reads "Express Appointment".

---

## 2. DATE SELECTION (Calendar)

### TC-2.1 — Calendar renders current month by default

- **Priority**: P0
- **Preconditions**: A service is selected.
- **Steps**:
  1. Observe the calendar in Step 2.
- **Expected Result**: Calendar shows the current month name (e.g. "marec 2026" in SK), with day headers `Po, Ut, St, Št, Pi, So, Ne`. Week starts on Monday.

### TC-2.2 — Sundays are disabled

- **Priority**: P0
- **Preconditions**: Calendar is visible.
- **Steps**:
  1. Observe Sunday column dates.
- **Expected Result**: All Sunday dates are visually muted (opacity ~20%), have `cursor: not-allowed`, and cannot be clicked.

### TC-2.3 — Dates within 36-hour window are disabled

- **Priority**: P0
- **Preconditions**: Calendar is visible.
- **Steps**:
  1. Today is March 16, 2026 at 10:00. The 36h cutoff is March 17 at 22:00.
  2. Observe dates for March 16 and March 17.
- **Expected Result**: March 16 is disabled. March 17 is disabled (since even the latest possible slot on Mar 17 would be before 22:00 in most configs). March 18+ should be selectable (depending on whether it's a Sunday or blocked).

### TC-2.4 — Past dates are disabled

- **Priority**: P0
- **Preconditions**: Calendar is visible.
- **Steps**:
  1. Observe any date before today.
- **Expected Result**: All past dates are grayed out and not clickable.

### TC-2.5 — Previous month navigation disabled on current month

- **Priority**: P2
- **Preconditions**: Calendar shows current month.
- **Steps**:
  1. Click the left arrow (previous month).
- **Expected Result**: Button is disabled; calendar does not navigate to a past month.

### TC-2.6 — Navigate to next month

- **Priority**: P1
- **Preconditions**: Calendar shows current month.
- **Steps**:
  1. Click the right arrow (next month).
- **Expected Result**: Calendar advances to next month. Day labels and dates update correctly.

### TC-2.7 — Blocked dates are disabled

- **Priority**: P1
- **Preconditions**: A date is marked as blocked in Supabase `blocked_dates` table (e.g. March 20, 2026).
- **Steps**:
  1. Navigate to the month containing the blocked date.
  2. Observe the blocked date cell.
- **Expected Result**: The blocked date is not selectable (muted appearance, not clickable).

### TC-2.8 — Selecting a date highlights it and triggers slot loading

- **Priority**: P0
- **Preconditions**: An available (non-disabled) date exists.
- **Steps**:
  1. Click on an available date (e.g. March 19, Thursday).
- **Expected Result**: Date cell highlights with blue background and bold font. Time slot area begins loading (shows TimeSlotSkeleton) and then displays available slots.

### TC-2.9 — Today indicator ring

- **Priority**: P3 (Low)
- **Preconditions**: Calendar shows current month.
- **Steps**:
  1. Observe today's date cell (even if disabled).
- **Expected Result**: Today's date has a subtle blue ring border indicator distinguishing it from other dates.

---

## 3. TIME SLOT SELECTION

### TC-3.1 — Placeholder shown before date selected

- **Priority**: P1
- **Preconditions**: No date selected yet.
- **Steps**:
  1. Observe the time slot area.
- **Expected Result**: Clock icon with message "Vyberte dátum na zobrazenie dostupných časov" displayed.

### TC-3.2 — Time slots load correctly for selected date

- **Priority**: P0
- **Preconditions**: A valid date is selected with configured time slots in `time_slots_config` for that day of week.
- **Steps**:
  1. Select an available date.
  2. Wait for slots to load.
- **Expected Result**: Slots appear in a 4-column grid, grouped into "Dopoludnia" (morning, <12:00) and "Popoludní" (afternoon, ≥12:00). Each slot shows time in HH:MM format. Available slots have white/glass background; unavailable slots are faded.

### TC-3.3 — Loading skeleton during slot fetch

- **Priority**: P2
- **Preconditions**: Slow network or first load after date selection.
- **Steps**:
  1. Select a date.
  2. Observe the time slot area during loading.
- **Expected Result**: 12 placeholder skeleton boxes render with 50ms stagger animation.

### TC-3.4 — No slots available for selected date

- **Priority**: P1
- **Preconditions**: Date selected has no active `time_slots_config` entries for that day of week.
- **Steps**:
  1. Select a date with no configured hours (e.g. Saturday if no Saturday hours configured).
- **Expected Result**: Message "Pre tento deň nie sú dostupné žiadne termíny. Vyberte iný deň." displayed.

### TC-3.5 — Unavailable (fully booked) slots cannot be selected

- **Priority**: P0
- **Preconditions**: A time slot is fully booked (all employees have bookings at that time).
- **Steps**:
  1. Select a date where 09:00 is fully booked.
  2. Attempt to click the 09:00 slot.
- **Expected Result**: Slot appears faded (opacity ~25%), cursor is `not-allowed`. Clicking does nothing.

### TC-3.6 — Select an available time slot

- **Priority**: P0
- **Preconditions**: Available slots displayed.
- **Steps**:
  1. Click an available time slot (e.g. "10:00").
- **Expected Result**: Slot highlights with blue background and shadow. Step 4 (Client Details) becomes enabled (no longer dimmed). Page scrolls smoothly to the client details form.

### TC-3.7 — Multi-slot service highlights consecutive slots on hover

- **Priority**: P1
- **Preconditions**: Selected service has duration > 30 min (e.g. 60 min = 2 slots).
- **Steps**:
  1. Hover over an available time slot.
- **Expected Result**: The hovered slot AND the next consecutive slot(s) are highlighted together. An info text displays "Služba zaberie 2 po sebe idúcich slotov (60 min)".

### TC-3.8 — Multi-slot service cannot be booked if next consecutive slots unavailable

- **Priority**: P1
- **Preconditions**: 60-min service selected. Slot at 14:00 is available but 14:30 is fully booked.
- **Steps**:
  1. Observe the 14:00 slot.
- **Expected Result**: 14:00 is rendered as unavailable because the required consecutive 14:30 slot is not free.

### TC-3.9 — 36-hour lead time enforced on time slots

- **Priority**: P0
- **Preconditions**: Date is 2 days from now; some morning slots fall within the 36h window.
- **Steps**:
  1. Select the date that is exactly 2 days from now.
  2. Observe early morning time slots.
- **Expected Result**: Slots that would start before `now + 36 hours` are displayed but marked unavailable (faded, not clickable).

---

## 4. CLIENT DETAILS FORM

### TC-4.1 — Form disabled until date and time selected

- **Priority**: P0
- **Preconditions**: Service selected but no date/time yet.
- **Steps**:
  1. Observe Step 4 (Client Details) section.
- **Expected Result**: Section is visually dimmed (opacity ~30%) with `pointer-events: none`. Cannot interact with form fields.

### TC-4.2 — Valid name accepted (≥2 characters)

- **Priority**: P0
- **Preconditions**: Form is enabled.
- **Steps**:
  1. Type "Ján" in the name field.
  2. Click away (blur).
- **Expected Result**: Green checkmark icon appears next to the field. No error message.

### TC-4.3 — Invalid name rejected (<2 characters)

- **Priority**: P0
- **Preconditions**: Form is enabled.
- **Steps**:
  1. Type "J" in the name field.
  2. Attempt to submit the form.
- **Expected Result**: Error message "Meno je povinné" appears below the name field. Red alert icon displayed.

### TC-4.4 — Empty name rejected

- **Priority**: P0
- **Preconditions**: Form enabled.
- **Steps**:
  1. Leave name empty.
  2. Submit form.
- **Expected Result**: Error "Meno je povinné" displayed.

### TC-4.5 — Valid email accepted

- **Priority**: P0
- **Preconditions**: Form enabled.
- **Steps**:
  1. Type "<jan@priklad.sk>" in email field.
  2. Blur.
- **Expected Result**: Green checkmark icon. No error.

### TC-4.6 — Invalid email formats rejected

- **Priority**: P0
- **Preconditions**: Form enabled.
- **Steps**:
  1. Type "janpriklad.sk" (missing @).
  2. Submit.
- **Expected Result**: Error "Zadajte platný e-mail" displayed.

### TC-4.7 — Empty email rejected

- **Priority**: P0
- **Preconditions**: Form enabled.
- **Steps**:
  1. Leave email empty.
  2. Submit.
- **Expected Result**: Error "E-mail je povinný" displayed.

### TC-4.8 — Valid phone numbers accepted

- **Priority**: P0
- **Preconditions**: Form enabled.
- **Steps** (test each format):
  1. `+421 905 307 198` — international with spaces
  2. `0905307198` — local, no spaces
  3. `+421-905-307-198` — with dashes
  4. `(0905) 307198` — with parentheses
- **Expected Result**: All four formats pass validation (green checkmark). Regex: `/^[\+]?[0-9\s\-\(\)]{7,20}$/`

### TC-4.9 — Invalid phone rejected (<7 digits)

- **Priority**: P1
- **Preconditions**: Form enabled.
- **Steps**:
  1. Type "12345" (5 chars).
  2. Submit.
- **Expected Result**: Error "Telefónne číslo je povinné" displayed.

### TC-4.10 — Notes field is optional

- **Priority**: P1
- **Preconditions**: Form enabled.
- **Steps**:
  1. Fill name, email, phone correctly.
  2. Leave notes empty.
  3. Submit.
- **Expected Result**: Form submits successfully without notes.

### TC-4.11 — Notes field accepts free text

- **Priority**: P2
- **Preconditions**: Form enabled.
- **Steps**:
  1. Type "Bolesti chrbta, rehabilitácia po operácii" in notes.
- **Expected Result**: Text accepted, displayed in textarea.

### TC-4.12 — Real-time validation feedback (icons)

- **Priority**: P2
- **Preconditions**: Form enabled.
- **Steps**:
  1. Focus the name field → type valid name.
  2. Focus the email field → type an invalid email.
- **Expected Result**: Name field shows green check icon. Email field shows red alert icon with error text. Icons transition smoothly. Focused field's icon turns primary color.

### TC-4.13 — GDPR notice displayed

- **Priority**: P2
- **Preconditions**: Form visible.
- **Steps**:
  1. Scroll to bottom of client details form.
- **Expected Result**: Shield icon with text "GDPR • Vaše údaje sú chránené" visible.

### TC-4.14 — Autocomplete attributes set correctly

- **Priority**: P3
- **Preconditions**: Form enabled, inspected via DevTools.
- **Steps**:
  1. Inspect name input: `autocomplete="name"`.
  2. Inspect email input: `autocomplete="email"`.
  3. Inspect phone input: `autocomplete="tel"`.
- **Expected Result**: All three autocomplete attributes are present and correct.

---

## 5. BOOKING SUBMISSION

### TC-5.1 — Submit button disabled until service + date/time selected

- **Priority**: P0
- **Preconditions**: Only service selected, no date/time.
- **Steps**:
  1. Observe submit button.
- **Expected Result**: Button is disabled (not clickable, visually dimmed).

### TC-5.2 — Successful booking submission

- **Priority**: P0
- **Preconditions**: Service, date, time, and all client fields filled correctly. Network available.
- **Steps**:
  1. Fill all required fields with valid data.
  2. Click submit button (text from `t.submitBooking`).
- **Expected Result**: Button shows loading spinner during submission. On success, toast message "Rezervácia úspešne potvrdená!" appears. View transitions to Confirmation screen. Page scrolls to top.

### TC-5.3 — Submit with missing client details shows inline errors

- **Priority**: P0
- **Preconditions**: Service, date, time selected. Name left empty.
- **Steps**:
  1. Leave name field empty but fill email and phone correctly.
  2. Click submit.
- **Expected Result**: Form does NOT submit. Error "Meno je povinné" appears below name field. Toast error "Vyplňte všetky povinné polia" may also appear.

### TC-5.4 — Submit with missing service/date/time shows toast error

- **Priority**: P1
- **Preconditions**: Client details filled but somehow service or date/time not selected.
- **Steps**:
  1. *(Edge case)* If state allows submission without all selections.
- **Expected Result**: Toast error "Vyplňte všetky povinné polia" displayed. Booking not created.

### TC-5.5 — Server-side error handled gracefully

- **Priority**: P1
- **Preconditions**: Supabase `create-booking` edge function returns an error (e.g. slot became unavailable).
- **Steps**:
  1. Fill all fields.
  2. Submit (while another user books the last slot simultaneously).
- **Expected Result**: Toast error displays the server error message. Form remains editable for retry. User can select a different time slot.

### TC-5.6 — Loading state prevents double submission

- **Priority**: P1
- **Preconditions**: Form filled correctly.
- **Steps**:
  1. Click submit.
  2. Immediately click submit again while request is in-flight.
- **Expected Result**: Button is disabled during `isPending` state. Only one API call is made.

---

## 6. CONFIRMATION SCREEN

### TC-6.1 — Confirmation code generated and displayed

- **Priority**: P0
- **Preconditions**: Booking submitted successfully.
- **Steps**:
  1. Observe the confirmation screen header.
- **Expected Result**: Title "Rezervácia potvrdená!" with green checkmark icon. A 6-character alphanumeric confirmation code displayed as `#XXXXXX` (uppercase).

### TC-6.2 — Booking details match submitted data

- **Priority**: P0
- **Preconditions**: Booking confirmed.
- **Steps**:
  1. Compare displayed service name, date, time, client name, email, phone.
- **Expected Result**: All fields match exactly what was submitted. Date formatted as `d. MMM yyyy` (SK locale). Time in HH:MM format. Location shows "Krmanová 6, Košice".

### TC-6.3 — Notes displayed if provided

- **Priority**: P2
- **Preconditions**: Booking submitted with notes text.
- **Steps**:
  1. Observe notes section on confirmation.
- **Expected Result**: Notes text displayed in a styled container.

### TC-6.4 — Notes section hidden if not provided

- **Priority**: P3
- **Preconditions**: Booking submitted without notes.
- **Steps**:
  1. Observe confirmation screen.
- **Expected Result**: No notes section visible.

### TC-6.5 — Email sent notice displayed

- **Priority**: P1
- **Preconditions**: Booking confirmed.
- **Steps**:
  1. Observe email notice area.
- **Expected Result**: Text displays the client email address where confirmation was sent.

### TC-6.6 — "Book Another Appointment" resets wizard

- **Priority**: P0
- **Preconditions**: On confirmation screen.
- **Steps**:
  1. Click "Rezervovať ďalší termín" button.
- **Expected Result**: Wizard resets to Step 1. All form fields cleared. Service, date, time deselected. Page scrolls to top.

### TC-6.7 — "Add to Calendar" opens Google Calendar

- **Priority**: P1
- **Preconditions**: On confirmation screen.
- **Steps**:
  1. Click "Pridať do kalendára" button.
- **Expected Result**: New tab opens with Google Calendar event creation URL. Pre-filled with: title "FYZIOAFIT - {service name}", correct start/end times, location "Krmanová 6, Košice".

---

## 7. CANCELLATION FLOW

### TC-7.1 — Valid cancellation link loads booking details

- **Priority**: P0
- **Preconditions**: Valid `cancellation_token` exists for an upcoming booking.
- **Steps**:
  1. Navigate to `/cancel?token={valid-token}`.
  2. Wait for loading to complete.
- **Expected Result**: Loading spinner with "Overujem rezerváciu..." shown first. Then booking details displayed: service name, date (formatted as "EEEE, d. MMMM yyyy"), time, client name. Confirmation prompt asks "Chcete zrušiť túto rezerváciu?" with warning that action is irreversible.

### TC-7.2 — Confirm cancellation

- **Priority**: P0
- **Preconditions**: Cancellation page shows booking details in `confirm` state.
- **Steps**:
  1. Click "Áno, zrušiť rezerváciu" (red button).
  2. Wait for processing.
- **Expected Result**: Button shows processing spinner. On success, view transitions to success state with green checkmark and "Rezervácia zrušená". Booking details shown as read-only. "Nová rezervácia" button available.

### TC-7.3 — Decline cancellation navigates home

- **Priority**: P1
- **Preconditions**: Cancellation page in `confirm` state.
- **Steps**:
  1. Click "Nie, ponechať" button.
- **Expected Result**: User navigated to `/` (homepage). Booking remains unchanged.

### TC-7.4 — Already cancelled booking

- **Priority**: P1
- **Preconditions**: Same cancellation token used again after successful cancellation.
- **Steps**:
  1. Navigate to `/cancel?token={already-cancelled-token}`.
- **Expected Result**: Shows "Rezervácia už bola zrušená" with X icon (muted). Booking details displayed. "Nová rezervácia" button available.

### TC-7.5 — Too late to cancel (<12 hours before)

- **Priority**: P0
- **Preconditions**: Booking is within 12 hours. Cancellation token is valid.
- **Steps**:
  1. Navigate to `/cancel?token={token-for-soon-booking}`.
  2. Click confirm cancellation.
- **Expected Result**: Error "Zrušenie online nie je možné" displayed. Message explains 12-hour deadline. Phone contact shown: "Kontaktujte nás telefonicky:" with clickable link to `+421 905 307 198`.

### TC-7.6 — Invalid or missing token

- **Priority**: P1
- **Preconditions**: No token or garbage token.
- **Steps**:
  1. Navigate to `/cancel` (no token).
  2. Navigate to `/cancel?token=invalid-garbage`.
- **Expected Result**: Error state with "Neplatný odkaz na zrušenie" or "Rezervácia nebola nájdená". "Späť na hlavnú stránku" button navigates to `/`.

### TC-7.7 — Cancellation with English language

- **Priority**: P2
- **Preconditions**: Language set to EN.
- **Steps**:
  1. Navigate to `/cancel?token={valid-token}`.
- **Expected Result**: All text in English: "Do you want to cancel this booking?", "This action cannot be undone", "Yes, cancel booking", "No, keep it".

---

## 8. PROGRESS BAR / STEPPER

### TC-8.1 — Steps reflect wizard progression

- **Priority**: P1
- **Preconditions**: Wizard visible.
- **Steps**:
  1. Observe stepper with no selections (Step 1 current).
  2. Select a service → observe stepper.
  3. Select date + time → observe stepper.
- **Expected Result**: Step 1 circle is blue (current). After service selected, Step 1 shows checkmark (completed), Step 2 becomes current. After date+time, Steps 1-2-3 completed, Step 4 current.

### TC-8.2 — Mobile stepper shows compact view

- **Priority**: P2
- **Preconditions**: Viewport < 640px.
- **Steps**:
  1. Observe progress bar on mobile.
- **Expected Result**: Smaller circles (28px), connected by lines. Current step title shown below. Text "Krok {current} z {total}" displayed.

---

## 9. MOBILE RESPONSIVENESS

### TC-9.1 — Service list stacks on mobile

- **Priority**: P1
- **Preconditions**: Viewport < 640px.
- **Steps**:
  1. Observe service list layout.
- **Expected Result**: Service cards stack vertically in a single column. Padding is reduced (16px). Touch targets are ≥48px height.

### TC-9.2 — Calendar and time slots stack on mobile

- **Priority**: P1
- **Preconditions**: Viewport < 640px, service and date selected.
- **Steps**:
  1. Observe date/time section.
- **Expected Result**: Calendar appears above time slot grid (stacked, not side-by-side). Time slot grid adjusts columns for narrower viewport.

### TC-9.3 — Confirmation buttons stack on mobile

- **Priority**: P2
- **Preconditions**: Viewport < 640px, confirmation screen visible.
- **Steps**:
  1. Observe action buttons.
- **Expected Result**: "Book Another Appointment" and "Add to Calendar" buttons are full-width, stacked vertically.

### TC-9.4 — Form inputs are full width on mobile

- **Priority**: P1
- **Preconditions**: Viewport < 640px, form enabled.
- **Steps**:
  1. Observe name, email, phone, notes fields.
- **Expected Result**: All inputs span full container width. Input height is 48px (touch-friendly).

---

## 10. EMPTY / LOADING / ERROR STATES SUMMARY

### TC-10.1 — Splash screen on first visit

- **Priority**: P1
- **Preconditions**: No `splashShown` flag in sessionStorage.
- **Steps**:
  1. Open `/` in a fresh session.
- **Expected Result**: Splash screen shows "FYZIOAFIT" branding with progress bar animation. Fades out after ~320ms, completes at ~640ms. Not shown on subsequent navigations in same session (sessionStorage flag set).

### TC-10.2 — Offline banner

- **Priority**: P2
- **Preconditions**: Device goes offline (disconnect network).
- **Steps**:
  1. While app is loaded, disconnect network.
- **Expected Result**: Sticky offline banner appears (using `navigator.onLine` + `offline` event). Reconnecting dismisses it.

### TC-10.3 — Cookie consent banner

- **Priority**: P1
- **Preconditions**: No `cookie-consent` key in localStorage.
- **Steps**:
  1. Open the app.
  2. Wait ~1 second.
- **Expected Result**: Cookie banner slides in from bottom with glass-card styling. Shows privacy text, "Súhlasím" accept button, "Odmietnuť" decline button, "Viac informácií" link to `/legal?tab=privacy`, and X close button.

### TC-10.4 — Accept cookies

- **Priority**: P1
- **Preconditions**: Cookie banner visible.
- **Steps**:
  1. Click "Súhlasím".
- **Expected Result**: Banner hides. `localStorage.getItem('cookie-consent')` = `'accepted'`. Banner does not reappear.

### TC-10.5 — Decline cookies removes analytics

- **Priority**: P2
- **Preconditions**: Cookie banner visible.
- **Steps**:
  1. Click "Odmietnuť".
- **Expected Result**: Banner hides. `localStorage.getItem('cookie-consent')` = `'declined'`. Plausible analytics script (`script[data-domain]`) is removed from DOM.

---

## 11. LANGUAGE SWITCHING (i18n)

### TC-11.1 — Switch from Slovak to English

- **Priority**: P1
- **Preconditions**: Default language is SK.
- **Steps**:
  1. Click "EN" in the LanguageSwitcher.
- **Expected Result**: All visible UI text switches to English: step labels, service names, validation errors, date labels, button text. Day names change from [Po, Ut, St…] to [Mo, Tu, We…].

### TC-11.2 — Validation errors display in active language

- **Priority**: P2
- **Preconditions**: Language set to EN.
- **Steps**:
  1. Leave name empty and submit.
- **Expected Result**: Error reads "Name is required" (not "Meno je povinné").

---

## 12. ROUTING & NAVIGATION

### TC-12.1 — 404 page for unknown routes

- **Priority**: P2
- **Preconditions**: None.
- **Steps**:
  1. Navigate to `/nonexistent`.
- **Expected Result**: NotFound page renders. Console logs `404 Error: User attempted to access non-existent route: /nonexistent`.

### TC-12.2 — Legal page accessible

- **Priority**: P2
- **Preconditions**: None.
- **Steps**:
  1. Navigate to `/legal`.
- **Expected Result**: Legal page with tabbed terms/privacy content renders.

### TC-12.3 — Cancel route without auth required

- **Priority**: P1
- **Preconditions**: None.
- **Steps**:
  1. Navigate to `/cancel?token={token}` without being logged in.
- **Expected Result**: Cancellation page loads (no auth required for cancellation).

---

## 13. EDGE CASES & RATE LIMITING

### TC-13.1 — Rate limit on booking creation (10/15min)

- **Priority**: P1
- **Preconditions**: Same IP submits bookings rapidly.
- **Steps**:
  1. Submit 11 booking requests within 15 minutes from the same IP.
- **Expected Result**: 11th request returns HTTP 429 with `Retry-After: 60` header. Error message displayed to user.

### TC-13.2 — Rate limit on cancellation (20/15min)

- **Priority**: P2
- **Preconditions**: Same IP sends cancellation requests rapidly.
- **Steps**:
  1. Send 21 cancellation requests within 15 minutes.
- **Expected Result**: 21st request returns HTTP 429.

### TC-13.3 — Concurrent booking for last slot

- **Priority**: P1
- **Preconditions**: Only 1 employee, 1 slot remaining at 14:00.
- **Steps**:
  1. User A selects 14:00 and starts filling form.
  2. User B books 14:00 and submits first.
  3. User A submits.
- **Expected Result**: User A's submission fails with server-side error (slot no longer available). Error toast displayed. User A can pick a different time.

---

## 14. SEO & META TAGS

### TC-14.1 — Homepage has correct meta tags

- **Priority**: P3
- **Preconditions**: None.
- **Steps**:
  1. Inspect `<head>` on `/`.
- **Expected Result**: `<title>` set. OpenGraph tags (`og:title`, `og:description`, `og:url`) present. Twitter card tags present. `hreflang` attributes for SK/EN.

### TC-14.2 — JSON-LD structured data present

- **Priority**: P3
- **Preconditions**: None.
- **Steps**:
  1. Inspect page source for `<script type="application/ld+json">`.
- **Expected Result**: Valid `HealthAndBeautyBusiness` schema.org JSON-LD block with clinic name, address ("Krmanová 6, Košice"), and contact info.

---

## Features Not Verifiable from Current Context

The following are **not testable** without additional context or access:

| Item | Reason |
| ------ | -------- |
| Email delivery content/rendering | Sent via Supabase edge function; no preview available in frontend |
| Employee auto-assignment algorithm | Server-side logic in `create-booking` edge function |
| Scheduled reminder emails (cron job) | Backend scheduled function, not visible in UI |
| Admin dashboard CRUD operations | Separate admin module, not part of booking user journey |
| Supabase Storage avatar upload limits | Backend storage config, not client-testable |
| OAuth provider configuration (Google/Apple) | Requires live OAuth credentials |
| Database Row-Level Security policies | Infrastructure-level, not UI-testable |
| Plausible analytics event tracking | Third-party integration, requires separate verification |

---

## Test Priority Distribution

| Priority | Count | Description |
| ---------- | ------- | ------------- |
| P0 (Critical) | 21 | Core booking flow — must pass for release |
| P1 (High) | 23 | Important functionality and error handling |
| P2 (Medium) | 14 | Edge cases, i18n, mobile, secondary flows |
| P3 (Low) | 4 | Meta, SEO, autocomplete attributes |
| **Total** | **62** | |

