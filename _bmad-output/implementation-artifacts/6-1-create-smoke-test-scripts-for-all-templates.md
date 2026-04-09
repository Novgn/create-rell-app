# Story 6.1: Create Smoke Test Scripts for All Templates

Status: review

## Story

As a developer maintaining the CLI tool,
I want automated smoke tests that scaffold, install, build, and lint every template end-to-end,
so that I catch real integration breakage before publishing to npm.

## Acceptance Criteria

1. A new directory `tests/smoke/` exists and contains a runnable smoke-test entry point at `tests/smoke/smoke-test.mjs` (ESM Node script — cross-platform, no bash dependency).
2. A new npm script `test:smoke` is added to the root `package.json`. Running `npm run test:smoke` executes the smoke test suite against all three templates.
3. The smoke runner builds the CLI via `tsup` before running (or fails fast with a clear error if the build cannot be produced) so it always tests the current source.
4. Each of the three templates (`web`, `mobile`, `monolith`) is scaffolded into a unique directory under the OS temporary directory using the built CLI in flag-only (non-interactive) mode: `node dist/cli.js <name> --template <t> --pm npm --no-install` followed by a separate install step (so scaffold failures vs install failures are distinguishable in the report).
5. For each scaffolded template, the smoke runner invokes `npm install` and fails the template if install exits non-zero. Install output is captured and surfaced on failure.
6. For each scaffolded template, the smoke runner runs the **lint command** and fails the template if lint exits non-zero. (Command per template: `npm run lint`.)
7. For each scaffolded template, the smoke runner runs the **build/verification command** and fails the template if it exits non-zero. Per-template mapping:
   - `web` → `npm run build` (`next build`)
   - `monolith` → `npm run build:web` (the root script that runs `next build` in the `web/` workspace) and additionally `npm run typecheck` (TypeScript project references across `web`, `mobile`, `shared`)
   - `mobile` → `npm run typecheck` (`tsc --noEmit`) — Expo has no `build` script in the template; typecheck is the closest "does it compile" gate that is safe to run in CI without native toolchains (Android SDK, Xcode, CocoaPods). This interpretation of the AC is documented in Dev Notes.
8. For each scaffolded template, the smoke runner verifies the existence of key files in the scaffold output: `package.json`, `README.md`, `.env.example`, `.gitignore`. Missing files fail the template.
9. For the **monolith** template only, the smoke runner additionally verifies that the workspace subdirectories exist and each contains a `package.json`: `web/package.json`, `mobile/package.json`, `shared/package.json`.
10. The smoke runner prints a per-template pass/fail summary to stdout at the end of the run, including total wall time and the name of the step that failed (if any). Format is human-readable and also machine-parseable (one template per line with a clear `PASS`/`FAIL` token).
11. The smoke runner exits with code `0` only if every template passes every step. Any failure results in exit code `1`.
12. Scaffold output directories are created under `os.tmpdir()` with a unique, random suffix and are cleaned up after the run by default. An environment variable `KEEP_SMOKE_OUTPUT=1` preserves them for post-mortem debugging.
13. The smoke runner supports a `--templates=<list>` flag (e.g. `--templates=web,mobile`) so a developer can run a subset locally while iterating. Default is all three templates.
14. The smoke runner is idempotent — running it twice in a row (without `KEEP_SMOKE_OUTPUT`) leaves no artifacts in the repository working tree, only under `os.tmpdir()`.
15. A new unit test (`tests/unit/smoke-runner.test.ts`) covers pure helper functions extracted from the smoke runner: template filter parsing, per-template command matrix, summary-line formatting. The subprocess / filesystem orchestration is not unit-tested — it is its own integration test when executed.
16. Running `npm test` continues to run only the fast unit tests (not the slow smoke tests). The vitest config's existing `include: ['tests/**/*.test.ts']` glob naturally excludes `tests/smoke/smoke-test.mjs` because it is `.mjs`, not `.test.ts`; the new unit test for helpers sits in `tests/unit/` and is picked up normally.
17. The smoke runner uses `execa` (already a dependency) for subprocess execution, not raw `child_process.spawn`, so error handling, timeouts, and stderr capture are consistent.
18. The smoke runner sets a generous per-step timeout (default 600000ms / 10 minutes) so a hung install does not block the full run indefinitely. Timeouts produce a clear "step X timed out after Yms" failure message.
19. No repository-tracked files inside `my-project/` or the repo root are modified by a smoke run. (Guarded by the "scaffold under `os.tmpdir()`" rule in AC 12.)
20. All new code passes `npm run lint`, `npm run format:check`, and `npm run typecheck` at the root with zero errors.

## Tasks / Subtasks

- [ ] Build the per-template command matrix as a pure data structure inside `tests/smoke/smoke-test.mjs`
- [ ] Extract filter parsing + summary formatting helpers into `tests/smoke/smoke-helpers.mjs` (re-exported from the runner)
- [ ] Write the smoke runner entry point that: builds CLI → iterates templates → scaffolds → installs → lints → builds/typechecks → validates files → reports
- [ ] Add the `test:smoke` script to root `package.json`
- [ ] Write `tests/unit/smoke-runner.test.ts` covering the extracted helpers (filter parsing, matrix shape, summary formatting)
- [ ] Run `npm run test:smoke` locally against at least one template (e.g. `--templates=web`) to prove the pipeline works end-to-end
- [ ] Run the full unit suite (`npm test`) to confirm no regressions
- [ ] Run `npm run lint`, `npm run format:check`, `npm run typecheck` — all green
- [ ] Commit

## Dev Notes

### Why Node, not bash

The architecture doc originally said `tests/smoke/smoke-test.sh`, but flagged "shell script vs Node.js test runner" as an open question. Shell scripts don't run natively on Windows, and the project promises cross-platform support (Architecture: "Cross-platform: macOS, Linux, Windows support"). An `.mjs` Node script runs unmodified on all three OSes, can import `execa` / `fs-extra` directly (already deps), and has a richer error model. This is a better default than bash.

### Why `.mjs` instead of `.ts`

- `.mjs` runs directly under Node 22+ with no transpile step. `.ts` would require `tsx`, `ts-node`, or a build step — one extra moving part for a script that doesn't benefit much from static types.
- Vitest's `include: ['tests/**/*.test.ts']` naturally ignores `.mjs`, so the smoke script won't be picked up as a unit test. This keeps `npm test` fast (AC 16).
- The helper module (`smoke-helpers.mjs`) is the only piece that benefits from typed tests, and we cover it with a separate `tests/unit/smoke-runner.test.ts` (pure Vitest file that imports the `.mjs` module — Node ESM interop works fine).

### Why not `build` for mobile

The mobile and monolith-mobile templates do not define `build` scripts because Expo's build pipeline (`expo export`, EAS Build) requires native toolchains that don't live in a hosted CI runner without setup:

- Android: Android SDK + Gradle
- iOS: Xcode + CocoaPods (macOS-only)
- Metro bundler needs a running device/simulator for `expo start`

The closest proxy for "does this code compile" that is safe and fast in CI is `tsc --noEmit` (already wired as `npm run typecheck` in the mobile template). A future story can add an Expo-specific build step (e.g. `expo export --platform web`) once the team decides whether to invest in that CI matrix. The current scope is "does the scaffold compile and lint cleanly", and typecheck is the right level.

### Per-template command matrix (source of truth for AC 7)

```js
const TEMPLATES = {
  web: {
    install: ['npm', ['install']],
    steps: [
      ['lint', 'npm', ['run', 'lint']],
      ['build', 'npm', ['run', 'build']],
      ['typecheck', 'npm', ['run', 'typecheck']],
    ],
    requiredFiles: ['package.json', 'README.md', '.env.example', '.gitignore'],
  },
  mobile: {
    install: ['npm', ['install']],
    steps: [
      ['lint', 'npm', ['run', 'lint']],
      ['typecheck', 'npm', ['run', 'typecheck']],
    ],
    requiredFiles: ['package.json', 'README.md', '.env.example', '.gitignore'],
  },
  monolith: {
    install: ['npm', ['install']],
    steps: [
      ['lint', 'npm', ['run', 'lint']],
      ['build:web', 'npm', ['run', 'build:web']],
      ['typecheck', 'npm', ['run', 'typecheck']],
    ],
    requiredFiles: [
      'package.json',
      'README.md',
      '.env.example',
      '.gitignore',
      'web/package.json',
      'mobile/package.json',
      'shared/package.json',
    ],
  },
};
```

### What about pnpm and yarn?

The AC says "scaffolded using flag-based (non-interactive) mode" and names `npm install` specifically. Running the same smoke sequence across all three package managers would triple CI time and is low marginal value compared to the existing `tests/unit/install.test.ts` coverage, which already asserts the correct `execa` command shape per pm via injected fakes. If a future story wants a full pm matrix, this runner is already structured to support it (just loop the `install` + `steps` over a pm list).

### Why `--no-install` then a separate `npm install`

Two reasons:
1. **Failure isolation.** The AC distinguishes "scaffold failure" from "install failure" (AC 4 + AC 5). Running them separately gives us a clear failure location in the report.
2. **Retries / timeouts.** If install needs special handling (timeout, cache warmup), keeping it out of `runCli` lets us adjust it without touching the CLI's install code path.

### Referenced deferred findings that this story closes or mitigates

- **LOW-1.4-A** (`defaultProcessRunner` not unit-tested) — smoke tests exercise the real execa code path against real binaries.
- **MEDIUM-1.3-A / MEDIUM-1.5-A** (TOCTOU between stat/readdir and scaffold) — smoke tests will surface any real-world race by actually running the scaffold into a fresh directory.
- **MEDIUM-2.1-A** (no token coverage test) — smoke build will surface any `{{token}}` that slipped through substitution because Next/ESLint/TS will bark on leftover `{{...}}` in source.
- **MEDIUM-2.1-B** (`react-native` / `expo` version mismatch) — smoke install will fail fast if Expo SDK 55 and react-native 0.85 are incompatible at the pinned versions.
- **LOW-2.1-B** (`--prefix` portability) — monolith's `npm run build:web` uses `--prefix`, which is exercised here with npm specifically; a future pm matrix will catch yarn issues.

### Security notes

- Smoke script does not take user input — templates and project names are hard-coded. No injection risk.
- Scaffold targets live under `os.tmpdir()`, so no chance of stomping on repo-tracked files.
- Install runs in the temp directory, not the repo, so node_modules is sandboxed.
- `KEEP_SMOKE_OUTPUT=1` is opt-in; default cleanup means no accidental disk fill.
- No secrets or env vars are required or consumed by the smoke runner. It only reads `KEEP_SMOKE_OUTPUT`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#CI/CD & Publishing — "Smoke test pipeline (on every push/PR)"]
- [Source: _bmad-output/planning-artifacts/architecture.md#Areas for Future Enhancement — "shell script vs Node.js test runner"]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR18 — "Automated smoke tests validate all three templates on every change"]
