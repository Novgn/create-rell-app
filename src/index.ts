// create-rell-app library module.
//
// This module is pure — importing it has no side effects. The actual
// CLI entry point is `src/cli.ts`, which imports buildProgram() from here
// and runs `parseAsync(process.argv)` unconditionally. Splitting the
// entry from the library lets tests import buildProgram/runCli without
// triggering argv parsing, and avoids brittle isMainModule() checks that
// fail under symlinked global bin shims (e.g. `npm install -g`).

import { Command } from 'commander';

import pkg from '../package.json' with { type: 'json' };
import { buildPartialInputs, defaultPromptDriver, gatherInputs } from './prompts.ts';
import type { PromptDriver } from './prompts.ts';

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
export async function runCli(
  projectName: string,
  options: CliOptions,
  driver: PromptDriver = defaultPromptDriver,
): Promise<void> {
  const partial = buildPartialInputs(projectName, options.template, options.pm);
  const resolved = await gatherInputs(partial, driver);

  console.log('[create-rell-app] resolved configuration:');
  console.log('  project name : %s', resolved.projectName);
  console.log('  template     : %s', resolved.template);
  console.log('  package mgr  : %s', resolved.pm);
}
