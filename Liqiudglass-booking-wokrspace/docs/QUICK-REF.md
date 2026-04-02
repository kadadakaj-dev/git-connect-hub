# 🚀 Quick Reference — Booking Pro LE

Essential commands and tips for quick access.

---

## ⚡ Commands Quick Start

### Installation & Setup

```bash
# 1. Clone repo
git clone https://github.com/erikbabcan-commits/booking-pro-LE.git
cd booking-pro-LE

# 2. Install dependencies
pnpm install

# 3. Setup database
cd docker
docker-compose up -d postgres
cd ..

# 4. Migrate & seed
pnpm -C apps/api run prisma:migrate
pnpm -C apps/api run prisma:seed
```

### Development Servers

```bash
# Terminal 1: Database
cd docker && docker-compose up postgres redis

# Terminal 2: API (NestJS)
pnpm -C apps/api start:dev
# 👉 http://localhost:4000

# Terminal 3: Web (Next.js)
pnpm -C apps/web dev
# 👉 http://localhost:3000
```

### Build & Deploy

```bash
# Build everything
pnpm run build

# Build specific
pnpm -C apps/api run build
pnpm -C apps/web build

# Typecheck
pnpm typecheck

# Lint
pnpm lint

# Test
pnpm test
```

### Database

```bash
# Migrations
pnpm -C apps/api run prisma:migrate      # Apply new
pnpm -C apps/api run prisma:migrate reset # Reset (dev only)
pnpm -C apps/api run prisma:seed         # Add demo data

# Connect directly
psql -U postgres -d bookinggg
```

### Docker

```bash
# Start all services
cd docker && docker-compose up -d

# Stop all
docker-compose down

# View logs
docker-compose logs -f postgres

# Cleanup
docker-compose down -v  # Also remove volumes
```

---

## 🔗 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Dashboard | http://localhost:3000 | Web app |
| API | http://localhost:4000 | REST endpoints |
| Database | localhost:5432 | PostgreSQL |
| Redis | localhost:6379 | Cache (optional) |

---

## 📄 Documentation Map

| File | Purpose |
|------|---------|
| [README.md](../README.md) | Overview & architecture |
| [docs/SETUP.md](SETUP.md) | Installation guide |
| [docs/API.md](API.md) | REST API reference |
| [docs/USER-MANUAL.md](USER-MANUAL.md) | Dashboard guide |
| [docs/QUICK-REF.md](QUICK-REF.md) | This file |

---

## 🛠️ Common Tasks

### Add New Endpoint

1. **Controller** (`apps/api/src/your-feature.controller.ts`):
```typescript
@Get("/path")
getYourFeature(@Param("id") id: string) {
  return this.service.get(id);
}
```

2. **Service** (`apps/api/src/your-feature.service.ts`):
```typescript
@Injectable()
export class YourFeatureService {
  get(id: string) { ... }
}
```

3. **Module** (`apps/api/src/app.module.ts`):
```typescript
providers: [YourFeatureService],
controllers: [YourFeatureController],
```

### Modify Database Schema

1. Edit `apps/api/prisma/schema.prisma`
2. Create migration:
```bash
pnpm -C apps/api run prisma:migrate
# Name your migration (e.g., "add_new_field")
```
3. Apply:
```bash
pnpm -C apps/api run prisma:migrate dev
```

### Add New Provider

1. Create `packages/integrations/src/providers/new-provider.ts`
2. Implement `BookingProvider` interface
3. Register in `packages/integrations/src/registry.ts`
4. Test in `packages/integrations/test/`

### Update Dependencies

```bash
# Check for updates
pnpm outdated

# Update all
pnpm update --latest

# Update one package
pnpm update react@latest
```

### Fix Common Issues

```bash
# Clear all node_modules
rm -rf node_modules && pnpm install

# Hard reset git
git reset --hard HEAD

# Kill process on port
lsof -ti:3000 | xargs kill -9

# Fix permissions
chmod +x docker/docker-compose.yml
```

---

## 🔐 Environment Variables

### Required (must set)
```dotenv
DATABASE_URL=postgresql://user:pass@localhost/bookinggg
JWT_ACCESS_SECRET=your-secret-here
API_KEY=dev-api-key
```

### Optional (sensible defaults)
```dotenv
PORT=4000                          # API port
NODE_ENV=development               # or production
CORS_ORIGINS=http://localhost:3000 # comma-separated
```

---

## 📊 Project Structure Reference

```
├── apps/
│   ├── api/         → NestJS backend
│   └── web/         → Next.js frontend
├── packages/
│   ├── core/        → Shared types
│   ├── integrations → Providers
│   └── widget/      → Embeddable
├── docs/            → Documentation
├── docker/          → Containers
└── supabase/        → Optional DB schemas
```

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Watch mode (rerun on changes)
pnpm test --watch

# Coverage
pnpm test --coverage

# E2E tests
pnpm -C apps/web test:e2e

# Specific test file
pnpm test -- booking.test.ts
```

---

## 📈 Git Workflow

```bash
# Create branch
git checkout -b feature/my-feature

# Make changes
git add .
git commit -m "feat: add my feature"

# Push
git push origin feature/my-feature

# Create PR on GitHub
# Review → Merge → Delete branch
git checkout main && git pull
```

---

## 🚨 SOS - Emergency Commands

```bash
# I broke the database
docker-compose down -v  # Delete everything
docker-compose up -d postgres
pnpm -C apps/api run prisma:migrate
pnpm -C apps/api run prisma:seed

# I broke node_modules
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Port is locked
lsof -ti:3000 | xargs kill -9
lsof -ti:4000 | xargs kill -9

# Git is messed up
git reset --hard HEAD
git clean -fd

# API won't start
ps aux | grep node  # Check if running
pkill -f "node\|nest"  # Kill all
pnpm -C apps/api start:dev  # Restart

# Web won't load
rm -rf apps/web/.next
pnpm -C apps/web build
pnpm -C apps/web dev
```

---

## 💡 Pro Tips

### Enable Swagger API Docs

In `apps/api/main.ts`:
```typescript
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

Then visit: http://localhost:4000/api/docs

### Use PostMan for API

1. Import endpoints from http://localhost:4000/api/docs
2. Set environment variable: `api_key=dev-api-key`
3. Use `{{api_key}}` in headers

### Debug with VS Code

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach Debugger",
  "port": 9229
}
```

Run API with: `NODE_OPTIONS="--inspect" npm run start:dev`

### Performance Monitoring

```bash
# Check startup time
time pnpm -C apps/api start:dev

# Memory usage
ps aux | grep node

# Database query times
# Enable Prisma debug:
export DEBUG=prisma:*
```

---

## 📞 Quick Help

| Need | Command |
|------|---------|
| Docs | `open README.md` |
| API Info | `curl http://localhost:4000/health` |
| Database status | `docker-compose ps` |
| Clear cache | `rm -rf .next node_modules` |
| Version check | `node -v && pnpm -v` |

---

## 🎯 Roadmap Commands

```bash
# Find all TODOs
grep -r "TODO\|FIXME" apps/

# Count lines of code
find apps -name "*.ts" -o -name "*.tsx" | xargs wc -l

# Check dependencies
pnpm list --depth=0

# Find large files
find . -type f -size +1M -not -path "./node_modules/*"
```

---

**Bookmark this for quick access!** ⭐

Last Updated: February 2026 | Version 1.0.0
