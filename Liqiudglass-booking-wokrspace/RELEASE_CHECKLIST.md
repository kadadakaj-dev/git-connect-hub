# Release Checklist (Production Hardening)

Use this checklist before promoting `main` to production.

## 1) Environment & Secrets
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured.
- [ ] `NEXT_PUBLIC_SENTRY_DSN` (web) and `SENTRY_DSN` (api) configured.
- [ ] `JWT_ACCESS_SECRET`, `API_KEY`, `DATABASE_URL`, `CORS_ORIGINS` configured.
- [ ] Sentry environment tags (`APP_ENV` / `NEXT_PUBLIC_APP_ENV`) set correctly.

## 2) Database & Security
- [ ] Apply `supabase/schema.sql` to target project.
- [ ] Run `supabase/rls_audit.sql` and verify no assertion failures.
- [ ] Confirm Realtime is enabled for `public.bookings`.
- [ ] Confirm at least one admin profile exists (`profiles.role = 'admin'`).

## 3) Quality Gates (must pass)
- [ ] `pnpm -r lint`
- [ ] `pnpm -r test`
- [ ] `pnpm -r build`
- [ ] `pnpm -C apps/web test:e2e`

## 4) Observability
- [ ] Verify frontend and backend events appear in Sentry.
- [ ] Verify API emits structured JSON logs (`http_request`, `api_started`, `bootstrap_failed`).
- [ ] Configure alert rules for error-rate and latency regressions.

## 5) Deployment Safety
- [ ] CI workflow `.github/workflows/ci.yml` green on target commit.
- [ ] Rollback plan documented (previous image tag + DB migration rollback strategy).
- [ ] Release notes include user-visible changes and risk notes.
