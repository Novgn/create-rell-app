# Story 4.4: Add ESLint, Prettier, Husky Configuration and Inline Comments

Status: in-progress

## Story

As a developer starting a new project,
I want ESLint, Prettier, Husky, and lint-staged pre-configured, with inline
comments explaining the non-obvious wiring,
so that code quality is enforced on every commit and I can understand what the
starter is actually doing under the hood.

## Acceptance Criteria

1. **Root monolith** ships `_husky/pre-commit` (scaffolded to `.husky/pre-commit`) that runs `lint-staged`.
2. The scaffold engine (`src/scaffold.ts`) learns the `_husky` → `.husky` directory rename alongside the existing `_gitignore`/`_npmrc`/`_env.example` file renames.
3. **Root** `package.json` gains:
   - `lint` script (`{{pmRunCmd}} --prefix web lint`)
   - `format` script (`prettier --write .` at the root)
   - `format:check` script (`prettier --check .`)
   - `prepare` script (`husky`)
   - `lint-staged` config as a top-level key
   - `prettier` config as a top-level key (no dotfile — avoids packaging friction)
   - `devDependencies`: `husky`, `lint-staged`, `prettier`, `eslint`, `typescript`, `typescript-eslint`, `@eslint/js`, `eslint-config-prettier`, `eslint-config-next`
4. **Web** workspace gets `web/eslint.config.mjs` — ESLint flat config extending `eslint-config-next` and `eslint-config-prettier`, with `no-explicit-any` set to error to enforce PRD NFR16-style strictness.
5. **Mobile** workspace gets `mobile/eslint.config.mjs` using `typescript-eslint` flat config + Prettier disable; keeps the RN-specific globals (`__DEV__`).
6. **TypeScript strict mode**: confirm `tsconfig.base.json` has `"strict": true` and `"noUncheckedIndexedAccess": true`. If not, tighten.
7. **`.gitignore` additions**: confirm `.env`, `.env.local`, `credentials.json`, `*.pem`, `*.key`, `.husky/_` (husky's internal dir) are excluded.
8. **Inline comments** added to the three "non-obvious" integration seams the PRD calls out:
   - `web/lib/supabase/client.ts` — `accessToken` callback wiring (the native 3P auth pattern) — verify the existing comments still hold and tighten if needed
   - `shared/db/migrations/0000_initial.sql` — RLS policy construction and `auth.jwt()->>'sub'` usage — verify comments are present
   - `web/app/api/webhooks/clerk-billing/route.ts` — svix signature validation — verify comments are present
   Comments should be in block form, explain *why* (not what), and reference the deprecated pattern so a future maintainer doesn't regress.
9. **Unit tests** verify:
   - `_husky/pre-commit` exists in the template and references `lint-staged`
   - `src/scaffold.ts` rename table includes `_husky` → `.husky`
   - A scaffold end-to-end test confirms `_husky/pre-commit` lands at `.husky/pre-commit` in the output directory
   - Root package.json has `lint`, `format`, `format:check`, `prepare`, `lint-staged`, and `prettier` keys
   - Root package.json devDependencies include husky, lint-staged, prettier, eslint, typescript-eslint, eslint-config-next (all pinned exact)
   - `web/eslint.config.mjs` exists and extends `eslint-config-next` + `eslint-config-prettier`
   - `mobile/eslint.config.mjs` exists and uses `typescript-eslint`
   - `tsconfig.base.json` has strict + noUncheckedIndexedAccess
   - Supabase client, initial migration, billing webhook route comments mention the "non-obvious" topics
10. `npm test` passes and ALL previous stories' tests still pass (no regressions).

## Tasks / Subtasks

- [ ] **Task 1: Scaffold engine — directory rename**
  - [ ] Extend `SPECIAL_FILENAME_RENAMES` in `src/scaffold.ts` with `_husky` → `.husky`
  - [ ] Add a unit test that calls `renameSpecialFiles('_husky')` → `.husky`
- [ ] **Task 2: Husky pre-commit hook**
  - [ ] Create `templates/monolith/_husky/pre-commit`
- [ ] **Task 3: Root package.json**
  - [ ] Add lint, format, format:check, prepare scripts
  - [ ] Add lint-staged + prettier config blocks
  - [ ] Add devDependencies
- [ ] **Task 4: Web + mobile ESLint flat configs**
  - [ ] Create `templates/monolith/web/eslint.config.mjs`
  - [ ] Create `templates/monolith/mobile/eslint.config.mjs`
- [ ] **Task 5: tsconfig strictness**
  - [ ] Verify/tighten `tsconfig.base.json`
- [ ] **Task 6: .gitignore additions**
  - [ ] Verify secrets/credentials are excluded; add husky internals
- [ ] **Task 7: Inline comments audit**
  - [ ] Spot-check the three PRD-mandated files; tighten comments if needed
- [ ] **Task 8: Tests**
  - [ ] Extend `EXPECTED_TEMPLATE_FILES`
  - [ ] Extend `tests/unit/scaffold.test.ts` with the `_husky` rename assertion
  - [ ] Add a `describe('templates/monolith ESLint + Prettier + Husky (Story 4.4)')` block
- [ ] **Task 9: Verification**
  - [ ] `npx vitest run` — all green, no regressions

## Dev Notes

### Why scaffold rename for `_husky`

The rename table currently handles files only in practice, but looking at
`walkAndCopy` in `src/scaffold.ts` (lines 228–276) the transform is applied
to `entry.name` regardless of whether `entry.isDirectory()` or `entry.isFile()` —
so adding `_husky` → `.husky` to the map will just work for directories too.

Why not ship the husky hook directly in a `.husky` directory? Because:
- npm publishing strips/renames `.gitignore`, but `.husky` survives
- However, git has historically had weird interactions with `.husky` in nested
  packages (specifically: running `git init` during scaffold can confuse husky's
  internal `_`-prefixed subfolder)
- Shipping under an underscore-prefixed directory and renaming on scaffold is
  consistent with how `_gitignore` is already handled — one approach for all
  dotfiles/dotdirs the CLI needs to distribute as templates.

### Husky v9 pre-commit format

Husky 9 simplified the hook: no `husky.sh` source line needed — just the
commands to run. A minimal `pre-commit` is one line:

```sh
npx lint-staged
```

This works across npm, pnpm, and yarn.

### ESLint flat config for Next.js

`eslint-config-next` ships a flat-config entry point at
`eslint-config-next/flat`. The Next.js docs recommend `eslint.config.mjs`
with the shape:

```js
import next from 'eslint-config-next/flat';
import prettier from 'eslint-config-prettier';

export default [...next(), prettier];
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#DX]
- [Source: _bmad-output/planning-artifacts/prd.md#FR13 FR47 NFR8]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)
