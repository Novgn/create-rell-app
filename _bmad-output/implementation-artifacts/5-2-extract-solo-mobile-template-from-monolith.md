# Story 5.2: Extract Solo Mobile Template from Monolith

Status: in-progress

## Story

As a developer who only needs a mobile app,
I want a Solo Mobile template that uses the same patterns as the monolith's mobile portion,
so that I get a lighter scaffold without web code.

## Acceptance Criteria

1. `templates/mobile/` exists with a self-contained Expo Router project extracted from `templates/monolith/mobile/`.
2. Shared DB schema + validation are inlined: `shared/db/` → `db/` at project root, `shared/validation/profile-form.ts` → `lib/validation/profile-form.ts`.
3. Every import from `@{{projectNameKebab}}/shared` is rewritten to a local alias (`@/db/schema`, `@/db/queries`, `@/db/client`, `@/lib/validation/profile-form`) where the mobile workspace supports the `@/` path alias (the existing `mobile/tsconfig.json` already defines `@/*: ['./*']`).
4. `package.json` at the root merges the monolith root's DX devDeps (eslint, prettier, husky, lint-staged, typescript-eslint, `@eslint/js`, `eslint-config-prettier`) with the existing mobile runtime + devDeps, plus `drizzle-orm`, `postgres`, `drizzle-kit` (previously in `shared`).
5. `tsconfig.json` is standalone — inlines the strict flags from `tsconfig.base.json` instead of extending it.
6. `_env.example` contains **only** the mobile (`EXPO_PUBLIC_*`) block.
7. `_gitignore` and `_husky/pre-commit` are copied byte-for-byte from the monolith.
8. A `README.md` is written for the Solo Mobile story (no references to `web/` or `shared/`).
9. A `drizzle.config.ts` is present at the root so `db:generate`/`db:migrate` commands work.
10. No references to `web/`, `shared/`, `workspaces`, or `@{{projectNameKebab}}/shared` remain.
11. Unit tests verify every expected file exists, imports have been rewritten, package.json shape is correct, and an end-to-end scaffold run produces a token-free output.
12. `npm test` passes with no regressions.

## Tasks / Subtasks

- [ ] Copy `templates/monolith/mobile/` → `templates/mobile/`
- [ ] Copy `templates/monolith/shared/db/*` → `templates/mobile/db/`
- [ ] Copy `templates/monolith/shared/validation/profile-form.ts` → `templates/mobile/lib/validation/profile-form.ts`
- [ ] Copy `_gitignore`, `_husky/pre-commit`
- [ ] Write standalone `package.json`, `tsconfig.json`, `_env.example`, `README.md`, `drizzle.config.ts`
- [ ] Rewrite imports in `mobile/lib/auth/use-role.ts`, `mobile/components/auth/RoleGate.tsx`, `mobile/components/forms/ProfileForm.tsx`
- [ ] Rewrite the db schema/queries/client comments referencing shared
- [ ] Add `tests/unit/templates-mobile.test.ts`
- [ ] Run full test suite

## Dev Notes

### Mobile-specific considerations

- `mobile/app.json` already uses `{{projectName}}` and `{{projectNameKebab}}` — no extraction changes needed.
- `mobile/db/client.ts` will work on React Native only in server-like contexts (e.g. Expo Router API routes). Most mobile consumers hit Supabase via the `useSupabaseClient` hook which talks to the HTTP API — the Drizzle client is still useful for migration scripts and edge functions, so we ship it.
- Drizzle Kit is a dev-time tool (runs in Node during migration generation), not at app runtime. That's fine even for a pure-mobile scaffold.
- The `mobile/lib/auth/use-role.ts` hook queries Supabase directly via the Clerk-authenticated client; it imports only a `type Role` from shared — a trivial rewrite to `@/db/schema`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Solo Mobile App Template]
- [Source: _bmad-output/planning-artifacts/prd.md#FR43 FR45]
