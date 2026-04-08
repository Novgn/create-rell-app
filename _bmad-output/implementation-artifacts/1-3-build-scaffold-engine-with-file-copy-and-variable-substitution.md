# Story 1.3: Build Scaffold Engine with File Copy and Variable Substitution

Status: done

## Story

As a developer scaffolding a new project,
I want the CLI to copy template files and substitute project-specific variables,
so that I get a correctly named, ready-to-use project directory.

## Acceptance Criteria

1. **Given** a template directory exists in `templates/<template-name>/` and the developer has selected a template, **When** the scaffold engine runs with a target directory and a `ResolvedInputs` object, **Then** every file from the template is copied to the target directory.
2. **Given** a template file contains the literal token `{{projectName}}`, **When** the scaffold engine processes that file, **Then** the token is replaced with the actual project name in the destination file. The same applies to `{{projectNameKebab}}` (kebab-cased project name).
3. Substitution applies to both file **contents** and **filenames** (e.g. a template file `{{projectName}}.config.ts` becomes `my-app.config.ts`). Directory names are also substituted.
4. The scaffold engine handles binary files (images, archives) by copying them byte-for-byte without attempting substitution. Files are detected as binary by extension (`.png`, `.jpg`, `.gif`, `.webp`, `.ico`, `.zip`, `.tar`, `.gz`, `.woff`, `.woff2`, `.ttf`, `.otf`, `.eot`, `.pdf`, `.mp3`, `.mp4`, `.wav`).
5. Output is **deterministic** — given the same inputs (template + project name + target dir), the same set of files with the same contents is produced. (Verified by running the engine twice into different temp dirs and diffing.)
6. The scaffold engine generates an `.env.example` file when one exists in the template — this is just a regular template file and confirms point 1, no special handling required.
7. Hidden files (`.gitignore`, `.eslintrc.json`, `.env.example`, `.prettierrc.json`) are copied. Special-case: a template file named `_gitignore` (or `gitignore`) is renamed to `.gitignore` on output. Rationale: npm strips `.gitignore` files from published tarballs unless they are renamed before publish; using a `_gitignore` placeholder in the template directory bypasses this.
8. The scaffold engine returns a typed `ScaffoldResult` object: `{ filesWritten: number; targetDir: string }`. No `any` types.
9. The scaffold engine is unit-tested using a fixture template directory (created during the test) and a temporary output directory. Tests cover: file copy, content substitution, filename substitution, binary file handling, `_gitignore` rename, and determinism.
10. `runCli` calls the scaffold engine after `gatherInputs` succeeds (no longer just logs the resolved values). The placeholder log line is replaced.
11. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all pass with zero errors and zero warnings.
12. All previous Story 1.1 + 1.2 tests still pass (no regressions).

## Tasks / Subtasks

- [ ] **Task 1: Add `fs-extra` dependency (AC 1, 4)**
  - [ ] Run `npm view fs-extra version` to find the latest stable; pin exact in `dependencies` per NFR16.
  - [ ] Run `npm view @types/fs-extra version` for the matching typings; pin exact in `devDependencies`.
  - [ ] `npm install` and verify lockfile is clean.
- [ ] **Task 2: Create `src/scaffold.ts` (AC 1–8)**
  - [ ] Define `ScaffoldOptions` interface: `{ templateDir: string; targetDir: string; resolvedInputs: ResolvedInputs }`.
  - [ ] Define `ScaffoldResult` interface: `{ filesWritten: number; targetDir: string }`.
  - [ ] Define `BINARY_EXTENSIONS` constant: `ReadonlySet<string>` of lower-case extensions (`.png`, `.jpg`, `.gif`, `.webp`, `.ico`, `.zip`, `.tar`, `.gz`, `.woff`, `.woff2`, `.ttf`, `.otf`, `.eot`, `.pdf`, `.mp3`, `.mp4`, `.wav`).
  - [ ] Define a small helper `toKebabCase(value: string): string` that lowercases and replaces non-alphanumeric runs with `-`. Trim leading/trailing `-`. Used to derive `projectNameKebab` from the user's input.
  - [ ] Define `substituteVariables(input: string, vars: Record<string, string>): string` — replaces every `{{key}}` token with `vars[key]`. Tokens with unknown keys are left as-is (warned but not errored — we want to surface unintended tokens during smoke tests).
  - [ ] Define `isBinaryFile(relativePath: string): boolean` using the extensions set.
  - [ ] Define `renameSpecialFiles(filename: string): string` — maps `_gitignore` → `.gitignore`, `_npmrc` → `.npmrc`. Other names pass through unchanged. Document the rename rules so future stories can extend the table.
  - [ ] Define and export `scaffoldProject(options: ScaffoldOptions): Promise<ScaffoldResult>`:
    1. Build a `vars` map from `resolvedInputs`: `{ projectName: resolvedInputs.projectName, projectNameKebab: toKebabCase(resolvedInputs.projectName) }`.
    2. Walk the template directory recursively. Use `fs-extra.readdir` with `withFileTypes: true` and recurse manually so the order is sorted (deterministic).
    3. For each entry:
       - Compute the relative path from `templateDir`.
       - Substitute variables in each path segment, then apply `renameSpecialFiles` to the leaf segment.
       - Compute the destination path under `targetDir`.
       - For directories: ensure the destination dir exists.
       - For files: if binary → byte copy; otherwise → read text, substitute variables, write text. Use UTF-8 encoding.
    4. Track `filesWritten` and return `{ filesWritten, targetDir }`.
  - [ ] **Do not** mutate the template directory. **Do not** delete the target directory if it already exists — Story 1.5 owns the "target dir already exists" guard rail with confirmation. For 1.3, assume the caller has ensured the target dir is empty/non-existent and just `ensureDir` it.
- [ ] **Task 3: Add a fixture template for tests (AC 9)**
  - [ ] Tests create a temp dir under `os.tmpdir()` for each test (using `node:os` and `node:fs.mkdtempSync`). The template fixture is constructed in-memory inside the test, not committed as a file tree.
  - [ ] Helper `makeTemplateFixture(root: string)` writes:
    - `package.json` (text, contains `{{projectName}}`)
    - `README.md` (text, contains `{{projectNameKebab}}`)
    - `_gitignore` (text, becomes `.gitignore` in output)
    - `src/{{projectName}}.config.ts` (text in `{{projectName}}`-named file, contains `{{projectName}}`)
    - `assets/logo.png` (binary — write a few non-utf8 bytes)
    - Subdirectory `nested/{{projectNameKebab}}/index.ts` (filename and dir name substitution + content)
- [ ] **Task 4: Unit tests in `tests/unit/scaffold.test.ts` (AC 9)**
  - [ ] Test that all template files are copied to the target dir.
  - [ ] Test that `{{projectName}}` in file contents is replaced.
  - [ ] Test that `{{projectName}}` in filenames is replaced.
  - [ ] Test that `{{projectNameKebab}}` in directory names is replaced and that the kebab transform handles e.g. `My App` → `my-app`.
  - [ ] Test that binary files (`.png`) are not corrupted by substitution (write specific bytes, read back, byte-compare).
  - [ ] Test that `_gitignore` is renamed to `.gitignore`.
  - [ ] Test that running `scaffoldProject` twice into two different temp dirs yields identical file trees (determinism).
  - [ ] Test that unknown `{{tokens}}` are left as-is (not stripped, not errored).
  - [ ] Test that `ScaffoldResult.filesWritten` matches the number of files in the fixture.
  - [ ] After each test, clean up the temp dirs in an `afterEach` hook.
- [ ] **Task 5: Wire scaffold engine into `runCli` (AC 10)**
  - [ ] In `src/index.ts`, after `gatherInputs` returns, compute `templateDir` and `targetDir`:
    - `templateDir = path.resolve(<package root>, 'templates', resolved.template)`. The package root can be derived from `import.meta.url` via `fileURLToPath` and `dirname`.
    - `targetDir = path.resolve(process.cwd(), resolved.projectName)`.
  - [ ] **Important**: Story 1.3 does **not** ship template directories under `templates/`. The `templates/` folder is empty until Epics 2–5 produce templates. So `runCli` should:
    1. Compute the paths.
    2. Check whether `templateDir` exists. If not, log a friendly message ("template not yet shipped — coming in Epic 2") and `console.log` the resolved configuration as a placeholder. Do **not** call `scaffoldProject` against a non-existent dir.
    3. If `templateDir` exists, call `scaffoldProject` and log the result.
  - [ ] This dual path keeps `runCli` exercising the new code without requiring fake template directories in the repo. Story 6.1 (smoke tests) will eventually exercise the full path against real templates.
  - [ ] Add a `runCli` test that spies on `scaffoldProject` (or factors a thin wrapper so it can be injected) and asserts the right path is taken when the template dir exists vs. doesn't exist. Use a temp directory as a fake template dir.
- [ ] **Task 6: Verification (all ACs)**
  - [ ] `npm run typecheck` → 0 errors.
  - [ ] `npm run lint` → 0 errors, 0 warnings.
  - [ ] `npm run test` → all tests pass.
  - [ ] `npm run build` → builds cleanly.

## Dev Notes

### Architecture compliance

- **Stack** _(architecture.md, "CLI Libraries")_: `fs-extra` is the file system library. Use it for `ensureDir`, `copy` if useful, but the recursive walk is hand-rolled so we control substitution and ordering precisely. Do **not** introduce alternative libraries (`graceful-fs`, `recursive-readdir`, etc.).
- **Variable substitution** _(architecture.md, "Variables requiring substitution")_:
  - `{{projectName}}` — exact user input.
  - `{{projectNameKebab}}` — kebab-cased user input.
  - Package manager lock file selection and command rewriting are deferred to Story 1.4 (this story does not touch lock files).
- **Naming** _(architecture.md, "CLI Source Code — Naming")_:
  - Files: `kebab-case.ts` → `src/scaffold.ts`
  - Functions: `camelCase` → `scaffoldProject`, `substituteVariables`, `toKebabCase`, `isBinaryFile`, `renameSpecialFiles`
  - Types/interfaces: `PascalCase` → `ScaffoldOptions`, `ScaffoldResult`
  - True constants: `UPPER_SNAKE_CASE` → `BINARY_EXTENSIONS`
- **No `any`**: enforced by ESLint.
- **Named exports only**.
- **Deterministic output** _(architecture.md, "Decision Impact Analysis")_: walk in sorted order so the file count and order are stable.

### Critical implementation details — anti-disaster guardrails

- **`_gitignore` rename**: npm strips `.gitignore` from published tarballs unless renamed. The convention used by `create-next-app`, `create-vite`, etc. is to ship `_gitignore` in the template directory and rename on scaffold. Document this in a code comment so the future template authors know.
- **Binary file detection by extension only**, not by content sniffing. Content sniffing is slow and unreliable; the architecture template has a known set of binary file types so an extension whitelist is sufficient.
- **Don't follow symlinks** during the walk — use `withFileTypes: true` and check `dirent.isDirectory()` / `dirent.isFile()`. If a `dirent.isSymbolicLink()` shows up, fail loudly so it's never silently traversed.
- **Use `path.posix` for relative path computations** so output is consistent across Windows/macOS/Linux. The fs-extra writes will still use the platform-native path separator.
- **Substitution order matters**: substitute path segments **before** computing the destination path so that nested directories like `src/{{projectName}}/index.ts` resolve correctly.
- **Don't error on unknown tokens** in 1.3. Silent passthrough is the safer default for unknown templating mistakes — smoke tests in Story 6.1 will catch them. We can add a strict mode later if needed.
- **No CWD-relative writes**: always compute the target with `path.resolve(process.cwd(), projectName)` and pass an absolute path into `scaffoldProject`. Tests use `os.tmpdir()` based absolute paths.
- **Error path**: if `scaffoldProject` fails mid-walk, **do not** attempt to roll back — leave the partial state for the user. Story 1.5 owns "abort + clean up" semantics.

### Pinned version targets (verify before pinning)

| Package | Track | Notes |
|---|---|---|
| `fs-extra` | v11.x | ESM-friendly with default import; verify exports match TS types |
| `@types/fs-extra` | match v11 | dev dep |

### Project Structure Notes

After Story 1.3:

```
src/
├── cli.ts        # unchanged
├── index.ts      # runCli now calls scaffoldProject when templates/ has a dir
├── prompts.ts    # unchanged
└── scaffold.ts   # NEW: scaffoldProject(), substituteVariables(), helpers
tests/unit/
├── cli.test.ts       # adds a runCli test for the scaffold path
├── prompts.test.ts   # unchanged
└── scaffold.test.ts  # NEW: covers walk, substitution, binary, _gitignore, determinism
```

### Testing standards summary

- Vitest, `tests/unit/`, `*.test.ts`.
- Tests create temp dirs under `os.tmpdir()` and clean them up in `afterEach`.
- No real template files are checked into the repo; fixtures are constructed in-memory.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3: Build Scaffold Engine with File Copy and Variable Substitution]
- [Source: _bmad-output/planning-artifacts/architecture.md#Template Storage & Scaffolding]
- [Source: _bmad-output/planning-artifacts/architecture.md#Variables requiring substitution]
- [Source: _bmad-output/planning-artifacts/prd.md#FR9, FR12, FR49 — project directory generation, .env.example, deterministic output]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR16 — pinned dependency versions]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- `npm install fs-extra@11.3.4 @types/fs-extra@11.0.4` → 6 packages added
- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors
- `npm run test` → 54/54 passing (29 scaffold + 14 prompts + 11 cli)
- `npm run build` → tsup → `dist/cli.js` 11.50 KB

### Completion Notes List

- **Pinned `fs-extra@11.3.4` + `@types/fs-extra@11.0.4`** (verified via `npm view`).
- **Source vs destination path tracking**: A subtle bug surfaced during initial test runs — the recursive walker was reusing a single relative-path variable for both the source filesystem reads and the destination writes, so a substituted parent directory name (`{{projectNameKebab}}` → `my-saas-app`) would break the source-side path lookup for children. Fixed by tracking `sourceRelativeDir` and `destRelativeDir` independently in `walkAndCopy`. Caught by the kebab-in-directory-name test.
- **Symlinks fail loudly** rather than being silently followed. Templates should never contain symlinks.
- **Sorted directory walks** → deterministic output (FR49). Verified by the `produces deterministic output across two runs` test that diffs two scaffolds byte-for-byte.
- **Special filename rename table** (`_gitignore` → `.gitignore`, `_npmrc` → `.npmrc`, `_env.example` → `.env.example`) lets templates ship files that npm would otherwise strip from published tarballs.
- **`runCli` deps refactor**: introduced `RunCliDeps` object with backwards-compatible signature so the older Story 1.2 tests that pass a `PromptDriver` directly still work. Tests can now inject `templatesDir`, `targetDirOverride`, `scaffoldRunner` for the scaffold integration tests.
- **No template directories shipped yet**: `runCli` checks whether the template dir exists and prints a friendly placeholder otherwise. Real templates land in Epics 2–5, smoke tests in Epic 6.
- **Deferred to later stories**:
  - Lock file selection / package manager command rewriting → Story 1.4
  - Target dir already exists confirmation → Story 1.5
  - Strict project name validation → Story 1.5
  - Template directory contents → Epics 2–5

### File List

**Created (2):**

- `src/scaffold.ts` — `scaffoldProject()`, `walkAndCopy()`, `substituteVariables()`, `toKebabCase()`, `isBinaryFile()`, `renameSpecialFiles()`, `buildSubstitutionVars()`, `BINARY_EXTENSIONS`
- `tests/unit/scaffold.test.ts` — 29 unit tests covering helpers, walk, substitution, binary handling, kebab transform, determinism, and error paths

**Modified (3):**

- `package.json` — added `fs-extra@11.3.4` and `@types/fs-extra@11.0.4`
- `src/index.ts` — `runCli()` now accepts `RunCliDeps`, resolves template/target dirs, calls `scaffoldRunner` when template exists
- `tests/unit/cli.test.ts` — added two new scaffold-integration tests (placeholder path + scaffold-runner-invocation path)

### Code Review Findings (Phase 3)

**CRITICAL (auto-fixed):**

- **Path traversal via `{{projectName}}` in filenames**: A crafted project name like `../../etc/passwd` substituted into a template filename `{{projectName}}.txt` would write outside the target directory. Fixed by introducing `substitutePathSegment()` which rejects substituted segments containing `/`, `\`, `\0`, `..`, `.`, or empty results. Added 7 unit tests covering each rejection class.

**HIGH (auto-fixed):**

- **Missing destination containment check**: Even with sanitized segments, defence-in-depth is good practice. Added `assertContained()` that resolves the destination path and verifies it stays inside `targetDir`. Catches symlinks, normalization quirks, and any future template tokens that might slip through.
- **Template-side path injection**: Same fix as Critical — `substitutePathSegment` is the choke point.

**MEDIUM (deferred):** see `deferred-findings.md` (`MEDIUM-1.3-A`, `MEDIUM-1.3-B`).

**LOW (deferred):** see `deferred-findings.md` (`LOW-1.3-A`, `LOW-1.3-B`, `LOW-1.3-C`).

**Semgrep scan:** 0 findings on `src/scaffold.ts`, `src/index.ts`, `src/prompts.ts`.
