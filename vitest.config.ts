import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      // `cli.ts` is a trivial shim that only calls buildProgram().parseAsync(),
      // so excluding it keeps coverage focused on the testable library code.
      exclude: ['src/cli.ts'],
    },
  },
});
