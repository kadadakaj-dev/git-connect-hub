# 🎫 Booking Pro LE — Universal Booking Platform

> Modern, multi-tenant booking system with PWA dashboard, headless API, and embeddable widget.

**Production-ready** reference implementation featuring:

- ✅ **Headless REST API** (NestJS + multi-tenant)
- ✅ **Progressive Web App** (Next.js, offline-capable, installable)
- ✅ **Admin Dashboard** (real-time booking management)
- ✅ **Embeddable Widget** (drop-in booking for any website)
- ✅ **Multi-provider integration** (WordPress, mock, extensible)

---

## 📋 Quick Start

### Prerequisites

- **Node.js** 18+ + **pnpm** 9.15+
- **PostgreSQL** 14+ (or Docker)
- **Git**

### 1️⃣ Clone & Install

```bash
git clone https://github.com/erikbabcan-commits/booking-pro-LE.git
cd booking-pro-LE

# Install dependencies (pnpm workspace)
pnpm install

# Generate Prisma client
pnpm -C apps/api run prisma:generate
```

### 2️⃣ Setup Database

Update `apps/api/.env`:

```dotenv
DATABASE_URL=postgresql://user:password@localhost:5432/bookinggg
```

Then run migrations:

```bash
pnpm -C apps/api run prisma:migrate
pnpm -C apps/api run prisma:seed
```

### 3️⃣ Configure Environment

**API** (`apps/api/.env`):

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bookinggg
API_KEY=dev-api-key
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
JWT_ACCESS_SECRET=your-secret-change-in-production
NODE_ENV=development
```

**Web** (`apps/web/.env.local`):

```dotenv
NEXT_PUBLIC_API_BASE=http://localhost:4000
NEXT_PUBLIC_API_KEY=dev-api-key
NEXT_PUBLIC_APP_ENV=development
```

### 4️⃣ Run Development Servers

#### Terminal 1 — REST API

```bash
pnpm -C apps/api start:dev
# Listens on http://localhost:4000
# Swagger docs: http://localhost:4000/api/docs (if enabled)
```

#### Terminal 2 — Web Dashboard

```bash
pnpm -C apps/web dev
# Listens on http://localhost:3000
# Your dashboard: http://localhost:3000
```

✅ Ready! Visit **<http://localhost:3000>**

---

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    BOOKING PRO LE                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Frontend Layer         Backend Layer       Storage      │
│  ───────────────        ─────────────        ───────    │
│                                                          │
│  [Web Dashboard]        [NestJS API]        [PostgreSQL]│
│  - Next.js PWA          - Multi-tenant      - Unified   │
│  - Offline capable      - Provider adapter  - Bookings  │
│  - Install prompt       - Idempotency       - Integ.    │
│  - Real-time updates    - Auth & CORS       - Config    │
│  │                       │                   │           │
│  └──────────────┬────────┴─────────────────┘           │
│                 │                                        │
│           [Embeddable Widget]                            │
│           - Web Component                                │
│           - Drop-in booking                              │
│           - Universal JS/UMD                             │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                  Provider Layer (Adapters)              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  [WordPress]  [Bookio]  [Google Cal]  [Mock]  [Custom]  │
│   Provider     Provider   Provider     Test   REST API   │
│                                                           │
└─────────────────────────────────────────────────────────┘

```

### Core Components

#### **Backend (apps/api/)**

- **NestJS** framework with dependency injection
- **Prisma ORM** for multi-tenant data access
- **JWT authentication** with optional 2FA
- **API Key guards** for service-to-service
- **Global error handling** with unified response format

#### **Frontend (apps/web/)**

- **Next.js 14** with App Router
- **Tailwind CSS** + Radix UI components
- **Zustand** state management
- **Supabase** realtime client (optional)
- **Service Worker** for offline mode
- **Install prompt** for PWA standalone

#### **Packages (packages/)**

- **@bookinggg/core** — Shared TypeScript types & DTOs
- **@bookinggg/integrations** — Provider registry & implementations
- **@bookinggg/widget** — Embeddable Web Component

---

## 📡 API Endpoints

### Booking Management

#### Get Available Slots

```http
GET /api/tenants/:tenantId/slots?from=2024-02-20T09:00Z&to=2024-02-20T18:00Z&serviceId=haircut
```

**Response:**

```json
{
  "slots": [
    {
      "startAt": "2024-02-20T09:00:00Z",
      "endAt": "2024-02-20T09:45:00Z",
      "available": true
    },
    {
      "startAt": "2024-02-20T09:45:00Z",
      "endAt": "2024-02-20T10:30:00Z",
      "available": true
    }
  ]
}
```

#### Create Booking

```http
POST /api/tenants/:tenantId/bookings
Idempotency-Key: unique-request-id-uuid
X-API-Key: dev-api-key
Content-Type: application/json

{
  "serviceId": "haircut",
  "startAt": "2024-02-20T09:00:00Z",
  "endAt": "2024-02-20T09:45:00Z",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1-555-0100",
  "notes": "First time customer"
}
```

**Response:**

```json
{
  "id": "booking_xyz123",
  "tenantId": "tenant_1",
  "status": "CONFIRMED",
  "startAt": "2024-02-20T09:00:00Z",
  "endAt": "2024-02-20T09:45:00Z",
  "customerName": "John Doe",
  "customerEmail": "john@example.com"
}
```

#### List Bookings

```http
GET /api/tenants/:tenantId/bookings?from=2024-02-20T00:00Z&to=2024-02-21T00:00Z
```

**Response:**

```json
{
  "bookings": [
    { "id": "booking_xyz", "status": "CONFIRMED", "startAt": "...", ... },
    { "id": "booking_abc", "status": "CONFIRMED", "startAt": "...", ... }
  ]
}
```

#### Cancel Booking

```http
POST /api/tenants/:tenantId/bookings/:bookingId/cancel
X-API-Key: dev-api-key
```

**Response:**

```json
{
  "id": "booking_xyz",
  "status": "CANCELLED",
  "cancelledAt": "2024-02-20T10:30:00Z"
}
```

### Authentication

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "rememberMe": true
}
```

#### Login with OAuth

```http
POST /api/auth/oauth/callback
Content-Type: application/json

{
  "provider": "github",
  "code": "github_auth_code"
}
```

#### 2FA Verification

```http
POST /api/auth/verify-2fa
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

---

## 🎨 Dashboard Features

### Main Dashboard (`/`)

- 📊 **Real-time stats** (bookings today, revenue, occupancy)
- 📅 **Live calendar view** with drag & drop (optional)
- 📱 **Responsive design** (mobile-first PWA)
- 🔔 **Offline alerts** when connection lost
- ⬇️ **Install prompt** for standalone app

### Bookings View

- List all bookings (today, week, month)
- Filter by status (CONFIRMED, PENDING, CANCELLED)
- Search by customer name/email
- Quick actions: cancel, reschedule (future)

### Settings (Admin)

- Tenant configuration
- Integration management (enable/disabled providers)
- User roles & permissions (roadmap)

---

## 🧩 Integrations

### Adding a New Provider

Create a new file in `packages/integrations/src/providers/my-provider.ts`:

```typescript
import { BookingProvider, BookingDTO, CreateBookingInput, ProviderContext } from "@bookinggg/core";

export class MyProvider implements BookingProvider {
  async ping(context: ProviderContext): Promise<{ status: "ok" | "error" }> {
    // Health check
    return { status: "ok" };
  }

  async listAvailability(context: ProviderContext, filter: any) {
    // Return available time slots
    return { slots: [...] };
  }

  async createBooking(context: ProviderContext, input: CreateBookingInput): Promise<BookingDTO> {
    // Create booking in your system
    return { id: "ext_123", ...input, status: "CONFIRMED" };
  }

  async cancelBooking(context: ProviderContext, externalId: string): Promise<void> {
    // Cancel in your system
  }

  async listBookings(context: ProviderContext, filter: any) {
    // Return list of bookings
    return { bookings: [...] };
  }
}
```

Register in `packages/integrations/src/registry.ts`:

```typescript
registry.register("my-provider", () => new MyProvider(httpClient));
```

---

## 🔐 Security

### Authentication Flow

```text
User Login
    ↓
[NestJS Auth Service]
    ↓
JWT Token → HttpOnly Cookie
    ↓
Subsequent Requests: Cookie Auto-Attached
    ↓
[Auth Guard] Validates Token
```

### API Key Authentication

Service-to-service calls use `X-API-Key` header:

```typescript
// In main.ts, ApiKeyGuard is registered globally
app.useGlobalGuards(new ApiKeyGuard());
```

### CORS Configuration

Defined in `.env`:

```dotenv
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Data Protection

- Secrets encrypted in database (`secretsEnc` field)
- Sensitive fields (passwords, OTP secrets) never logged
- Idempotency keys prevent duplicate bookings
- Input validation with class-transformer

---

## 📦 Project Structure

```text
booking-pro-LE/
│
├── apps/
│   ├── api/                    # NestJS REST API
│   │   ├── src/
│   │   │   ├── main.ts        # Bootstrap
│   │   │   ├── app.module.ts  # Root module
│   │   │   ├── bookings.controller.ts
│   │   │   ├── booking-adapter.service.ts
│   │   │   ├── auth/
│   │   │   ├── prisma.service.ts
│   │   │   └── provider.factory.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma  # DB schema
│   │   │   └── seed.ts        # Demo data
│   │   └── .env               # Configuration
│   │
│   └── web/                    # Next.js PWA
│       ├── app/
│       │   ├── page.tsx        # Landing/booking page
│       │   ├── admin/
│       │   │   └── page.tsx    # Dashboard
│       │   └── layout.tsx
│       ├── components/
│       │   ├── dashboard/      # Stats, charts
│       │   └── pwa/            # Install prompt, offline alert
│       ├── public/
│       │   └── manifest.json   # PWA manifest
│       └── .env.local
│
├── packages/
│   ├── core/                   # Shared types & DTOs
│   │   └── src/index.ts
│   ├── integrations/           # Provider implementations
│   │   ├── src/
│   │   │   ├── providers/
│   │   │   │   ├── mock.ts
│   │   │   │   └── wordpress.ts
│   │   │   └── registry.ts
│   │   └── test/
│   │
│   └── widget/                 # Embeddable booking widget
│       ├── src/widget.ts
│       └── build.mjs
│
├── supabase/                   # Optional: Supabase schema
│   ├── schema.sql
│   └── rls_audit.sql
│
├── docker/                     # Dev containers
│   └── docker-compose.yml
│
├── pnpm-workspace.yaml         # Workspace config
└── tsconfig.base.json          # Base TypeScript config
```

---

## 🚀 Deployment

### Vercel (Production)

Projekt je nasadeny na **Vercel** ako monorepo s dvoma aplikaciami:

| Aplikacia | Vercel projekt | Custom domena | Vercel URL (fallback) |
|-----------|---------------|---------------|----------------------|
| **Web (Next.js)** | `papi-hair-booking-web` | `booking.papihairdesign.sk` | `papi-hair-booking-web.vercel.app` |
| **API (NestJS)** | `papi-hair-booking-api` | `api.papihairdesign.sk` | `papi-hair-booking-api.vercel.app` |

**Team:** `h4ck3d` (`team_TDBfz8ZkzAmnjqyiWEGVIeO1`)

#### Custom domeny

| Subdomena | Vercel projekt | DNS zaznam |
|-----------|---------------|------------|
| `booking.papihairdesign.sk` | papi-hair-booking-web | `CNAME booking → cname.vercel-dns.com` |
| `api.papihairdesign.sk` | papi-hair-booking-api | `CNAME api → cname.vercel-dns.com` |

Ak Vercel vyzaduje overenie vlastnictva domeny, pridaj TXT zaznam:
```
TXT _vercel → vc-domain-verify=<hodnota-z-vercel-dashboardu>
```

### Environment Variables (POVINNE na Vercel Dashboard)

**API projekt** (`papi-hair-booking-api`):

| Premenna | Hodnota | Povinna |
|----------|---------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | **ANO** |
| `API_KEY` | silny API kluc | **ANO** |
| `JWT_ACCESS_SECRET` | silny random string (min 32 znakov) | **ANO** |
| `JWT_REFRESH_SECRET` | silny random string (min 32 znakov) | **ANO** |
| `CORS_ORIGINS` | `https://booking.papihairdesign.sk,https://papi-hair-booking-web.vercel.app` | **ANO** |
| `SUPABASE_URL` | `https://dssdiqojkktzfuwoulbq.supabase.co` | Odporucane |
| `SUPABASE_ANON_KEY` | Supabase anon key | Odporucane |
| `NODE_ENV` | `production` | Odporucane |

**Web projekt** (`papi-hair-booking-web`):

| Premenna | Hodnota | Povinna |
|----------|---------|---------|
| `NEXT_PUBLIC_API_BASE` | `https://api.papihairdesign.sk` | **ANO** |
| `NEXT_PUBLIC_API_KEY` | rovnaky ako API_KEY | **ANO** |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dssdiqojkktzfuwoulbq.supabase.co` | **ANO** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | **ANO** |
| `NEXT_PUBLIC_APP_ENV` | `production` | Odporucane |

### Build for Production

```bash
# Build all packages
pnpm run build

# API
pnpm -C api run build
# Creates: api/dist/

# Web
pnpm -C web build
# Creates: web/.next/
```

---

## 🧪 Testing

### Run All Tests

```bash
pnpm test

# Or specific workspace:
pnpm -C apps/api test
pnpm -C apps/web test
```

### Coverage Report

```bash
pnpm -C apps/web test:coverage
```

### E2E Tests (Playwright)

```bash
pnpm -C apps/web test:e2e
```

---

## 🔧 Troubleshooting

### Issue: `pnpm install` fails

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: Prisma migrations fail

```bash
# Reset database (dev only!)
pnpm -C apps/api run prisma:migrate reset

# Or drop schema manually
psql -d bookinggg -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
pnpm -C apps/api run prisma:migrate
```

### Issue: API returns 401 Unauthorized

- Check `X-API-Key` header matches `API_KEY` in `.env`
- Verify request format (Content-Type, body)

### Issue: Web app shows white screen

```bash
# Check browser console (F12)
# Clear localStorage:
localStorage.clear()
location.reload()

# Check API is running:
curl http://localhost:4000/api/tenants/tenant_1/slots
```

### Issue: TypeScript errors after git pull

```bash
pnpm install
pnpm run typecheck
```

---

## 📚 Documentation

- **[Setup Guide](docs/SETUP.md)** — Detailed installation & configuration
- **[API Reference](docs/API.md)** — Complete endpoint documentation
- **[User Manual](docs/USER-MANUAL.md)** — Dashboard usage guide
- **[Contributing](CONTRIBUTING.md)** — Development guidelines

---

## 📞 Support

- **GitHub Issues**: [Report bugs](https://github.com/erikbabcan-commits/booking-pro-LE/issues)
- **Discussions**: [Ask questions](https://github.com/erikbabcan-commits/booking-pro-LE/discussions)
- **Email**: <team@bookinggg.dev>

---

## 📜 License

MIT License — See [LICENSE](LICENSE) for details

---

## 🎉 What's Next?

- [ ] Admin panel with drag & drop calendar
- [ ] SMS/Email notifications
- [ ] Payment integration (Stripe, PayPal)
- [ ] Custom branding for white-label
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Multi-location support
- [ ] Staff scheduling

---

**Last Updated:** February 2026  
**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Repository:** [erikbabcan-commits/booking-pro-LE](https://github.com/erikbabcan-commits/booking-pro-LE)
