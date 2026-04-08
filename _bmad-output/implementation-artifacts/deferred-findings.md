# Deferred Code Review Findings

This file collects Low and Info findings from code review that were not auto-fixed during the BMAD full-auto pipeline. They are batched here for triage in a future pass (e.g. retrospective or polish epic).

---

## Story 1.2 — Interactive Prompts

### LOW-1.2-A: Test driver `selectAnswers` accepts any string

**Source:** `tests/unit/prompts.test.ts`, `FakeDriverConfig.selectAnswers: string[]`

The fake driver's `selectAnswers` is loosely typed as `string[]`. Tests can technically queue an answer that doesn't match any choice; the driver throws at runtime, which is good defensive coding, but the test API does not enforce correctness at compile time.

**Why deferred:** Acceptable trade-off for now — the runtime check catches mistakes immediately and tightening the types would require generic propagation through `FakeDriverConfig` that adds noise without much value.

---

### LOW-1.2-B: No test verifies prompt ordering

**Source:** `src/prompts.ts`, `gatherInputs()`

Tests verify which prompts are called and what they return, but do not assert the order in which the project name → template → package manager prompts are issued. If the order accidentally swapped, tests would still pass.

**Why deferred:** The current implementation uses sequential `await`s, so the order is structurally guaranteed. A regression test would only catch refactoring mistakes.

---

## Story 1.3 — Scaffold Engine

### MEDIUM-1.3-A: TOCTOU between `fs.stat` and walk

**Source:** `src/scaffold.ts`, `scaffoldProject()`

There's a small window between `fs.stat(templateDir)` returning "is a directory" and the recursive walk actually reading entries. A concurrent process could swap the directory for a symlink in between.

**Why deferred:** Single-user CLI tool; the realistic threat model doesn't include concurrent malicious processes manipulating the user's own home directory. Symlinks within the template directory are already rejected by the walker.

### MEDIUM-1.3-B: BINARY_EXTENSIONS missing several common formats

**Source:** `src/scaffold.ts`, `BINARY_EXTENSIONS`

The set is missing `.bmp`, `.tiff`, `.heic`, `.avif` (images), `.flac`, `.ogg` (audio), `.webm`, `.mov`, `.mkv` (video).

**Why deferred:** Add as templates start using them. The current set covers everything Epics 2–5 templates are expected to ship.

### LOW-1.3-A: Hard-coded fixture file count

**Source:** `tests/unit/scaffold.test.ts`, `writes every fixture file into the target directory`

The test asserts `result.filesWritten === 7`, which is brittle if the fixture changes.

**Why deferred:** Acceptable trade-off — the explicit number documents the fixture's expected file count and would catch accidental drops.

### LOW-1.3-B: No Windows-specific path test

**Source:** `tests/unit/scaffold.test.ts`

Tests run with platform-native paths and don't explicitly verify Windows backslash handling. CI on Windows (Story 6.2) will catch any platform regressions.

**Why deferred:** Tests rely on the platform's actual `path.sep`, which is correct behavior. Windows CI will exercise the backslash path naturally.

### LOW-1.3-C: No template-side exclusion patterns

**Source:** `src/scaffold.ts`

The scaffold engine has no `.gitignore`-style exclusion mechanism. If a template ever needs to exclude files (e.g. example envs that should never ship), there's no built-in way.

**Why deferred:** Templates own their own file lists. No current need.

---

## Story 1.4 — Package Manager Abstraction

### MEDIUM-1.4-A: No yarn 1 vs yarn 4 distinction

**Source:** `src/install.ts`, `PACKAGE_MANAGER_COMMANDS.yarn`

The `yarn dlx` exec command is yarn 2+. Yarn classic (1.x) does not have `dlx` and needs `npx` instead. We don't detect or document this.

**Why deferred:** Yarn 4 is the current stable. Most modern users won't be on yarn 1. If a user does run into this, the README can be updated to call out the assumption. A real fix would detect the installed yarn major version at scaffold time.

### MEDIUM-1.4-B: No timeout on the install subprocess

**Source:** `src/install.ts`, `defaultProcessRunner`

A hung install (e.g. waiting on a postinstall script that wants keyboard input) would block the CLI forever.

**Why deferred:** Story 1.5 owns hardening. Realistic threat is low — modern package managers don't generally prompt during install.

### LOW-1.4-A: `defaultProcessRunner` is not unit-tested

**Source:** `tests/unit/install.test.ts`

Unit tests exclusively use injected fake runners. The default `execa`-backed runner's ENOENT branch is untested.

**Why deferred:** Real subprocess spawning is integration-test territory. Smoke tests in Story 6.1 will exercise the default runner against real binaries.

### LOW-1.4-B: `runCli` is getting long; could extract `executeScaffoldFlow()` helper

**Source:** `src/index.ts`, `runCli()`

After Stories 1.3 and 1.4, `runCli` does prompt → scaffold → cleanup → install in a single function. A helper would clarify the flow.

**Why deferred:** ~~Refactor opportunity for Story 1.5 cleanup pass — when we add validation it'll be a natural breakpoint.~~ **RESOLVED in Story 1.5** — `executeScaffoldFlow()` helper extracted.

---

## Story 1.5 — Validation & Exit Codes

### MEDIUM-1.5-A: TOCTOU between target-dir check and scaffold

**Source:** `src/validation.ts`, `assertTargetDirSafe`

There's a window between `fs.readdir(targetDir).length === 0` and the scaffold writing files. A concurrent process could populate the directory in between.

**Why deferred:** Single-user CLI, low realistic threat. Fixing would require taking a directory lock (rare in Node CLI tools).

### MEDIUM-1.5-B: No end-to-end test for friendly drop-and-reprompt path through `runCli`

**Source:** `tests/unit/cli.test.ts`

Story 1.2's `prompts.test.ts` covers the drop-unknown-flag-value behavior in `gatherInputs` directly. There's no end-to-end `runCli` test that exercises invalid flag → reprompt → resolved value in interactive mode.

**Why deferred:** Unit-level coverage is sufficient. The integration path is exercised by the existing "drops invalid flag values and re-prompts via the driver" cli test which uses `interactive: true`.

### LOW-1.5-A: `validateProjectName` regex and error message are duplicated knowledge

**Source:** `src/validation.ts`, `PROJECT_NAME_PATTERN` and the matching error string

The regex pattern lives in one constant but the error message describing the rules is hand-written. Updating one without the other would silently drift.

**Why deferred:** The pattern is unlikely to change. A test would catch drift if it occurred.

### LOW-1.5-B: Scoped npm names rejected

**Source:** `src/validation.ts`, `validateProjectName`

`@scope/name` is rejected because of the `/`. This is intentional — `create-rell-app` scaffolds applications, not publishable libraries — but it's worth documenting that the project name → directory name → optional `package.json` name is a single value.

**Why not a bug:** Documented decision. Users can still edit `package.json` post-scaffold.

---

## Story 2.1 — Monolith Template Base Structure

### MEDIUM-2.1-A: No test asserts every token appears in at least one file

**Source:** `tests/unit/templates-monolith.test.ts`

The end-to-end test catches leftover `{{...}}` tokens after substitution but doesn't verify that every expected token (e.g. `{{projectNameKebab}}`, `{{pmRunCmd}}`) appeared somewhere in the template source. A file that forgot its token would silently be project-agnostic.

**Why deferred:** Smoke tests in Story 6.1 will catch integration issues by running `next build` against the scaffolded output. Unit-level token enforcement is low value.

### MEDIUM-2.1-B: `react-native` / `expo` version pairing not independently verified

**Source:** `templates/monolith/mobile/package.json`

`react-native@0.85.0` is pinned based on `npm view react-native version`; the actual Expo SDK 55 bundled version should be verified against Expo's matrix (https://github.com/expo/expo/blob/main/packages/expo/bundledNativeModules.json).

**Why deferred:** If mismatched, `expo install` would warn and smoke tests (6.1) would catch build failures. Pinning to the latest stable of each is the best we can do from `npm view` alone.

### LOW-2.1-A: Next.js `next-env.d.ts` may become stale

**Source:** `templates/monolith/web/next-env.d.ts`

Next.js auto-regenerates this file on dev server start. Committing a static version prevents first-dev warnings but means we must keep the reference directives in sync with Next.js conventions.

**Why deferred:** File content is stable across Next.js 14/15/16 minor releases.

### LOW-2.1-B: Root `package.json` scripts use `--prefix` which is npm/pnpm-specific

**Source:** `templates/monolith/package.json`, `scripts.dev:web`

`npm run --prefix web dev` works with npm and pnpm but yarn 1 doesn't accept `--prefix`. Yarn 4 uses `yarn workspace web run dev`.

**Why deferred:** Story 1.4 yarn-classic vs yarn-4 mismatch (MEDIUM-1.4-A) already captures this class of issue. The README's canonical commands use `{{pmRunCmd}} dev:web` which forwards to whatever script the chosen pm natively supports.

---

## Story 2.2 — Clerk + Supabase native 3P auth

### LOW-2.2-A: `useSupabaseClient` memoization could be tightened

**Source:** `templates/monolith/web/lib/supabase/client.ts`

The hook memoizes on `[session]`, which creates a new client object on every session refresh. The `accessToken` callback already pulls fresh tokens on every request, so the re-creation is wasted work.

**Why deferred:** Attempting to memoize on `[]` would cause the callback to close over a stale `session` reference from the first render — correctness > micro-perf. Leave as-is.

### LOW-2.2-B: No CSP / security headers

**Source:** `templates/monolith/web/next.config.ts`

The Next.js config doesn't set any `headers()` for CSP, HSTS, X-Frame-Options, etc.

**Why deferred:** Story 4.4 (ESLint/Prettier/Husky/inline comments DX pass) or a future polish story is a better home for security header configuration. The Clerk integration handles its own OAuth flow CSP needs.

---

## Story 2.3 — Sign-in / Sign-up / Middleware

### MEDIUM-2.3-A: Mobile sign-in form has no client-side validation

**Source:** `templates/monolith/mobile/app/(auth)/sign-in.tsx`

Empty email/password fields can be submitted and rely on Clerk's server-side rejection for the error. Real apps add inline validation (e.g. via `react-hook-form` + `zod`).

**Why deferred:** The scaffold is intentionally minimal. Story 4.2 adds React Hook Form + Zod, at which point we can retrofit the form.

### MEDIUM-2.3-B: Mobile sign-up doesn't complete email verification

**Source:** `templates/monolith/mobile/app/(auth)/sign-up.tsx`

After `signUp.create()`, Clerk requires a code verification step. The scaffold stops with an error message pointing this out.

**Why deferred:** Email verification is app-specific UX; leaving it as a documented TODO keeps the scaffold clean.

---

## Story 2.4 — Drizzle schema

### LOW-2.4-A: No `db:drop` / `db:reset` scripts

**Source:** `templates/monolith/package.json`

Would be useful during dev to wipe + re-migrate the local database.

**Why deferred:** Story 4.4 can add these.

### LOW-2.4-B: `drizzle.config.ts` uses empty-string fallback for DATABASE_URL

**Source:** `templates/monolith/shared/drizzle.config.ts`

`process.env.DATABASE_URL ?? ''` silently runs drizzle-kit with an empty URL, which produces a less-clear error than throwing up front.

**Why deferred:** Drizzle Kit is a dev tool — the failure mode is visible enough. Changing this would complicate the config in exchange for minor UX improvement.
