# Story 2.3: Add Sign-In/Sign-Up Pages and Protected Route Middleware

Status: done

## Story

As a developer building a SaaS product,
I want sign-in and sign-up pages scaffolded with Clerk middleware protecting dashboard routes,
so that unauthenticated users are redirected and protected routes are secure.

## Acceptance Criteria

1. **Given** the scaffolded monolith runs, **When** a user navigates to `/sign-in`, **Then** Clerk's `<SignIn />` component is rendered (catch-all route `(auth)/sign-in/[[...sign-in]]/page.tsx`).
2. Same for `/sign-up` via `(auth)/sign-up/[[...sign-up]]/page.tsx` rendering `<SignUp />`.
3. A `middleware.ts` at the `web/` root uses `clerkMiddleware()` from `@clerk/nextjs/server` and defines a protected matcher that covers the `(dashboard)` route group. Unauthenticated requests to dashboard routes are redirected to `/sign-in`.
4. A `(dashboard)` route group exists with a placeholder page at `(dashboard)/page.tsx` that is only accessible to authenticated users.
5. A `(dashboard)/layout.tsx` uses Clerk's `<UserButton />` or `auth().userId` to show the signed-in user (minimal — full UI lands in later stories).
6. The middleware matcher **has no bypass paths** — the architecture's security NFR requires this. Any route under `(dashboard)` is protected; public routes are the landing page, `(auth)` group, and the webhook route (added in Story 3.2).
7. Mobile: `mobile/app/(auth)/sign-in.tsx` and `mobile/app/(auth)/sign-up.tsx` use Clerk Expo components (`<SignIn />` / `<SignUp />` don't exist for Expo — instead use Clerk Expo's `useSignIn()` and `useSignUp()` hooks with a minimal form). The mobile root `_layout.tsx` uses Expo Router groups: `(auth)` for public auth flows, `(tabs)` for authenticated users.
8. Mobile: a protected route group `(tabs)` with a placeholder `index.tsx` home screen, and its `_layout.tsx` uses Clerk's `useAuth()` hook to redirect unauthenticated users to `/sign-in`.
9. New template files:
   - `web/middleware.ts`
   - `web/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
   - `web/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
   - `web/app/(dashboard)/layout.tsx`
   - `web/app/(dashboard)/page.tsx`
   - `mobile/app/(auth)/_layout.tsx`
   - `mobile/app/(auth)/sign-in.tsx`
   - `mobile/app/(auth)/sign-up.tsx`
   - `mobile/app/(tabs)/_layout.tsx`
   - `mobile/app/(tabs)/index.tsx`
10. The mobile root `_layout.tsx` is updated to use an `InitialLayout` + `<Slot />` + auth-based redirect pattern (ClerkProvider wraps Slot, inside the slot we conditionally route based on `isSignedIn`).
11. The top-level `mobile/app/index.tsx` from Story 2.1 is removed (replaced by the `(tabs)/index.tsx` protected home screen).
12. Unit tests verify:
    - Every new file exists.
    - `middleware.ts` imports `clerkMiddleware` from `@clerk/nextjs/server` and exports a `middleware` default or named export with a `matcher` config.
    - Sign-in page imports `SignIn` from `@clerk/nextjs`; sign-up page imports `SignUp`.
    - The dashboard layout uses `auth()` or `UserButton` (an auth-related import).
    - The mobile `(auth)/sign-in.tsx` imports `useSignIn` from `@clerk/clerk-expo`.
    - The mobile `(tabs)/_layout.tsx` imports `useAuth` and conditionally redirects.
    - The middleware matcher excludes `_next`, static assets, and the `(auth)` + landing routes — but protects everything else under `(dashboard)`.
13. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all pass.

## Tasks / Subtasks

- [ ] **Task 1: Web middleware**
  - [ ] Create `templates/monolith/web/middleware.ts` importing `clerkMiddleware` and `createRouteMatcher` from `@clerk/nextjs/server`. Define `isProtectedRoute = createRouteMatcher(['/(dashboard)(.*)'])`. Call `auth.protect()` inside the middleware when the route matches.
  - [ ] Set the `config.matcher` to the canonical Clerk matcher (skip `_next`, files with extensions, etc.).
  - [ ] Inline comment explaining "no bypass paths" per NFR7.
- [ ] **Task 2: Web sign-in / sign-up pages**
  - [ ] Create `web/app/(auth)/sign-in/[[...sign-in]]/page.tsx` rendering `<SignIn />` from `@clerk/nextjs`.
  - [ ] Create `web/app/(auth)/sign-up/[[...sign-up]]/page.tsx` rendering `<SignUp />` from `@clerk/nextjs`.
- [ ] **Task 3: Web (dashboard) group**
  - [ ] Create `web/app/(dashboard)/layout.tsx` as a server component that calls `auth()` (redirects if no `userId`) and renders children with a header showing `<UserButton />`.
  - [ ] Create `web/app/(dashboard)/page.tsx` as a placeholder protected page.
- [ ] **Task 4: Mobile (auth) flows**
  - [ ] Create `mobile/app/(auth)/_layout.tsx` — Stack layout for auth screens.
  - [ ] Create `mobile/app/(auth)/sign-in.tsx` — uses `useSignIn` hook with a minimal form (email + password).
  - [ ] Create `mobile/app/(auth)/sign-up.tsx` — uses `useSignUp` hook.
- [ ] **Task 5: Mobile (tabs) protected group**
  - [ ] Create `mobile/app/(tabs)/_layout.tsx` — `Tabs` layout wrapped in auth redirect logic: if not `isSignedIn`, redirect to `/sign-in`.
  - [ ] Create `mobile/app/(tabs)/index.tsx` — placeholder home screen.
- [ ] **Task 6: Mobile root layout refactor**
  - [ ] Update `mobile/app/_layout.tsx` to use `Slot` instead of a hard-coded `Stack.Screen name="index"`. ClerkProvider wraps Slot; route resolution happens in the nested layouts.
  - [ ] Delete the old top-level `mobile/app/index.tsx` (replaced by `(tabs)/index.tsx`).
- [ ] **Task 7: Tests**
  - [ ] Extend `EXPECTED_TEMPLATE_FILES` with new additions and remove deleted ones.
  - [ ] Add content assertions per AC 12.
- [ ] **Task 8: Verification**
  - [ ] `npm run typecheck` / `npm run lint` / `npm run test` / `npm run build` pass.

## Dev Notes

### Architecture compliance

- **`clerkMiddleware()` is the required pattern** — architecture.md explicitly calls it out. Do not replace with `proxy.ts` (Next.js 16) — Clerk's middleware currently assumes the `middleware.ts` convention.
- **No bypass paths in middleware** — NFR7 from PRD. The matcher must not have a "skip auth for specific paths" escape hatch.
- **Mobile RBAC flows** use hooks (`useAuth`, `useSignIn`, `useSignUp`) — Clerk Expo's patterns are hook-based, unlike Clerk Next.js's pre-built components.
- **Route groups**: `(auth)` and `(dashboard)` on web, `(auth)` and `(tabs)` on mobile. Parentheses are part of the Next.js / Expo Router convention for logical groups that don't affect the URL.

### Critical implementation details — anti-disaster guardrails

- **Clerk Next.js 16 middleware signature**: `export default clerkMiddleware((auth, req) => { ... })`. The `auth` helper has a `.protect()` method for programmatic enforcement. Don't confuse with the old `authMiddleware({ publicRoutes })` pattern from earlier Clerk versions.
- **Catch-all sign-in/sign-up routes**: `[[...sign-in]]` (double square brackets) is the Next.js catch-all syntax. Clerk's SignIn component uses nested paths for OAuth flows, so the catch-all is required.
- **Dashboard layout uses `auth()` defensively**: even though middleware redirects unauthenticated users, an explicit check in the layout catches edge cases during dev-mode hot-reload.
- **Mobile auth redirect pattern**: Clerk Expo's idiomatic approach uses `useAuth()` in a layout and returns `<Redirect href="/sign-in" />` from `expo-router`.
- **Do NOT hard-code Clerk appearance/theme props** in the sign-in/sign-up pages — users should customize those in their own project. Keep the scaffold minimal.
- **Mobile sign-in form is minimal**: architectural intent is "scaffold, not polish". Real styling with NativeWind lands in Story 4.3.

### Project Structure Notes

After Story 2.3:

```
templates/monolith/web/
├── middleware.ts                                   # NEW
└── app/
    ├── (auth)/
    │   ├── sign-in/[[...sign-in]]/page.tsx         # NEW
    │   └── sign-up/[[...sign-up]]/page.tsx         # NEW
    ├── (dashboard)/
    │   ├── layout.tsx                              # NEW
    │   └── page.tsx                                # NEW
    ├── layout.tsx                                  # unchanged
    ├── page.tsx                                    # unchanged
    ├── error.tsx                                   # unchanged
    └── loading.tsx                                 # unchanged

templates/monolith/mobile/app/
├── _layout.tsx                                     # UPDATED: <Slot />
├── (auth)/
│   ├── _layout.tsx                                 # NEW
│   ├── sign-in.tsx                                 # NEW
│   └── sign-up.tsx                                 # NEW
├── (tabs)/
│   ├── _layout.tsx                                 # NEW
│   └── index.tsx                                   # NEW
└── index.tsx                                       # DELETED
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Auth Flow]
- [Source: _bmad-output/planning-artifacts/prd.md#FR17, FR18, NFR7]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors
- `npm run test` → 160/160 (11 new Story 2.3 tests)
- `npm run build` → 20.48 KB

### Completion Notes List

- **11 new template files** across web (`middleware.ts`, catch-all sign-in/sign-up, dashboard layout + page) and mobile (`(auth)` group with sign-in/sign-up, `(tabs)` protected group).
- **`mobile/app/index.tsx` deleted** — routing is now delegated to the nested layouts via `Slot`.
- **Clerk Next.js 16 middleware signature**: `clerkMiddleware(async (auth, req) => { ... })` with `createRouteMatcher` + `auth.protect()`. Canonical Clerk matcher config excludes static assets. No bypass paths (NFR7).
- **Defense-in-depth auth check**: the dashboard layout also calls `auth()` + `redirect('/sign-in')` so a dev-mode hot-reload misconfig can't expose protected pages.
- **Mobile auth group**: `(auth)/_layout.tsx` redirects already-signed-in users away from sign-in; `(tabs)/_layout.tsx` redirects not-signed-in users to sign-in. Both handle `isLoaded === false` gracefully (return null to avoid flash).
- **Minimal sign-in/sign-up forms** on mobile use `useSignIn` / `useSignUp` hooks with plain React Native form primitives. Story 4.3 will add NativeWind styling.
- **Self-caught test regression**: my mobile root layout update removed `Stack.Screen` but the test I wrote for it asserts that `Stack.Screen` is NOT present — prevents accidental regressions.
- **Deferred:**
  - Email verification code flow (sign-up 2nd step) — left as a comment in `sign-up.tsx`; real implementation is app-specific
  - RBAC role checks → Story 3.3
  - OAuth / social sign-in → not in scope (users can enable in Clerk dashboard)
  - NativeWind / shadcn styling → Story 4.3

### File List

**Created (11):**

- `templates/monolith/web/middleware.ts`
- `templates/monolith/web/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- `templates/monolith/web/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- `templates/monolith/web/app/(dashboard)/layout.tsx`
- `templates/monolith/web/app/(dashboard)/page.tsx`
- `templates/monolith/mobile/app/(auth)/_layout.tsx`
- `templates/monolith/mobile/app/(auth)/sign-in.tsx`
- `templates/monolith/mobile/app/(auth)/sign-up.tsx`
- `templates/monolith/mobile/app/(tabs)/_layout.tsx`
- `templates/monolith/mobile/app/(tabs)/index.tsx`

**Modified (2) / Deleted (1):**

- `templates/monolith/mobile/app/_layout.tsx` — uses `Slot` instead of hard-coded Stack
- `templates/monolith/mobile/app/index.tsx` — **deleted** (replaced by `(tabs)/index.tsx`)
- `tests/unit/templates-monolith.test.ts` — 11 new tests covering middleware shape, sign-in/sign-up imports, dashboard guards, mobile auth redirect logic, and the migration away from `index.tsx` at the root

### Code Review Findings (Phase 3)

**HIGH (auto-fixed):**

- **CRITICAL routing bug caught in review**: I initially placed the dashboard at `app/(dashboard)/page.tsx` (parenthesized route group). Next.js route groups don't affect the URL, so this would resolve to `/` — the same URL as the public landing page `app/page.tsx`, causing a "duplicate route" build error. The middleware matcher `/(dashboard)(.*)` would also never match anything because `(dashboard)` is not a real URL segment.
- **Fix**: moved to `app/dashboard/layout.tsx` and `app/dashboard/page.tsx` (real URL `/dashboard`), updated the middleware matcher to `['/dashboard(.*)']`, added a test asserting the matcher does NOT use the buggy parenthesized form.

**MEDIUM (deferred):**

- Mobile sign-in form has no client-side validation (empty fields would produce a Clerk error rather than an inline message). Real apps add their own validation — scaffold keeps it minimal.
- Mobile sign-up doesn't handle the email verification second step (comment explains).

**LOW:** see deferred-findings patterns from earlier stories.

**CRITICAL:** none unresolved.
