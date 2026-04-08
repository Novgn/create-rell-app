# Story 2.4: Add Drizzle Schema, Migrations, and Typed Queries

Status: done

## Story

As a developer building a SaaS product,
I want a Drizzle ORM schema with user roles table, migration scripts, and example typed queries,
so that I have a working database layer from day one.

## Acceptance Criteria

1. **Given** Supabase is configured via environment variables, **When** the developer runs Drizzle migrations, **Then** a `user_roles` table is created with columns `clerk_user_id`, `role`, `created_at`, `updated_at`.
2. The schema is defined in `shared/db/schema.ts` (single source of truth for the monolith).
3. Typed query helpers exist in `shared/db/queries.ts` with at least one typed select (e.g. `getUserRoleByClerkId`) and one typed insert/upsert (e.g. `setUserRole`).
4. A Drizzle config file at `shared/drizzle.config.ts` points Drizzle Kit at the schema and outputs migrations to `shared/db/migrations/`.
5. A seed migration file lives in `shared/db/migrations/0000_initial.sql` creating the `user_roles` table **plus** the RLS policy referencing `auth.jwt()->>'sub'` to match Clerk user IDs. Comment the RLS policy heavily.
6. `shared/db/client.ts` exports a typed `db` instance built from `drizzle-orm/postgres-js` + `postgres` using `DATABASE_URL`.
7. Table names use `snake_case plural`, column names use `snake_case`, foreign keys use `<table>_id` (architecture naming rules).
8. All table / column / index / policy names match the architecture's naming conventions.
9. The shared workspace's `package.json` pins `drizzle-orm`, `drizzle-kit`, and `postgres` exact.
10. The shared `index.ts` re-exports `schema` and `queries` so web and mobile can import via `@{{projectNameKebab}}/shared`.
11. The monolith root `package.json` gains `db:generate`, `db:migrate`, `db:studio` scripts that delegate to drizzle-kit.
12. `_env.example` mentions `DATABASE_URL` explicitly (it was already placeholder-documented in 2.2; promote it).
13. `web/next.config.ts` adds `transpilePackages: ['@{{projectNameKebab}}/shared']` now that shared has real TS code.
14. Unit tests verify:
    - Every new file exists.
    - `shared/db/schema.ts` declares the `userRoles` table with `clerkUserId`, `role`, `createdAt`, `updatedAt` columns.
    - Column names are `snake_case` in the database (Drizzle's `.column('snake_case')` form).
    - `shared/db/queries.ts` exports typed select and insert helpers.
    - The initial migration SQL creates the `user_roles` table and an RLS policy referencing `auth.jwt()->>'sub'`.
    - `shared/package.json` pins all three drizzle-related deps exact.
    - `shared/index.ts` re-exports schema + queries.
    - `next.config.ts` references `transpilePackages`.
    - End-to-end scaffold still produces zero leftover tokens.
15. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all pass.

## Tasks / Subtasks

- [ ] **Task 1: Pin Drizzle deps in shared/package.json**
  - [ ] Verify `drizzle-orm@0.45.2`, `drizzle-kit@0.31.10`, `postgres@3.4.9` via `npm view`.
  - [ ] Update `templates/monolith/shared/package.json` to include them.
- [ ] **Task 2: Drizzle schema**
  - [ ] Create `templates/monolith/shared/db/schema.ts` defining the `userRoles` pgTable with columns:
    - `id: uuid` primary key default `gen_random_uuid()`
    - `clerkUserId: text('clerk_user_id').notNull().unique()`
    - `role: text('role', { enum: ['super_admin', 'paid', 'free'] }).notNull().default('free')`
    - `createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()`
    - `updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()`
  - [ ] Define and export a `Role` TypeScript union type derived from the schema.
  - [ ] Add an index on `clerk_user_id` named `idx_user_roles_clerk_user_id`.
- [ ] **Task 3: Drizzle client**
  - [ ] Create `templates/monolith/shared/db/client.ts` exporting a `db` instance: `drizzle(postgres(env.DATABASE_URL))`.
  - [ ] Pull `DATABASE_URL` via a local helper (shared can't import from web/mobile env). Put a small env reader inline with a clear error message.
- [ ] **Task 4: Typed queries**
  - [ ] Create `templates/monolith/shared/db/queries.ts` exporting:
    - `getUserRoleByClerkId(db, clerkUserId): Promise<UserRole | null>` using `db.select().from(userRoles).where(eq(userRoles.clerkUserId, clerkUserId))`.
    - `setUserRole(db, clerkUserId, role): Promise<UserRole>` using `db.insert(userRoles).values({...}).onConflictDoUpdate({...}).returning()`.
  - [ ] Both helpers accept the `db` client as a parameter so callers can pass server-side and client-side variants without coupling.
- [ ] **Task 5: Drizzle config + initial migration**
  - [ ] Create `templates/monolith/shared/drizzle.config.ts` pointing to `./db/schema.ts` with out dir `./db/migrations` and Postgres dialect.
  - [ ] Create `templates/monolith/shared/db/migrations/0000_initial.sql` containing the `CREATE TABLE user_roles ...` statement plus the `CREATE POLICY` statements for RLS. Comment each policy heavily.
  - [ ] Include a `gen_random_uuid()` extension enable if needed (`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`).
- [ ] **Task 6: Shared barrel export**
  - [ ] Update `templates/monolith/shared/index.ts` to re-export `./db/schema.js` and `./db/queries.js` (using `.js` extensions in source because TS emits `.js` — actually, since shared is raw TS imported via `transpilePackages`, use plain TS extension-less imports).
- [ ] **Task 7: Wire shared into web + root scripts**
  - [ ] Update `templates/monolith/web/next.config.ts` to add `transpilePackages: ['@{{projectNameKebab}}/shared']`.
  - [ ] Update `templates/monolith/package.json` to add `db:generate`, `db:migrate`, `db:push`, `db:studio` scripts forwarded via `{{pmRunCmd}}` to `shared`.
- [ ] **Task 8: Tests**
  - [ ] Extend `EXPECTED_TEMPLATE_FILES`.
  - [ ] Add content assertions per AC 14.
- [ ] **Task 9: Verification**
  - [ ] All commands pass.

## Dev Notes

### Architecture compliance

- **Schema location**: monolith's single source of truth is `shared/db/schema.ts` — web and mobile both import from `@{{projectNameKebab}}/shared`.
- **Naming** _(architecture.md)_:
  - Tables: `snake_case` plural → `user_roles`
  - Columns: `snake_case` → `clerk_user_id`, `created_at`
  - Foreign keys: `<table>_id` (no FKs in the initial `user_roles` table — it's the referenced table for everything else)
  - Indexes: `idx_<table>_<column>` → `idx_user_roles_clerk_user_id`
  - RLS policies: `<action>_<table>_<context>` → `select_user_roles_own`, `insert_user_roles_own`
- **Native 3P auth**: RLS policies reference `auth.jwt()->>'sub'` to match the Clerk user ID — architecture's "CRITICAL" section explicitly specifies this and forbids the deprecated JWT-template pattern.
- **Pinning**: `drizzle-orm`, `drizzle-kit`, `postgres` all exact per NFR16.

### Critical implementation details — anti-disaster guardrails

- **RLS policies must be enabled on the table** with `ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;` before `CREATE POLICY` — forgetting this silently disables RLS.
- **`auth.jwt()->>'sub'` vs `auth.uid()`**: the `auth.uid()` helper is for Supabase's built-in auth, which we do NOT use. Always use `auth.jwt()->>'sub'` to extract the Clerk user ID from the token.
- **Default role** is `'free'` — matches the three-tier RBAC architecture (super_admin / paid / free).
- **`db:generate`** is the Drizzle Kit command that produces migration SQL from schema changes. `db:migrate` applies them. `db:push` applies schema directly (useful in dev). `db:studio` opens the Drizzle Studio GUI.
- **`postgres` library buffers connections** — make sure `shared/db/client.ts` doesn't create a new client per import. Use module-level caching.
- **Don't hard-code the database URL in the template** — always read from env. Templates that ship a placeholder URL are a nightmare to debug.
- **pgcrypto extension**: Supabase Postgres enables `uuid-ossp` and `pgcrypto` by default, so `gen_random_uuid()` is available. But the migration should explicitly enable it for portability to self-hosted Postgres.

### Pinned version targets (verified 2026-04-08)

| Package | Pin |
|---|---|
| `drizzle-orm` | 0.45.2 |
| `drizzle-kit` | 0.31.10 (devDependency) |
| `postgres` | 3.4.9 |

### Project Structure Notes

After Story 2.4:

```
templates/monolith/shared/
├── package.json        # updated: drizzle deps
├── tsconfig.json       # unchanged
├── index.ts            # updated: re-exports
├── drizzle.config.ts   # NEW
└── db/
    ├── schema.ts       # NEW
    ├── client.ts       # NEW
    ├── queries.ts      # NEW
    └── migrations/
        └── 0000_initial.sql  # NEW
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Database Naming]
- [Source: _bmad-output/planning-artifacts/architecture.md#Supabase Auth Integration (Critical)]
- [Source: _bmad-output/planning-artifacts/prd.md#FR33, FR34, FR35, FR36]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors
- `npm run test` → 171/171 passing (10 new Drizzle tests)
- `npm run build` → 20.48 KB

### Completion Notes List

- **Pinned versions** (verified 2026-04-08):
  - `drizzle-orm@0.45.2`
  - `postgres@3.4.9`
  - `drizzle-kit@0.31.10` (devDependency)
- **Schema architecture**: `userRoles` table with `id`, `clerk_user_id`, `role`, `created_at`, `updated_at`. Role is a typed text enum (`super_admin` | `paid` | `free`). Index on `clerk_user_id` for the RLS lookup hot path.
- **Type derivation**: `UserRole = typeof userRoles.$inferSelect`, `NewUserRole = typeof userRoles.$inferInsert`, `Role = (typeof ROLES)[number]`. Zero hand-written row shapes.
- **`postgres` client singleton** with `prepare: false` for Supabase pgbouncer transaction-mode compatibility. Module-level caching avoids connection pool thrash.
- **RLS policies** in `0000_initial.sql`:
  - `select_user_roles_own` — users can read their own row via `auth.jwt()->>'sub' = clerk_user_id`
  - `insert_user_roles_service` / `update_user_roles_service` — authenticated clients cannot mutate; only service-role writes allowed
  - **Super_admin god-mode read policy is intentionally deferred** to Story 3.3 — the naive EXISTS subquery form recurses into its own table through RLS, and the correct fix (`SECURITY DEFINER` helper function) belongs in the RBAC story
- **Every policy references `auth.jwt()->>'sub'`** — matches Clerk native 3P auth. The deprecated-pattern test still passes after adding this migration.
- **`transpilePackages`** restored in `web/next.config.ts` now that shared has real TypeScript code that web imports.
- **Shared barrel** re-exports `./db/schema` and `./db/queries` so downstream callers write `import { userRoles, getUserRoleByClerkId } from '@{{projectNameKebab}}/shared'`.
- **Root scripts** forwarded: `db:generate`, `db:migrate`, `db:push`, `db:studio` → shared workspace.
- **Deferred:**
  - Actual user creation webhook → Story 3.2 (billing webhook) will call `setUserRole` to assign 'free' on new users
  - Additional tables (subscriptions, webhook_events) → Epic 3
  - Server-side Supabase client integration with these queries → Story 3.2

### File List

**Created (6):**

- `templates/monolith/shared/db/schema.ts`
- `templates/monolith/shared/db/client.ts`
- `templates/monolith/shared/db/queries.ts`
- `templates/monolith/shared/db/migrations/0000_initial.sql`
- `templates/monolith/shared/drizzle.config.ts`

**Modified (4):**

- `templates/monolith/shared/package.json` — pinned drizzle-orm, postgres, drizzle-kit
- `templates/monolith/shared/index.ts` — re-exports schema + queries
- `templates/monolith/web/next.config.ts` — transpilePackages restored
- `templates/monolith/package.json` — db:* scripts
- `tests/unit/templates-monolith.test.ts` — 10 new tests covering pinned deps, schema shape, type derivation, client setup, query exports, RLS policies, transpilePackages wiring, and drizzle config

### Code Review Findings (Phase 3)

**CRITICAL (auto-fixed):**

- **Recursive RLS admin policy**: the `select_user_roles_admin` policy queried `user_roles` inside its own USING clause, which would trigger RLS recursively. Removed from the 0000 migration; Story 3.3 will introduce a `SECURITY DEFINER` `is_super_admin()` helper function that bypasses RLS internally and then reference it in a safe policy.

**HIGH (auto-fixed):**

- **Module-load throw on missing `DATABASE_URL`**: `shared/db/client.ts` previously opened the Postgres connection pool at module load. Any downstream import (including `next build`) would fail on machines without the env set. Refactored to a lazy `getDb()` function that reads env and opens the pool on first use, then memoizes via a module-level cache.
- **`shared/index.ts` now exports `getDb`** alongside `DbClient`, so downstream callers write `import { getDb } from '@{{projectNameKebab}}/shared'`.

**LOW (deferred):** see `deferred-findings.md` (`LOW-2.4-A` db:drop/reset scripts, `LOW-2.4-B` drizzle.config.ts empty-string fallback).

**CRITICAL unresolved:** none.
