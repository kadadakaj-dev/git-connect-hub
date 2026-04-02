# Copilot Instructions — Liqiudglass Booking System

## Architecture Overview

**pnpm monorepo** with three workspaces:
- `api/` — NestJS 10 backend, deployed as Vercel serverless function
- `web/` — Next.js 14 (App Router), deployed to Vercel, live at `booking.papihairdesign.sk`
- `packages/` — Shared TypeScript packages (`@bookinggg/core`, `@bookinggg/types`, `@bookinggg/integrations`)

**Dual database strategy:** Supabase (public Postgres via `@supabase/supabase-js` in web) + Prisma ORM (server-side in API). Both point to the same Supabase Postgres instance — Prisma handles auth, tenants and unified bookings; Supabase client handles real-time subscriptions and direct public table access.

## Key Data Flow: Booking Creation

```
Web booking form → POST /api/tenants/tenant_1/bookings (x-api-key required)
  → BookingsController → BookingAdapterService
  → if providerKey="supabase": AvailabilityService validates slot → Prisma Booking table
  → if external provider: BookingProvider.createBooking() → mirror to UnifiedBooking table
```

Idempotency key (`idempotency-key` header) prevents duplicate bookings on retry. Unique constraint: `@@unique([tenantId, idempotencyKey])` on `UnifiedBooking`.

## Dev Commands

```bash
# Root
pnpm install                         # install all workspaces

# API (run from api/)
pnpm start:dev                       # NestJS watch mode on :4000
pnpm build                           # prisma generate && tsc
pnpm prisma:migrate                  # run DB migrations
pnpm prisma:seed                     # seed data

# Web (run from web/)
pnpm dev                             # Next.js on :3000
pnpm test                            # Vitest
pnpm test:e2e                        # Playwright
```

Build order matters: build `packages/*` before `api/` or `web/` — shared types must be compiled first.

## Security Conventions

Every API call from web **must** include `x-api-key` header (value: `NEXT_PUBLIC_API_KEY`). The `ApiKeyGuard` is global — no exceptions.

CSRF applies only to `/auth/*` state-changing routes:
1. GET `/auth/csrf` → get token + `__csrf` cookie
2. POST/PUT/PATCH/DELETE → include `x-csrf-token` header matching cookie

Auth cookies (`access_token` 15 min, `refresh_token` 14 days) are set httpOnly by the API. Web middleware (`web/middleware.ts`) checks for Supabase `auth-token` cookie to gate `/admin/*` — the API does the real JWT verification.

## Environment Variables

**API** (`api/.env`):
```
DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE
API_KEY, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
CORS_ORIGINS=https://booking.papihairdesign.sk
```

**Web** (`web/.env.local`):
```
NEXT_PUBLIC_API_BASE=https://papi-hair-booking-api.vercel.app
NEXT_PUBLIC_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Production API: `papi-hair-booking-api.vercel.app`. Production web: `booking.papihairdesign.sk`.

## Prisma Schema Key Models

- `Service` — salon services (id: `BigInt`, `@@map("services")`)
- `Booking` — internal bookings (UUID from `gen_random_uuid()`, `@@map("bookings")`)
- `BusinessSettings` — opening hours stored as `openingHoursJson: Json` keyed by lowercase weekday (`"monday"`, etc.)
- `UnifiedBooking` — mirror of external provider bookings; always includes `tenantId`, `integrationId`, `externalReservationId`
- `Integration` — per-tenant provider config; `secretsEnc` stores encrypted secrets; `providerKey` values: `"mock"`, `"wordpress"`, `"supabase"`

`BigInt` fields (`Service.id`) require `Number(id)` conversion when serialized to JSON. Use `BigInt(serviceId)` in Prisma where clauses.

## Multi-tenant Pattern

All booking API routes are scoped: `/api/tenants/:tenantId/*`. The current single-tenant deployment uses `tenantId = "tenant_1"`. `PrismaTenantConfigStore` resolves which `Integration` is active for a tenant. `ProviderFactory` returns the correct `BookingProvider` implementation from `@bookinggg/integrations`.

## Adding a New Provider

1. Implement `BookingProvider` interface in `packages/integrations/src/<name>.ts`
2. Register in `packages/integrations/src/registry.ts`
3. Add `providerKey` to `Integration` row in DB
4. No API controller changes needed — `BookingAdapterService` dispatches via `ProviderFactory`

## Shared Types

Import from workspace packages, not relative paths:
```typescript
import type { BookingDTO, CreateBookingInput } from "@bookinggg/core";
import type { User, Role } from "@bookinggg/types";
```

## Vercel Deployment Notes

- API `vercel.json`: `buildCommand: "pnpm run build"`, all routes rewritten to `/api` (serverless entry at `api/index.ts`)
- GitHub → Vercel auto-deploy is unreliable for the API project — may require manual **Redeploy** (uncheck "Use existing Build Cache") from Vercel Dashboard
- Web deploys reliably on push to `main`
