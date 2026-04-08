# Story 2.1: Create Monolith Template Base Structure

Status: done

## Story

As a developer scaffolding a full-stack monolith,
I want the template to generate a project with Next.js web, Expo mobile, and shared directories,
so that I have a properly structured monorepo to build on.

## Acceptance Criteria

1. **Given** the CLI scaffolds the monolith template, **When** scaffold completes, **Then** the output project contains top-level `web/`, `mobile/`, and `shared/` directories.
2. The root `package.json` has `"workspaces": ["web", "mobile", "shared"]`, private: true, no application code at the root.
3. A `tsconfig.base.json` at the root provides shared TypeScript configuration extended by `web/tsconfig.json`, `mobile/tsconfig.json`, and `shared/tsconfig.json`.
4. `web/` is a valid Next.js 16 App Router project skeleton:
   - `package.json` with pinned `next`, `react`, `react-dom`, `@types/*` versions
   - `next.config.ts` (TypeScript config per Next.js 16 convention)
   - `app/layout.tsx` (root layout, placeholder with `{{projectName}}` in the title)
   - `app/page.tsx` (landing page)
   - `app/error.tsx` (global error boundary)
   - `app/loading.tsx` (global loading state with skeleton placeholder)
   - `app/globals.css` (Tailwind entry point comment — Tailwind config lands in Story 4.3)
   - `tsconfig.json` extends the root base
   - `next-env.d.ts`
5. `mobile/` is a valid Expo 55 project skeleton with Expo Router:
   - `package.json` with pinned `expo`, `expo-router`, `react`, `react-native` versions
   - `app.json` with `{{projectName}}` in `name` and `{{projectNameKebab}}` in `slug`
   - `app/_layout.tsx` (root layout using Expo Router `Stack`)
   - `app/index.tsx` (home screen)
   - `tsconfig.json` extends the root base
   - `babel.config.js` with the Expo preset
6. `shared/` is a workspace package importable from both web and mobile:
   - `package.json` with `"name": "@{{projectNameKebab}}/shared"` and `"main": "./index.ts"`
   - `index.ts` (barrel export — empty for now; Drizzle schema lands in Story 2.4)
   - `tsconfig.json` extends the root base
7. A root `_gitignore` and `_env.example` are included (the scaffold engine renames them to `.gitignore` and `.env.example` on output). The `_env.example` has a header comment explaining that env keys land in Story 2.2.
8. A root `README.md` documents the workspace layout and basic commands using the `{{pmInstallCmd}}`, `{{pmRunCmd}}` tokens from Story 1.4.
9. All template files use `{{projectName}}` / `{{projectNameKebab}}` / `{{pmInstallCmd}}` / `{{pmRunCmd}}` / `{{pmExecCmd}}` tokens where the architecture requires a user-specific or package-manager-specific value.
10. Unit tests verify:
    - Every expected file path exists under `templates/monolith/`.
    - `templates/monolith/package.json` contains the `workspaces` field.
    - `templates/monolith/web/package.json` pins Next.js / React versions (no floating ranges).
    - `templates/monolith/mobile/package.json` pins Expo / React Native versions.
    - `templates/monolith/shared/package.json` has the `@{{projectNameKebab}}/shared` name.
    - The `{{projectName}}` token appears in expected locations (root package.json `name`, web `app/layout.tsx` metadata, mobile `app.json` name, etc.).
    - An end-to-end scaffold via `scaffoldProject` produces a project with no `{{...}}` tokens left un-replaced in any file.
11. `runCli` now successfully scaffolds into a real temp dir using the monolith template — verified by an integration-style test that uses the CLI's actual `templatesDir` resolver, the real `scaffoldProject`, and `installDeps: false` to avoid spawning a real package manager.
12. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all pass.
13. All previous tests still pass (no regressions). Scaffold placeholder-only test (the "template not yet bundled" path from Story 1.3) is updated to use a template name that still doesn't exist — the monolith now does exist.

## Tasks / Subtasks

- [ ] **Task 1: Root monolith files (AC 1, 2, 3, 7, 8, 9)**
  - [ ] Create `templates/monolith/package.json` with `"name": "{{projectName}}"`, `"private": true`, `"workspaces": ["web", "mobile", "shared"]`, engines.node `>=22`, scripts forwarding to workspaces.
  - [ ] Create `templates/monolith/tsconfig.base.json` with strict mode, ES2023, ESNext module, moduleResolution bundler.
  - [ ] Create `templates/monolith/_gitignore` covering Node, Next.js, Expo, macOS, env files.
  - [ ] Create `templates/monolith/_env.example` with a header comment and placeholders for keys that Story 2.2 will populate.
  - [ ] Create `templates/monolith/README.md` referencing `{{projectName}}`, the workspace layout, and `{{pmInstallCmd}}` / `{{pmRunCmd}}` tokens.
- [ ] **Task 2: Web workspace (AC 4, 9)**
  - [ ] Create `templates/monolith/web/package.json` with `"name": "{{projectName}}-web"`, pinned `next@16.2.2`, `react@19.2.4`, `react-dom@19.2.4`, dev-deps `typescript@6.0.2`, `@types/node@25.5.2`, `@types/react@19.2.14`, `@types/react-dom@19.2.3`. Include `dev`, `build`, `start`, `lint` scripts.
  - [ ] Create `templates/monolith/web/next.config.ts` — minimal TypeScript config exporting `NextConfig`.
  - [ ] Create `templates/monolith/web/tsconfig.json` — extends root `../tsconfig.base.json`, includes Next.js defaults.
  - [ ] Create `templates/monolith/web/next-env.d.ts` — standard Next.js reference directives.
  - [ ] Create `templates/monolith/web/app/layout.tsx` — root layout exporting `metadata: { title: '{{projectName}}' }`, empty children wrapper.
  - [ ] Create `templates/monolith/web/app/page.tsx` — placeholder landing page with a `{{projectName}}` heading.
  - [ ] Create `templates/monolith/web/app/error.tsx` — client component error boundary.
  - [ ] Create `templates/monolith/web/app/loading.tsx` — skeleton-ish loading state (shadcn lands in 4.3; use plain divs for now).
  - [ ] Create `templates/monolith/web/app/globals.css` — empty CSS file with a comment noting Tailwind goes in 4.3.
- [ ] **Task 3: Mobile workspace (AC 5, 9)**
  - [ ] Create `templates/monolith/mobile/package.json` with `"name": "{{projectName}}-mobile"`, pinned `expo@55.0.12`, `expo-router@55.0.11`, `react@19.2.4`, `react-native@0.85.0`. Include `start`, `android`, `ios`, `web` scripts.
  - [ ] Create `templates/monolith/mobile/app.json` with `expo.name = "{{projectName}}"`, `expo.slug = "{{projectNameKebab}}"`, scheme `{{projectNameKebab}}`.
  - [ ] Create `templates/monolith/mobile/babel.config.js` with the Expo preset.
  - [ ] Create `templates/monolith/mobile/tsconfig.json` extending the root base, with Expo paths.
  - [ ] Create `templates/monolith/mobile/app/_layout.tsx` — Expo Router `Stack` root.
  - [ ] Create `templates/monolith/mobile/app/index.tsx` — home screen with a `{{projectName}}` heading using `Text` + `View`.
- [ ] **Task 4: Shared workspace (AC 6)**
  - [ ] Create `templates/monolith/shared/package.json` with `"name": "@{{projectNameKebab}}/shared"`, `"main": "./index.ts"`, private: true.
  - [ ] Create `templates/monolith/shared/tsconfig.json` extending the root base.
  - [ ] Create `templates/monolith/shared/index.ts` — empty barrel with a comment pointing to Story 2.4 for the Drizzle schema.
- [ ] **Task 5: Unit tests in `tests/unit/templates-monolith.test.ts` (AC 10, 11)**
  - [ ] Test that every expected template file exists (use `fs.pathExists` against a static list).
  - [ ] Test that the root package.json contains `"workspaces"` and `{{projectName}}`.
  - [ ] Test that `web/package.json` pins Next.js/React to exact versions (regex `^\d+\.\d+\.\d+$`, no `^`/`~`).
  - [ ] Test that `mobile/package.json` pins Expo/React Native to exact versions.
  - [ ] Test that `shared/package.json` has the scoped name pattern.
  - [ ] End-to-end test: scaffold the monolith into a temp dir with `scaffoldProject`, recursively grep for any remaining `{{...}}` tokens, fail if found.
  - [ ] Integration-style test: call `runCli('my-app', { template: 'monolith', pm: 'pnpm' }, { installDeps: false, templatesDir: <resolved default>, targetDirOverride })` and assert the files are present.
- [ ] **Task 6: Verification (all ACs)**
  - [ ] `npm run typecheck` → 0 errors.
  - [ ] `npm run lint` → 0 errors.
  - [ ] `npm run test` → all pass.
  - [ ] `npm run build` → builds cleanly.
  - [ ] Manual: inspect `dist/` to confirm tsup bundle still small (templates are not bundled into the CLI JS).

## Dev Notes

### Architecture compliance

- **Templates are not buildable in this repo.** The template files contain `{{projectName}}` tokens and reference packages we do not install in the CLI repo. Lint/typecheck/test ignore `templates/**` (eslint.config.js already excludes it). Runtime validation of the generated project is Story 6.1 (smoke tests).
- **Pinned versions** _(architecture.md NFR16)_: every third-party package must be pinned exact (no `^`/`~`). Intended pins are captured in the task list; dev agent should re-verify with `npm view <pkg> version` before writing.
- **Directory structure** _(architecture.md "Full-Stack Monolith Template")_: `web/`, `mobile/`, `shared/` at the monolith root with `package.json` workspaces.
- **Naming** _(architecture.md)_: file names `kebab-case.ts`, components `PascalCase.tsx`, Next.js App Router conventions (`page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`).
- **Variable substitution**: Story 1.3's scaffold engine supplies `{{projectName}}`, `{{projectNameKebab}}`, and Story 1.4's engine supplies `{{pmInstallCmd}}` / `{{pmRunCmd}}` / `{{pmExecCmd}}`. Use them wherever the template should vary.
- **Deferred to later stories:**
  - Clerk + Supabase wiring → Story 2.2
  - Sign-in/sign-up + middleware → Story 2.3
  - Drizzle schema, queries, migrations → Story 2.4
  - Clerk billing → Epic 3
  - Tailwind + shadcn/ui + NativeWind → Story 4.3
  - ESLint/Prettier/Husky → Story 4.4

### Critical implementation details — anti-disaster guardrails

- **`_gitignore` and `_env.example` placeholders**: npm strips `.gitignore` from published tarballs. Story 1.3's `renameSpecialFiles` map handles `_gitignore` → `.gitignore` and `_env.example` → `.env.example`. Use those placeholder names in `templates/monolith/`.
- **Do not pre-install dependencies** in the template. `package.json` files describe the dependencies, but `node_modules/` should never be shipped. Story 1.4's `installDependencies` runs `<pm> install` on scaffold.
- **No lock files shipped** — Story 1.4's `cleanupLockFiles` deletes stale lock files anyway, but we don't need to generate any. The user's chosen package manager writes the lock file at install time.
- **`next.config.ts`** is the Next.js 16 convention — architecture was written around this release. Use `import type { NextConfig } from 'next'` and `export default config satisfies NextConfig`.
- **Expo Router file routing**: Expo Router uses file-based routing under `app/`, mirroring Next.js App Router. Keep the directory structure parallel.
- **`next-env.d.ts` is normally auto-generated** by Next.js on first `next dev`, but we ship a static version so fresh scaffolds have correct types without needing to run dev first.
- **Root `package.json` scripts** forward to workspaces using the package manager abstraction: e.g. `"dev:web": "{{pmRunCmd}} --prefix web dev"` — or equivalent. Keep it simple for now; fancy orchestration is Epic 6 territory.

### Token checklist

Every template file that should vary by user input needs the appropriate token:

| Token | Where used |
|---|---|
| `{{projectName}}` | root `package.json` name, web/mobile `package.json` name prefix, web metadata title, mobile `app.json` name, README heading |
| `{{projectNameKebab}}` | Expo slug, scheme, `@scope/shared` package name, README |
| `{{pmInstallCmd}}` | README install commands |
| `{{pmRunCmd}}` | README dev/build commands |
| `{{pmExecCmd}}` | README examples referencing `npx`/`pnpm dlx`/`yarn dlx` |

### Pinned version targets (verified 2026-04-08)

| Package | Pin | Context |
|---|---|---|
| `next` | 16.2.2 | App Router, Server Components |
| `react` | 19.2.4 | Paired with Next 16 |
| `react-dom` | 19.2.4 | Paired with React 19 |
| `@types/react` | 19.2.14 | Matches React 19 |
| `@types/react-dom` | 19.2.3 | Matches React 19 |
| `@types/node` | 25.5.2 | Node 22+ LTS types |
| `typescript` | 6.0.2 | Same as CLI repo |
| `expo` | 55.0.12 | Expo SDK 55 |
| `expo-router` | 55.0.11 | Expo Router matching SDK 55 |
| `react-native` | 0.85.0 | Paired with Expo 55 |
| `eslint-config-next` | 16.2.2 | Paired with Next 16 (added in 4.4) |

### Project Structure Notes

After Story 2.1:

```
templates/monolith/
├── package.json
├── README.md
├── _gitignore
├── _env.example
├── tsconfig.base.json
├── web/
│   ├── package.json
│   ├── next.config.ts
│   ├── next-env.d.ts
│   ├── tsconfig.json
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── error.tsx
│       ├── loading.tsx
│       └── globals.css
├── mobile/
│   ├── package.json
│   ├── app.json
│   ├── babel.config.js
│   ├── tsconfig.json
│   └── app/
│       ├── _layout.tsx
│       └── index.tsx
└── shared/
    ├── package.json
    ├── tsconfig.json
    └── index.ts
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1: Create Monolith Template Base Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#Full-Stack Monolith Template]
- [Source: _bmad-output/planning-artifacts/architecture.md#Supabase Auth Integration (Critical)]
- [Source: _bmad-output/planning-artifacts/prd.md#FR9, FR43, FR44, FR45, FR46]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors (after broadening ignore list for scaffold-output dirs)
- `npm run test` → 136/136 passing (13 new templates-monolith tests)
- `npm run build` → 20.48 KB (unchanged — templates aren't bundled into the CLI JS)

### Completion Notes List

- **23 template files** under `templates/monolith/` covering root, `web/`, `mobile/`, `shared/`.
- **Pinned versions** (verified via `npm view` on 2026-04-08):
  - `next@16.2.2`, `react@19.2.4`, `react-dom@19.2.4`, `@types/react@19.2.14`
  - `expo@55.0.12`, `expo-router@55.0.11`, `react-native@0.85.0`
  - `typescript@6.0.2`, `@types/node@25.5.2`
- **`_gitignore` / `_env.example` placeholder pattern**: Story 1.3's rename table handles both, so the template ships the underscored names and the scaffold engine restores the leading dot on output. End-to-end test asserts this.
- **Next.js 16 conventions**: `next.config.ts`, App Router layout/page/error/loading files, `Metadata`/`Viewport` exports. Cache Components and Turbopack explicit config deferred — Next.js 16 enables Turbopack in dev by default and Cache Components are an opt-in developer choice, not something to bake into a minimal starter.
- **Expo 55 conventions**: Expo Router under `app/`, `Stack` root layout, `newArchEnabled: true`, typed routes experiment enabled, `expo-router` plugin declared in `app.json`.
- **Shared workspace** uses `@{{projectNameKebab}}/shared` so the scoped name resolves deterministically from the project name and `web/next.config.ts` references it via `transpilePackages`.
- **Token coverage**: `{{projectName}}`, `{{projectNameKebab}}`, `{{pmInstallCmd}}`, `{{pmRunCmd}}`, `{{pmExecCmd}}` all used where the architecture specifies user-varying or pm-varying values.
- **Leftover `my-project/` cwd pollution** from earlier local testing caused the cli.test.ts `drops invalid flag values` test to fail because Story 1.5's target-dir guard fired against the pre-existing directory. Fixed by refactoring the three legacy Story 1.2 cli tests to use `RunCliDeps` with a temp `targetDirOverride` and an empty `templatesDir`, AND by broadening `eslint.config.js` ignores to cover common scaffold-output names (`my-project`, `my-app`, `my-saas-app`, `test-project`).
- **Deferred to later stories:**
  - Clerk wiring → 2.2
  - Sign-in/sign-up + middleware → 2.3
  - Drizzle schema → 2.4
  - Clerk billing → Epic 3
  - Tailwind + shadcn/ui + NativeWind → 4.3
  - ESLint + Prettier + Husky per template → 4.4
  - Runtime validation (npm install / next build) → 6.1 smoke tests

### File List

**Created (23 template files + 1 test file):**

- `templates/monolith/package.json`
- `templates/monolith/tsconfig.base.json`
- `templates/monolith/_gitignore`
- `templates/monolith/_env.example`
- `templates/monolith/README.md`
- `templates/monolith/web/package.json`
- `templates/monolith/web/next.config.ts`
- `templates/monolith/web/tsconfig.json`
- `templates/monolith/web/next-env.d.ts`
- `templates/monolith/web/app/layout.tsx`
- `templates/monolith/web/app/page.tsx`
- `templates/monolith/web/app/error.tsx`
- `templates/monolith/web/app/loading.tsx`
- `templates/monolith/web/app/globals.css`
- `templates/monolith/mobile/package.json`
- `templates/monolith/mobile/app.json`
- `templates/monolith/mobile/babel.config.js`
- `templates/monolith/mobile/tsconfig.json`
- `templates/monolith/mobile/app/_layout.tsx`
- `templates/monolith/mobile/app/index.tsx`
- `templates/monolith/shared/package.json`
- `templates/monolith/shared/tsconfig.json`
- `templates/monolith/shared/index.ts`
- `tests/unit/templates-monolith.test.ts` — 13 tests: file presence, exact version pins, token usage, end-to-end scaffold with no-leftover-tokens check, rename verification, pm-substitution in README

**Modified (2):**

- `eslint.config.js` — broader ignore list for scaffold-output directories
- `tests/unit/cli.test.ts` — 3 legacy tests updated to use `RunCliDeps` with temp `targetDirOverride`

### Code Review Findings (Phase 3)

**HIGH (auto-fixed):**

- **`transpilePackages: ['@{{projectNameKebab}}/shared']`** in `next.config.ts` pointed at an empty TS-only package with no proper exports. Removed for Story 2.1; Story 2.4 will add it back once the shared workspace has real code that web imports.
- **`tsconfig.base.json` included DOM libs** (`DOM`, `DOM.Iterable`), which would pollute the mobile workspace with browser types. Moved `DOM` libs to `web/tsconfig.json`; the base is platform-neutral.

**MEDIUM (deferred):** see `deferred-findings.md` (`MEDIUM-2.1-A` token-presence tests, `MEDIUM-2.1-B` RN/Expo pairing verification).

**LOW (deferred):**
- `LOW-2.1-A` — `next-env.d.ts` staleness risk
- `LOW-2.1-B` — `--prefix` flag compatibility across yarn classic

**CRITICAL:** none.
