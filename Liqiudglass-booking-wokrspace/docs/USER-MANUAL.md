# 📖 User Manual — Booking Pro LE Dashboard

Complete guide to using the Booking Pro LE dashboard for bookings management.

---

## Table of Contents

1. [Getting Started](#-getting-started)
2. [Main Dashboard](#-main-dashboard)
3. [Bookings Management](#-bookings-management)
4. [Create New Booking](#-create-new-booking)
5. [Cancel Booking](#-cancel-booking)
6. [Settings](#-settings)
7. [Mobile & PWA](#-mobile--pwa)
8. [FAQ](#-faq)

---

## 🚀 Getting Started

### Access Dashboard

1. Open browser: **http://localhost:3000** (development)
2. You'll see the booking interface
3. Services and available slots will load automatically

### System Requirements

- ✅ Modern browser (Chrome, Firefox, Safari, Edge)
- ✅ Internet connection
- ✅ JavaScript enabled
- ✅ Cookies enabled (for authentication)

---

## 📊 Main Dashboard

### Overview Page (`/`)

The landing page shows:

**📈 Key Metrics** (Top Section):
- **Total Bookings Today** — Count of bookings made today
- **Revenue Today** — Income from today's bookings
- **Occupancy Rate** — Percentage of available slots booked
- **Next Booking** — Time of next scheduled booking

**📅 Quick Stats** (Cards):
- Bookings for today
- Bookings for this week
- Bookings for this month
- Cancellations

**🚀 Quick Actions** (Buttons):
- "Create Booking" — Book new appointment
- "View All Bookings" — See full calendar
- "Settings" — Configure tenant

### Admin Dashboard (`/admin`)

Enhanced view with management tools:

**📆 Calendar View**:
- Visual representation of all bookings
- Color-coded by status (Confirmed, Pending, Cancelled)
- Click to see booking details
- Drag-and-drop to reschedule (future feature)

**📋 Bookings List**:
- Time-sorted list of upcoming bookings
- Filter by date range
- Search by customer name/email
- Quick action buttons (View, Cancel, Edit)

**👥 Customer Insights** (Future):
- Repeat customer data
- Revenue per customer
- Popular services

---

## 🎫 Bookings Management

### View All Bookings

Navigate to **Bookings** page:

1. Click **"View All Bookings"** button
2. Bookings list displays with:
   - **Date & Time** — When booking is scheduled
   - **Customer** — Name and email
   - **Service** — Booked service
   - **Status** — CONFIRMED, PENDING, or CANCELLED
   - **Actions** — View, Cancel

### Filter Bookings

**By Date Range**:
```
Select "From Date" → Select "To Date" → Click "Apply"
```

**By Status**:
```
Click "Status" dropdown → Select: All, Confirmed, Pending, Cancelled
```

**By Customer**:
```
Type in search box → Results filter automatically
```

### View Booking Details

Click booking entry to see:

```
┌─────────────────────────────────────────┐
│ Booking ID: booking_xyz123              │
├─────────────────────────────────────────┤
│ Status: CONFIRMED                       │
│ Date: Tuesday, Feb 20, 2024             │
│ Time: 09:00 AM - 09:45 AM               │
│ Duration: 45 minutes                    │
├─────────────────────────────────────────┤
│ Customer Information:                   │
│ • Name: John Doe                        │
│ • Email: john@example.com               │
│ • Phone: +1-555-0100                    │
│ • Notes: First time customer            │
├─────────────────────────────────────────┤
│ Service: Hair Cut                       │
│ Price: $45.00                           │
├─────────────────────────────────────────┤
│ [Cancel]  [Edit]  [Print]  [Close]     │
└─────────────────────────────────────────┘
```

---

## ✏️ Create New Booking

### Step 1: Open Booking Form

Click **"Create Booking"** button (top right)

### Step 2: Select Service

```
┌─────────────────────────────────────────┐
│ Which service?                          │
├─────────────────────────────────────────┤
│ ○ Hair Cut (45 min)     $45             │
│ ○ Hair Coloring (90 min) $65            │
│ ○ Styling (30 min)      $35             │
│ ○ Consultation (15 min) FREE            │
└─────────────────────────────────────────┘
```

- Click on serviceto select
- Shows duration and price

### Step 3: Select Date & Time

```
┌─────────────────────────────────────────┐
│ Pick date and time                      │
├─────────────────────────────────────────┤
│ Calendar picker shows available dates   │
│ Grayed out = fully booked               │
│                                          │
│ [Select Date]                           │
│                                          │
│ Available times:                        │
│ [09:00]  [09:45]  [10:30]              │
│ [11:15]  [12:00]  [13:30] [14:15]      │
└─────────────────────────────────────────┘
```

- Select date from calendar
- Choose time slot from available options
- Green = available, Gray = booked

### Step 4: Enter Customer Details

```
┌─────────────────────────────────────────┐
│ Customer Information                    │
├─────────────────────────────────────────┤
│ Full Name *                             │
│ [____________________________]           │
│                                          │
│ Email Address *                         │
│ [____________________________]           │
│                                          │
│ Phone Number (optional)                 │
│ [____________________________]           │
│                                          │
│ Notes                                   │
│ [____________________________]           │
│ [____________________________]           │
│                                          │
│ ☑ First time customer?                  │
│ ☑ Needs confirmation email              │
│                                          │
│ [Cancel]  [Confirm Booking]            │
└─────────────────────────────────────────┘
```

Fill in:
- ✅ **Full Name** (required) — Customer name
- ✅ **Email** (required) — Contact email
- ⬜ **Phone** (optional) — Contact number
- ⬜ **Notes** (optional) — Special requests, allergies, etc.
- ☑ **Checkboxes**:
  - First time customer (for notes)
  - Send confirmation email (notify customer)

### Step 5: Review & Confirm

Check summary:

```
┌─────────────────────────────────────────┐
│ Review Your Booking                     │
├─────────────────────────────────────────┤
│ Service: Hair Cut                       │
│ Date & Time: Tue, Feb 20 @ 09:00 AM    │
│ Duration: 45 mins                       │
│ Customer: John Doe (john@example.com)  │
│                                          │
│ Price: $45.00                           │
│                                          │
│ [Back]  [Confirm & Book]               │
└─────────────────────────────────────────┘
```

Click **"Confirm & Book"** to finalize.

### Success Message

```
✓ Booking confirmed!
  Booking ID: booking_xyz123
  Confirmation email sent to john@example.com
```

---

## ❌ Cancel Booking

### Via Bookings List

1. Find booking in list
2. Click **"Cancel"** button
3. Confirm cancellation dialog:
   ```
   Are you sure? This cannot be undone.
   [No, Keep]  [Yes, Cancel Booking]
   ```
4. Confirmation message appears

### Via Booking Details

1. Open booking details
2. Click **"Cancel"** button
3. Select reason (optional):
   - Customer request
   - Double booking
   - No-show
   - Staff unavailable
4. Confirm cancellation
5. Booking status changes to "CANCELLED"

### After Cancellation

- ✅ Time slot becomes available again
- ✅ Customer sent cancellation email
- ⚠️ Booking remains in records (for audit)

---

## ⚙️ Settings

### Access Settings

Click **"Settings"** (gear icon, top right)

### Tenant Configuration

```
┌─────────────────────────────────────────┐
│ Business Information                    │
├─────────────────────────────────────────┤
│ Business Name: [________________]       │
│ Timezone: [UTC ▼                        │
│ Currency: [USD ▼                        │
│ Email Notifications: [Toggle]           │
│ SMS Notifications: [Toggle]             │
│                        [Save Changes]   │
└─────────────────────────────────────────┘
```

**Available Timezones**:
- America/Chicago
- America/Denver
- America/Los_Angeles
- America/New_York
- Europe/Berlin
- Europe/London
- Europe/Paris
- Asia/Bangkok
- Asia/Tokyo

### Integration Management

```
┌─────────────────────────────────────────┐
│ Connected Services                      │
├─────────────────────────────────────────┤
│ Provider: Mock (Development)            │
│ Status: ✓ Connected                     │
│ Last Sync: 2 minutes ago                │
│ [Test Connection]  [Edit]  [Disable]   │
│                                          │
│ Provider: WordPress (Not Connected)     │
│ Status: ⚠ Offline                       │
│ [Setup]  [Documentation]                │
└─────────────────────────────────────────┘
```

- **Mock Provider** — For testing
- **WordPress** — If you have WordPress site
- **More providers coming soon**

### Data & Privacy

```
┌─────────────────────────────────────────┐
│ Data Management                         │
├─────────────────────────────────────────┤
│ Total Bookings: 256                     │
│ Data Storage: 12 MB                     │
│                                          │
│ [Export Data as CSV]                    │
│ [Download Backup]                       │
│ [Delete Old Bookings]                   │
│                                          │
│ 🔒 Privacy                              │
│ ☑ Encrypt sensitive data                │
│ ☑ Don't share with 3rd parties          │
└─────────────────────────────────────────┘
```

---

## 📱 Mobile & PWA

### Install as App

**iPhone (Safari)**:
1. Open dashboard in Safari
2. Tap **Share** button (bottom)
3. Tap **"Add to Home Screen"**
4. Name: "Booking Pro"
5. Tap **"Add"**
6. App appears on home screen

**Android (Chrome)**:
1. Open dashboard in Chrome
2. Tap **menu** (⋮) → **"Install app"**
3. Confirm installation
4. App appears in app drawer

### Offline Mode

Dashboard works **offline**:

✅ **Works offline**:
- View past bookings
- View calendar
- Create draft bookings
- Read this help

❌ **Requires internet**:
- Fetch available slots
- Confirm bookings
- Sync with system

When offline, you'll see:
```
⚠️ You're offline
Your changes will sync when you reconnect.
```

### Mobile Features

**Responsive Design**:
- Automatically adjusts for phone/tablet
- Touch-friendly buttons
- Swipe to navigate
- Optimized keyboard input

**Notifications** (if enabled):
- Booking reminders
- Customer confirmations
- Staff updates

---

## ❓ FAQ

### Q: How do I reset my password?

**A:** Contact your system administrator. (Self-service coming soon)

---

### Q: Can customers book online?

**A:** Not yet in v1.0. Admin creates bookings manually.

**v2.0 features**:
- Customer self-booking
- Online payment
- Automated reminder emails

---

### Q: Why don't I see available slots?

**A:** Check that:
1. ✅ API is running (`http://localhost:4000`)
2. ✅ You selected a service
3. ✅ You selected a date within office hours
4. ✅ No other slots conflict
5. ✅ Browser console has no errors (F12)

---

### Q: Can I edit a booking?

**A:** Currently only supported:
- ✅ View details
- ✅ Cancel
- ✅ Create new for rescheduled time

**Coming soon**:
- Edit customer details
- Change service
- Reschedule via drag-drop

---

### Q: How do I delete a booking?

**A:** Bookings can be **cancelled** (kept as records) but not deleted.

This is for audit trail. If you need deletion, contact admin.

---

### Q: Does it work offline?

**A:** Partially:
- ✅ View past bookings (cached)
- ✅ Phone/email are available
- ❌ Can't check availability (real-time)
- ❌ Can't confirm new bookings

New bookings sync when online.

---

### Q: What browsers are supported?

**Fully supported**:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Good performance**:
- ⚠️ Older versions may be slow
- ⚠️ Internet Explorer not supported

---

### Q: How long do bookings stay in the system?

**Default**: 2 years (configurable in settings)

Older bookings can be archived or deleted in Settings.

---

### Q: Can I print bookings?

**A:** Yes! Click **"Print"** on any booking details.

Prints:
- ✅ Customer name & contact
- ✅ Time & duration
- ✅ Service & price
- ✅ Booking ID (for reference)

---

### Q: Is my data secure?

**Yes!** Data is:
- 🔒 Encrypted in database
- 🔒 Protected with API keys
- 🔒 Backed up daily
- 🔒 GDPR compliant

---

### Q: How do I export bookings?

1. Go to **Settings** → **Data Management**
2. Click **"Export Data as CSV"**
3. Download file (Excel-compatible)

CSV includes:
- Booking ID, Date, Time
- Customer name, email, phone
- Service, status
- Notes

---

## 📞 Getting Help

- **Read**: [Setup Guide](SETUP.md) and [API Docs](API.md)
- **Report Bugs**: [GitHub Issues](https://github.com/erikbabcan-commits/booking-pro-LE/issues)
- **Ask Questions**: [GitHub Discussions](https://github.com/erikbabcan-commits/booking-pro-LE/discussions)
- **Email**: team@bookinggg.dev

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Status**: ✅ Stable

Happy booking! 🎉
