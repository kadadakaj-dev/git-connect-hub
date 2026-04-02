-- API Auth tables (managed by Prisma, mirrored here for Supabase deployments)
-- These tables power the NestJS API authentication: register, login, JWT, OAuth, biometric

-- User table (API-level auth, separate from Supabase auth.users)
create table if not exists public."User" (
  id            text primary key,
  email         text not null unique,
  "passwordHash" text,
  salt          text,
  "twoFaSecret" text,
  "biometricId" text,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);

-- Session table (active login sessions)
create table if not exists public."Session" (
  token       text primary key,
  "userId"    text not null references public."User"(id) on delete cascade,
  "expiresAt" timestamptz not null,
  "ipAddress" text not null,
  "userAgent" text,
  "createdAt" timestamptz not null default now()
);

create index if not exists idx_session_user_id on public."Session"("userId");
create index if not exists idx_session_expires_at on public."Session"("expiresAt");

-- Refresh tokens
create table if not exists public."RefreshToken" (
  token       text primary key,
  "userId"    text not null references public."User"(id) on delete cascade,
  "expiresAt" timestamptz not null,
  "isRevoked" boolean not null default false,
  "createdAt" timestamptz not null default now()
);

create index if not exists idx_refresh_token_user_id on public."RefreshToken"("userId");
create index if not exists idx_refresh_token_expires_at on public."RefreshToken"("expiresAt");

-- OAuth accounts (Google, GitHub, Apple)
create table if not exists public."OauthAccount" (
  id                  text primary key,
  "userId"            text not null references public."User"(id) on delete cascade,
  provider            text not null,
  "providerAccountId" text not null,
  "createdAt"         timestamptz not null default now(),
  unique (provider, "providerAccountId")
);

create index if not exists idx_oauth_account_user_id on public."OauthAccount"("userId");

-- Token blacklist (revoked JWTs)
create table if not exists public."TokenBlacklist" (
  token       text primary key,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default now()
);

create index if not exists idx_token_blacklist_expires_at on public."TokenBlacklist"("expiresAt");

-- Audit log
create table if not exists public."AuditLog" (
  id          text primary key,
  "tenantId"  text,
  action      text not null,
  meta        jsonb not null,
  "createdAt" timestamptz not null default now()
);
