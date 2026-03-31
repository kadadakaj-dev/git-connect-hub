# Copilot Instructions for FYZIO&FIT Booking App

## Project Overview

This is a **FYZIO&FIT** appointment booking web application for a physiotherapy and chiropractic clinic. It is a bilingual (Slovak/English) Progressive Web App (PWA) that allows clients to book, manage, and cancel appointments online. It also includes an admin dashboard for managing bookings, services, time slots, and blocked dates.

The project was scaffolded with [Lovable](https://lovable.dev) and uses **Vite + React + TypeScript + shadcn-ui + Tailwind CSS** on the frontend, backed by **Supabase** (PostgreSQL, Auth, Edge Functions, Storage).

---

## Tech Stack

- **Runtime**: Node.js (use `npm` or `bun`)
- **Frontend**: React 18, TypeScript 5, Vite 5
- **UI**: shadcn-ui (Radix UI primitives), Tailwind CSS 3, Framer Motion
- **State / Data Fetching**: TanStack React Query v5
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router DOM v6
- **i18n**: Custom `LanguageContext` (`src/i18n/LanguageContext.tsx`, `src/i18n/translations.ts`)
- **Backend**: Supabase (project ID `bqoeopfgivbvyhonkree`)
  - PostgreSQL database with typed client (`src/integrations/supabase/types.ts`)
  - Auth (magic link + OAuth)
  - Edge Functions (Deno runtime, in `supabase/functions/`)
  - Push notifications
- **PWA**: `vite-plugin-pwa`, service worker at `src/sw.ts`
- **Testing**: Vitest + Testing Library (jsdom environment)
- **Linting**: ESLint 9 with typescript-eslint and react-hooks plugin

---

## Commands

Always run from the repository root. Install dependencies before any other command.

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Production build (output in dist/)
npm run build

# Development build
npm run build:dev

# Lint all TypeScript/TSX files
npm run lint

# Run tests (Vitest)
npx vitest run

# Run tests in watch mode
npx vitest

# Preview production build
npm run preview
```

> There is no separate `test` script in `package.json`; use `npx vitest run` to run tests non-interactively.

---

## Project Layout

```
/
├── .github/
│   └── copilot-instructions.md   # This file
├── public/                        # Static assets, PWA icons
├── src/
│   ├── components/
│   │   ├── booking/               # Multi-step booking wizard components
│   │   ├── admin/                 # Admin dashboard components
│   │   ├── client/                # Client portal components
│   │   ├── seo/                   # SEO meta and JSON-LD components
│   │   ├── ui/                    # shadcn-ui generated primitives
│   │   └── *.tsx                  # Shared layout components (Footer, NavLink, etc.)
│   ├── hooks/                     # Custom React hooks (data fetching, utilities)
│   ├── i18n/
│   │   ├── LanguageContext.tsx    # Language provider (sk/en)
│   │   └── translations.ts        # All UI string translations
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Supabase client initialization
│   │       └── types.ts           # Auto-generated DB types (do not edit manually)
│   ├── pages/                     # Route-level page components
│   ├── test/                      # Vitest setup and mocks
│   │   ├── setup.ts
│   │   └── __mocks__/
│   ├── types/                     # Shared TypeScript type definitions
│   ├── App.tsx                    # Root app with router and providers
│   ├── main.tsx                   # Entry point
│   └── sw.ts                      # Service worker (PWA)
├── supabase/
│   ├── config.toml                # Supabase project config
│   ├── functions/                 # Edge Functions (Deno, TypeScript)
│   │   ├── _shared/               # Shared helpers across functions
│   │   ├── create-booking/
│   │   ├── cancel-booking/
│   │   ├── send-booking-email/
│   │   ├── send-booking-reminder/
│   │   ├── send-push-notification/
│   │   ├── get-booking-by-token/
│   │   ├── delete-account/
│   │   ├── process-email-queue/
│   │   └── auth-email-hook/
│   └── migrations/                # SQL migration files
├── components.json                # shadcn-ui configuration
├── eslint.config.js               # ESLint flat config
├── tailwind.config.ts             # Tailwind theme (custom colors, fonts, animations)
├── tsconfig.json                  # Root TS config
├── tsconfig.app.json              # App TS config
├── tsconfig.node.json             # Node/Vite TS config
├── vite.config.ts                 # Vite config (with PWA plugin)
└── vitest.config.ts               # Vitest config
```

---

## Key Conventions

### Path aliases
Use the `@/` alias for all imports from `src/`. Example: `import { Button } from '@/components/ui/button'`.

### UI components
New UI primitives should be added via the shadcn-ui CLI (`npx shadcn-ui@latest add <component>`) and placed in `src/components/ui/`. Do not manually recreate Radix UI components.

### Internationalisation
All user-facing strings must support both Slovak and English. Add translations to `src/i18n/translations.ts` and use the `useLanguage()` hook to access them.

### Supabase types
The file `src/integrations/supabase/types.ts` is auto-generated from the Supabase schema. Do not edit it manually; regenerate with `npx supabase gen types typescript --project-id bqoeopfgivbvyhonkree > src/integrations/supabase/types.ts`.

### Tests
- Test files live alongside source files in `__tests__/` subdirectories or as `*.test.ts(x)` files under `src/`.
- The Vitest setup file is `src/test/setup.ts`.
- A PWA register mock is provided at `src/test/__mocks__/pwa-register-react.ts` and aliased via `vitest.config.ts`.

### Linting
The ESLint config (`eslint.config.js`) uses the flat config format. `@typescript-eslint/no-unused-vars` is disabled. Run `npm run lint` to check for issues before committing.

### Environment variables
Supabase credentials are read from environment variables. For local development, copy `.env` and populate `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never commit secrets.
