

## Code Review: Admin Calendar — All 4 Views

### Verified Components

**1. TimeGridView (Day/Week)** — `TimeGridView.tsx`
- Event pills show: bold time range (`9:30 – 11:00`), service name, client name, phone/email, employee name
- Small events (≤30min) show compact single-line with service + client
- Medium events (30-45min) hide contact info to save space
- Large events show full details including phone/email
- Resize handles, drag-and-drop, current time indicator all present

**2. MonthView** — `MonthView.tsx`
- Shows `startTime–endTime` and service name on each event pill
- Color-coded by category via `getEventColorByCategory`
- Blocked dates marked with 🚫
- Drag-and-drop between days supported

**3. ListView** — `ListView.tsx` (new)
- Groups events by date with localized date headers
- Each card shows: time block (start/end + duration), service name, client name with icon, phone/email, employee name, status badge
- Filtered by selected therapist
- Click to edit event
- Empty state message when no bookings

**4. CalendarHeader** — `CalendarHeader.tsx`
- 4 view toggles: Mesiac/Týždeň/Deň/Zoznam with animated active indicator
- Employee filter, navigation, overlap prevention toggle

### Potential Issues Found

1. **No issues in code logic** — all views correctly receive `events`, `selectedTherapist`, `language` props
2. **ListView navigation** — correctly uses week-based navigation (same as week view) in `CalendarView.tsx` line 57-59
3. **Employee name mapping** — correctly built from `employees_public` join in `CalendarView.tsx` line 93

### To Complete Testing
You need to log in as admin in the preview first. Then I can:
- Switch between all 4 views
- Verify event cards display all info
- Test mobile responsiveness

### No Code Changes Needed
The implementation looks complete and correct based on code review. Browser testing requires admin authentication.

