# FYZIO&FIT Booking Platform

A premium, high-performance booking platform designed for clinical and high-end physical therapy services. The system features the signature **"Baby Blue Glass"** design system, providing a modern, liquid, and professional user interface.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase CLI & Edge Runtime (for email system)
- SMTP Credentials (configured in Supabase Env)

### Installation
```bash
# Clone the repository and install dependencies
npm install

# Start development server
npm run dev

# Run Edge Function tests
supabase functions serve --no-verify-jwt
deno test supabase/functions/send-booking-email/templates_test.ts
```

### Environment Variables
Create a `.env` file in the root directory (refer to `.env.example`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_VAPID_PUBLIC_KEY=your_pwa_push_key
```

## 💎 Premium Communication ("Luxury Mode")

The platform utilizes a service-centric communication suite designed to provide immediate clarity and a premium experience:

- **Service-First Subject Lines**: Administrative and client emails lead with the actual service name (e.g., `Nová rezervácia: Chiropraxia ✅`).
- **Dynamic UX Emojis**: Instant recognition of email types (✅ Confirmation, 🔔 Reminder, ❌ Cancellation, 📅 Admin).
- **Anti-Defacing Architecture**: Robust localized fallbacks and strict type-safety (tested via Deno) ensure no `undefined` or generic labels reach the client.
- **Logo-free Design**: High-contrast typography, rounded aesthetics, and modern CSS gradients replace heavy assets for maximum performance.

## 📅 Business & Booking Rules

The platform enforces strict rules to ensure operational stability:

1.  **36h Advance Booking**: Customers cannot book appointments that begin within 36 hours of the current moment.
2.  **Clinic-Wide Exclusivity**: Each time slot has a global capacity of **1**. If any therapist is booked for a slot, that slot becomes unavailable for all other service requests.
3.  **Opening Hours**: Bookings are only allowed within defined operating windows, specialized rules handle holidays and weekends (Saturday off).
4.  **No Therapist Choice**: To ensure optimal internal scheduling, customers are assigned to "Personál – FYZIO&FIT".

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
- **Web (React/TypeScript)**: `npm test` (Powered by Vitest)
- **Email System (Deno)**: `supabase/functions/.../templates_test.ts`
- **End-to-End**: `npm run test:e2e` (Powered by Playwright)
- **Linting**: `npm run lint`

### 🛡️ Infrastructure Hardening
The system is protected by a series of specialized migrations:
- **Universal Cascade Delete**: Ensures clean data integrity when removing dependencies.
- **Security Hardening**: Strict RLS policies and server-side verification of business hours.
- **Edge Deployment**: Fast, globally distributed Edge Functions for background tasks.

### CI/CD
The project uses GitHub Actions for continuous integration, automatically verifying:
1.  Environment Sync & Linting Audit
2.  Production Build & PWA Integrity
3.  Cross-environment Vitest execution

---
© 2026 FYZIO&FIT. All rights reserved.
