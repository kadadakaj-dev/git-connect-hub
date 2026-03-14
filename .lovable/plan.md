

# Fix: Input fields lose focus after every keystroke

## Root cause
`GlassCard` is defined as a component **inside** the `BookingWizard` render function (line 223). Every state change (e.g. typing a character) creates a new `GlassCard` function reference, which React treats as a **different component type**. This causes React to unmount and remount the entire subtree on every keystroke, destroying input focus.

## Fix
Move the `GlassCard` component definition **outside** of `BookingWizard` so it maintains a stable identity across renders. One line move, no functional change.

**File:** `src/components/booking/BookingWizard.tsx`
- Extract `GlassCard` from inside `BookingWizard` (line 223-232) to a standalone component defined before or after `BookingWizard`.

