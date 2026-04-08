// create-rell-app library module.
//
// This module is pure — importing it has no side effects. The actual
// CLI entry point is `src/cli.ts`, which imports buildProgram() from here
// and runs `parseAsync(process.argv)` unconditionally. Splitting the
// entry from the library lets tests import buildProgram/runCli without
// triggering argv parsing, and avoids brittle isMainModule() checks that
// fail under symlinked global bin shims (e.g. `npm install -g`).

import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import pkg from '../package.json' with { type: 'json' };
import {
  cleanupLockFiles,
  defaultProcessRunner,
  installDependencies,
  InstallFailedError,
} from './install.ts';
import type { ProcessRunner } from './install.ts';
import {
  buildPartialInputs,
  defaultPromptDriver,
  gatherInputs,
  NonInteractiveStdinError,
  PromptCancelledError,
} from './prompts.ts';
import type { PromptDriver, ResolvedInputs } from './prompts.ts';
import { scaffoldProject } from './scaffold.ts';
import type { ScaffoldResult } from './scaffold.ts';

export type TemplateName = 'web' | 'mobile' | 'monolith';
export type PackageManagerName = 'npm' | 'pnpm' | 'yarn';

export interface CliOptions {
  template?: string;
  pm?: string;
}

/**
 * Build and configure the Commander program. Factored out so tests can
 * call this without triggering argv parsing or process.exit.
 *
 * Note: strict enum validation for --template and --pm is intentionally
 * deferred to Story 1.5 (Error Handling, Validation, and Exit Codes).
 */
export function buildProgram(): Command {
  const program = new Command();

  program
    .name('create-rell-app')
    .description('Scaffold a fully wired Clerk + Supabase + Drizzle starter app')
    .version(pkg.version, '-v, --version', 'output the current version')
    .argument('<project-name>', 'name of the project directory to create')
    .option('-t, --template <template>', 'template to use (web | mobile | monolith)')
    .option('--pm <packageManager>', 'package manager to use (npm | pnpm | yarn)')
    .action(async (projectName: string, options: CliOptions) => {
      await runCli(projectName, options);
    });

  return program;
}

/**
 * CLI action handler. In Story 1.2 it gathers any missing inputs from the
 * developer via interactive prompts and echoes the resolved configuration.
 * Stories 1.3–1.5 will replace the body with scaffolding, installation, and
 * strict validation.
 *
 * @param projectName  positional argument from Commander
 * @param options      parsed flags from Commander
 * @param driver       optional prompt driver — tests inject a fake to avoid
 *                     spawning a real TTY prompt
 */
/**
 * Resolve the absolute path to the bundled `templates/` directory. The CLI
 * is published as an npm package with `templates/` next to `dist/`, so we
 * compute the path relative to the calling source file rather than the
 * (potentially shimmed) cwd.
 *
 * Exported and overrideable so tests can point at a fixture directory.
 */
export function resolveTemplatesDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // src/ → ../templates  |  dist/ → ../templates
  return resolve(here, '..', 'templates');
}

/**
 * Compute the absolute target directory for a given project name. Exported
 * for unit testability and to keep the path resolution policy in one place.
 */
export function resolveTargetDir(projectName: string, cwd: string = process.cwd()): string {
  return resolve(cwd, projectName);
}

/**
 * Internal helper used by runCli to perform the scaffold step. Factored out
 * so tests can stub it via dependency injection without mocking modules.
 */
export interface ScaffoldRunner {
  (templateDir: string, targetDir: string, resolved: ResolvedInputs): Promise<ScaffoldResult>;
}

const defaultScaffoldRunner: ScaffoldRunner = (templateDir, targetDir, resolved) =>
  scaffoldProject({ templateDir, targetDir, resolvedInputs: resolved });

export interface RunCliDeps {
  driver?: PromptDriver;
  gatherOptions?: { interactive?: boolean };
  templatesDir?: string;
  targetDirOverride?: string;
  scaffoldRunner?: ScaffoldRunner;
  installRunner?: ProcessRunner;
  /** Whether to install dependencies after scaffolding. Defaults to `true`. */
  installDeps?: boolean;
}

export async function runCli(
  projectName: string,
  options: CliOptions,
  driverOrDeps: PromptDriver | RunCliDeps = defaultPromptDriver,
  legacyGatherOptions: { interactive?: boolean } = {},
): Promise<void> {
  // Backwards-compatible signature: callers may pass a PromptDriver as the
  // third argument (the Story 1.2 shape) or a RunCliDeps object (the
  // Story 1.3 shape). Tests use whichever is more convenient.
  const deps: RunCliDeps = isPromptDriver(driverOrDeps)
    ? { driver: driverOrDeps, gatherOptions: legacyGatherOptions }
    : driverOrDeps;

  const driver = deps.driver ?? defaultPromptDriver;
  const gatherOptions = deps.gatherOptions ?? {};
  const templatesDir = deps.templatesDir ?? resolveTemplatesDir();
  const scaffoldRunner = deps.scaffoldRunner ?? defaultScaffoldRunner;
  const installRunner = deps.installRunner ?? defaultProcessRunner;
  const shouldInstallDeps = deps.installDeps ?? true;

  const partial = buildPartialInputs(projectName, options.template, options.pm);

  let resolved;
  try {
    resolved = await gatherInputs(partial, driver, gatherOptions);
  } catch (err) {
    if (err instanceof PromptCancelledError) {
      // User hit Ctrl+C during a prompt. Exit cleanly without a stack trace.
      console.error('Aborted.');
      process.exit(130); // 128 + SIGINT(2), conventional for Ctrl+C cancellation.
    }
    if (err instanceof NonInteractiveStdinError) {
      console.error('Error: %s', err.message);
      process.exit(1);
    }
    throw err;
  }

  const targetDir = deps.targetDirOverride ?? resolveTargetDir(resolved.projectName);
  const templateDir = resolve(templatesDir, resolved.template);

  console.log('[create-rell-app] resolved configuration:');
  console.log('  project name : %s', resolved.projectName);
  console.log('  template     : %s', resolved.template);
  console.log('  package mgr  : %s', resolved.pm);

  // Story 1.3: scaffold if the template directory is shipped, otherwise
  // print a friendly placeholder. Real templates land in Epic 2+.
  const templateExists = await fs.pathExists(templateDir);
  if (!templateExists) {
    console.log(
      '[create-rell-app] template "%s" is not yet bundled — coming in Epic 2. ' +
        'Skipping scaffold for now.',
      resolved.template,
    );
    return;
  }

  const result = await scaffoldRunner(templateDir, targetDir, resolved);
  console.log(
    '[create-rell-app] scaffolded %d files into %s',
    result.filesWritten,
    result.targetDir,
  );

  if (!shouldInstallDeps) {
    console.log(chalk.dim('[create-rell-app] skipping dependency install (installDeps=false)'));
    return;
  }

  // Clean up stale lock files BEFORE running install so the chosen package
  // manager doesn't get confused by leftovers from a different one.
  await cleanupLockFiles(targetDir, resolved.pm);

  console.log(chalk.cyan(`Installing dependencies with ${resolved.pm}…`));
  try {
    await installDependencies(targetDir, resolved.pm, installRunner);
    console.log(chalk.green('Done.'));
  } catch (err) {
    if (err instanceof InstallFailedError) {
      console.error(chalk.red(`Install failed: ${err.message}`));
      process.exit(1);
    }
    throw err;
  }
}

/**
 * Discriminate between the legacy `PromptDriver` third-arg and the modern
 * `RunCliDeps` object based on the presence of method-shaped fields.
 */
function isPromptDriver(value: PromptDriver | RunCliDeps): value is PromptDriver {
  return (
    typeof (value as PromptDriver).text === 'function' &&
    typeof (value as PromptDriver).select === 'function'
  );
}
