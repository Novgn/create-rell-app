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
