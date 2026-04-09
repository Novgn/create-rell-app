# Story 6.2: Set Up GitHub Actions CI Pipeline

Status: done

## Story

As a developer maintaining the CLI tool,
I want smoke tests to run automatically on every push and PR,
so that I'm alerted to breakage before merging.

## Acceptance Criteria

1. A new file `.github/workflows/ci.yml` defines the GitHub Actions CI pipeline.
2. The pipeline triggers on `push` (all branches) and `pull_request` (targeting `main`).
3. The pipeline has two jobs, run in order: `check` then `smoke`.
4. **`check` job** (runs on `ubuntu-latest`, Node 22 LTS):
   - Checks out the repository.
   - Sets up Node.js 22 with npm cache.
   - Runs `npm ci` to install root dependencies.
   - Runs `npm run typecheck` — fails the job if TypeScript has errors.
   - Runs `npm run lint` — fails the job if ESLint has errors.
   - Runs `npm test` — fails the job if any unit test fails.
5. **`smoke` job** (requires `check` to pass first):
   - Runs on a 2×1 matrix: `os: [ubuntu-latest, macos-latest]` × `node: [22]`.
   - Checks out the repository.
   - Sets up Node.js with npm cache.
   - Runs `npm ci`.
   - Runs `npm run test:smoke` — the full smoke test suite across all three templates.
   - Fails the job if any template's scaffold, install, build, lint, or typecheck fails.
6. The pipeline uses `actions/checkout@v4` and `actions/setup-node@v4` (current stable).
7. npm dependencies are cached via `actions/setup-node`'s built-in `cache: 'npm'` option, keyed on `package-lock.json`.
8. The pipeline sets `HUSKY=0` in the environment for all jobs so Husky's `prepare` script doesn't try to install hooks in the CI runner's non-interactive git checkout.
9. The pipeline does NOT include `workflow_dispatch` (manual trigger) — smoke tests are automated-only, not on-demand. (Story 6.3 may add publish-specific triggers separately.)
10. No new npm scripts, no new dependencies — this story is purely the workflow YAML file and the sprint-status update.
11. `npm test` still passes with zero regressions (no code changes expected).
12. The YAML file passes basic linting (valid YAML, no syntax errors).

## Tasks / Subtasks

- [ ] Create `.github/workflows/` directory
- [ ] Write `ci.yml` with `check` and `smoke` jobs
- [ ] Validate YAML syntax (`node -e "require('js-yaml').load(...)"` or manual inspection)
- [ ] Run `npm test` to confirm no regressions
- [ ] Commit

## Dev Notes

### Why two jobs instead of one

- **Fast feedback**: the `check` job (typecheck + lint + unit tests) completes in ~30s. If it fails, we don't waste 10+ minutes provisioning two OS runners for the smoke suite.
- **Clear failure signals**: a failing `check` means the CLI's own code is broken. A failing `smoke` means a generated template is broken. Different root causes, different owners.
- **Cost-efficient**: the smoke matrix (2 OS × 1 Node) only runs when the fast checks pass.

### OS matrix

The AC says "macOS and Linux (minimum)". We pick `ubuntu-latest` + `macos-latest`. Windows is excluded because:
- The templates use Husky and Unix shell conventions in npm scripts.
- The monolith template uses `--prefix` which has portability concerns on Windows (documented in deferred finding LOW-2.1-B).
- The architecture doc lists "macOS, Linux, Windows" but the CI AC specifically relaxes to "minimum" for the first iteration.

A future story can add `windows-latest` if the community requests it.

### Node version

Pin to `22` (LTS) in the matrix. The root `package.json` engines says `>=22`. CI should validate on the minimum supported version, not the bleeding edge. Node 24 LTS can be added to the matrix later without changing the workflow structure.

### Known CI failure on first run (Option A from Checkpoint 2 discussion)

The web and monolith smoke tests will fail at the `lint` step because `templates/web/lib/auth/use-role.ts` has real `react-hooks/set-state-in-effect` errors (HIGH-6.1-T1). This is intentional — the CI is correct and the templates need fixing. A follow-up template-polish story will:
1. Fix the hook anti-pattern in `use-role.ts`
2. Fix the `import/no-anonymous-default-export` warning
3. Green the CI

Until then, the CI pipeline is "honest red" — it accurately reports that the generated templates have lint errors.

### What about the `check` job's `npm run lint`?

The `check` job lints the **CLI source code** (the root `eslint.config.js`), not the templates. Template code lives under `templates/` which is excluded from the root ESLint config. So `check` should pass even though the template code has lint errors.

The template lint errors only surface during `smoke` → `npm run test:smoke` → per-template `npm run lint`.

### Caching strategy

`actions/setup-node@v4` with `cache: 'npm'` uses a hash of `package-lock.json` as the cache key. This caches the npm global store (~/.npm), not `node_modules/` directly. `npm ci` still runs but resolves from cache — typically ~10s instead of ~60s.

We do NOT cache the smoke-test scaffolded project `node_modules` because:
- Each scaffold is in a fresh tmpdir with unique dependencies.
- The template's package.json changes between runs (version bumps, new deps).
- Stale template node_modules would mask install failures.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#CI/CD & Publishing — "Smoke test pipeline"]
- [Source: _bmad-output/implementation-artifacts/deferred-findings.md#HIGH-6.1-T1]
