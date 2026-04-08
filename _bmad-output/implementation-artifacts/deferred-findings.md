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
