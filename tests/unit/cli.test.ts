import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildProgram, runCli } from '../../src/index.ts';
import type { PromptDriver } from '../../src/prompts.ts';

describe('buildProgram', () => {
  it('parses project name, --template, and --pm flags', () => {
    const program = buildProgram();
    program.exitOverride();

    // Prevent the default action from firing during parse() so we can
    // inspect the populated state without running runCli().
    program.action(() => {});

    program.parse(['my-project', '--template', 'monolith', '--pm', 'pnpm'], { from: 'user' });

    const opts = program.opts();
    expect(program.args[0]).toBe('my-project');
    expect(opts.template).toBe('monolith');
    expect(opts.pm).toBe('pnpm');
  });

  it('parses the short -t alias for --template', () => {
    const program = buildProgram();
    program.exitOverride();
    program.action(() => {});

    program.parse(['my-project', '-t', 'web'], { from: 'user' });

    expect(program.opts().template).toBe('web');
  });

  it('leaves template and pm undefined when no flags are given', () => {
    const program = buildProgram();
    program.exitOverride();
    program.action(() => {});

    program.parse(['my-project'], { from: 'user' });

    const opts = program.opts();
    expect(opts.template).toBeUndefined();
    expect(opts.pm).toBeUndefined();
  });

  it('exposes usage information via helpInformation()', () => {
    const program = buildProgram();
    program.exitOverride();

    const help = program.helpInformation();

    expect(help).toContain('create-rell-app');
    expect(help).toContain('<project-name>');
    expect(help).toContain('--template');
    expect(help).toContain('--pm');
  });

  it('throws on missing required positional argument when exitOverride is set', () => {
    const program = buildProgram();
    program.exitOverride();
    program.action(() => {});

    expect(() => program.parse([], { from: 'user' })).toThrow();
  });
});

describe('runCli (action handler)', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  function makeRecordingDriver(
    selectAnswers: string[] = [],
  ): { driver: PromptDriver; selectCallCount: { count: number } } {
    const queue = [...selectAnswers];
    const selectCallCount = { count: 0 };
    const driver: PromptDriver = {
      text({ default: defaultValue }) {
        return Promise.resolve(defaultValue ?? '');
      },
      select({ choices }) {
        selectCallCount.count += 1;
        const queued = queue.shift();
        if (queued !== undefined) {
          const match = choices.find((c) => c.value === queued);
          if (!match) throw new Error(`unknown choice ${queued}`);
          return Promise.resolve(match.value);
        }
        const first = choices[0];
        if (!first) throw new Error('empty choices');
        return Promise.resolve(first.value);
      },
    };
    return { driver, selectCallCount };
  }

  it('logs the resolved project name, template, and package manager when all flags are provided', async () => {
    const { driver, selectCallCount } = makeRecordingDriver();

    await runCli('my-project', { template: 'monolith', pm: 'pnpm' }, driver, { interactive: true });

    const output = logSpy.mock.calls.map((c: unknown[]) => c.join(' ')).join('\n');
    expect(output).toContain('my-project');
    expect(output).toContain('monolith');
    expect(output).toContain('pnpm');
    // Both flags provided → no select prompts.
    expect(selectCallCount.count).toBe(0);
  });

  it('prompts for missing template and package manager when no flags are provided', async () => {
    const { driver, selectCallCount } = makeRecordingDriver(['web', 'npm']);

    await runCli('minimal-project', {}, driver, { interactive: true });

    const output = logSpy.mock.calls.map((c: unknown[]) => c.join(' ')).join('\n');
    expect(output).toContain('minimal-project');
    expect(output).toContain('web');
    expect(output).toContain('npm');
    expect(selectCallCount.count).toBe(2);
  });

  it('drops invalid flag values and re-prompts via the driver', async () => {
    // Pretend Commander parsed `--template react --pm bun`. Both should be
    // sanitized to undefined and the prompts shown.
    const { driver, selectCallCount } = makeRecordingDriver(['mobile', 'yarn']);

    await runCli('my-project', { template: 'react', pm: 'bun' }, driver, { interactive: true });

    const output = logSpy.mock.calls.map((c: unknown[]) => c.join(' ')).join('\n');
    expect(output).toContain('mobile');
    expect(output).toContain('yarn');
    expect(selectCallCount.count).toBe(2);
  });

  it('exits with code 1 when stdin is non-interactive and required flags are missing', async () => {
    const { driver } = makeRecordingDriver();
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code ?? 0}`);
    }) as never);

    try {
      await expect(
        runCli('my-project', {}, driver, { interactive: false }),
      ).rejects.toThrow('process.exit:1');
      expect(errSpy).toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
      errSpy.mockRestore();
    }
  });
});
