# Story 1.1: Initialize CLI Project with TypeScript and Commander

Status: review

## Story

As a developer building create-rell-app,
I want a TypeScript project with Commander.js wired as the entry point,
so that the CLI can parse arguments and be invoked via `npx create-rell-app`.

## Acceptance Criteria

1. **Given** the project is set up with `package.json`, `tsconfig.json`, and `tsup.config.ts`, **When** the CLI is built and run with `npx create-rell-app my-project`, **Then** Commander parses the positional `<project-name>` argument plus `--template` (`-t`) and `--pm` flags and the parsed values are accessible to the entry function.
2. The `bin` field in `package.json` maps `create-rell-app` to the compiled entry point under `dist/`, the entry file starts with a `#!/usr/bin/env node` shebang, and the file is executable after `tsup` build.
3. Running `create-rell-app --help` displays usage information that shows the program name, the `<project-name>` positional, the `--template`/`-t` and `--pm` options with their allowed values, and a short description.
4. Running `create-rell-app --version` prints the version from `package.json`.
5. `npm run build` compiles `src/index.ts` (and any imports) to `dist/index.js` (ESM, Node 22 target) using `tsup` with no errors.
6. `npm run test` runs Vitest and at least one passing unit test exists that asserts Commander parses a representative invocation (`my-project --template monolith --pm pnpm`) into the expected values.
7. `npm run typecheck` runs `tsc --noEmit` against strict-mode TypeScript with zero errors and zero `any` types.
8. `npm run lint` runs ESLint + Prettier checks against `src/` and `tests/` with zero errors and zero warnings on the freshly scaffolded source.
9. The project layout matches the architecture: source in `src/`, tests in `tests/unit/`, build output in `dist/`, and `dist/` is gitignored.

## Tasks / Subtasks

- [ ] **Task 1: Initialize npm package skeleton (AC 1, 2, 9)**
  - [ ] Create `package.json` with `"name": "create-rell-app"`, `"version": "0.1.0"`, `"type": "module"`, `"engines.node": ">=22"`, `"description"`, `"license": "MIT"`, `"author": "Wayne"`, and `"private": false`.
  - [ ] Set `"bin": { "create-rell-app": "./dist/index.js" }`.
  - [ ] Add `"files": ["dist", "templates", "README.md"]` (`templates/` is empty for now — added in Story 1.3+).
  - [ ] Add scripts: `build`, `dev` (tsup --watch), `typecheck`, `lint`, `lint:fix`, `format`, `test`, `test:watch`.
  - [ ] Create `.gitignore` excluding `node_modules`, `dist`, `*.tsbuildinfo`, `.DS_Store`, `coverage`, `.env*` (allow `.env.example`).
  - [ ] Create `.npmignore` (or rely on `files`) to keep `tests/`, `_bmad/`, `_bmad-output/` out of the published tarball.
- [ ] **Task 2: Configure TypeScript strict mode (AC 5, 7, 9)**
  - [ ] Create `tsconfig.json`: `"target": "ES2023"`, `"module": "ESNext"`, `"moduleResolution": "Bundler"`, `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`, `"esModuleInterop": true`, `"isolatedModules": true`, `"skipLibCheck": true`, `"resolveJsonModule": true`, `"outDir": "dist"`, `"rootDir": "."`, `"include": ["src/**/*", "tests/**/*"]`.
  - [ ] Verify `tsc --noEmit` passes on an empty `src/index.ts`.
- [ ] **Task 3: Configure tsup build (AC 5, 2)**
  - [ ] Create `tsup.config.ts`: `entry: ['src/index.ts']`, `format: ['esm']`, `target: 'node22'`, `outDir: 'dist'`, `clean: true`, `sourcemap: true`, `dts: false`, `splitting: false`, `shims: false`.
  - [ ] Add a tsup `banner` (or `outExtension`) so the bundled `dist/index.js` retains the `#!/usr/bin/env node` shebang from `src/index.ts`.
  - [ ] Use a `tsup` `onSuccess`/`outExtension`/post-build hook (or a tiny `postbuild` script that runs `chmod +x dist/index.js` on POSIX) so the published bin is executable. Skip the chmod gracefully on Windows (e.g., `node` script that no-ops on `process.platform === 'win32'`).
- [ ] **Task 4: Wire Commander entry point (AC 1, 2, 3, 4)**
  - [ ] Create `src/index.ts` starting with `#!/usr/bin/env node` and `import { Command } from 'commander'`.
  - [ ] Read the version once via `import pkg from '../package.json' with { type: 'json' }` (the JSON import attribute keeps it ESM-safe and statically typed).
  - [ ] Build the program: `.name('create-rell-app')`, `.description('Scaffold a fully wired Clerk + Supabase + Drizzle starter app')`, `.version(pkg.version, '-v, --version')`, `.argument('<project-name>', 'name of the project directory to create')`, `.option('-t, --template <template>', 'template to use (web | mobile | monolith)')`, `.option('--pm <packageManager>', 'package manager to use (npm | pnpm | yarn)')`.
  - [ ] Define and export a typed `CliOptions` interface (`template?: 'web' | 'mobile' | 'monolith'`, `pm?: 'npm' | 'pnpm' | 'yarn'`).
  - [ ] Define `runCli(projectName: string, options: CliOptions): Promise<void>` as a separate exported function (action handler) so it can be unit-tested without spawning a process. For Story 1.1 the body just `console.log`s the parsed values — actual prompts/scaffolding land in later stories.
  - [ ] At the bottom: only call `program.parseAsync(process.argv)` when the file is the entry module — gate it with `import.meta.url === pathToFileURL(process.argv[1]).href` so unit tests can import the module without triggering parse.
- [ ] **Task 5: Add Vitest with one passing test (AC 6)**
  - [ ] Create `vitest.config.ts` that picks up `tests/**/*.test.ts`, sets `environment: 'node'`, and enables typecheck-friendly defaults.
  - [ ] Create `tests/unit/cli.test.ts` that imports the program builder (factor it as `export function buildProgram(): Command` in `src/index.ts`) and asserts that calling `program.parse(['node', 'create-rell-app', 'my-project', '--template', 'monolith', '--pm', 'pnpm'], { from: 'user' })` populates the expected positional and options. Use `program.exitOverride()` inside the test to prevent Commander from calling `process.exit`.
  - [ ] Add a second test asserting `--help` output (captured via `program.helpInformation()`) contains `create-rell-app`, `<project-name>`, `--template`, and `--pm`.
- [ ] **Task 6: Configure ESLint + Prettier (AC 8)**
  - [ ] Create `eslint.config.js` (flat config) using `@eslint/js`, `typescript-eslint`, and `eslint-config-prettier`. Enable `@typescript-eslint/no-explicit-any: 'error'`, `@typescript-eslint/consistent-type-imports: 'error'`, `no-console: 'off'` (CLI prints to stdout), and ESLint recommended rules.
  - [ ] Create `.prettierrc.json`: `singleQuote: true`, `semi: true`, `trailingComma: 'all'`, `printWidth: 100`.
  - [ ] Add `.prettierignore` (mirror `.gitignore` essentials plus `dist/`, `coverage/`, `_bmad-output/`).
  - [ ] Verify `npm run lint` passes on the freshly scaffolded source.
- [ ] **Task 7: Verification (all ACs)**
  - [ ] Run `npm install` and confirm install succeeds with no audit errors.
  - [ ] Run `npm run typecheck` → 0 errors.
  - [ ] Run `npm run lint` → 0 errors.
  - [ ] Run `npm run build` → produces `dist/index.js`; verify it starts with `#!/usr/bin/env node`; verify it is executable (`ls -l dist/index.js`).
  - [ ] Run `npm run test` → all tests pass.
  - [ ] Run `node dist/index.js my-test-project --template monolith --pm pnpm` and confirm it logs the parsed inputs (no errors).
  - [ ] Run `node dist/index.js --help` and confirm output matches AC 3.
  - [ ] Run `node dist/index.js --version` and confirm it prints `0.1.0`.

## Dev Notes

### Architecture compliance — what the dev MUST follow

- **Stack** _(architecture.md, Selected Approach: Commander.js + @inquirer/prompts)_:
  - `commander` (flag/argument parsing)
  - `@inquirer/prompts` — _do not import yet; reserved for Story 1.2_
  - `chalk` — _do not import yet; reserved for Story 1.4 progress feedback_
  - `fs-extra` — _do not import yet; Story 1.3_
  - `execa` — _do not import yet; Story 1.4_
- **Build tool**: `tsup` (architecture.md, "Build Tooling: tsup for TypeScript compilation to distributable JS").
- **Test framework**: Vitest (architecture.md, "Testing: Vitest for unit tests").
- **Module system**: ESM only. Set `"type": "module"` in `package.json`. `chalk` v5+ and `execa` v8+ are ESM-only — committing to ESM up front avoids a painful CJS migration later.
- **Node target**: 22+ LTS (PRD + architecture). Node 23 is fine locally for dev but `engines.node` must be `>=22`.
- **Naming** _(architecture.md, "CLI Source Code — Naming")_:
  - Files: `kebab-case.ts`
  - Functions/variables: `camelCase`
  - Types/interfaces: `PascalCase`
  - True constants: `UPPER_SNAKE_CASE`
- **Source layout** _(architecture.md, "CLI Project repo structure")_: flat `src/` directory. Story 1.1 only creates `src/index.ts`. Do **not** preemptively create `prompts.ts`, `scaffold.ts`, `install.ts`, or `utils.ts` — those are added in their respective stories so they get real implementations and tests, not empty stubs.
- **TypeScript strict mode + no `any`** _(architecture.md, "TypeScript Conventions: Strict mode enabled, no `any`")_. Enforced by tsconfig + ESLint rule.
- **Named exports only** _(architecture.md, same section)_. The only acceptable side-effect statement at the bottom of `src/index.ts` is the gated `parseAsync` call.

### Critical implementation details — anti-disaster guardrails

- **Shebang preservation**: tsup strips top-of-file comments by default. Use `tsup`'s `banner` option or a `js` `banner: '#!/usr/bin/env node'` to ensure the bundled `dist/index.js` keeps the shebang. Verify with `head -1 dist/index.js` after build.
- **JSON import for version**: Use the standardized JSON import attribute syntax (`import pkg from '../package.json' with { type: 'json' }`). Older syntax with `assert` is deprecated. Node 22+ supports `with`.
  - tsup will inline the JSON at build time so the bundled output does not need a runtime JSON import.
- **Test isolation**: The action handler (`runCli`) must be exported and unit-testable without spawning a subprocess. Do **not** call `program.parseAsync(process.argv)` at module top level unconditionally — that breaks `import` from tests. Gate with `import.meta.url === pathToFileURL(process.argv[1]).href`.
- **Commander exit override in tests**: When testing `parse()` in unit tests, call `program.exitOverride()` first so unknown commands or `--help` throw a `CommanderError` instead of calling `process.exit(0)` and crashing the test runner.
- **Don't validate option enums yet**: AC 7 in Story 1.5 covers "clear error messages for invalid input". Story 1.1 should accept any string for `--template` and `--pm` and only do final validation in Story 1.5. This avoids cross-story coupling and keeps each checkpoint focused. (You may use Commander's `.choices()` if you want — but it's not required for AC.)
- **No interactive prompts yet**: Story 1.2 owns @inquirer/prompts. Story 1.1 just logs the parsed args. Resist the urge to wire prompts now.

### Latest stable versions to pin (as of 2026-04-07)

Pin exact versions in `package.json` (no `^` or `~`) per architecture rule "no floating ranges". These are the intended targets — the dev agent should run `npm view <pkg> version` for each to confirm the current stable before pinning, and document the actual version chosen in the Dev Agent Record below.

| Package | Intended track | Notes |
|---|---|---|
| `commander` | v12.x or v13.x | Stable, ESM-friendly, exitOverride supported |
| `tsup` | v8.x | esbuild-based, ESM, Node 22 target supported |
| `vitest` | v2.x or v3.x | Pin same version as `@vitest/coverage-v8` if added later |
| `typescript` | v5.6+ | Required for `noUncheckedIndexedAccess` and modern JSON import |
| `eslint` | v9.x | Flat config (`eslint.config.js`) is required in v9 |
| `typescript-eslint` | v8.x | Pulls in `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` |
| `eslint-config-prettier` | v9.x | Disables ESLint stylistic rules that conflict with Prettier |
| `prettier` | v3.x | |
| `@types/node` | matching Node 22 LTS | dev dependency |

### Project Structure Notes

Expected layout after Story 1.1 completes:

```
create-rell-app/
├── src/
│   └── index.ts                # Commander entry, exports buildProgram + runCli
├── tests/
│   └── unit/
│       └── cli.test.ts         # Vitest test for Commander parsing + --help
├── dist/                       # gitignored, generated by tsup
├── _bmad/                      # existing
├── _bmad-output/               # existing
├── .github/                    # not yet — Story 6.2
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── eslint.config.js
├── .prettierrc.json
├── .prettierignore
├── .gitignore
├── .npmignore                  # optional if `files` field is set
└── README.md                   # optional for Story 1.1; placeholder OK
```

**Variances from architecture.md**: none expected. Files like `src/prompts.ts`, `src/scaffold.ts`, `src/install.ts`, `src/utils.ts`, and `templates/` are intentionally deferred to their respective stories so each story owns its real code rather than empty placeholders.

### Testing standards summary

- **Framework**: Vitest. Tests in `tests/unit/`.
- **Naming**: `*.test.ts`.
- **No coverage gate yet** — established later if needed.
- **Tests must not spawn subprocesses** in this story. Test the `buildProgram()` factory directly. Subprocess tests are appropriate for the smoke test (Story 6.1).
- **Use `program.exitOverride()`** in tests to capture Commander's exit/help paths.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1: Initialize CLI Project with TypeScript and Commander]
- [Source: _bmad-output/planning-artifacts/architecture.md#Selected Approach: Commander.js + @inquirer/prompts]
- [Source: _bmad-output/planning-artifacts/architecture.md#Repository Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules — CLI Source Code — Naming]
- [Source: _bmad-output/planning-artifacts/prd.md#FR1, FR48, FR49 — CLI entry, exit codes, deterministic output]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR16 — pinned dependency versions]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors
- `npm run format:check` → all files match Prettier style
- `npm run test` → 5/5 tests passing in `tests/unit/cli.test.ts`
- `npm run build` → tsup → `dist/index.js` (2.32 KB) + sourcemap, postbuild chmod 0o755 ✓
- `head -1 dist/index.js` → `#!/usr/bin/env node` (shebang preserved)
- `ls -l dist/index.js` → `-rwxr-xr-x` (executable bit set)
- `node dist/index.js --version` → `0.1.0`
- `node dist/index.js --help` → shows usage with `<project-name>`, `--template`, `--pm`
- `node dist/index.js my-test-project --template monolith --pm pnpm` → echoes parsed values

### Completion Notes List

- **Pinned versions** (verified via `npm view <pkg> version` on 2026-04-08):
  `commander@14.0.3`, `tsup@8.5.1`, `vitest@4.1.3`, `typescript@6.0.2`, `eslint@10.2.0`, `typescript-eslint@8.58.1`, `eslint-config-prettier@10.1.8`, `prettier@3.8.1`, `@types/node@25.5.2`, `@eslint/js@10.0.1`. All pinned exact (no `^`/`~`) per NFR16.
- **Version compatibility verified**: `typescript-eslint@8.58.1` peer-deps allow `eslint ^10` and `typescript >=4.8.4 <6.1.0`, so `eslint@10` + `typescript@6.0` are compatible.
- **EBADENGINE warnings on install**: ESLint 10 requires Node `^20.19.0 || ^22.13.0 || >=24`. Local dev machine runs Node 23.8.0 (odd-numbered current, not LTS), which falls in the gap. Warnings are non-fatal and `npm install` completed successfully. Users on Node 22.13+ LTS (our `engines.node` floor) will not see these warnings. Recommend documenting "Node 22 LTS or 24+ LTS" in the README later.
- **`allowImportingTsExtensions: true`** had to be enabled in `tsconfig.json` so `tests/unit/cli.test.ts` can `import { buildProgram } from '../../src/index.ts'`. This is safe because `noEmit: true` is set and tsup handles the actual build without going through `tsc`.
- **Test isolation pattern works**: `buildProgram()` is exported and tests use `program.exitOverride()` + a no-op `program.action(() => {})` to inspect parsed state without spawning a process or running the placeholder `runCli()` body. The "missing required argument" stderr emitted by Commander during the negative test is expected — Commander emits the error message before throwing.
- **Postbuild chmod script** is plain JS (`scripts/chmod-bin.mjs`) so it does not require TypeScript compilation. It no-ops on Windows.
- **Semgrep finding mitigated**: post-write hook flagged template-literal interpolation in `console.error` (CWE-134). Rewrote `scripts/chmod-bin.mjs` to use constant format strings with positional `%s` args.
- **Deferred to later stories** (intentionally not added in 1.1):
  - `@inquirer/prompts`, `chalk`, `fs-extra`, `execa` — added by stories 1.2/1.3/1.4 when they get real usage
  - Strict enum validation for `--template`/`--pm` — Story 1.5
  - `templates/` directory — Story 1.3
  - `.github/workflows/` — Story 6.2
  - README content — placeholder only for now

### File List

**Created (11 files — `src/cli.ts` added during code review after CRITICAL fix):**

- `package.json` — npm package manifest, bin field, scripts, pinned dependency versions
- `tsconfig.json` — strict TypeScript config, ES2023 target, ESM, `allowImportingTsExtensions` for test imports
- `tsup.config.ts` — tsup build config: ESM, node22 target, shebang banner
- `vitest.config.ts` — Vitest test runner config
- `eslint.config.js` — ESLint v10 flat config (typescript-eslint + Prettier)
- `.prettierrc.json` — Prettier formatting rules
- `.prettierignore` — Prettier ignore list
- `.gitignore` — git ignore list (node_modules, dist, env files, OS files)
- `src/index.ts` — Pure library module (no side effects); exports `buildProgram` + `runCli` + `CliOptions`/`TemplateName`/`PackageManagerName` types
- `src/cli.ts` — Thin entry file that tsup bundles to `dist/cli.js`; imports buildProgram and calls parseAsync unconditionally (added during code review to fix symlink-install CRITICAL bug)
- `tests/unit/cli.test.ts` — 7 Vitest unit tests covering positional, options, short alias, defaults, help, missing-arg error, and direct `runCli` invocation with/without options
- `scripts/chmod-bin.mjs` — postbuild script to mark `dist/cli.js` executable (POSIX only)

**Generated (gitignored):**

- `node_modules/` — installed dependencies (168 packages)
- `package-lock.json` — npm lockfile (NOT gitignored — committed for reproducibility)
- `dist/index.js` + `dist/index.js.map` — tsup build output
