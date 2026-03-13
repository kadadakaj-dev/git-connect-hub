---
description: Development Guide for Booking Buddy
---

# Booking Buddy Development Workflow

Follow these steps when developing new features for the FYZIO&FIT booking system.

## 1. Project Context
- **Framework**: Vite + React
- **Translation**: Every user-facing text must be in both Slovak (`sk`) and English (`en`).
- **Styling**: Use glassmorphism tokens. Check `src/index.css` for `--glass-*` variables.

## 2. Common Tasks

### Adding a New Admin Sub-page
1. Create a new component in `src/components/admin/`.
2. Add a new `TabsTrigger` and `TabsContent` in `src/pages/AdminDashboard.tsx`.
3. Ensure it uses `useLanguage` to support both languages in labels.

### Modifying Database Schema
1. Check existing migrations in `supabase/migrations/`.
2. Create a new migration file.
3. Update `src/integrations/supabase/types.ts` (manually or via `supabase gen types`).

## 3. Coding Guidelines
- **UI Components**: Use Shadcn (located in `src/components/ui`).
- **Icons**: Use `lucide-react`.
- **Feedback**: Use `sonner` for toasts.
- **Data Hooks**: Place Supabase logic in `src/hooks/` for reusability.

## 4. Documentation
- Update `navod.md` if a major milestone is reached.
- Keep `PROMPTS.md` updated if the tech stack or core architecture changes.
