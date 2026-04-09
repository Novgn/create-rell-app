// Flat ESLint config for the web workspace (Story 4.4).
//
// Uses `eslint-config-next/flat` — the flat-config entry point of Next.js's
// shared config — and appends `eslint-config-prettier` so ESLint does not
// fight Prettier over formatting rules. The root monolith runs this via
// `npm run lint` -> `next lint` -> this file.
//
// Keep the rules list short: project-specific rules that aren't covered by
// the Next.js baseline go in the `rules` block below.

import next from 'eslint-config-next/flat';
import prettier from 'eslint-config-prettier';

export default [
  ...next(),
  prettier,
  {
    rules: {
      // PRD NFR / architecture: strict TypeScript — no `any` anywhere.
      '@typescript-eslint/no-explicit-any': 'error',
      // Unused imports/vars are a code smell in a fresh scaffold.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];
