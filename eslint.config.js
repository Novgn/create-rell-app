// Flat ESLint config (ESLint v9+ / v10+). See https://eslint.org/docs/latest/use/configure/configuration-files-new
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '_bmad/**',
      '_bmad-output/**',
      '.claude/**',
      '.worktrees/**',
      'templates/**',
      // Scaffolded output left in the repo root during local CLI testing.
      // These are generated projects, not CLI source, so ESLint should skip
      // them entirely (they'll have their own nested lint configs).
      'my-project/**',
      'my-app/**',
      'my-saas-app/**',
      'test-project/**',
      'full-app/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      // Pin tsconfigRootDir so the @typescript-eslint parser can't be
      // confused by ghost editor buffers or nested tsconfigs from
      // scaffolded test projects. Without this, opening a file under
      // e.g. full-app/apps/mobile/ causes the parser to discover two
      // candidate roots and bail with a "multiple candidate TSConfigRootDirs"
      // error. See https://tseslint.com/parser-tsconfigrootdir.
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': 'off',
    },
  },
  prettierConfig,
);
