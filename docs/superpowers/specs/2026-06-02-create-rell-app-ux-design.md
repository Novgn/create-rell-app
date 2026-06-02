# create-rell-app UX improvements — design

**Date:** 2026-06-02
**Status:** Approved (pending written-spec review)
**Author:** Claude + Wayne

## Context

`create-rell-app` is a scaffolding CLI (like `create-next-app`) that generates a
Clerk + Supabase + Drizzle starter in three flavors: `web` (Next.js), `mobile`
(Expo), and `monolith` (npm-workspaces monorepo). The CLI core is well built —
dependency-injected and unit-tested, path-traversal hardened
(`substitutePathSegment` + `assertContained` in `src/scaffold.ts`), deterministic
output, `--dry-run`, and a 3-OS smoke matrix.

The gaps are in the **last mile** — the experience between "scaffold succeeded"
and "app actually runs" — plus a handful of correctness bugs and distribution
misses. This spec covers four workstreams. The **env onboarding** workstream is
the centerpiece and is specified in depth; the other three are mechanical and
specified crisply.

## Goals

1. The first command the CLI tells a user to run must actually work, for every
   template.
2. The path from scaffold to a running dev server is obvious and self-diagnosing,
   without ever prompting for secrets the user may not have yet.
3. Cheap distribution/quality wins (discoverability, license, output polish).
4. Generated projects don't silently rot as pinned dependencies age.

## Non-goals (YAGNI)

- No interactive secret-paste prompts during scaffold (explicitly rejected: users
  usually scaffold *before* creating accounts). May revisit as an opt-in later.
- No auto-running of `db:migrate` (needs a reachable DB + real `DATABASE_URL`;
  too risky to run unattended).
- No network calls / DB-reachability ping in the doctor (presence + format only;
  keeps it instant and offline). A `--deep` variant is a possible future add.
- No change to the runtime Zod env modules' behavior — they stay as the backstop.
- No auto-merge of dependency-bump PRs.

---

## Workstream 1 — Env onboarding (centerpiece)

### 1.1 Scaffold auto-creates `.env.local`

The scaffold engine already renders `_env.example → .env.example`
(`SPECIAL_FILENAME_RENAMES` in `src/scaffold.ts`). Add a post-walk step in
`scaffoldProject()`: for each `.env.example` written, if a sibling `.env.local`
does not already exist, write `.env.local` with the **same rendered content**.

- Single source of truth: the `.env.example` content. No second template file to
  keep in sync, so no drift risk and no new `templates-consistency` burden.
- `.env.local` is already gitignored in every template (`_gitignore` includes
  `.env.local` plus a `!.env.example` negation), so we never commit it.
- Removes the easy-to-forget `cp .env.example .env.local` step — the user edits
  the one file the framework actually loads.
- Dry-run aware: in `dryRun` mode, record the `.env.local` path in `plannedFiles`
  but write nothing.
- Implement as a small, testable helper (e.g. `materializeEnvLocal(targetDir,
  writtenFiles)`), invoked from `scaffoldProject()` after `walkAndCopy()`.

**Open implementation detail (must verify during build):** for the **monolith**,
confirm *where* each app loads env from. Next.js (`apps/web`) loads
`apps/web/.env.local` relative to its own cwd; Expo (`apps/mobile`) loads from
`apps/mobile`. The monolith template currently ships a single root
`templates/monolith/_env.example`. The implementer must place `.env.local` (and
the `check-env` script + its `predev`/`prestart` wiring) where each framework
actually reads it — likely per-app, not just at the root — and reconcile the
root example accordingly. Do not assume; read the monolith's Next/Expo config and
follow it.

### 1.2 `scripts/check-env.mjs` doctor (dependency-free)

A standalone Node ESM script shipped in each app that needs env. Behavior:

1. Parse `.env.local` with a tiny inline `KEY=VALUE` parser — **no `dotenv`
   dependency**. Rules: ignore blank lines and `#` comments; split on the first
   `=`; trim; strip a single pair of surrounding single/double quotes; do **not**
   interpret escape sequences or perform variable expansion; never `eval` or shell
   out.
2. Merge with `process.env` (a value present and non-empty in either source counts
   as "set", so CI-injected envs are honored).
3. Validate against a per-template key table — the single source of truth:
   `KEY → { label, url, required }`.
4. Print the checklist: `✓`/`✗` per key; for each missing key, its human label
   and a **dashboard deep-link**; required-vs-optional distinguished
   (`DATABASE_URL` rendered as "needed for `db:migrate`", not a hard failure).
   **Never print env values** — only key names, status, and static links.
5. Exit code: `0` if all **required** keys are set; `1` if any required key is
   missing/empty. Optional keys never affect the exit code.

Key tables (initial):

- **web / monolith-web:** required `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
  `CLERK_SECRET_KEY`, `CLERK_BILLING_WEBHOOK_SIGNING_SECRET`,
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; optional
  `DATABASE_URL`.
- **mobile / monolith-mobile:** required `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`,
  `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`; optional
  `DATABASE_URL` (mobile ships `db:*` scripts + a `migrations/` dir).

The required/optional split must match the templates' Zod schemas
(`lib/env.ts`, `lib/env-server.ts`) so the doctor and the runtime backstop agree.
`DATABASE_URL` is optional in `env-server.ts` today ("auth-only dev") — keep that
contract.

**Consistency fix:** the **mobile** `_env.example` currently lists no
`DATABASE_URL`, yet the mobile template ships `db:generate`/`db:migrate`/`db:push`/
`db:studio` scripts and a `migrations/` dir. Add a commented `DATABASE_URL` line
to `templates/mobile/_env.example` (mirroring the web example) so the doctor's
"optional `DATABASE_URL`, needed for `db:migrate`" entry references a key the
example actually documents.

Dashboard links (static constants):
- Clerk API keys → `https://dashboard.clerk.com/last-active?path=api-keys`
- Clerk webhook secret → `https://dashboard.clerk.com/last-active?path=webhooks`
- Supabase API settings → `https://supabase.com/dashboard/project/_/settings/api`
- Supabase DB connection string → `https://supabase.com/dashboard/project/_/settings/database`

### 1.3 Wiring into the dev flow

Each app gains a `"check-env"` script and an auto-run pre-hook:

- web: `"check-env": "node scripts/check-env.mjs"`, `"predev": "node scripts/check-env.mjs"`
- mobile: `"prestart": "node scripts/check-env.mjs"` (Expo uses `start`, not `dev`)
- monolith: each app wired as above; a root `"check-env"` runs both apps' checks.

**Blocking policy (⚙ confirmed default): block only on missing *required* keys.**
Rationale: the generated app's Zod env modules already throw at module-load
without those keys, so the app cannot boot regardless — a clean pre-flight
checklist is strictly better than Next's runtime error overlay. Optional keys
never block. The hook is one line and trivially removable for anyone who wants
`dev` to start unconditionally. (Alternative considered and rejected by default:
warn-only.)

### 1.4 Truthful next-steps banner (absorbs Tier-1 bug #2)

Rewrite `printNextSteps()` in `src/index.ts`. Replace the hardcoded
`${cmds.run} dev` / `${cmds.run} build` with a template-aware, ordered flow:

```
Success! Created <name> at <abs path>

Next steps:
  cd <relative>
  1. Fill in .env.local        → <pm> run check-env   (shows what's missing + where to get it)
  2. <pm> run db:migrate       (apply database migrations)
  3. <devCommand>              (start the dev server)
```

The dev command is derived from the **scaffolded** `package.json` scripts via a
pure, unit-tested helper `resolveDevCommand(scripts, template, pm)`:
- web → `<pm> run dev`
- mobile → `<pm> start`
- monolith → `<pm> run dev:web`
- generic fallback: prefer `dev`, else `start`, else first `dev:*` script, else
  omit step 3 with a note to check `package.json`.

This fixes Tier-1 bug #1 (mobile/monolith no longer print non-existent scripts)
and bug #2 (env + migrate steps are now shown) in one change.

### 1.5 Zod env modules unchanged

`lib/env.ts` / `lib/env-server.ts` keep parsing-at-load and throwing. The doctor
is the pre-flight; Zod is the guarantee. Defense in depth; no behavior removed.

---

## Workstream 2 — Remaining Tier-1 correctness

- **Banner** — covered by 1.4.
- **README flags table** (`README.md`): add `--no-git`, `--dry-run`, and the new
  `--yes` (workstream 3) so docs match `buildProgram()` in `src/index.ts`.

---

## Workstream 3 — Cheap polish bundle

- **`package.json` `keywords`** — add for npm/registry discoverability:
  `clerk, supabase, drizzle, nextjs, expo, react-native, scaffold, starter,
  boilerplate, saas, rbac, monorepo, create-app`.
- **`LICENSE` file** — add an MIT license file (matches `"license": "MIT"`;
  none currently ships). Ensure it's included in published tarball (`files` field
  already publishes by allowlist; add `LICENSE` or rely on npm's automatic
  inclusion of LICENSE — verify with `npm pack --dry-run`).
- **Console output cleanup** (`src/index.ts`): replace the debug-style
  `[create-rell-app] resolved configuration:` printf lines and `[create-rell-app]
  scaffolded N files…` with a clean, branded summary block (consistent chalk
  styling, aligned labels). **Keep install output stdio-inherited** (transparency
  beats a spinner that would clobber npm/pnpm/yarn's own progress rendering); just
  improve the surrounding framing ("Installing dependencies with <pm>…" header is
  fine). No new dependency.
- **Remove dead code** (`src/index.ts:323-331`): the "template not yet bundled —
  coming in Epic 2" placeholder branch is unreachable (all three templates ship).
  Replace with a hard error if a template directory is genuinely missing
  (defensive), or remove if `executeScaffoldFlow` can no longer be reached with a
  missing dir.
- **`--yes` / `-y` flag**: skip all prompts and fill any unspecified values with
  defaults (`template=web`, `pm=npm`). Works in both TTY and non-TTY. Without
  `--yes`, non-TTY-without-flags keeps today's clear error
  (`NonInteractiveStdinError`).

---

## Workstream 4 — Dependency-freshness workflow

`.github/workflows/refresh-templates.yml`:
- **Trigger:** weekly `schedule` (cron, Monday) + `workflow_dispatch`.
- **Steps:** for each template package.json (`templates/web`,
  `templates/mobile`, `templates/monolith/**`), run `npx npm-check-updates -u`
  to bump pinned exact versions to latest; then `npm run build && npm run
  test:smoke` (the existing smoke matrix scaffolds + installs + builds + lints +
  typechecks every template).
- **On green:** open a PR via `gh pr create` (or `peter-evans/create-pull-request`)
  with a labeled summary of version changes. **No auto-merge** — a human reviews.
- **On red:** fail the run (and optionally open a draft PR / issue noting which
  template broke), so a breaking upstream bump is surfaced as a deliberate, tested
  event rather than silent drift.

This complements the recently-disabled Dependabot-for-templates without
reintroducing the thundering-herd it caused.

---

## Testing strategy

- **Unit (repo `src`):**
  - `resolveDevCommand(scripts, template, pm)` — table-driven across all three
    templates + fallback cases.
  - New banner builder — assert ordered steps + correct dev command per template;
    update existing `tests/unit/cli.test.ts` expectations.
  - `materializeEnvLocal` — writes `.env.local` only when absent; dry-run records
    but does not write; content equals `.env.example`.
  - `--yes` default resolution in `prompts.ts` / `index.ts`.
- **Doctor:** unit-test the pure parse/evaluate logic (extract a pure function the
  `.mjs` can import, or test the `.mjs` directly with fixture `.env.local`
  contents): missing-required → exit 1; all-required-present → exit 0; optional
  absent → still 0; values never printed.
- **Smoke (`tests/smoke`):** add a step that, per template, writes a partial
  `.env.local`, runs `check-env`, and asserts the exit code and that no secret
  values appear in output. Confirm `.env.local` is auto-created by scaffold.
- **Consistency (`tests/unit/templates-consistency.test.ts`):** assert every
  env-bearing template ships `scripts/check-env.mjs`, a `check-env` script, and
  the appropriate `predev`/`prestart` hook.

## Security considerations

- Env parser is pure string handling — no `eval`, no shell, no variable
  expansion, no escape interpretation. Avoids injection via crafted `.env.local`.
- Doctor prints only static key names + static dashboard URLs and ✓/✗ status —
  **never env values** — so secrets can't leak into terminal scrollback/CI logs.
- Dashboard URLs are compile-time constants.
- We only ever write `.env.local` with empty placeholder values (copied from the
  example); we never write user secrets.
- Project-name validation and path-traversal hardening are unchanged.

## Decisions log (the ⚙ defaults, all confirmed)

1. **Guided, no secret prompts** — chosen over interactive paste / hybrid.
2. **Block `dev`/`start` only on missing *required* keys** — chosen over warn-only.
3. **Apply to all three templates** — consistency with existing parity test.
4. **No network / DB-ping in doctor** — presence + format only.

## File-by-file change summary

- `src/scaffold.ts` — `.env.local` auto-creation (+ helper).
- `src/index.ts` — template-aware banner via `resolveDevCommand`; output cleanup;
  remove dead Epic-2 branch.
- `src/prompts.ts` / `src/index.ts` — `--yes/-y` handling.
- `templates/{web,mobile,monolith/...}` — `scripts/check-env.mjs`, `check-env` +
  `predev`/`prestart` scripts in each app's `package.json`; monolith env
  placement reconciled.
- `package.json` — `keywords`; `LICENSE` file added at repo root.
- `README.md` — flags table (`--no-git`, `--dry-run`, `--yes`).
- `.github/workflows/refresh-templates.yml` — new.
- `tests/unit/*`, `tests/smoke/*` — new + updated coverage as above.
