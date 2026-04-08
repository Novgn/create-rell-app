# Story 2.2: Add Clerk Authentication with Native Supabase Third-Party Auth

Status: review

## Story

As a developer building a SaaS product,
I want Clerk authentication wired with Supabase via native 3P auth,
so that my users can sign in and Supabase RLS policies trust Clerk tokens.

## Acceptance Criteria

1. **Given** the monolith template is scaffolded, **When** the generated web app starts, **Then** `<ClerkProvider>` wraps the root layout.
2. A browser-side Supabase client is initialized with an `accessToken` callback that returns `session?.getToken() ?? null`. The callback uses Clerk's `useSession()` hook (or equivalent client-side Clerk API).
3. A server-side Supabase client is initialized with an `accessToken` callback that returns `(await auth()).getToken() ?? null` using `@clerk/nextjs/server.auth()`.
4. The **deprecated** `getToken({ template: 'supabase' })` pattern is NOT present anywhere in the generated project. A test greps the scaffold output and fails if it finds the string `template: 'supabase'` or `template: "supabase"`.
5. RLS policy examples in the template reference `auth.jwt()->>'sub'` (or equivalent) to match the Clerk user ID — these live in SQL migration files or comments in `shared/db/schema.ts` and will be exercised fully in Story 2.4. For Story 2.2 we add a single note / comment and the client patterns.
6. `_env.example` documents every required Clerk + Supabase key:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL` (forward-looking for Drizzle in 2.4)
7. The monolith template's web `package.json` gains pinned `@clerk/nextjs` and `@supabase/supabase-js` dependencies.
8. The mobile template's `package.json` gains pinned `@clerk/clerk-expo` and `@supabase/supabase-js` dependencies (Clerk Expo integration is the mobile counterpart; the `accessToken` callback pattern is mirrored).
9. New template files:
   - `web/lib/supabase/client.ts` — browser client with Clerk `accessToken` callback
   - `web/lib/supabase/server.ts` — server client with `auth().getToken()` callback
   - `web/lib/env.ts` — runtime env validation for required keys (throws clear error if missing)
   - `mobile/lib/supabase/client.ts` — mobile browser-ish client with Clerk Expo `getToken()` callback
   - `mobile/lib/env.ts` — mirror for mobile
10. The web root `app/layout.tsx` is updated to wrap `{children}` with `<ClerkProvider>` imported from `@clerk/nextjs`.
11. The mobile root `app/_layout.tsx` is updated to wrap the `Stack` with `<ClerkProvider>` imported from `@clerk/clerk-expo` (Clerk Expo requires a `tokenCache` prop; use `expo-secure-store`-backed cache).
12. Inline comments explain the **native 3P auth** approach and call out that the deprecated JWT-template pattern must not be used.
13. Unit tests verify:
    - Every new template file exists.
    - `web/lib/supabase/client.ts` imports `createClient` from `@supabase/supabase-js` and uses the `accessToken` callback.
    - `web/lib/supabase/server.ts` imports `auth` from `@clerk/nextjs/server`.
    - Neither file contains the string `'supabase'` or `"supabase"` inside a `getToken({ template: ... })` pattern.
    - `web/app/layout.tsx` imports `ClerkProvider` from `@clerk/nextjs` and wraps children.
    - `_env.example` documents all 5 required keys.
    - End-to-end scaffold still produces no leftover tokens.
14. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all pass.

## Tasks / Subtasks

- [ ] **Task 1: Pin Clerk + Supabase deps**
  - [ ] Update `templates/monolith/web/package.json`: add `"@clerk/nextjs": "7.0.11"`, `"@supabase/supabase-js": "2.102.1"`.
  - [ ] Update `templates/monolith/mobile/package.json`: add `"@clerk/clerk-expo": "2.19.31"`, `"@supabase/supabase-js": "2.102.1"`, `"expo-secure-store": "15.0.8"` (or current stable — verify).
- [ ] **Task 2: Web Supabase clients**
  - [ ] Create `templates/monolith/web/lib/env.ts` — reads & validates `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc. Throws a friendly error on missing keys at module-load time.
  - [ ] Create `templates/monolith/web/lib/supabase/client.ts` — browser Supabase client using `accessToken: async () => session?.getToken() ?? null`. Exports a `useSupabaseClient()` hook that pulls `session` from `useSession()` and memoizes the client.
  - [ ] Create `templates/monolith/web/lib/supabase/server.ts` — server Supabase client using `accessToken: async () => (await auth()).getToken() ?? null`.
- [ ] **Task 3: Mobile Supabase client**
  - [ ] Create `templates/monolith/mobile/lib/env.ts` — reads `process.env.EXPO_PUBLIC_SUPABASE_URL`, etc. (Expo public prefix).
  - [ ] Create `templates/monolith/mobile/lib/supabase/client.ts` — mobile Supabase client using Clerk Expo's `useAuth()` hook for the token callback.
- [ ] **Task 4: ClerkProvider wiring**
  - [ ] Update `templates/monolith/web/app/layout.tsx` to wrap children with `<ClerkProvider>`.
  - [ ] Update `templates/monolith/mobile/app/_layout.tsx` to wrap `<Stack>` with `<ClerkProvider>` and supply a `tokenCache` backed by `expo-secure-store`. Add a `tokenCache.ts` helper in `mobile/lib/`.
- [ ] **Task 5: .env.example keys**
  - [ ] Update `templates/monolith/_env.example` to include the 5 required keys with descriptions. Add a second section for `EXPO_PUBLIC_*` variants for the mobile side.
- [ ] **Task 6: Tests in `tests/unit/templates-monolith.test.ts`**
  - [ ] Extend `EXPECTED_TEMPLATE_FILES` with the new files.
  - [ ] Add content assertions for each new file.
  - [ ] Add a "no deprecated JWT template pattern" assertion that walks every text file and verifies no `getToken({ template: ... })` usage.
  - [ ] Add `.env.example` key assertions.
- [ ] **Task 7: Verification**
  - [ ] `npm run typecheck` / `npm run lint` / `npm run test` / `npm run build` pass.

## Dev Notes

### Architecture compliance

- **Native 3P auth is mandatory** _(architecture.md "Supabase Auth Integration")_. The deprecated `getToken({ template: 'supabase' })` pattern was phased out in April 2025. All template files use the `accessToken` callback form.
- **Pin versions exact** _(NFR16)_. Verify `expo-secure-store` version via `npm view` before pinning.
- **Naming**: `kebab-case.ts` files, `camelCase` functions, `PascalCase` types.
- **Environment variable prefix**: web uses `NEXT_PUBLIC_` for browser-safe values; mobile uses `EXPO_PUBLIC_` (Expo's convention).

### Critical implementation details — anti-disaster guardrails

- **`<ClerkProvider>` on the web lives in a Server Component** (the root `app/layout.tsx`). Clerk's Next.js 16 provider is designed to be placed server-side. No `'use client'` directive needed at the root layout.
- **`useSession()` is a client-side hook**, so the browser Supabase client wrapper must be a client component. Use a thin hook module that returns a memoized client.
- **Server-side Supabase client must NOT be imported into client components** — doing so leaks the service role key. Document this in a comment at the top of `server.ts`.
- **mobile tokenCache must survive app restarts** — use `expo-secure-store` for secure persistence. Document why in a comment.
- **`.env.example` is the contract**: if a key is added here, it must also be read/validated in `lib/env.ts`. Keep them in sync.
- **No running builds**: this is all template text, not CLI source. Unit tests verify file shape; runtime verification is Story 6.1.

### Pinned version targets (verified 2026-04-08)

| Package | Pin | Context |
|---|---|---|
| `@clerk/nextjs` | 7.0.11 | Next.js 16 compatible |
| `@clerk/clerk-expo` | 2.19.31 | Expo SDK 55 compatible |
| `@supabase/supabase-js` | 2.102.1 | Supports `accessToken` callback |
| `expo-secure-store` | TBD — run `npm view expo-secure-store version` |

### Project Structure Notes

New template files:

```
templates/monolith/
├── _env.example                  # updated with 5 keys
├── web/
│   ├── app/layout.tsx            # updated: <ClerkProvider>
│   ├── lib/
│   │   ├── env.ts                # NEW
│   │   └── supabase/
│   │       ├── client.ts         # NEW
│   │       └── server.ts         # NEW
└── mobile/
    ├── app/_layout.tsx           # updated: <ClerkProvider> + tokenCache
    └── lib/
        ├── env.ts                # NEW
        ├── token-cache.ts        # NEW
        └── supabase/
            └── client.ts         # NEW
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2: Add Clerk Authentication with Native Supabase Third-Party Auth]
- [Source: _bmad-output/planning-artifacts/architecture.md#Supabase Auth Integration (Critical)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Generated Code — Auth Flow (Native 3P Auth — NOT deprecated JWT templates)]
- [Source: _bmad-output/planning-artifacts/prd.md#FR16, FR17, FR18, FR19, FR20]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors
- `npm run test` → 148/148 passing (12 new Clerk + Supabase tests)
- `npm run build` → 20.48 KB (templates not bundled)

### Completion Notes List

- **Pinned versions** (verified 2026-04-08):
  - `@clerk/nextjs@7.0.11`
  - `@clerk/clerk-expo@2.19.31`
  - `@supabase/supabase-js@2.102.1`
  - `expo-secure-store@55.0.12`
- **Native 3P auth everywhere**: web browser client uses `useSession() → accessToken callback`, web server client uses `auth() → getToken()`, mobile client uses `useAuth() → getToken()`.
- **`server-only` guard**: `web/lib/supabase/server.ts` imports `'server-only'` at the top so the module cannot be bundled into a client component (leaks protection).
- **`expo-secure-store` token cache**: mobile's `token-cache.ts` persists Clerk tokens in Keychain/Keystore instead of AsyncStorage (which is unencrypted).
- **Self-catching test**: the "no deprecated JWT pattern" test caught my own warning comments that literally contained `getToken({ template: 'supabase' })` — rephrased the comments to describe the pattern in prose.
- **Env validation fail-fast**: `web/lib/env.ts` and `mobile/lib/env.ts` throw at import time if any required key is missing. Matches the architecture's "integration correctness" NFR — a missing env var surfaces during `next build` instead of a runtime crash.
- **Deferred to later stories**:
  - Sign-in/sign-up pages + middleware → 2.3
  - Drizzle schema + RLS policies → 2.4
  - Role-based RBAC → 3.3

### File List

**Created (6):**

- `templates/monolith/web/lib/env.ts`
- `templates/monolith/web/lib/supabase/client.ts`
- `templates/monolith/web/lib/supabase/server.ts`
- `templates/monolith/mobile/lib/env.ts`
- `templates/monolith/mobile/lib/token-cache.ts`
- `templates/monolith/mobile/lib/supabase/client.ts`

**Modified (5):**

- `templates/monolith/web/package.json` — `@clerk/nextjs`, `@supabase/supabase-js` pinned
- `templates/monolith/mobile/package.json` — `@clerk/clerk-expo`, `@supabase/supabase-js`, `expo-secure-store` pinned
- `templates/monolith/web/app/layout.tsx` — wraps children with `<ClerkProvider>`
- `templates/monolith/mobile/app/_layout.tsx` — wraps Stack with `<ClerkProvider>` + tokenCache
- `templates/monolith/_env.example` — 5 web keys + 3 mobile keys documented
- `templates/monolith/README.md` — auth notes updated
- `tests/unit/templates-monolith.test.ts` — 12 new tests covering ClerkProvider imports, Supabase client shape, env validation, pinned deps, and the no-deprecated-pattern sweep
