import { describe, expect, it } from 'vitest';
import { resolveDevCommand } from '../../src/banner.ts';

describe('resolveDevCommand', () => {
  it('web → "<pm> run dev"', () => {
    expect(resolveDevCommand('web', 'npm')).toBe('npm run dev');
    expect(resolveDevCommand('web', 'pnpm')).toBe('pnpm run dev');
  });
  it('mobile → "<pm> start"', () => {
    expect(resolveDevCommand('mobile', 'npm')).toBe('npm start');
    expect(resolveDevCommand('mobile', 'yarn')).toBe('yarn start');
  });
  it('monolith → "<pm> run dev:web"', () => {
    expect(resolveDevCommand('monolith', 'pnpm')).toBe('pnpm run dev:web');
  });
});
