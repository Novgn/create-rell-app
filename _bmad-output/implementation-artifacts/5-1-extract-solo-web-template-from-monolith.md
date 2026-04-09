# Story 5.1: Extract Solo Web Template from Monolith

Status: in-progress

## Story

As a developer who only needs a web app,
I want a Solo Web template that uses the same patterns as the monolith's web portion,
so that I get a lighter scaffold without mobile code.

## Acceptance Criteria

1. A new template directory `templates/web/` exists with a self-contained Next.js project.
2. The Solo Web template is identical to `templates/monolith/web/` in behavior and patterns:
   - Same Clerk + Supabase native 3P auth wiring
   - Same Drizzle schema + RLS migrations
   - Same RBAC three-tier system (roles.ts + use-role.ts + RoleGate + PaywallPrompt)
   - Same Clerk Billing webhook handler
   - Same Zustand store, React Hook Form + Zod example
   - Same Tailwind 4 + shadcn base components + skeletons
   - Same ESLint flat config + Prettier + Husky + lint-staged
3. The `shared/db/` directory is **inlined** at the project root as `db/` (schema, queries, client, migrations, drizzle.config.ts).
4. The `shared/validation/` schema is inlined at `lib/validation/profile-form.ts`.
5. All imports from `@{{projectNameKebab}}/shared` are rewritten to local paths:
   - `@/db/client`, `@/db/queries`, `@/db/schema` for DB
   - `@/lib/validation/profile-form` for the Zod form schema
6. `next.config.ts` drops the `transpilePackages: ['@{{projectNameKebab}}/shared']` line (no workspace package to transpile).
7. `package.json` at the root is a **single** package.json (not a workspace root) — it merges the monolith's web `package.json` with the monolith root's DX devDeps (eslint, prettier, husky, lint-staged, typescript-eslint, eslint-config-next, eslint-config-prettier) and scripts (`lint`, `format`, `format:check`, `prepare`, `db:generate`, `db:migrate`, `db:push`, `db:studio`).
8. `tsconfig.json` stands alone — no `extends: "../tsconfig.base.json"`. It inlines the strict flags from `tsconfig.base.json`.
9. `_gitignore` and `_husky/pre-commit` are identical to the monolith versions (already web-neutral).
10. `_env.example` contains **only** the WEB block — no `EXPO_PUBLIC_*` keys.
11. `README.md` is rewritten for the Solo Web story: no references to `mobile/` or `shared/`.
12. No references to `mobile/`, `shared/`, `workspaces`, or `@{{projectNameKebab}}/shared` remain anywhere in `templates/web/`.
13. The CLI already supports `--template web` (Story 1.1) — scaffolding the new template directory must succeed and all `{{...}}` tokens must resolve after substitution.
14. Unit tests verify every expected file exists in `templates/web/`, all imports have been rewritten, `package.json` has the merged shape, and an end-to-end scaffold run produces a token-free output.
15. `npm test` passes and all previous tests still pass.

## Tasks / Subtasks

- [ ] **Task 1: Root configs**
  - [ ] `templates/web/package.json`, `tsconfig.json`, `_gitignore`, `_env.example`, `_husky/pre-commit`, `README.md`
- [ ] **Task 2: Next.js + Tailwind configs**
  - [ ] `next.config.ts`, `next-env.d.ts`, `postcss.config.mjs`, `components.json`, `eslint.config.mjs`, `middleware.ts`, `drizzle.config.ts`
- [ ] **Task 3: db/ — inlined from shared/db/**
  - [ ] `db/schema.ts`, `db/queries.ts`, `db/client.ts`, `db/migrations/0000_initial.sql`, `db/migrations/0001_rbac_helpers.sql`
- [ ] **Task 4: lib/**
  - [ ] `lib/env.ts`, `lib/env-server.ts`, `lib/cn.ts`
  - [ ] `lib/supabase/client.ts`, `lib/supabase/server.ts`
  - [ ] `lib/auth/current-user.ts`, `lib/auth/roles.ts`, `lib/auth/use-role.ts`
  - [ ] `lib/billing/plan-to-role.ts`, `lib/billing/event-handler.ts`
  - [ ] `lib/validation/profile-form.ts`
- [ ] **Task 5: app/ routes**
  - [ ] `app/layout.tsx`, `app/page.tsx`, `app/error.tsx`, `app/loading.tsx`, `app/globals.css`
  - [ ] `app/(auth)/sign-in/[[...sign-in]]/page.tsx`
  - [ ] `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
  - [ ] `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`, `app/dashboard/loading.tsx`
  - [ ] `app/dashboard/billing/page.tsx`
  - [ ] `app/dashboard/settings/page.tsx`
  - [ ] `app/dashboard/paid-feature/page.tsx`
  - [ ] `app/api/me/role/route.ts`
  - [ ] `app/api/webhooks/clerk-billing/route.ts`
- [ ] **Task 6: components/**
  - [ ] `components/ui/Button.tsx`, `Card.tsx`, `Skeleton.tsx`
  - [ ] `components/shared/SkeletonCard.tsx`, `SkeletonTable.tsx`, `OnboardingGreeting.tsx`
  - [ ] `components/auth/RoleGate.tsx`, `PaywallPrompt.tsx`
  - [ ] `components/forms/ProfileForm.tsx`
- [ ] **Task 7: stores/**
  - [ ] `stores/app-store.ts`
- [ ] **Task 8: Tests**
  - [ ] New test file `tests/unit/templates-web.test.ts` with file-existence and key assertion checks
  - [ ] End-to-end scaffold test with `template: 'web'` verifying no leftover tokens and no `@/shared` imports
- [ ] **Task 9: Verification**
  - [ ] `npx vitest run` — all green, no regressions

## Dev Notes

### Extraction principle

"Same patterns, different scope." Every file that exists in `monolith/web/` exists in the Solo Web template with at most three changes:

1. Imports from `@{{projectNameKebab}}/shared` rewritten to local aliases (`@/db/...` or `@/lib/validation/...`)
2. Comments that mention the `shared/` workspace rewritten to describe the local path
3. `next.config.ts` loses `transpilePackages`

Everything else is byte-identical.

### Why inline `db/` instead of keeping `shared/`

The whole point of the Solo Web template is to be standalone. A `shared/` workspace would be dead weight — no mobile code to share with, no npm workspace wiring. Inlining into `db/` at the root matches the architecture spec (`templates/web/` structure, architecture.md line 419) which explicitly places `db/` at project root for solo templates.

### Package.json merge strategy

The monolith has two package.jsons relevant to us:
- `templates/monolith/package.json` — workspace root with DX devDeps and scripts
- `templates/monolith/web/package.json` — the web-only runtime + dev deps

For the solo web template, these get merged into a single `templates/web/package.json`:
- `scripts`: `dev`, `build`, `start`, `lint` (was `next lint`), `typecheck`, `format`, `format:check`, `prepare`, `db:generate`, `db:migrate`, `db:push`, `db:studio`
- `dependencies`: everything from `monolith/web/package.json` + `drizzle-orm`, `postgres` (which lived in `shared` in the monolith)
- `devDependencies`: merge the web devDeps + the monolith root DX devDeps + `drizzle-kit`
- `prettier` + `lint-staged` config blocks
- No `workspaces` field

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Solo Web App Template]
- [Source: _bmad-output/planning-artifacts/prd.md#FR43 FR44]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)
