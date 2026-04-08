# FYZIO&FIT Booking Platform

A premium, high-performance booking platform designed for clinical and high-end physical therapy services. The system features the signature **"Baby Blue Glass"** design system, providing a modern, liquid, and professional user interface.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account with the database schema applied

### Installation
```bash
# Clone the repository and install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables
Create a `.env` file in the root directory (refer to `.env.example`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_VAPID_PUBLIC_KEY=your_pwa_push_key
```

## 📅 Business & Booking Rules

The platform enforces strict rules to ensure operational stability:

1.  **36h Advance Booking**: Customers cannot book appointments that begin within 36 hours of the current moment.
2.  **Clinic-Wide Exclusivity**: Each time slot has a global capacity of **1**. If any therapist is booked for a slot, that slot becomes unavailable for all other service requests.
3.  **Opening Hours**: Bookings are only allowed within the hours defined in `time_slots_config`.
4.  **No Therapist Choice**: To ensure optimal internal scheduling, customers are assigned to "Personál – FYZIO&FIT" rather than selecting individual therapists.

## 🗺️ Route Matrix

| Path | Purpose | Access Control |
| :--- | :--- | :--- |
| `/` | Booking Wizard | Public |
| `/portal` | Client Dashboard | Authenticated |
| `/admin` | Main Dashboard | Admin Only |
| `/auth` | Login/Signup | Public |
| `/cancel` | Cancel Appointment | Public (Secure Token) |
| `/legal` | GDPR & Terms | Public |

## 🧪 Engineering & Verification

### Test Suite
- **Unit/Integration**: `npm test` (Powered by Vitest)
- **End-to-End**: `npm run test:e2e` (Powered by Playwright)
- **Linting**: `npm run lint`

### ⚠️ Known Issues / Skipped Tests
The following tests are currently skipped but do NOT block production release:
- **`src/__tests__/auth/Auth.test.tsx`**: "should initiate password recovery flow".
  - **Reason**: Brittle JSDOM/Vi-mock environment consistency issue when tracking UI redirects during mock resolution.
  - **Status**: Non-blocking. The password recovery logic has been manually verified in the live environment.
  - **Action**: Fix scheduled for P2 stabilization phase once JSDOM mocks are updated.

### CI/CD
The project uses GitHub Actions (`.github/workflows/ci.yml`) for continuous integration, automatically verifying every push to `main` via:
1.  Environment Sync
2.  Linting Audit
3.  Production Build
4.  Vitest & Playwright execution

## 🔐 Administrative Access
Admin users must have the `admin` role in the `user_roles` database table. Identity is strictly verified at both the UI level (`AdminProtectedRoute.tsx`) and the Database level (RLS).

## 📦 Production Release Checklist
- [ ] Environment variables configured in Vercel/Production
- [ ] Database migrations successfully applied
- [ ] PWA Manifest and Service Worker verified (`npm run build`)
- [ ] 36h lead time rule verified in production timezone (Bratislava)
- [ ] Admin user identity verified in the production database

---
© 2026 FYZIO&FIT. All rights reserved.
