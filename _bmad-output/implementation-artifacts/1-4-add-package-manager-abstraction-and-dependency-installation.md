# Story 1.4: Add Package Manager Abstraction and Dependency Installation

Status: done

## Story

As a developer scaffolding a new project,
I want dependencies installed automatically using my chosen package manager,
so that I can run the project immediately after scaffolding.

## Acceptance Criteria

1. **Given** the scaffold engine has copied template files to the target directory and the developer selected a package manager (`npm`, `pnpm`, or `yarn`), **When** dependency installation runs, **Then** the corresponding install command (`npm install`, `pnpm install`, or `yarn install`) executes inside the target directory.
2. **Given** the user selected a package manager, **When** installation completes, **Then** only that manager's lock file remains in the target directory and the other lock files are removed if they existed (e.g. `package-lock.json` for npm; `pnpm-lock.yaml` for pnpm; `yarn.lock` for yarn).
3. **Given** the target directory contains a `README.md` referencing package manager commands, **When** the install step finishes (or is skipped — see #5), **Then** the README has had its package manager commands rewritten to match the user's selection. Substitution rules: `{{pmInstallCmd}}` → `<pm> install`, `{{pmRunCmd}}` → `<pm> run`, `{{pmExecCmd}}` → `<npx | pnpm dlx | yarn dlx>`. These tokens are inserted by Story 1.3's substitution mechanism — Story 1.4 just supplies the values.
4. The CLI displays progress feedback during install: a "Installing dependencies with <pm>…" line printed via `chalk` (cyan) before the install starts and a "Done." (green) on success. Errors print in red.
5. The install step is **opt-out** at the API level: `runCli` accepts an `installDeps?: boolean` flag that defaults to `true`. Tests pass `false` so they don't actually invoke a package manager subprocess.
6. The package manager helper exposes:
   - `getPackageManagerCommands(pm: PackageManagerName)` returning `{ install: string; run: string; exec: string; lockFile: string }`.
   - `installDependencies(targetDir: string, pm: PackageManagerName, runner?: ProcessRunner): Promise<void>` that executes the install command and returns when finished. `runner` is an injectable interface (default uses `execa`); tests inject a fake.
   - `cleanupLockFiles(targetDir: string, pm: PackageManagerName): Promise<void>` that removes all lock files except the selected one.
7. Errors from the install subprocess (non-zero exit, missing binary) propagate as a typed error (`InstallFailedError`) and `runCli` catches them and exits with a non-zero code.
8. The package manager binary is detected via the user's `PATH` (handled by `execa`). If the binary is missing, the error message tells the developer to install it. (E.g. "Could not find pnpm in PATH. Install it from https://pnpm.io/installation".)
9. `runCli`'s `RunCliDeps` is extended with `installRunner?: ProcessRunner` and `installDeps?: boolean` so tests can fully control the behavior without spawning subprocesses.
10. The substitution variables map (from Story 1.3 `buildSubstitutionVars`) is extended with `pmInstallCmd`, `pmRunCmd`, `pmExecCmd` so future templates can reference them directly via `{{pmInstallCmd}}` etc.
11. `npm run typecheck`, `npm run lint`, `npm run test` all pass with zero errors.
12. All previous tests pass (no regressions).

## Tasks / Subtasks

- [ ] **Task 1: Add `execa` and `chalk` dependencies (AC 1, 4)**
  - [ ] `npm view execa version` → pin exact in `dependencies`.
  - [ ] `npm view chalk version` → pin exact in `dependencies`.
  - [ ] `npm install`.
- [ ] **Task 2: Create `src/install.ts` (AC 1, 6, 7, 8)**
  - [ ] Define `PackageManagerCommands` interface: `{ install: string; run: string; exec: string; lockFile: string }`.
  - [ ] Define and export `PACKAGE_MANAGER_COMMANDS: Readonly<Record<PackageManagerName, PackageManagerCommands>>` containing the canonical strings:
    - `npm`: `{ install: 'npm install', run: 'npm run', exec: 'npx', lockFile: 'package-lock.json' }`
    - `pnpm`: `{ install: 'pnpm install', run: 'pnpm run', exec: 'pnpm dlx', lockFile: 'pnpm-lock.yaml' }`
    - `yarn`: `{ install: 'yarn install', run: 'yarn run', exec: 'yarn dlx', lockFile: 'yarn.lock' }`
  - [ ] Define `getPackageManagerCommands(pm)` and export it.
  - [ ] Define `ProcessRunner` interface with one method: `run(command: string, args: ReadonlyArray<string>, options: { cwd: string }): Promise<void>`. The default implementation uses `execa` and rejects with `InstallFailedError` on non-zero exit, including stderr in the message.
  - [ ] Define `defaultProcessRunner: ProcessRunner` that wraps `execa(command, args, { cwd, stdio: 'inherit' })`. Inheriting stdio is important so the user sees install progress in real time. Catch `ENOENT` from execa and wrap it as `InstallFailedError` with a friendly "install <pm>" message.
  - [ ] Define `class InstallFailedError extends Error` (named, with `name` set, optional `cause`).
  - [ ] Define and export `installDependencies(targetDir, pm, runner = defaultProcessRunner)`. Splits the canonical install string at the first space (e.g. `'pnpm install'` → `['pnpm', ['install']]`) and calls `runner.run`.
  - [ ] Define and export `cleanupLockFiles(targetDir, pm)`. Iterates the three known lock files; for each one **not** matching `pm`'s lock file, calls `fs.remove` (idempotent — no error if missing).
- [ ] **Task 3: Extend substitution variables (AC 10)**
  - [ ] Update `buildSubstitutionVars` in `src/scaffold.ts` to also accept the package manager and inject `pmInstallCmd`, `pmRunCmd`, `pmExecCmd`. Backward-compat: the function signature stays the same since `ResolvedInputs` already includes `pm`.
  - [ ] Add a unit test asserting the new variables are present and correct for each package manager.
- [ ] **Task 4: Wire install + cleanup into `runCli` (AC 1, 2, 4, 5, 7, 9)**
  - [ ] Extend `RunCliDeps` with `installRunner?: ProcessRunner` and `installDeps?: boolean`.
  - [ ] After `scaffoldProject` succeeds, if `installDeps !== false`:
    1. Print a cyan "Installing dependencies with <pm>…" via chalk.
    2. Call `cleanupLockFiles(targetDir, pm)` first so we don't accidentally trigger lock-file conflicts.
    3. Call `installDependencies(targetDir, pm, installRunner)`.
    4. On success, print green "Done.".
    5. On `InstallFailedError`, print red error and `process.exit(1)`.
  - [ ] If `installDeps === false`, skip the install entirely (used by tests and by future `--no-install` flag — but no flag is added in this story).
- [ ] **Task 5: Unit tests in `tests/unit/install.test.ts` (AC 1, 2, 6, 7, 8)**
  - [ ] Test that `getPackageManagerCommands('npm')` returns the npm record.
  - [ ] Test all three package manager records.
  - [ ] Test `installDependencies` calls the runner with the correct command, args, and cwd for each pm.
  - [ ] Test `installDependencies` rejects with `InstallFailedError` when the runner rejects.
  - [ ] Test `cleanupLockFiles('npm')` removes `pnpm-lock.yaml` and `yarn.lock` if they exist, leaves `package-lock.json` alone.
  - [ ] Test `cleanupLockFiles` is idempotent (no error if files don't exist).
  - [ ] Test the new substitution variables for each package manager.
- [ ] **Task 6: cli.test.ts tests for the install path (AC 5, 9)**
  - [ ] Test that `runCli` calls the install runner exactly once when scaffolding succeeds and `installDeps !== false`.
  - [ ] Test that `runCli` does NOT call the install runner when `installDeps: false`.
  - [ ] Test that `runCli` exits with code 1 when the install runner rejects with `InstallFailedError`.
- [ ] **Task 7: Verification (all ACs)**
  - [ ] `npm run typecheck` → 0 errors.
  - [ ] `npm run lint` → 0 errors.
  - [ ] `npm run test` → all pass.
  - [ ] `npm run build` → builds cleanly.

## Dev Notes

### Architecture compliance

- **Stack** _(architecture.md, "CLI Libraries")_: `execa` is the chosen subprocess library, `chalk` is the chosen output coloring library. Pin both exact per NFR16. Do **not** introduce alternatives (`zx`, `cross-spawn`, `kleur`, etc.).
- **Naming**: `src/install.ts`, `installDependencies`, `cleanupLockFiles`, `getPackageManagerCommands`, `PACKAGE_MANAGER_COMMANDS`, `ProcessRunner`, `InstallFailedError`.
- **No `any`**.
- **Named exports only**.

### Critical implementation details — anti-disaster guardrails

- **Use `stdio: 'inherit'`** for the install subprocess so the user sees the package manager's output in real time. Buffering it would silence ~30 seconds of install logs.
- **Inject the `ProcessRunner`**, do not directly call `execa` from the CLI flow. Tests must run without spawning subprocesses (and definitely without invoking `npm install` against the file system).
- **Handle `ENOENT`** specifically — execa surfaces it as `code === 'ENOENT'`. Convert to a friendly "install <pm>" message.
- **Order matters**: clean up lock files **before** running install, so a stale lock file from a different package manager doesn't confuse the install. (Templates may ship with `package-lock.json` even if the user picks pnpm.)
- **Don't pipe through a shell**. Pass arguments as an array to execa to avoid quoting issues. Each command in `PACKAGE_MANAGER_COMMANDS` is a single binary plus a single subcommand, so splitting at the first space is sufficient.
- **chalk is ESM-only since v5** — already aligned with our `"type": "module"` setup.
- **Don't add a `--no-install` flag** in this story. Story 1.5 owns CLI flag additions. The `installDeps?: boolean` parameter on `runCli` exists purely for tests now; the flag wiring lands in 1.5.

### Pinned version targets

| Package | Track |
|---|---|
| `execa` | v9.x (ESM-only) |
| `chalk` | v5.x (ESM-only) |

Verify with `npm view <pkg> version` before pinning.

### Project Structure Notes

After Story 1.4:

```
src/
├── cli.ts        # unchanged
├── index.ts      # runCli now also installs deps + cleans lock files
├── install.ts    # NEW: package manager abstraction
├── prompts.ts    # unchanged
└── scaffold.ts   # buildSubstitutionVars now adds pm-related tokens
tests/unit/
├── cli.test.ts       # adds tests for install path
├── install.test.ts   # NEW: covers commands, runner, cleanup
├── prompts.test.ts   # unchanged
└── scaffold.test.ts  # adds tests for new substitution vars
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4: Add Package Manager Abstraction and Dependency Installation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Selected Approach — chalk + execa for CLI feedback and subprocess]
- [Source: _bmad-output/planning-artifacts/prd.md#FR8, FR10, FR11 — progress feedback, install, lockfile generation]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- `npm install execa@9.6.1 chalk@5.6.2` → 17 packages added, 0 vulnerabilities
- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors
- `npm run test` → 84/84 (18 install + 38 scaffold + 14 prompts + 14 cli)
- `npm run build` → tsup → `dist/cli.js` 15.60 KB

### Completion Notes List

- **Pinned `execa@9.6.1` + `chalk@5.6.2`** (verified via `npm view`).
- **`getPackageManagerCommands` uses a switch** instead of indexed access. With `noUncheckedIndexedAccess: true` in tsconfig, `Record<K, V>[k]` returns `V | undefined` even when `K` is a string literal union. The switch is exhaustive over `PackageManagerName` so TS knows the return type is `PackageManagerCommands`.
- **`PackageManagerName` import path**: install.ts imports from `./index.ts` (where the type is declared) rather than `./prompts.ts` (which only re-uses it). This matches the pattern prompts.ts uses.
- **`stdio: 'inherit'`** in `defaultProcessRunner` so users see real-time install progress. Tests inject a fake runner and never spawn subprocesses.
- **Lock file cleanup runs BEFORE install** to avoid stale lock files left over from the template confusing the chosen package manager.
- **`buildSubstitutionVars` extended** with `pmInstallCmd`/`pmRunCmd`/`pmExecCmd`. Templates can use these tokens directly in their READMEs (e.g. ``` Run `{{pmInstallCmd}}` to install dependencies. ```).
- **`installDeps` defaults to true**; tests pass `false` to skip the install. The CLI flag for opt-out (e.g. `--no-install`) lands in Story 1.5.
- **Deferred to later stories**:
  - `--no-install` CLI flag → Story 1.5
  - Strict input validation / target dir guard → Story 1.5

### File List

**Created (2):**

- `src/install.ts` — `installDependencies()`, `cleanupLockFiles()`, `getPackageManagerCommands()`, `defaultProcessRunner`, `InstallFailedError`, `PACKAGE_MANAGER_COMMANDS`
- `tests/unit/install.test.ts` — 18 unit tests covering commands, runner, cleanup, error wrapping, and the new substitution variables

**Modified (3):**

- `package.json` — added `execa@9.6.1` and `chalk@5.6.2` to `dependencies`
- `src/scaffold.ts` — `buildSubstitutionVars` now also injects pm-related tokens
- `src/index.ts` — `runCli()` now installs dependencies (and cleans lock files) by default; new `installRunner` and `installDeps` deps; `InstallFailedError` → exit 1
- `tests/unit/cli.test.ts` — added 3 install-path tests (default install, opt-out, error handling)

### Code Review Findings (Phase 3)

**HIGH (auto-fixed):**

- **Fragile install command split**: `commands.install.split(' ')` worked for current strings but felt ad hoc. Refactored to store install commands as `installArgv: { binary: string; args: string[] }` tuples — `installDependencies` now reads them directly without string parsing.
- **`installDependencies` lacks targetDir validation**: would surface a confusing low-level execa error if called with a non-existent path. Added `fs.stat` check up front that throws `InstallFailedError` with a clear message.

**MEDIUM (deferred):** see `deferred-findings.md` (`MEDIUM-1.4-A` yarn 1/4 distinction, `MEDIUM-1.4-B` install timeout).

**LOW (deferred):** see `deferred-findings.md` (`LOW-1.4-A` no test for default execa runner, `LOW-1.4-B` `runCli` length refactor).

**CRITICAL:** none. Subprocess invocation already uses argv arrays (no shell injection).
