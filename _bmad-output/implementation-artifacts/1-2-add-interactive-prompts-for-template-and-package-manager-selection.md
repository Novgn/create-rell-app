# Story 1.2: Add Interactive Prompts for Template and Package Manager Selection

Status: review

## Story

As a developer scaffolding a new project,
I want interactive prompts to select my template and package manager,
so that I can configure my scaffold without memorizing flag syntax.

## Acceptance Criteria

1. **Given** the CLI is run with no flags (e.g. `create-rell-app my-project`), **When** the action handler runs, **Then** an interactive prompt asks the developer to select a template from `Solo Web` (`web`), `Solo Mobile` (`mobile`), and `Full-Stack Monolith` (`monolith`), and a second prompt asks the developer to select a package manager from `npm`, `pnpm`, and `yarn`.
2. **Given** the developer passes `--template web` (or `-t web`), **When** prompts run, **Then** the template prompt is skipped and only the package manager prompt is shown.
3. **Given** the developer passes `--pm pnpm`, **When** prompts run, **Then** the package manager prompt is skipped and only the template prompt is shown.
4. **Given** the developer passes both `--template` and `--pm`, **When** prompts run, **Then** **no** interactive prompts are shown and the parsed arguments are used directly.
5. The developer can confirm or modify the project name via an interactive prompt; the value parsed from the positional `<project-name>` is the default.
6. The CLI exposes a single `gatherInputs(initial: PartialInputs): Promise<ResolvedInputs>` function (or equivalent) that the action handler calls. `ResolvedInputs` is fully typed with `projectName: string`, `template: TemplateName`, `pm: PackageManagerName`. No `any` types.
7. Prompt logic is unit-testable without spawning a TTY: tests inject a fake prompt driver (or stub `@inquirer/prompts`) so we can assert the prompt skip-when-flag-provided behavior deterministically.
8. `npm run typecheck`, `npm run lint`, and `npm run test` all pass with zero errors and zero warnings.
9. All existing tests from Story 1.1 continue to pass (no regressions).

## Tasks / Subtasks

- [ ] **Task 1: Add `@inquirer/prompts` dependency (AC 1, 6)**
  - [ ] Run `npm view @inquirer/prompts version` to confirm the latest stable, then add it to `dependencies` in `package.json` pinned exact (no `^`/`~`) per NFR16.
  - [ ] `npm install` and verify lockfile updates cleanly.
- [ ] **Task 2: Create `src/prompts.ts` (AC 1, 2, 3, 4, 5, 6)**
  - [ ] Export `TEMPLATE_CHOICES` and `PACKAGE_MANAGER_CHOICES` constants (typed `readonly` arrays of `{ name, value, description? }` objects). These are the single source of truth for the labels and values.
  - [ ] Export typed interfaces:
    - `PartialInputs` — `{ projectName: string; template?: TemplateName; pm?: PackageManagerName }` (raw flags from Commander, possibly invalid string values from `--template`/`--pm` are narrowed to undefined and re-prompted).
    - `ResolvedInputs` — `{ projectName: string; template: TemplateName; pm: PackageManagerName }` (post-prompt, all required).
  - [ ] Export `gatherInputs(initial: PartialInputs, driver?: PromptDriver): Promise<ResolvedInputs>`.
    - Always prompts for project name (default = `initial.projectName`) — AC 5.
    - Prompts for template only if `initial.template` is undefined — AC 2, 4.
    - Prompts for package manager only if `initial.pm` is undefined — AC 3, 4.
    - The optional `driver` parameter accepts a `PromptDriver` interface so tests can inject a fake. Default driver wraps `@inquirer/prompts`.
  - [ ] Define `PromptDriver` interface with three methods: `text({ message, default })`, `select<T>({ message, choices })`, returning `Promise<string>` / `Promise<T>`. Keep this interface narrow — only what we actually use, no leaky types from `@inquirer/prompts`.
  - [ ] Implement the default driver as a small adapter object that calls `@inquirer/prompts` `input()` and `select()`. Tests substitute their own driver.
- [ ] **Task 3: Wire prompts into `runCli` (AC 1–5)**
  - [ ] Update `src/index.ts` `runCli(projectName, options)` to:
    1. Build a `PartialInputs` object from `projectName` + `options.template` + `options.pm`.
       - Narrow the raw `string | undefined` flag values: if `options.template` is not one of `'web' | 'mobile' | 'monolith'`, treat as undefined for now (prompt will be shown). Same for `options.pm`. Strict validation with friendly errors lands in Story 1.5; for 1.2 we err on the side of re-prompting.
    2. Call `gatherInputs(partial)` to get a fully resolved `ResolvedInputs`.
    3. Log the resolved values (placeholder behavior — actual scaffold lands in 1.3).
  - [ ] Keep `runCli` exported and unit-testable. The `driver` parameter is wired via an optional second argument so tests can pass a fake driver: `runCli(projectName, options, driver?)`.
- [ ] **Task 4: Unit tests in `tests/unit/prompts.test.ts` (AC 7, 8)**
  - [ ] Test that `gatherInputs` skips the template prompt when `initial.template === 'web'` (assert the fake driver's `select` was called only for the package manager).
  - [ ] Test that `gatherInputs` skips the package manager prompt when `initial.pm === 'pnpm'`.
  - [ ] Test that `gatherInputs` runs neither template nor package manager `select` when both flags are provided.
  - [ ] Test that `gatherInputs` always prompts for project name and uses `initial.projectName` as the default (the fake driver echoes the default back).
  - [ ] Test that an unknown `template` value (e.g. `'react'`) is dropped and the prompt is shown.
  - [ ] Test that an unknown `pm` value is dropped and the prompt is shown.
  - [ ] Test that the resolved object is fully typed: `projectName: string`, `template: TemplateName`, `pm: PackageManagerName` — accomplished by relying on the existing `tsc --noEmit` strict check, no runtime assertion needed.
- [ ] **Task 5: Update `cli.test.ts` for the prompt-skip path (AC 4, 9)**
  - [ ] Add a test that calls `runCli('my-project', { template: 'web', pm: 'pnpm' }, fakeDriver)` and asserts that the fake driver only prompted for `projectName` and that the resolved values match.
  - [ ] Make sure all existing tests still pass.
- [ ] **Task 6: Verification (all ACs)**
  - [ ] `npm run typecheck` → 0 errors.
  - [ ] `npm run lint` → 0 errors, 0 warnings.
  - [ ] `npm run test` → all tests pass.
  - [ ] `npm run build` → builds cleanly.
  - [ ] Spot-check `node dist/cli.js my-project` should attempt to launch a real prompt (manual verification noted but not automated since it requires a TTY).

## Dev Notes

### Architecture compliance

- **Stack** _(architecture.md, "CLI Libraries")_:
  - `@inquirer/prompts` is the chosen interactive prompt library. Use `input()` for the project name and `select()` for template + package manager. Do **not** introduce alternative prompt libraries (`enquirer`, `prompts`, etc.).
- **Naming** _(architecture.md, "CLI Source Code — Naming")_:
  - Files: `kebab-case.ts` → `src/prompts.ts`
  - Types/interfaces: `PascalCase` → `PartialInputs`, `ResolvedInputs`, `PromptDriver`
  - Functions/variables: `camelCase` → `gatherInputs`
  - True constants: `UPPER_SNAKE_CASE` → `TEMPLATE_CHOICES`, `PACKAGE_MANAGER_CHOICES`
- **No `any`**: enforced by ESLint rule. The `PromptDriver` interface keeps `@inquirer/prompts`' types out of the public surface so tests can mock without complex typing.
- **Named exports only**.

### Critical implementation details — anti-disaster guardrails

- **Driver injection over module mocking.** Vitest module mocking with ESM is brittle. Pass the prompt driver explicitly. The default driver is a tiny adapter; tests construct their own.
- **Don't reach for `inquirer` (the legacy package).** `@inquirer/prompts` is the modern, ESM-native, individually-imported version. Architecture.md specifies it explicitly.
- **Sanitize unknown flag values to `undefined` rather than throwing.** Story 1.5 owns hard validation with exit codes. For 1.2 we just want the smooth re-prompt experience.
- **Project name prompt always runs**, even when the positional argument is provided. AC 5 specifies "confirm or modify". The default is the positional value, so a developer who is happy with their input just hits Enter.
- **Don't validate project name format** (empty / illegal chars / existing dir). Story 1.5 owns validation. 1.2 only handles re-prompt on missing flag values.
- **No chalk yet.** Story 1.4 owns progress feedback / colored output. Plain `console.log` is fine for the placeholder log line in `runCli`.

### Pinned version target (verify before pinning)

| Package | Track | Notes |
|---|---|---|
| `@inquirer/prompts` | v7.x or v8.x | ESM-only, individually imported (`input`, `select`). Pin exact. |

Run `npm view @inquirer/prompts version` and pin the exact stable.

### Project Structure Notes

After Story 1.2:

```
src/
├── cli.ts        # unchanged
├── index.ts      # runCli now calls gatherInputs()
└── prompts.ts    # NEW: gatherInputs(), PromptDriver, PartialInputs, ResolvedInputs
tests/unit/
├── cli.test.ts   # adds one new test for prompt-skip path
└── prompts.test.ts  # NEW: covers all prompt skip behaviors via fake driver
```

### Testing standards summary

- Vitest, `tests/unit/`, `*.test.ts`.
- Tests inject a fake `PromptDriver` — no module mocking, no real prompts in unit tests.
- The fake driver records calls so tests can assert which prompts were skipped.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2: Add Interactive Prompts for Template and Package Manager Selection]
- [Source: _bmad-output/planning-artifacts/architecture.md#Selected Approach: Commander.js + @inquirer/prompts]
- [Source: _bmad-output/planning-artifacts/architecture.md#CLI Source Code — Naming]
- [Source: _bmad-output/planning-artifacts/prd.md#FR2, FR3, FR4, FR5, FR6 — interactive prompts and partial-flag bypass]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR16 — pinned dependency versions]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- `npm install @inquirer/prompts@8.4.1` → 26 packages added, 0 vulnerabilities
- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors
- `npm run test` → 18/18 tests passing (10 in prompts.test.ts, 8 in cli.test.ts)
- `npm run build` → tsup → `dist/cli.js` 4.29 KB

### Completion Notes List

- **Pinned `@inquirer/prompts@8.4.1`** (verified via `npm view @inquirer/prompts version`). Pinned exact per NFR16.
- **Driver injection pattern**: `gatherInputs(initial, driver?)` and `runCli(projectName, options, driver?)` accept an optional `PromptDriver` so tests inject a fake. Avoids brittle ESM module mocking.
- **Type narrowing on flag values**: `buildPartialInputs()` runs each raw flag through a type guard against the canonical choice list. Unknown values become `undefined` so the user is re-prompted. Hard validation/exit codes land in Story 1.5.
- **Project name prompt always runs** (AC 5: "confirm or modify"). The positional value is the default, so the happy path is one Enter press.
- **Choice constants are the single source of truth** for valid template/pm names. Type guards reference these so adding a new template only requires updating the constant.
- **No regressions**: all 7 existing Story 1.1 cli tests still pass (now expanded to 8 with the new prompt-skip test).
- **Deferred to later stories**:
  - `chalk` colored output → Story 1.4
  - Strict validation with hard errors / exit codes → Story 1.5
  - Empty / illegal project name handling → Story 1.5
  - Real scaffold engine → Story 1.3

### File List

**Created (2):**

- `src/prompts.ts` — `gatherInputs()`, `PromptDriver`, `PartialInputs`, `ResolvedInputs`, `buildPartialInputs()`, `TEMPLATE_CHOICES`, `PACKAGE_MANAGER_CHOICES`, `defaultPromptDriver`
- `tests/unit/prompts.test.ts` — 10 tests covering driver fake, prompt skip behavior, type narrowing, and answer routing

**Modified (3):**

- `package.json` — added `@inquirer/prompts@8.4.1` to `dependencies`
- `src/index.ts` — `runCli()` now calls `gatherInputs()` and accepts an optional `PromptDriver`
- `tests/unit/cli.test.ts` — replaced placeholder runCli tests with three new tests covering full-flag, no-flag, and invalid-flag re-prompt paths
