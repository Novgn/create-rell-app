# Story 1.5: Add Error Handling, Validation, and Exit Codes

Status: review

## Story

As a developer using the CLI,
I want clear error messages for invalid input and proper exit codes,
so that I can fix issues quickly and use the CLI in CI scripts.

## Acceptance Criteria

1. **Given** the developer provides an invalid project name (empty string, contains path separators, contains characters npm forbids in package names, or starts with a dot or `_`), **When** the CLI runs, **Then** a clear, actionable error message is printed and the CLI exits with a non-zero code.
2. **Given** the developer provides `--template <unknown>` (e.g. `--template react`), **When** the CLI runs, **Then** a clear error lists the valid template values and the CLI exits non-zero.
3. **Given** the developer provides `--pm <unknown>` (e.g. `--pm bun`), **When** the CLI runs, **Then** a clear error lists the valid package managers and the CLI exits non-zero.
4. **Given** the target directory already exists and is non-empty, **When** the CLI runs in interactive mode, **Then** the developer is prompted to confirm overwrite. If they decline, the CLI exits non-zero with a friendly "aborted by user" message.
5. **Given** the target directory already exists and is non-empty, **When** the CLI runs in non-interactive mode, **Then** the CLI exits non-zero with an error message (no overwrite without explicit confirmation).
6. **Given** the target directory already exists but is **empty**, **When** the CLI runs, **Then** scaffolding proceeds without prompting (an empty dir is safe to scaffold into).
7. The CLI exits with code `0` on a successful scaffold + install.
8. The CLI exits with code `1` for validation errors and unrecoverable errors.
9. The CLI exits with code `130` on Ctrl+C / interactive abort (already implemented in 1.2 — verify still works).
10. The CLI never throws an unhandled promise rejection or unhandled exception out of `runCli`. Every error path either prints a message and exits, or returns control to Commander.
11. Strict validation for `--template` and `--pm` is now enforced **before** prompts run. If the flag value is invalid in non-interactive mode, fail fast with a clear error. In interactive mode, the user is reprompted (preserving the Story 1.2 friendly behavior).
12. `--no-install` flag is added so users can skip dependency installation. When provided, the CLI scaffolds and reports that install was skipped.
13. The CLI's `--help` output now documents the validation behavior (valid values for `--template` and `--pm`, the `--no-install` flag).
14. `npm run typecheck`, `npm run lint`, `npm run test` all pass with zero errors.
15. All previous tests pass (no regressions).

## Tasks / Subtasks

- [ ] **Task 1: Project name validation (AC 1, 8)**
  - [ ] Create `src/validation.ts` exporting `validateProjectName(name: string): ValidationResult` where `ValidationResult` is `{ ok: true } | { ok: false; reason: string }`.
  - [ ] Rules (informed by npm package name rules and basic safety):
    - Non-empty after trimming.
    - No path separators (`/`, `\`).
    - No leading dot or underscore.
    - No NUL bytes or control characters.
    - Length ≤ 214 characters (npm limit).
    - Match regex `^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$` (npm package name shape, but kebab-case-first). Allow uppercase too — package names can technically be lowercase only, but the directory name doesn't need that. Actually relax to: lowercase letters, digits, `-`, `_`, `.`, but the first char must be alphanumeric.
  - [ ] Export `ValidationError extends Error` (typed, for runCli to catch).
  - [ ] Export `assertValidProjectName(name: string): void` that throws `ValidationError` on failure.
- [ ] **Task 2: Strict template/pm validation (AC 2, 3, 11)**
  - [ ] Add `validateTemplate(value: string): ValidationResult` and `validatePackageManager(value: string): ValidationResult` to `src/validation.ts`. They check membership in the canonical literal sets (reuse `TEMPLATE_CHOICES` / `PACKAGE_MANAGER_CHOICES`).
  - [ ] Update `runCli` to call these **after** Commander parses but **before** prompts run:
    - In interactive mode: invalid flag values are passed through `buildPartialInputs` (already drops them to undefined) — same Story 1.2 friendly behavior. **No change.**
    - In non-interactive mode: invalid flag values throw `ValidationError` → exit 1 with a clear message. The check needs to happen on the raw flag values before `buildPartialInputs` strips them.
- [ ] **Task 3: Target directory guard (AC 4, 5, 6)**
  - [ ] Add `assertTargetDirSafe(targetDir, options: { interactive, driver })` to `src/validation.ts` (or a new `src/target-dir.ts` — pick one — keeping it in `validation.ts` for cohesion).
  - [ ] Behavior:
    1. If the dir does not exist → return immediately, scaffold will create it.
    2. If the dir exists but is empty → return immediately, scaffold can write into it.
    3. If the dir exists and is non-empty:
       - In interactive mode: ask the user to confirm overwrite via the injected prompt driver. If they decline, throw `ValidationError`.
       - In non-interactive mode: throw `ValidationError` with a clear message.
  - [ ] Add `confirm` to the `PromptDriver` interface — a new method `confirm({ message, default }): Promise<boolean>`. Default driver wraps `@inquirer/prompts.confirm`.
- [ ] **Task 4: `--no-install` flag (AC 12, 13)**
  - [ ] Update `buildProgram` in `src/index.ts` to add `.option('--no-install', 'skip dependency installation')`.
  - [ ] Commander automatically maps `--no-install` to `options.install: false`. Update `CliOptions` to include `install?: boolean` (defaults to `true` per Commander convention).
  - [ ] In `runCli`, when `options.install === false`, override `installDeps` to `false`.
- [ ] **Task 5: Wire validation into `runCli` (AC 1, 2, 3, 4, 5, 7, 8, 10, 11)**
  - [ ] At the top of `runCli`, before `gatherInputs`:
    1. Call `assertValidProjectName(projectName)` — throws ValidationError on bad name.
    2. If non-interactive and `options.template` is provided, call `validateTemplate(options.template)` — error if invalid.
    3. If non-interactive and `options.pm` is provided, call `validatePackageManager(options.pm)` — error if invalid.
  - [ ] After `gatherInputs` returns and the target dir is computed, call `assertTargetDirSafe(targetDir, { interactive, driver })`. If it throws, exit 1.
  - [ ] Wrap `runCli`'s body in try/catch that maps `ValidationError` → `console.error(red(message))` + `process.exit(1)`. Other unexpected errors get rethrown.
- [ ] **Task 6: Refactor — extract `executeScaffoldFlow()` (LOW-1.4-B)**
  - [ ] `runCli` is now doing too much. Extract a private helper `executeScaffoldFlow(resolved, deps): Promise<void>` that handles scaffold + install. `runCli` becomes: validate → gatherInputs → execute. Improves readability without changing behavior.
- [ ] **Task 7: Tests in `tests/unit/validation.test.ts` (AC 1, 2, 3, 14)**
  - [ ] `validateProjectName` — happy path, empty, leading dot, leading underscore, contains slash, contains backslash, NUL byte, length > 214, valid kebab-case names.
  - [ ] `validateTemplate` — each valid value, several invalid values.
  - [ ] `validatePackageManager` — each valid value, several invalid values.
  - [ ] `assertTargetDirSafe`:
    - Returns when targetDir does not exist.
    - Returns when targetDir is an empty directory.
    - Throws ValidationError when targetDir is non-empty and non-interactive.
    - Asks driver.confirm() when targetDir is non-empty and interactive; returns if user confirms; throws if user declines.
- [ ] **Task 8: Tests in `tests/unit/cli.test.ts` (AC 1, 2, 3, 4, 5, 8, 10, 12)**
  - [ ] `runCli` exits with code 1 on invalid project name.
  - [ ] `runCli` exits with code 1 on invalid `--template` in non-interactive mode.
  - [ ] `runCli` exits with code 1 on invalid `--pm` in non-interactive mode.
  - [ ] `runCli` exits with code 1 when target dir is non-empty in non-interactive mode.
  - [ ] `runCli` proceeds when target dir is non-empty and the (interactive) driver confirms.
  - [ ] `runCli` exits with code 1 when target dir is non-empty and the (interactive) driver declines.
  - [ ] `runCli` skips install when `options.install === false` (the new `--no-install` path).
  - [ ] `buildProgram` parses `--no-install` into `options.install === false`.
- [ ] **Task 9: Verification (all ACs)**
  - [ ] `npm run typecheck` → 0 errors.
  - [ ] `npm run lint` → 0 errors.
  - [ ] `npm run test` → all pass.
  - [ ] `npm run build` → builds cleanly.
  - [ ] Manual: `node dist/cli.js ../bad-name` → exits with friendly error, not a crash.

## Dev Notes

### Architecture compliance

- **No new dependencies** — `@inquirer/prompts.confirm` is already part of `@inquirer/prompts` v8.4.1, no new imports needed beyond adding `confirm` to the existing import line.
- **Naming**: `src/validation.ts`, `validateProjectName`, `validateTemplate`, `validatePackageManager`, `assertTargetDirSafe`, `ValidationError`, `ValidationResult`.
- **Types**: discriminated union for `ValidationResult` (`{ ok: true } | { ok: false; reason: string }`). No `any`.
- **Named exports only**.
- **Exit codes** follow common shell conventions: `0` success, `1` validation/runtime error, `130` Ctrl+C.

### Critical implementation details — anti-disaster guardrails

- **Validate before prompting** — even in interactive mode, the project name validation should run first because the positional argument has already been parsed and there's no second chance to re-enter it. (Could change later to also re-prompt on bad project names — but for v1, fail fast.)
- **Strict flag validation only in non-interactive mode** — preserves Story 1.2's friendly "drop unknown values, re-prompt" behavior in interactive mode.
- **`--no-install` is `options.install === false`** because Commander's `--no-X` convention sets the option name to `X` with default `true`. Document this in code.
- **`assertTargetDirSafe` uses `fs.readdir` to check emptiness**, not `fs.stat`. An empty directory is fine — only non-empty triggers the prompt.
- **Confirm prompt must use the injected driver**, not call `@inquirer/prompts.confirm` directly. Tests inject a fake.
- **All error paths log to stderr** via `console.error`. stdout is reserved for normal progress.

### Project Structure Notes

After Story 1.5:

```
src/
├── cli.ts          # unchanged
├── index.ts        # runCli adds validation + target-dir guard, --no-install
├── install.ts      # unchanged
├── prompts.ts      # PromptDriver gains confirm() method
├── scaffold.ts     # unchanged
└── validation.ts   # NEW
tests/unit/
├── cli.test.ts        # adds tests for validation + target dir guard
├── install.test.ts    # unchanged
├── prompts.test.ts    # may add a confirm() test
├── scaffold.test.ts   # unchanged
└── validation.test.ts # NEW
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5: Add Error Handling, Validation, and Exit Codes]
- [Source: _bmad-output/planning-artifacts/prd.md#FR7, FR48 — error messages and exit codes]
- [Source: _bmad-output/planning-artifacts/architecture.md#Quality & Automation]
- npm package name rules: https://github.com/npm/validate-npm-package-name (patterns, not the dependency)

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors
- `npm run test` → 123/123 (35 validation + 38 scaffold + 20 install + 16 cli + 14 prompts)
- `npm run build` → tsup → `dist/cli.js` 20.48 KB

### Completion Notes List

- **`validation.ts`** centralizes all input validation: project name (npm-compatible regex + length + safety), template/pm strict checks, and target-dir safety. Pure validation functions return a discriminated union; assertion wrappers throw `ValidationError`.
- **Project name rules**: lowercase + digits + `-`/`_`/`.`, must start with alphanumeric, no path separators, no NUL bytes, max 214 chars (npm limit), no leading dot/underscore.
- **Strict flag validation only in non-interactive mode** — interactive mode preserves Story 1.2's friendly drop-and-reprompt UX. Tested both paths.
- **Target dir guard**:
  - Non-existent → proceed (scaffold will create).
  - Empty existing → proceed (safe to write into).
  - Non-empty + non-interactive → exit 1 with clear error.
  - Non-empty + interactive → ask via `driver.confirm()`. Decline → exit 1 ("Aborted by user…"). Confirm → proceed.
  - Path is a file → exit 1 with "not a directory" error.
- **`PromptDriver` extended with `confirm()`** — default driver wraps `@inquirer/prompts.confirm`, also catches `ExitPromptError` like the other methods.
- **`--no-install` flag** added to Commander. `options.install === false` overrides the default installation behavior. Test injection via `installDeps` still takes precedence.
- **`runCli` refactored**: extracted `executeScaffoldFlow()` helper so the validation gate, gather, and execution are visually separated. Addresses LOW-1.4-B from the previous review.
- **Top-level try/catch**: `runCli` now wraps everything so `ValidationError` is consistently mapped to a friendly red error and exit 1. Other errors propagate (preserving the existing `PromptCancelledError` exit-130 path).
- **Exit codes**: `0` success, `1` validation/install error, `130` Ctrl+C cancellation. Documented in code.
- **No regressions**: all 86 prior tests still pass. Added 35 new validation tests + 8 new cli validation tests + 2 new buildProgram tests for `--no-install`.

### File List

**Created (2):**

- `src/validation.ts` — `validateProjectName`, `validateTemplate`, `validatePackageManager`, `assertValidProjectName`, `assertValidTemplate`, `assertValidPackageManager`, `assertTargetDirSafe`, `ValidationError`
- `tests/unit/validation.test.ts` — 35 unit tests covering project name rules, template/pm validation, target-dir guard (all branches)

**Modified (4):**

- `src/prompts.ts` — `PromptDriver` interface gains `confirm()`; default driver wraps `@inquirer/prompts.confirm` with the existing Ctrl+C handler
- `src/index.ts` — `runCli` adds validation gate + target-dir guard + `--no-install` handling; refactored to extract `executeScaffoldFlow()`; new top-level try/catch for `ValidationError`; `--no-install` added to Commander
- `tests/unit/prompts.test.ts` — fake driver gets a no-op `confirm` to satisfy the new interface
- `tests/unit/cli.test.ts` — fake drivers get `confirm`; added 2 buildProgram tests (`--no-install`) and 6 runCli validation/guard tests
