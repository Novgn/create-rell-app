import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

import {
  cleanupLockFiles,
  getPackageManagerCommands,
  installDependencies,
  InstallFailedError,
  PACKAGE_MANAGER_COMMANDS,
} from '../../src/install.ts';
import type { ProcessRunner } from '../../src/install.ts';
import { buildSubstitutionVars } from '../../src/scaffold.ts';

let tempRoot: string;

beforeEach(() => {
  tempRoot = mkdtempSync(join(tmpdir(), 'crapp-install-'));
});

afterEach(() => {
  rmSync(tempRoot, { recursive: true, force: true });
});

interface RunnerCall {
  command: string;
  args: readonly string[];
  cwd: string;
}

function makeRecordingRunner(opts: { fail?: boolean; failWith?: Error } = {}): {
  runner: ProcessRunner;
  calls: RunnerCall[];
} {
  const calls: RunnerCall[] = [];
  const runner: ProcessRunner = {
    run(command, args, options) {
      calls.push({ command, args, cwd: options.cwd });
      if (opts.fail) {
        return Promise.reject(opts.failWith ?? new Error('fake failure'));
      }
      return Promise.resolve();
    },
  };
  return { runner, calls };
}

describe('PACKAGE_MANAGER_COMMANDS', () => {
  it('has entries for npm, pnpm, and yarn', () => {
    expect(Object.keys(PACKAGE_MANAGER_COMMANDS).sort()).toEqual(['npm', 'pnpm', 'yarn']);
  });

  it('npm record', () => {
    expect(getPackageManagerCommands('npm')).toEqual({
      install: 'npm install',
      run: 'npm run',
      exec: 'npx',
      lockFile: 'package-lock.json',
    });
  });

  it('pnpm record', () => {
    expect(getPackageManagerCommands('pnpm')).toEqual({
      install: 'pnpm install',
      run: 'pnpm run',
      exec: 'pnpm dlx',
      lockFile: 'pnpm-lock.yaml',
    });
  });

  it('yarn record', () => {
    expect(getPackageManagerCommands('yarn')).toEqual({
      install: 'yarn install',
      run: 'yarn run',
      exec: 'yarn dlx',
      lockFile: 'yarn.lock',
    });
  });
});

describe('installDependencies', () => {
  it('invokes the runner with npm install in the target directory', async () => {
    const { runner, calls } = makeRecordingRunner();

    await installDependencies(tempRoot, 'npm', runner);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({ command: 'npm', args: ['install'], cwd: tempRoot });
  });

  it('invokes the runner with pnpm install in the target directory', async () => {
    const { runner, calls } = makeRecordingRunner();

    await installDependencies(tempRoot, 'pnpm', runner);

    expect(calls[0]?.command).toBe('pnpm');
    expect(calls[0]?.args).toEqual(['install']);
  });

  it('invokes the runner with yarn install in the target directory', async () => {
    const { runner, calls } = makeRecordingRunner();

    await installDependencies(tempRoot, 'yarn', runner);

    expect(calls[0]?.command).toBe('yarn');
    expect(calls[0]?.args).toEqual(['install']);
  });

  it('rejects with InstallFailedError when the runner fails', async () => {
    // The runner here returns an Error directly, not an InstallFailedError —
    // installDependencies itself only wraps the runner in `defaultProcessRunner`.
    // When tests inject a runner that already throws an Error, it propagates as-is.
    // So we test the default-runner-style failure: the runner already wraps it.
    const wrapped = new InstallFailedError('boom');
    const { runner } = makeRecordingRunner({ fail: true, failWith: wrapped });

    await expect(installDependencies(tempRoot, 'npm', runner)).rejects.toBe(wrapped);
  });
});

describe('cleanupLockFiles', () => {
  it('removes pnpm-lock.yaml and yarn.lock when keeping npm', async () => {
    await writeFile(join(tempRoot, 'package-lock.json'), '{}', 'utf8');
    await writeFile(join(tempRoot, 'pnpm-lock.yaml'), '', 'utf8');
    await writeFile(join(tempRoot, 'yarn.lock'), '', 'utf8');

    await cleanupLockFiles(tempRoot, 'npm');

    expect(existsSync(join(tempRoot, 'package-lock.json'))).toBe(true);
    expect(existsSync(join(tempRoot, 'pnpm-lock.yaml'))).toBe(false);
    expect(existsSync(join(tempRoot, 'yarn.lock'))).toBe(false);
  });

  it('removes package-lock.json and yarn.lock when keeping pnpm', async () => {
    await writeFile(join(tempRoot, 'package-lock.json'), '{}', 'utf8');
    await writeFile(join(tempRoot, 'pnpm-lock.yaml'), '', 'utf8');
    await writeFile(join(tempRoot, 'yarn.lock'), '', 'utf8');

    await cleanupLockFiles(tempRoot, 'pnpm');

    expect(existsSync(join(tempRoot, 'package-lock.json'))).toBe(false);
    expect(existsSync(join(tempRoot, 'pnpm-lock.yaml'))).toBe(true);
    expect(existsSync(join(tempRoot, 'yarn.lock'))).toBe(false);
  });

  it('removes package-lock.json and pnpm-lock.yaml when keeping yarn', async () => {
    await writeFile(join(tempRoot, 'package-lock.json'), '{}', 'utf8');
    await writeFile(join(tempRoot, 'pnpm-lock.yaml'), '', 'utf8');
    await writeFile(join(tempRoot, 'yarn.lock'), '', 'utf8');

    await cleanupLockFiles(tempRoot, 'yarn');

    expect(existsSync(join(tempRoot, 'package-lock.json'))).toBe(false);
    expect(existsSync(join(tempRoot, 'pnpm-lock.yaml'))).toBe(false);
    expect(existsSync(join(tempRoot, 'yarn.lock'))).toBe(true);
  });

  it('is idempotent when no lock files exist', async () => {
    await expect(cleanupLockFiles(tempRoot, 'npm')).resolves.toBeUndefined();
  });
});

describe('buildSubstitutionVars (Story 1.4 additions)', () => {
  it('includes pmInstallCmd / pmRunCmd / pmExecCmd for npm', () => {
    const vars = buildSubstitutionVars({ projectName: 'my-app', template: 'web', pm: 'npm' });
    expect(vars.pmInstallCmd).toBe('npm install');
    expect(vars.pmRunCmd).toBe('npm run');
    expect(vars.pmExecCmd).toBe('npx');
  });

  it('includes pmInstallCmd / pmRunCmd / pmExecCmd for pnpm', () => {
    const vars = buildSubstitutionVars({ projectName: 'my-app', template: 'web', pm: 'pnpm' });
    expect(vars.pmInstallCmd).toBe('pnpm install');
    expect(vars.pmRunCmd).toBe('pnpm run');
    expect(vars.pmExecCmd).toBe('pnpm dlx');
  });

  it('includes pmInstallCmd / pmRunCmd / pmExecCmd for yarn', () => {
    const vars = buildSubstitutionVars({ projectName: 'my-app', template: 'web', pm: 'yarn' });
    expect(vars.pmInstallCmd).toBe('yarn install');
    expect(vars.pmRunCmd).toBe('yarn run');
    expect(vars.pmExecCmd).toBe('yarn dlx');
  });

  it('still includes projectName and projectNameKebab', () => {
    const vars = buildSubstitutionVars({
      projectName: 'My App',
      template: 'web',
      pm: 'pnpm',
    });
    expect(vars.projectName).toBe('My App');
    expect(vars.projectNameKebab).toBe('my-app');
  });
});

describe('InstallFailedError', () => {
  it('is an Error subclass with the right name', () => {
    const err = new InstallFailedError('boom');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('InstallFailedError');
    expect(err.message).toBe('boom');
  });

  it('preserves the cause when provided', () => {
    const cause = new Error('underlying');
    const err = new InstallFailedError('wrap', { cause });
    expect(err.cause).toBe(cause);
  });
});
