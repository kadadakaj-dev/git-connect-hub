# Production Configuration Bible

> **Archived on:** 2026-02-18
> **Purpose:** Immutable reference of the production configuration as it was before local development setup. Use this to restore settings if needed.

---

## 1. API Configuration

**File:** `apps/api/.env`

```dotenv
# Database
DATABASE_URL="postgresql://postgres.dssdiqojkktzfuwoulbq:23513900zZz%23%23%23@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
SUPABASE_DB_PASSWORD="23513900zZz###"

# Supabase
SUPABASE_URL="https://dssdiqojkktzfuwoulbq.supabase.co"
SUPABASE_ANON_KEY="sb_publishable_lyLFSvmcKZCHPMAWVhYBlw_fMRZOp62"
SUPABASE_SERVICE_ROLE_KEY=""
PROJECT_REF="dssdiqojkktzfuwoulbq"

# API
NODE_ENV=development
APP_ENV=development
PORT=4000

# Security
API_KEY=papihair-secret-key-2025
JWT_ACCESS_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,https://booking.papihairdesign.sk

# Optional: Observability
SENTRY_DSN=
SENTRY_TRACES_SAMPLE_RATE=0.1
```

---

## 2. Web Configuration

**File:** `apps/web/.env.local`

```dotenv
# API Connection
NEXT_PUBLIC_API_BASE=https://api.papihairdesign.sk
NEXT_PUBLIC_API_KEY=papihair-secret-key-2025

# Environment
NEXT_PUBLIC_APP_ENV=development

# Optional: Observability
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://dssdiqojkktzfuwoulbq.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_lyLFSvmcKZCHPMAWVhYBlw_fMRZOp62"
PROJECT_REF="dssdiqojkktzfuwoulbq"
```
