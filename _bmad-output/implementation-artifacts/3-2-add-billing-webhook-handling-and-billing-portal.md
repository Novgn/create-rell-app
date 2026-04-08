# Story 3.2: Add Billing Webhook Handling and Billing Portal

Status: done

## Story

As a developer building a subscription SaaS,
I want webhook handling for billing lifecycle events and a billing portal redirect,
so that subscription changes are processed and users can manage their billing.

## Acceptance Criteria

1. **Given** the billing webhook endpoint exists at `app/api/webhooks/clerk-billing/route.ts`, **When** Clerk sends subscription lifecycle webhooks, **Then** the webhook handler validates the request signature **before** processing the payload.
2. Signature validation uses `svix` (Clerk's webhook library under the hood). The `CLERK_BILLING_WEBHOOK_SIGNING_SECRET` env var is read and used to verify each event.
3. The handler processes at least these event types:
   - `user.created` — upsert `user_roles` row with default `'free'` tier
   - `subscription.created` / `subscription.updated` — upsert `user_roles` row with tier derived from the plan (e.g. plan with `features.includes('paid_tier')` → `'paid'`)
   - `subscription.cancelled` / `subscription.deleted` — downgrade to `'free'`
4. Unknown event types are logged and return `200 OK` so Clerk doesn't retry forever. Signature-validated but unrecognized events are safe to ignore.
5. The handler returns appropriate HTTP status codes:
   - `200 OK` on successful processing (including no-op for unknown events)
   - `400 Bad Request` on signature validation failure
   - `500 Internal Server Error` on DB write failure
6. Errors are logged server-side. The response body is generic (`{ error: 'message' }`) — no internal details leak to the caller.
7. Inline comments explain:
   - Why signature validation must run **before** JSON parsing (timing attacks + guards against malformed bodies)
   - How the plan-to-role mapping works
   - The expected Clerk dashboard configuration (URL + event types to subscribe to)
8. A billing portal redirect exists: `app/dashboard/billing/manage/page.tsx` (or similar) renders a server component that computes the Clerk portal URL for the current user and redirects via `next/navigation.redirect()`. Clerk Billing doesn't ship a dedicated portal — instead it exposes account management inside the Clerk `<UserButton />`. So the "manage" route can simply link to the Clerk profile URL. Document this.
9. Because Clerk Billing ties account management to Clerk's own UI (`<UserButton />` shows billing by default when Clerk Billing is configured), the "billing portal" requirement is satisfied by the existing `<UserButton />` in the dashboard layout. **Document this decision in the billing page and skip the separate manage route.**
10. New template files:
    - `templates/monolith/web/app/api/webhooks/clerk-billing/route.ts`
    - `templates/monolith/web/lib/billing/event-handler.ts` — pure function that takes a validated event and returns an action to apply to the DB (exported so the route handler is a thin shell)
    - `templates/monolith/web/lib/billing/plan-to-role.ts` — helper mapping Clerk plan identifiers to `Role`
11. Template adds `svix` pinned exact to `web/package.json` dependencies.
12. Unit tests verify:
    - Every new file exists
    - The route handler validates the signature before parsing
    - The route handler imports `svix` (or similar) for signature verification
    - `plan-to-role.ts` maps at least one known plan to `'paid'` and defaults unknown plans to `'free'`
    - Unknown event types return 200
    - The route handler calls `setUserRole` from the shared package
13. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all pass.

## Tasks / Subtasks

- [ ] **Task 1: Pin svix dep**
  - [ ] Add `"svix": "1.90.0"` to `templates/monolith/web/package.json`.
- [ ] **Task 2: Plan-to-role helper**
  - [ ] Create `templates/monolith/web/lib/billing/plan-to-role.ts` exporting `planToRole(planKey: string | undefined): Role` that maps known plan keys to roles. Default unknown/missing → `'free'`.
- [ ] **Task 3: Event handler**
  - [ ] Create `templates/monolith/web/lib/billing/event-handler.ts` exporting `handleBillingEvent(event): Promise<{ processed: boolean; role: Role | null }>`:
    - Takes a typed event object shape
    - Branches on `event.type`
    - For each recognized type, computes the target `Role` and calls `setUserRole(getDb(), clerkUserId, role)`
    - Returns `processed: true` with the applied role, or `processed: false` for unknown types
- [ ] **Task 4: Route handler**
  - [ ] Create `templates/monolith/web/app/api/webhooks/clerk-billing/route.ts` exporting `POST`:
    - Reads raw body via `req.text()` BEFORE JSON parsing
    - Reads headers `svix-id`, `svix-timestamp`, `svix-signature`
    - Constructs `new Webhook(env.clerk.billingWebhookSigningSecret)` from `svix`
    - Calls `wh.verify(body, { 'svix-id': ..., 'svix-timestamp': ..., 'svix-signature': ... })` — throws on bad signature
    - Catches signature errors → returns 400
    - On success, passes the verified event to `handleBillingEvent()`
    - Returns 200 on success, 500 on DB error
- [ ] **Task 5: env.ts update**
  - [ ] Add `billingWebhookSigningSecret: required('CLERK_BILLING_WEBHOOK_SIGNING_SECRET')` to `web/lib/env.ts`'s `clerk` object.
- [ ] **Task 6: Billing page note**
  - [ ] Update `web/app/dashboard/billing/page.tsx` to include a short note explaining that subscription management happens via the `<UserButton />` in the header (Clerk Billing's native UI).
- [ ] **Task 7: Tests**
  - [ ] Extend `EXPECTED_TEMPLATE_FILES` with the 3 new files.
  - [ ] Add content assertions per AC 12.
- [ ] **Task 8: Verification**
  - [ ] All commands pass.

## Dev Notes

### Architecture compliance

- **Signature validation is mandatory** _(PRD NFR6)_. Must run before processing the event body.
- **Clerk Billing uses svix** for webhook signing — same library Clerk uses for all its webhooks.
- **DB writes use the shared `setUserRole` query helper** — single code path for all role mutations.
- **Service-role RLS bypass**: the webhook runs server-side and reads the `DATABASE_URL` directly, which uses the Supabase service role credentials. RLS policies in Story 2.4 block authenticated clients from writing to `user_roles`; the service-role path is the only way to mutate the table.

### Critical implementation details

- **Read raw body FIRST**: `req.text()` before any JSON parsing. `svix.verify()` needs the raw string to compute the HMAC; parsing + re-serializing would produce a different string and fail verification.
- **Svix headers are lower-case**: `svix-id`, `svix-timestamp`, `svix-signature`.
- **Clerk dashboard config**: users add the webhook URL (`https://<host>/api/webhooks/clerk-billing`) in the Clerk Billing section of their dashboard and copy the signing secret into `.env.local`.
- **No retry logic in the handler** — svix handles retries by replaying on non-2xx responses. Just return the right status code.
- **Log errors without leaking**: `console.error('[clerk-billing webhook]', err)` server-side, `return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })` to the caller.

### Project Structure Notes

```
templates/monolith/web/
├── app/
│   └── api/
│       └── webhooks/
│           └── clerk-billing/
│               └── route.ts              # NEW
└── lib/
    ├── billing/
    │   ├── event-handler.ts               # NEW
    │   └── plan-to-role.ts                # NEW
    └── env.ts                             # UPDATED
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Generated Code — API Routes]
- [Source: _bmad-output/planning-artifacts/prd.md#FR24, FR25, NFR6]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors
- `npm run test` → 186/186 (11 new Story 3.2 tests)
- `npm run build` → 20.48 KB

### Completion Notes List

- **Pinned `svix@1.90.0`** — Clerk's underlying webhook signing library.
- **Three-file structure**: `plan-to-role.ts` (pure mapping), `event-handler.ts` (pure-ish business logic with DB writes), `route.ts` (thin signature-verification shell). Separation makes each layer unit-testable in isolation.
- **Signature verification runs BEFORE any JSON parsing** — `req.text()` first, then `Webhook(secret).verify(rawBody, headers)`. Parse + re-serialize would produce different bytes and fail HMAC.
- **Unknown plan keys default to 'free'** (least privilege) with a server-side warning log. A typo in the Clerk dashboard can't accidentally promote users.
- **Unknown event types return 200 OK** so svix doesn't retry forever during SDK upgrades.
- **Generic error responses** — 400 for `Invalid signature`, 500 for `Webhook processing failed`. Never leak internal stack traces to the caller.
- **Billing portal decision**: Clerk Billing exposes subscription management inside the Clerk `<UserButton />` UI. We document this in the billing page instead of building a separate portal redirect route.
- **Deferred**:
  - Idempotency check (same svix-id processed twice) → Story 4.4 or production hardening. Current implementation is idempotent because `setUserRole` uses upsert.
  - Webhook event logging table → Epic 4 or polish.

### File List

**Created (3):**

- `templates/monolith/web/lib/billing/plan-to-role.ts` — pure plan-to-Role mapper
- `templates/monolith/web/lib/billing/event-handler.ts` — branching logic + DB writes, `server-only` guarded
- `templates/monolith/web/app/api/webhooks/clerk-billing/route.ts` — POST handler with svix verification

**Modified (3):**

- `templates/monolith/web/package.json` — added `svix@1.90.0`
- `templates/monolith/web/lib/env.ts` — added `clerk.billingWebhookSigningSecret`
- `templates/monolith/web/app/dashboard/billing/page.tsx` — added Clerk `<UserButton />` note
- `tests/unit/templates-monolith.test.ts` — 11 new tests covering pinned svix, env key, plan mapping, event branches, raw-body requirement, signature failure path, generic error responses, and the UserButton note

### Code Review Findings (Phase 3)

**HIGH (auto-fixed):**

- **Browser-side secret-env crash**: `web/lib/env.ts` was imported by the browser Supabase client (Story 2.2) and called `required('CLERK_SECRET_KEY')` at module evaluation. Next.js replaces `process.env.NEXT_PUBLIC_*` at build but leaves other `process.env.X` as `undefined` in the browser — so every browser-side import would throw. Story 3.2 added yet another server-only key, making the bug harder to ignore.
- **Fix**: split `env.ts` into:
  - `lib/env.ts` — browser-safe, only `NEXT_PUBLIC_*` values
  - `lib/env-server.ts` — `import 'server-only'` guard, all secret values (CLERK_SECRET_KEY, CLERK_BILLING_WEBHOOK_SIGNING_SECRET, DATABASE_URL)
- Webhook route updated to import `serverEnv` from `env-server.ts`.
- Added a test asserting `env.ts` contains only `NEXT_PUBLIC_*` keys and never references server secrets.

**MEDIUM:** none requiring fix.

**LOW:** deferred per earlier stories.

**CRITICAL:** none.
