# Story 3.3: Add Three-Tier RBAC with Server, Client, and Database Enforcement

Status: review

## Story

As a developer building a SaaS with role-based access,
I want synchronized RBAC across server middleware, client hooks, and Supabase RLS,
so that access control is enforced consistently with no holes.

## Acceptance Criteria

1. **Given** the user roles table exists with `super_admin`, `paid`, and `free` values, **When** role-based access is checked, **Then** server helpers in `lib/auth/roles.ts` provide `hasRole()`, `isAdmin()`, and `isPaid()` functions that read from `user_roles`.
2. A client-side hook `lib/auth/use-role.ts` exposes a `useRole()` hook that fetches the current user's role via Clerk's `useAuth()` + a request to a `/api/me/role` endpoint (server reads the DB and returns the role).
3. `clerkMiddleware()` enforces role checks on protected API routes — the middleware can `auth.protect({ role: 'super_admin' })` if needed, but the monolith uses the simpler pattern of per-route checks inside handlers (consistent with architecture's "Process Patterns").
4. Supabase RLS includes a `SECURITY DEFINER` helper function `public.is_super_admin()` that bypasses RLS internally (reads `user_roles` without triggering policies) and returns a boolean. This function is safe to reference from other RLS policies without recursive lookup.
5. A second migration file `shared/db/migrations/0001_rbac_helpers.sql` adds the `is_super_admin()` function AND the previously-deferred `select_user_roles_admin` policy that uses it.
6. `super_admin` has full god-mode access — a select policy on `user_roles` using `public.is_super_admin()` lets super_admins read every row.
7. Inline comments explain the three-tier RBAC architecture and RLS policy construction:
   - Server layer: `hasRole()` reads `user_roles` via Drizzle
   - Client layer: `useRole()` fetches from `/api/me/role`
   - Database layer: RLS policies use `auth.jwt()->>'sub'` and `public.is_super_admin()`
8. A `GET /api/me/role` route handler exposes the current user's role to the client. It reads from `auth()` + `getUserRoleByClerkId` and returns `{ role: Role }` JSON.
9. New template files:
   - `templates/monolith/web/lib/auth/roles.ts` — server helpers (`hasRole`, `isAdmin`, `isPaid`)
   - `templates/monolith/web/lib/auth/use-role.ts` — client hook
   - `templates/monolith/web/app/api/me/role/route.ts` — role endpoint
   - `templates/monolith/shared/db/migrations/0001_rbac_helpers.sql` — SECURITY DEFINER + admin policy
10. Mobile: `templates/monolith/mobile/lib/auth/use-role.ts` — same hook for React Native, fetches from the web's `/api/me/role` URL or queries Supabase directly via the existing client (easier path).
11. Unit tests verify:
    - Every new file exists
    - `roles.ts` exports `hasRole`, `isAdmin`, `isPaid` and reads from `getUserRoleByClerkId`
    - `use-role.ts` (web) imports `useAuth` from `@clerk/nextjs` and uses `useEffect` + `fetch`
    - `api/me/role/route.ts` is a GET handler that reads `auth()` and returns JSON
    - The RBAC migration contains `CREATE OR REPLACE FUNCTION public.is_super_admin()` with `SECURITY DEFINER`
    - The migration creates a `select_user_roles_admin` policy that references `public.is_super_admin()`
    - Mobile `use-role.ts` uses `useAuth` from `@clerk/clerk-expo` and queries Supabase
12. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all pass.

## Tasks / Subtasks

- [ ] **Task 1: Server role helpers**
  - [ ] Create `templates/monolith/web/lib/auth/roles.ts` with `server-only` guard:
    - `hasRole(clerkUserId: string, role: Role): Promise<boolean>` — reads DB
    - `currentUserHasRole(role: Role): Promise<boolean>` — auth() + hasRole
    - `isAdmin(clerkUserId: string): Promise<boolean>` — hasRole with 'super_admin'
    - `isPaid(clerkUserId: string): Promise<boolean>` — hasRole with 'paid' OR 'super_admin' (admin implies paid)
- [ ] **Task 2: API role endpoint**
  - [ ] Create `templates/monolith/web/app/api/me/role/route.ts`:
    - GET handler
    - Reads `auth()` for Clerk user ID
    - Returns 401 if not authenticated
    - Uses `getCurrentUserWithRole` helper to fetch role (defaults to 'free')
    - Returns `{ role: Role }` as JSON
- [ ] **Task 3: Client role hook (web)**
  - [ ] Create `templates/monolith/web/lib/auth/use-role.ts`:
    - `'use client'`
    - `useRole()` hook that calls `useAuth()` from Clerk, fetches `/api/me/role` when signed in
    - Returns `{ role: Role | null; isLoading: boolean }`
- [ ] **Task 4: Client role hook (mobile)**
  - [ ] Create `templates/monolith/mobile/lib/auth/use-role.ts`:
    - Similar shape but uses `useAuth` from `@clerk/clerk-expo`
    - Queries Supabase directly via `useSupabaseClient()` instead of hitting a /api endpoint (mobile doesn't have a web host necessarily)
- [ ] **Task 5: RBAC SQL migration**
  - [ ] Create `templates/monolith/shared/db/migrations/0001_rbac_helpers.sql`:
    - `CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE clerk_user_id = auth.jwt()->>'sub' AND role = 'super_admin') $$;`
    - Grant execute on the function to `authenticated`
    - `CREATE POLICY "select_user_roles_admin" ON "user_roles" FOR SELECT TO authenticated USING (public.is_super_admin());`
- [ ] **Task 6: Tests**
  - [ ] Extend EXPECTED_TEMPLATE_FILES with the 5 new files.
  - [ ] Add content assertions.
- [ ] **Task 7: Verification**
  - [ ] All commands pass.

## Dev Notes

### Architecture compliance

- **`SECURITY DEFINER` bypasses RLS** inside the function body, so `is_super_admin()` can SELECT from `user_roles` without triggering a recursive RLS lookup. This is the canonical Supabase pattern for policies that need to reference the same table.
- **Grant EXECUTE to authenticated** only — anon users should not be able to call the helper.
- **No bypass paths in server helpers** — every role check reads the DB (cheap, indexed query). Cache-first optimization belongs in a later polish story.
- **Client hook** only uses the role for UI gating, never for security decisions. The server layer + RLS are authoritative.

### Critical implementation details

- **Super_admin implies paid**: `isPaid` returns true for both `'paid'` and `'super_admin'`. `isAdmin` returns true only for `'super_admin'`.
- **Mobile fetches role directly from Supabase**, not from a web `/api/me/role` endpoint. The Expo app may not have a paired web backend, so querying `user_roles` via the Supabase client (backed by Clerk's JWT) works anywhere.
- **`useRole()` on web** refetches on mount and whenever the Clerk session changes. Caching across renders is an optimization for later.
- **RLS function must be in the `public` schema** — Supabase service role can create functions in any schema, but RLS policies only trust functions that are explicitly referenced by schema-qualified name.

### Project Structure Notes

```
templates/monolith/
├── web/
│   ├── lib/auth/
│   │   ├── current-user.ts     # unchanged
│   │   ├── roles.ts            # NEW
│   │   └── use-role.ts         # NEW
│   └── app/api/me/role/route.ts   # NEW
├── mobile/
│   └── lib/auth/
│       └── use-role.ts         # NEW
└── shared/db/migrations/
    └── 0001_rbac_helpers.sql   # NEW
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Generated Code Architecture]
- [Source: _bmad-output/planning-artifacts/prd.md#FR26, FR27, FR28, FR29, FR30, FR31]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors
- `npm run test` → 193/193 (6 new Story 3.3 tests)
- `npm run build` → 20.48 KB

### Completion Notes List

- **Three-tier RBAC complete**:
  - Server: `roles.ts` with `hasRole`, `currentUserHasRole`, `isAdmin`, `isPaid` — `isPaid` returns true for both `'paid'` and `'super_admin'` (admins implicitly have paid access).
  - Client: `use-role.ts` hook fetches `/api/me/role` on web; mobile queries Supabase directly via the Clerk-authenticated client.
  - Database: `0001_rbac_helpers.sql` adds the `public.is_super_admin()` SECURITY DEFINER function with `SET search_path = public` (prevents search_path hijacking), grants EXECUTE to authenticated, and adds the previously-deferred `select_user_roles_admin` policy that references it — no recursive RLS lookup.
- **`/api/me/role` endpoint** returns 401 on unauth, `{ role: Role }` otherwise. Reuses `getCurrentUserWithRole` from Story 3.1 to avoid duplicating the defensive 'free' fallback.
- **Mobile uses Supabase directly, not a web backend** — mobile apps may not have a paired Next.js host, and the RLS `select_user_roles_own` policy from Story 2.4 already allows the signed-in user to read their own row.
- **All client-side checks are UI-only**: the hook-level tests are for rendering decisions, never security. RLS is the security boundary.
- **Story 2.4 unresolved finding closed**: the recursive `select_user_roles_admin` policy from the Story 2.4 deferral is now correctly implemented via the SECURITY DEFINER helper.

### File List

**Created (5):**

- `templates/monolith/web/lib/auth/roles.ts` — server RBAC helpers
- `templates/monolith/web/app/api/me/role/route.ts` — role endpoint
- `templates/monolith/web/lib/auth/use-role.ts` — web client hook
- `templates/monolith/mobile/lib/auth/use-role.ts` — mobile client hook
- `templates/monolith/shared/db/migrations/0001_rbac_helpers.sql` — SECURITY DEFINER + admin policy

**Modified (1):**

- `tests/unit/templates-monolith.test.ts` — 6 new tests covering server helpers, web hook, API endpoint, mobile hook, SECURITY DEFINER function, and admin policy
