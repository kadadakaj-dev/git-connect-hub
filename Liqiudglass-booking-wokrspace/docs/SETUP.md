# 🛠️ Setup Guide — Booking Pro LE

Complete step-by-step guide to get the project running locally.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running Servers](#running-servers)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Required

- **Node.js** 18.18+ (check: `node --version`)
- **pnpm** 9.15+ (install: `npm install -g pnpm@9`)
- **PostgreSQL** 14+ (or Docker)
- **Git** 2.37+

### Optional

- **Docker Desktop** (for PostgreSQL + Redis)
- **VS Code** with extensions (Copilot, Prettier, ESLint)

### Check Your System

```bash
node --version        # Should be 18.18 or higher
pnpm --version        # Should be 9.15 or higher
docker --version      # Optional
git --version         # Should be 2.37+

# Verify PostgreSQL
which psql            # or psql --version
```

---

## Installation

### Step 1: Clone Repository

```bash
# Option A: With HTTPS
git clone https://github.com/erikbabcan-commits/booking-pro-LE.git
cd booking-pro-LE

# Option B: With SSH (if SSH keys configured)
git clone git@github.com:erikbabcan-commits/booking-pro-LE.git
cd booking-pro-LE
```

### Step 2: Install Dependencies

```bash
# Install all workspace packages
pnpm install

# This runs: pnpm install for root + apps/api + apps/web + packages/*
# Takes ~2-3 minutes depending on internet speed
```

### Step 3: Verify Installation

```bash
# Check TypeScript compilation
pnpm typecheck

# Expected output: "Type-checking passed" (no errors)
```

---

## Database Setup

You have two options: **Docker (recommended)** or **existing PostgreSQL**.

### Option A: Docker (Recommended)

#### Install Docker

```bash
# macOS (via Homebrew)
brew install docker-desktop

# Windows
# Download from: https://www.docker.com/products/docker-desktop/

# Linux (Ubuntu)
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER
```

#### Start PostgreSQL

```bash
cd docker

# Start database
docker-compose up -d postgres redis

# Verify running
docker-compose ps
# Output should show: postgres (Up), redis (Up)

# Check database is accessible
docker-compose exec postgres psql -U postgres -c "SELECT 1"
```

#### Run Migrations & Seeds

```bash
cd ..  # Back to root
pnpm -C apps/api run prisma:generate
pnpm -C apps/api run prisma:migrate
pnpm -C apps/api run prisma:seed

# Expected: Created tables and demo data
```

### Option B: Existing PostgreSQL

#### Prerequisites

```bash
# Check PostgreSQL is running
psql --version

# Start PostgreSQL service (if not running)
# macOS:
brew services start postgresql

# Linux (Ubuntu):
sudo systemctl start postgresql

# Windows:
# Start "PostgreSQL" service in Services.msc
```

#### Create Database

```bash
# Connect as superuser
psql -U postgres

# Create database:
CREATE DATABASE bookinggg;

# Create user:
CREATE USER bookinggg_user WITH PASSWORD 'secure_password_here';

# Grant privileges:
ALTER ROLE bookinggg_user CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE bookinggg TO bookinggg_user;

# Exit psql:
\q
```

#### Update Environment

Edit `apps/api/.env`:

```dotenv
DATABASE_URL=postgresql://bookinggg_user:secure_password_here@localhost:5432/bookinggg
```

#### Run Migrations

```bash
pnpm -C apps/api run prisma:generate
pnpm -C apps/api run prisma:migrate
pnpm -C apps/api run prisma:seed
```

---

## Environment Configuration

### API Configuration (.env)

Create `apps/api/.env`:

```dotenv
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bookinggg

# API
NODE_ENV=development
APP_ENV=development
PORT=4000

# Security
API_KEY=dev-api-key
JWT_ACCESS_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000

# Optional: Observability
SENTRY_DSN=
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Web Configuration (.env.local)

Create `apps/web/.env.local`:

```dotenv
# API Connection
NEXT_PUBLIC_API_BASE=http://localhost:4000
NEXT_PUBLIC_API_KEY=dev-api-key

# Environment
NEXT_PUBLIC_APP_ENV=development

# Optional: Observability
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Verify Configuration

```bash
# Check files exist
ls -la apps/api/.env           # Should exist
ls -la apps/web/.env.local     # Should exist

# No output = not found!
```

---

## Running Servers

### Terminal Setup

You need **2-3 terminals**:

```plaintext
Terminal 1: PostgreSQL (Docker)
Terminal 2: NestJS API
Terminal 3: Next.js Web
```

### Terminal 1: Start Database

```bash
# In project root
cd docker
docker-compose up postgres redis

# Keep this running in background
# You'll see logs like:
# postgres_1  | ready to accept connections
# redis_1     | Ready to accept connections
```

### Terminal 2: Start API Server

```bash
# Open new terminal, in project root
pnpm -C apps/api start:dev

# Expected output:
# [Nest] 12:34:56  - 01/15/2025 LOG [NestFactory] Nest application successfully started +123ms
# Listening on port 4000

# Press Ctrl+C to stop
```

**API is now running:** <http://localhost:4000>

### Terminal 3: Start Web Dashboard

```bash
# Open another new terminal, in project root
pnpm -C apps/web dev

# Expected output:
#   ▲ Next.js 14.2.14
#   - Local:        http://localhost:3000
#   - Environments: .env.local

# Press Ctrl+C to stop
```

**Dashboard is now running:** <http://localhost:3000>

---

## Verification

### Check All Services

```bash
# API health
curl -s http://localhost:4000/health || echo "API not running"

# Web health (check it loads in browser)
open http://localhost:3000  # macOS
# or xdg-open http://localhost:3000  # Linux
# or start http://localhost:3000  # Windows
```

### Database Verification

```bash
# Connect to database
psql -U postgres -d bookinggg -c "\dt"

# Should show tables:
# - Tenant
# - Integration
# - UnifiedBooking
# - etc.
```

### Create Test Booking

```bash
# Via API
curl -X GET "http://localhost:4000/api/tenants/tenant_1/slots?from=2024-02-20T09:00Z&to=2024-02-20T18:00Z" \
  -H "x-api-key: dev-api-key"

# Expected: JSON with available slots
```

---

## Troubleshooting

### Issue: `pnpm install` fails with "No such file"

**Solution:**

```bash
# Clear cache
rm -rf node_modules .pnpm-store pnpm-lock.yaml

# Reinstall
pnpm install
```

### Issue: PostgreSQL won't start (Docker)

**Check logs:**

```bash
docker-compose logs postgres

# If "already in use", stop other containers:
docker-compose down
docker-compose up -d postgres
```

### Issue: Database migration fails

**Reset database (⚠️ destructive):**

```bash
# Stop API server first
pnpm -C apps/api run prisma:migrate reset

# Or manual reset:
dropdb bookinggg
createdb bookinggg
pnpm -C apps/api run prisma:migrate
```

### Issue: API returns 401 Unauthorized

**Verify API Key:**

```bash
# Check in .env matches request header
grep API_KEY apps/api/.env

# Send request with correct header:
curl -H "x-api-key: dev-api-key" http://localhost:4000/health
```

### Issue: Web shows "Cannot reach API"

**Check connection:**

```bash
# Verify API is running
ps aux | grep "node"  # or "nest"

# Check API URL in .env.local:
grep NEXT_PUBLIC_API_BASE apps/web/.env.local

# Should be: http://localhost:4000 (dev)
```

### Issue: Port already in use (3000 or 4000)

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Then restart servers
```

---

## 🎓 Next Steps

1. **Read Dashboard**: Open <http://localhost:3000>
2. **Explore API**: Check `/api/docs` (if Swagger enabled)
3. **Create Booking**: Use web UI to create a test booking
4. **Run Tests**: `pnpm test`
5. **Read User Manual**: See [USER-MANUAL.md](USER-MANUAL.md)

---

## 💡 Pro Tips

### Hot Reload Development

Both servers support hot reload:

- **API**: Changes to `apps/api/src/*` trigger rebuild
- **Web**: Changes to `apps/web/app/*` trigger refresh

Just save files and see changes instantly!

### Visual Studio Code

**Recommended Extensions:**

```json
{
  "extensions": [
    "ms-vscode.vscode-typescript-next",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "GitHub.copilot",
    "ms-python.python"
  ]
}
```

### Environment Variables Safety

⚠️ **Never commit `.env` files!**

- `apps/api/.env` — local secrets ❌ DON'T COMMIT
- `apps/web/.env.local` — local values ❌ DON'T COMMIT
- `.env.example` files — template ✅ COMMIT

### Database Backups

```bash
# Backup
pg_dump -U postgres bookinggg > backup.sql

# Restore
psql -U postgres bookinggg < backup.sql
```

---

## 📞 Still Stuck?

Check these:

1. **GitHub Issues**: <https://github.com/erikbabcan-commits/booking-pro-LE/issues>
2. **System Requirements**: Are Node, pnpm, PostgreSQL all correct versions?
3. **Environment Files**: Both `.env` files created with correct values?
4. **Database Running**: Is PostgreSQL/Docker actually running?
5. **Ports Available**: Are 3000 and 4000 free?

---

**Setup Complete!** 🎉

Your booking platform is ready. Check the [User Manual](USER-MANUAL.md) for how to use it.
