#!/usr/bin/env node
// Smoke test runner for create-rell-app.
//
// Story 6.1 — this script exercises every template end-to-end:
//
//   1. Build the CLI via `npm run build` (ensures dist/cli.js is current).
//   2. For each selected template, scaffold a fresh project under
//      os.tmpdir() using the built CLI in flag-only, non-interactive mode
//      with `--no-install` so scaffold failures are distinguishable from
//      install failures in the report.
//   3. Verify the required files exist in the scaffold output.
//   4. Run `npm install` then the template-specific verification steps
//      (lint / build / typecheck — see TEMPLATES in smoke-helpers.mjs).
//   5. Print a per-template pass/fail summary and exit with code 0 on
//      full success, 1 on any failure.
//
// Invocation:
//   node tests/smoke/smoke-test.mjs                      # all templates
//   node tests/smoke/smoke-test.mjs --templates=web      # subset
//   KEEP_SMOKE_OUTPUT=1 node tests/smoke/smoke-test.mjs  # preserve scaffolds
//
// Exit codes: 0 on all-pass, 1 on any failure.
//
// This script deliberately avoids TypeScript so it runs under plain
// Node 22+ with no loader flags. The pure helpers (command matrix,
// flag parsing, summary formatting) live in smoke-helpers.mjs and are
// unit-tested by tests/unit/smoke-runner.test.ts.

import { execa } from 'execa';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

import { TEMPLATES, computeExitCode, formatSummary, parseTemplatesFlag } from './smoke-helpers.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..');
const CLI_ENTRY = join(REPO_ROOT, 'dist', 'cli.js');

// Per-step timeout. 10 minutes is generous but needed for mobile install,
// which pulls react-native + expo + nativewind + a sizable native dep tree.
// A hang somewhere in the toolchain should still eventually free the runner.
const STEP_TIMEOUT_MS = 600_000;

// Turn off Husky's `prepare` hook in scaffolded projects during install.
// The scaffolded dirs are not git repos, and Husky's prepare would either
// fail or create a confusing .husky/_ directory inside a non-git dir.
// Real users get git init from their own workflow, not the smoke test.
const INSTALL_ENV = { ...process.env, HUSKY: '0' };

const KEEP_OUTPUT = process.env.KEEP_SMOKE_OUTPUT === '1';

/** Cyan ANSI escape — gives visual phase boundaries without pulling chalk. */
const CYAN = '\u001b[36m';
/** Red ANSI escape for failures. */
const RED = '\u001b[31m';
/** Green ANSI escape for success markers. */
const GREEN = '\u001b[32m';
/** Reset to default terminal color. */
const RESET = '\u001b[0m';

function logHeader(message) {
  process.stdout.write(`\n${CYAN}▶ ${message}${RESET}\n`);
}

function logStep(message) {
  process.stdout.write(`  • ${message}\n`);
}

function logOk(message) {
  process.stdout.write(`  ${GREEN}✓${RESET} ${message}\n`);
}

function logFail(message) {
  process.stdout.write(`  ${RED}✗${RESET} ${message}\n`);
}

/**
 * Ensure the CLI is built and `dist/cli.js` exists. Builds unconditionally
 * so the smoke test always runs against the current source — a slightly
 * slower startup is worth the guarantee that we're not testing stale code.
 */
async function ensureCliBuilt() {
  logHeader('Building CLI (npm run build)');
  try {
    await execa('npm', ['run', 'build'], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      timeout: STEP_TIMEOUT_MS,
    });
  } catch (err) {
    throw new Error(`CLI build failed: ${err instanceof Error ? err.message : String(err)}`, {
      cause: err,
    });
  }

  try {
    await stat(CLI_ENTRY);
  } catch {
    throw new Error(`Expected CLI entry at ${CLI_ENTRY} after build, but it does not exist.`);
  }
}

/**
 * Invoke the built CLI to scaffold `templateName` inside an already-prepared
 * `tempParent` directory. Returns the absolute scaffold root. The caller
 * owns `tempParent` (created via `mkdtemp` before this call) so that a
 * throw here leaves the tmp dir cleanly owned by the caller's cleanup
 * logic — earlier revisions of this runner leaked the tmp dir when the
 * CLI invocation failed between `mkdtemp` and a successful return.
 */
async function scaffoldTemplate(templateName, tempParent) {
  const projectName = `smoke-${templateName}`;
  const scaffoldRoot = join(tempParent, projectName);

  logStep(`scaffolding ${templateName} → ${scaffoldRoot}`);
  await execa(
    'node',
    [CLI_ENTRY, projectName, '--template', templateName, '--pm', 'npm', '--no-install'],
    {
      cwd: tempParent,
      stdio: 'inherit',
      timeout: STEP_TIMEOUT_MS,
    },
  );

  return scaffoldRoot;
}

/**
 * Verify every required file listed for `templateName` exists inside
 * `scaffoldRoot`. Throws with a list of missing files on failure.
 */
async function verifyRequiredFiles(templateName, scaffoldRoot) {
  const required = TEMPLATES[templateName].requiredFiles;
  const missing = [];
  for (const relativePath of required) {
    const absPath = join(scaffoldRoot, relativePath);
    try {
      await stat(absPath);
    } catch {
      missing.push(relativePath);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required files in ${templateName} scaffold: ${missing.join(', ')}`);
  }
}

/**
 * Run a single labeled step (install / lint / build / typecheck) in the
 * scaffolded project. stderr/stdout are inherited so CI logs stay linear.
 * Throws on non-zero exit or timeout.
 */
async function runStep(step, scaffoldRoot) {
  logStep(`${step.label}: ${step.cmd} ${step.args.join(' ')}`);
  await execa(step.cmd, step.args, {
    cwd: scaffoldRoot,
    stdio: 'inherit',
    timeout: STEP_TIMEOUT_MS,
    env: INSTALL_ENV,
  });
}

/**
 * Execute the full smoke cycle for one template. Returns a result object
 * the runner aggregates into the final summary. Never throws — failures
 * are captured as `{ status: 'fail', failedStep }`.
 */
async function smokeTemplate(templateName) {
  logHeader(`Smoke: ${templateName}`);
  const started = Date.now();

  // Create the temp parent BEFORE any fallible operation so that a
  // scaffold failure still returns the path for the caller to clean up
  // (or preserve for debugging). Fixes the orphaned-tmp-dir leak that
  // happened if execa threw between `mkdtemp` and the return statement.
  const tempParent = await mkdtemp(join(tmpdir(), `create-rell-app-smoke-${templateName}-`));
  let scaffoldRoot;

  try {
    scaffoldRoot = await scaffoldTemplate(templateName, tempParent);
  } catch (err) {
    logFail(`scaffold failed: ${err instanceof Error ? err.message : String(err)}`);
    return {
      name: templateName,
      status: 'fail',
      failedStep: 'scaffold',
      durationMs: Date.now() - started,
      tempParent,
    };
  }

  try {
    await verifyRequiredFiles(templateName, scaffoldRoot);
    logOk('required files present');
  } catch (err) {
    logFail(err instanceof Error ? err.message : String(err));
    return {
      name: templateName,
      status: 'fail',
      failedStep: 'required-files',
      durationMs: Date.now() - started,
      tempParent,
    };
  }

  for (const step of TEMPLATES[templateName].steps) {
    try {
      await runStep(step, scaffoldRoot);
      logOk(`${step.label} passed`);
    } catch (err) {
      logFail(`${step.label} failed: ${err instanceof Error ? err.message : String(err)}`);
      return {
        name: templateName,
        status: 'fail',
        failedStep: step.label,
        durationMs: Date.now() - started,
        tempParent,
      };
    }
  }

  return {
    name: templateName,
    status: 'pass',
    durationMs: Date.now() - started,
    tempParent,
  };
}

/**
 * Remove a scaffold temp parent. Silent on missing / already-removed paths
 * because `KEEP_SMOKE_OUTPUT=1` may have skipped an earlier cleanup.
 */
async function cleanupTempParent(tempParent) {
  if (!tempParent) return;
  if (KEEP_OUTPUT) {
    logStep(`KEEP_SMOKE_OUTPUT=1 — preserving ${tempParent}`);
    return;
  }
  try {
    await rm(tempParent, { recursive: true, force: true });
  } catch (err) {
    // Non-fatal: log and move on so the overall result still prints.
    logFail(
      `cleanup failed for ${tempParent}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

async function main() {
  const argv = process.argv.slice(2);
  let templatesToRun;
  try {
    templatesToRun = parseTemplatesFlag(argv);
  } catch (err) {
    process.stderr.write(
      `${RED}error:${RESET} ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exit(2);
  }

  await ensureCliBuilt();

  const results = [];
  for (const templateName of templatesToRun) {
    const result = await smokeTemplate(templateName);
    results.push(result);
    // Clean up right after each template finishes (when passing) so a
    // long run doesn't accumulate gigabytes of node_modules on disk.
    if (result.status === 'pass') {
      await cleanupTempParent(result.tempParent);
    }
  }

  // Summary + exit code.
  const summary = formatSummary(
    results.map((r) => ({
      name: r.name,
      status: r.status,
      failedStep: r.failedStep,
      durationMs: r.durationMs,
    })),
  );
  process.stdout.write(summary);

  // For failing templates, the scaffold parent is always preserved (we
  // never cleanup in the fail branch of the loop above). Print the path
  // so developers can cd in and debug. This runs regardless of
  // KEEP_SMOKE_OUTPUT because KEEP_OUTPUT's cleanupTempParent branch
  // only runs for passing templates, so failing templates would never
  // have their path logged otherwise.
  for (const result of results) {
    if (result.status === 'fail' && result.tempParent) {
      process.stdout.write(`${CYAN}debug: scaffold preserved at ${result.tempParent}${RESET}\n`);
    }
  }

  process.exit(computeExitCode(results));
}

main().catch((err) => {
  process.stderr.write(
    `${RED}fatal:${RESET} ${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`,
  );
  process.exit(1);
});
