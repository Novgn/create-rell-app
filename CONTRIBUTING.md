# Contributing to create-rell-app

Thanks for your interest! This project is a small, opinionated CLI — we try to keep the surface area tight and the tests fast.

## Setup

Requires Node.js 22 or later.

```bash
git clone https://github.com/Novgn/create-rell-app.git
cd create-rell-app
npm install
```

## Dev loop

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest run (unit tests)
npm run build       # tsup bundle
```

The full smoke suite — scaffolds all three templates end-to-end and runs install/lint/typecheck inside each — is slow (≈10 min). Use it before opening a PR:

```bash
npm run test:smoke
```

Environment knobs:

- `KEEP_SMOKE_OUTPUT=1` — preserve the temp directory after a run
- `node tests/smoke/smoke-test.mjs --templates=web` — run a single template

## Making changes

- **CLI source** lives in `src/`. Keep files small and testable; every non-trivial helper should have a matching unit test under `tests/unit/`.
- **Templates** live in `templates/{web,mobile,monolith}/`. Files there go through the scaffold engine verbatim except for `{{projectName}}` / `{{projectNameKebab}}` / `{{pmInstallCmd}}` / `{{pmRunCmd}}` / `{{pmExecCmd}}` substitutions and a special rename table (`_gitignore` → `.gitignore`, etc. — see `src/scaffold.ts`).
- **Template tests** in `tests/unit/templates-*.test.ts` assert file presence and content invariants. Update them alongside template changes.

## Commit style

Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).

## Reporting bugs

File issues at https://github.com/Novgn/create-rell-app/issues.
For security reports, see [SECURITY.md](./SECURITY.md).
