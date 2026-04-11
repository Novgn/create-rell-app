# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-04-11

Substantial template hardening and CLI ergonomics release. No breaking API
changes — existing `create-rell-app <name>` invocations keep working
unchanged. Upgrades are recommended for anyone scaffolding production SaaS
starters: this release closes a real privilege-downgrade bug in the Clerk
billing webhook handler and tightens default security posture across all
three templates.

### Added

- **`--dry-run` flag** — walks the chosen template and prints the files that
  would be scaffolded without touching the filesystem. Skips install and
  git init. Useful for CI previews and quick template inspection.
- **`--no-git` flag** — skip the automatic git repository init and initial
  commit step.
- **Automatic `git init` after scaffold** — every new project lands with a
  clean git history (`chore: initial scaffold`). Husky hooks are suppressed
  on the initial commit via `HUSKY=0`. Silently skipped if git is not in
  `PATH` or the `.git` directory already exists.
- **"Success!" next-steps banner** — after a successful scaffold + install,
  the CLI prints a `create-next-app`-style banner with the exact `cd` and
  `<pm> run dev` commands for the chosen package manager.
- **Structured logger stub** (`lib/logger.ts`) in the web and monolith
  templates. Dependency-free console JSON writer with a Pino-compatible
  `log.info(ctx, msg)` surface — swap for Pino, Winston, or a Sentry
  transport as a one-file change.
- **Rate-limit stub** (`lib/rate-limit.ts`) with an in-memory sliding-window
  implementation and an Upstash-compatible `{ success, remaining, resetAt }`
  return shape. Used by `/api/me/role` to cap per-user request rates.
- **Feature-flag abstraction** (`lib/flags.ts`) — reads `NEXT_PUBLIC_FLAG_<NAME>`
  or `FLAG_<NAME>` env vars. Stable call-site API for a future swap to
  `@vercel/flags` or another provider.
- **Webhook replay dedupe** via a new `webhook_deliveries` table (migration
  `0002_webhook_deliveries.sql`) and `markWebhookSeen(db, svixId, eventType)`
  helper. The Clerk billing route forwards `svix-id` into
  `handleBillingEvent`, which short-circuits on replays before hitting the
  role write path.
- **Baseline security headers** on the scaffolded `next.config.ts`: HSTS
  (two-year max-age + preload), `X-Frame-Options: SAMEORIGIN`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `Permissions-Policy` denying camera /
  microphone / geolocation, and `X-DNS-Prefetch-Control: on`. CSP is
  deliberately left off with a pointer to `clerk.com/docs/security/clerk-csp`
  — a functional CSP that doesn't break Clerk modals needs per-deployment
  tuning.
- **Cache headers on `/api/me/role`** (`Cache-Control: private, max-age=30,
  stale-while-revalidate=60`) to cut DB round-trips from repeated
  `useRole()` mounts.
- **Dependabot config** (`.github/dependabot.yml`) — weekly grouped minor
  /patch updates for the CLI root and every template workspace, plus
  monthly GitHub Actions updates.
- **CI matrix expansion** — `check` job now runs on Node 22 **and** 24;
  `smoke` job now runs on ubuntu-latest **and** macos-latest **and**
  windows-latest. Vitest v8 coverage is wired into the `check` job output.
- **`CHANGELOG.md`**, **`SECURITY.md`**, **`CONTRIBUTING.md`** at the repo
  root. GitHub `ISSUE_TEMPLATE/` (bug report + feature request) and
  `PULL_REQUEST_TEMPLATE.md`.
- **`db/README.md`** migration workflow guide inside each template that
  ships a Drizzle schema (`web`, `mobile`, `monolith/packages/shared`).
- **React `cache()` deduplication** for server RBAC helpers
  (`getCurrentUserWithRole`, `hasRole`, `currentUserHasRole`, `isAdmin`,
  `isPaid`) so duplicate calls within a single server render pass coalesce
  into one DB query.
- **Module-level in-flight memo on `useRole()`** — concurrent `<RoleGate>`
  mounts on the same page now share a single `/api/me/role` fetch instead
  of each firing their own.
- **Zod-based env validation** — all templates now load a single
  `z.object({...}).safeParse(process.env)` per env module and report every
  missing/invalid key in one error, replacing the previous per-key
  fail-on-first style.

### Fixed

- **P0 — duplicate `zod` key in monolith `apps/web/package.json`.** npm
  parsers silently kept the last occurrence; linters and `npm publish`
  warned. Now single entry, regression test added.
- **P0 — `user.created` webhook was demoting paid users on replay.** The
  handler called `setUserRole(db, id, 'free')` which used
  `onConflictDoUpdate` and would overwrite an existing `paid` or
  `super_admin` role. A new `insertDefaultUserRole` helper uses
  `INSERT ... ON CONFLICT DO NOTHING` so replays within svix's retry
  window are safe. Combined with the svix-id dedupe table above, this
  closes a real privilege-downgrade vector.
- **P0 — monolith `apps/web/package.json` was relying on implicit npm
  workspaces hoisting** for `drizzle-orm`, `drizzle-kit`, `postgres`, the
  full eslint/prettier/husky/lint-staged tool chain, and `@tailwindcss/postcss`.
  All direct dependencies are now declared explicitly, bringing the file
  to version-exact parity with the solo `templates/web/package.json`.
- **Production error boundary (`app/error.tsx`)** no longer leaks
  `error.message` to end users — replaced with a generic message in
  production, preserved in development for debugging.
- **`plan-to-role` unknown-plan warning** now sanitizes the attacker-
  controllable `planKey` against ANSI/newline log injection before
  `console.warn`.
- **`ProfileForm` example no longer ships a `console.log` in the submit
  handler** — replaced with a dev-only `console.warn` gated on
  `NODE_ENV !== 'production'` (web/monolith) or `__DEV__` (mobile/expo),
  plus a clear TODO marker.
- **Eslint parser "multiple candidate TSConfigRootDirs" error** in the
  CLI's own workspace resolved by pinning `parserOptions.tsconfigRootDir`
  to `__dirname` and ignoring `.worktrees/` and `full-app/` scaffold test
  outputs.

### Changed

- **Dropped `fs-extra` dependency** in favor of `node:fs/promises`. Saves
  one direct dependency (and `@types/fs-extra`). All scaffold engine,
  install, and validation modules now use native Node APIs.
- **Template `tsconfig.json` files** now ship under `_tsconfig.json`
  (restored to `tsconfig.json` at scaffold time via the existing
  `SPECIAL_FILENAME_RENAMES` table). Prevents the IDE's TypeScript server
  from auto-discovering a template as a standalone project where
  `node_modules` isn't installed.
- **Template `eslint.config.mjs` files** now ship under `_eslint.config.mjs`
  for the same reason — prevents the IDE's eslint LSP from walking up to
  a template's own eslint config and choking on multiple `tsconfig`
  candidate roots.
- **Template `.ts` / `.tsx` / `.mts` files** now start with a
  `// @ts-nocheck -- template-only` marker that the scaffold engine strips
  before writing. Contributors opening template files in the IDE see a
  clean file with no phantom type errors; scaffolded users get normal
  TypeScript checking against their own installed deps.

### Docs

- Full commit history available via `git log v0.1.3..v0.2.0`.

## [0.1.3] - 2026-04-11

- Earlier releases — see git history.
