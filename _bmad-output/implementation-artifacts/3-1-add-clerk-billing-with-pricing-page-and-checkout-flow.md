# Story 3.1: Add Clerk Billing with Pricing Page and Checkout Flow

Status: done

## Story

As a developer building a subscription SaaS,
I want a pricing page with subscription tiers and a checkout flow,
so that my users can view plans and subscribe.

## Acceptance Criteria

1. **Given** Clerk Billing is configured via environment variables, **When** the generated project runs, **Then** a pricing page at `/dashboard/billing` displays subscription tiers.
2. The pricing page uses Clerk's `<PricingTable />` component from `@clerk/nextjs` — the architecture requires Clerk Billing as the billing provider, and `<PricingTable />` is the official first-class UI.
3. Users can initiate a subscription checkout flow — Clerk's `<PricingTable />` handles the checkout redirect automatically when a plan is clicked. No custom Stripe/checkout integration needed.
4. The pricing page is accessible to both free and paid users (it's inside the protected `(dashboard)` group so requires auth, but the tier itself doesn't matter).
5. A "Current plan" section above the pricing table shows the signed-in user's current tier by calling `getUserRoleByClerkId` from `@{{projectNameKebab}}/shared`.
6. The dashboard landing page (`/dashboard`) gains a link to `/dashboard/billing`.
7. Inline comments explain:
   - That `<PricingTable />` handles checkout end-to-end
   - That Clerk plans are configured in the Clerk Dashboard, not in code
   - That the user-visible "tier" shown here is read from the Drizzle `user_roles` table (not from Clerk directly) because the app enforces RBAC via the database layer
8. A new `.env.example` section documents `CLERK_BILLING_WEBHOOK_SIGNING_SECRET` (needed in Story 3.2 but documenting it here so users set up the Clerk dashboard config once).
9. New template files:
   - `templates/monolith/web/app/dashboard/billing/page.tsx` — the pricing page
   - `templates/monolith/web/lib/auth/current-user.ts` — server helper wrapping `auth()` + `getDb()` + `getUserRoleByClerkId` into a single `getCurrentUserWithRole()` call
10. The dashboard page at `/dashboard` is updated to include a `<Link href="/dashboard/billing">` pointing at the new billing route.
11. Unit tests verify:
    - Every new file exists
    - `billing/page.tsx` imports `PricingTable` from `@clerk/nextjs`
    - `billing/page.tsx` reads the current user's role via the shared helper
    - `lib/auth/current-user.ts` uses `auth()` from `@clerk/nextjs/server` and `getDb()` from `@{{projectNameKebab}}/shared`
    - `_env.example` now mentions `CLERK_BILLING_WEBHOOK_SIGNING_SECRET`
    - Dashboard page links to `/dashboard/billing`
12. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all pass.

## Tasks / Subtasks

- [ ] **Task 1: Current-user helper**
  - [ ] Create `templates/monolith/web/lib/auth/current-user.ts` exporting:
    - `getCurrentUserWithRole(): Promise<{ clerkUserId: string; role: Role } | null>`
    - Calls `auth()` to get the Clerk user ID, then `getDb() + getUserRoleByClerkId()` to look up the role
    - Returns `null` if not signed in, otherwise returns a `{ clerkUserId, role }` object
    - If the user has no row in `user_roles`, returns `{ clerkUserId, role: 'free' }` as the default
- [ ] **Task 2: Billing page**
  - [ ] Create `templates/monolith/web/app/dashboard/billing/page.tsx`:
    - Server component
    - Imports `PricingTable` from `@clerk/nextjs`
    - Calls `getCurrentUserWithRole()` to show the current plan
    - Renders a heading, the current plan, and `<PricingTable />`
- [ ] **Task 3: Dashboard link**
  - [ ] Update `templates/monolith/web/app/dashboard/page.tsx` to include `<Link href="/dashboard/billing">Manage billing</Link>` from `next/link`.
- [ ] **Task 4: Env docs**
  - [ ] Update `templates/monolith/_env.example` to add a `CLERK_BILLING_WEBHOOK_SIGNING_SECRET=` line with a comment explaining that it's used in Story 3.2.
- [ ] **Task 5: Tests**
  - [ ] Extend `EXPECTED_TEMPLATE_FILES` with the 2 new files.
  - [ ] Add content assertions per AC 11.
  - [ ] Update the env-keys test to include the new variable.
- [ ] **Task 6: Verification**
  - [ ] `npm run typecheck` / `npm run lint` / `npm run test` / `npm run build` pass.

## Dev Notes

### Architecture compliance

- **Clerk Billing is the billing provider** _(architecture.md)_. `<PricingTable />` is the official drop-in UI from `@clerk/nextjs` and handles the entire checkout flow including plan selection, Stripe redirect, and confirmation. Do **not** bolt on a separate Stripe integration.
- **The user's "tier" is sourced from the `user_roles` table**, not from Clerk's subscription status directly. Clerk's billing webhook (Story 3.2) keeps `user_roles` in sync. This separation lets RBAC work even if Clerk Billing is temporarily unreachable — the cached tier is authoritative.
- **Billing route lives under `/dashboard/billing`** — protected by the Story 2.3 middleware + layout.
- **Naming**: file `current-user.ts`, function `getCurrentUserWithRole`, type imported from the shared workspace.

### Critical implementation details

- **`<PricingTable />` config** lives in the Clerk dashboard, not in code. Users configure plans there after scaffold.
- **No new npm dependencies needed for 3.1** — `@clerk/nextjs` already ships `<PricingTable />`. The billing webhook (Story 3.2) may need `svix` for signature verification.
- **`getCurrentUserWithRole` reads from the DB** — acceptable latency for a server component page; do not memoize across requests (tokens are per-user).
- **Default to 'free' when no row exists** — new users won't have a `user_roles` row until the billing webhook (3.2) creates one. The defensive default ensures the UI doesn't crash.

### Project Structure Notes

```
templates/monolith/web/
├── app/
│   └── dashboard/
│       ├── layout.tsx                 # unchanged
│       ├── page.tsx                   # updated: link to /dashboard/billing
│       └── billing/
│           └── page.tsx               # NEW
└── lib/
    └── auth/
        └── current-user.ts            # NEW
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Generated Code Architecture]
- [Source: _bmad-output/planning-artifacts/prd.md#FR21, FR22, FR23]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors
- `npm run test` → 175/175 passing (4 new Story 3.1 tests)
- `npm run build` → 20.48 KB

### Completion Notes List

- **No new npm deps** — `@clerk/nextjs@7.0.11` already ships `<PricingTable />` which handles the end-to-end checkout flow.
- **Database is the source of truth for RBAC tier** — the billing page shows `current.role` from `user_roles` (not from Clerk subscription state directly). Story 3.2 webhook keeps this in sync.
- **`getCurrentUserWithRole()` helper**: centralized `auth() + getDb() + getUserRoleByClerkId()` chain with a defensive 'free' default so new sign-ups don't crash before the billing webhook has populated their row.
- **`server-only` guard** on `current-user.ts` — accidental import into a client component throws at build time.
- **Dashboard link added** — `/dashboard` → `/dashboard/billing` via `<Link href>`.
- **`CLERK_BILLING_WEBHOOK_SIGNING_SECRET` documented** in `_env.example` now so users set up the Clerk dashboard webhook config once; Story 3.2 uses the secret to verify incoming events.

### File List

**Created (2):**

- `templates/monolith/web/lib/auth/current-user.ts` — `getCurrentUserWithRole()` server helper
- `templates/monolith/web/app/dashboard/billing/page.tsx` — pricing page with `<PricingTable />`

**Modified (2):**

- `templates/monolith/web/app/dashboard/page.tsx` — added link to /dashboard/billing
- `templates/monolith/_env.example` — documented `CLERK_BILLING_WEBHOOK_SIGNING_SECRET`
- `tests/unit/templates-monolith.test.ts` — 4 new tests for the helper, page, link, and env doc

### Code Review Findings (Phase 3)

**No CRITICAL/HIGH findings.** Story 3.1 is a small surface area — two new files and three small modifications.

**MEDIUM (accepted as-is):**
- `getCurrentUserWithRole` crashes if `DATABASE_URL` isn't set. Acceptable — the template requires a DB to function, and Story 2.4 already documents the lazy-init tradeoff.
- No custom loading state on `/dashboard/billing`. Route-level `app/loading.tsx` from Story 2.1 covers it.

**LOW (deferred):**
- Raw role name displayed (`super_admin`) — Story 4.3 will style it.
- Dashboard link has no styling — Story 4.3.

**CRITICAL:** none.
