// Flat ESLint config (ESLint v9+ / v10+). See https://eslint.org/docs/latest/use/configure/configuration-files-new
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '_bmad/**',
      '_bmad-output/**',
      '.claude/**',
      'templates/**',
      // Scaffolded output left in the repo root during local CLI testing.
      // These are generated projects, not CLI source, so ESLint should skip
      // them entirely (they'll have their own nested lint configs).
      'my-project/**',
      'my-app/**',
      'my-saas-app/**',
      'test-project/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
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
