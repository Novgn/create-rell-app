# create-rell-app UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `create-rell-app` correct and pleasant from one command to a running app — fix the broken next-steps banner, add a guided env "doctor", auto-create `.env.local`, polish distribution, and keep generated projects fresh.

**Architecture:** Five independent phases. CLI changes live in `src/` (pure, unit-tested helpers + a thin wiring layer). The env doctor is a single dependency-free `scripts/check-env.mjs` shipped byte-identically into each app; it derives its required-key set from the adjacent `.env.example` (uncommented `KEY=` → required, commented `# KEY=` → optional), so one file serves web, mobile, and both monolith apps. The monolith's env is corrected to per-app placement to match where Next/Expo actually load it.

**Tech Stack:** TypeScript (ESM, Node 22+), tsup, Vitest, Commander, chalk, @inquirer/prompts, execa. Templates: Next.js 16 / Expo 55 / npm workspaces.

**Spec:** `docs/superpowers/specs/2026-06-02-create-rell-app-ux-design.md`

**Branch:** `feat/scaffold-ux-improvements` (already created; spec already committed there).

---

## Plan-level decisions (refinements discovered while grounding the plan)

1. **`resolveDevCommand` uses a static per-template map, not a filesystem read of the scaffolded `package.json`.** Reading the generated `package.json` is fragile (fails in dry-run and in existing unit tests that use bare fixtures). The dev command per template is fixed and known: web → `<pm> run dev`, mobile → `<pm> start`, monolith → `<pm> run dev:web`. A consistency test asserts the map matches each template's actual scripts, so drift is still caught.
2. **The "template not yet bundled" branch in `executeScaffoldFlow` is NOT removed.** Several existing tests (`tests/unit/cli.test.ts`) use it as a no-op-scaffold escape hatch with a fake empty templates dir. It is a harmless safety net. Instead we only **de-stale its message** (drop the "coming in Epic 2" wording, keep the "not yet bundled" phrase the test asserts). This satisfies the spec's intent (no stale/embarrassing copy) without destabilizing 4 tests.
3. **Monolith env is corrected to per-app placement** (`apps/web/.env.example` + `apps/mobile/.env.example`), replacing the single root `_env.example`. This fixes the latent bug where the root guidance pointed at a file Next never loads. The cross-template consistency test is updated to read the per-app files.
4. **Output cleanup preserves all substrings existing tests assert** (`Success!`, `scaffolded`, `files into`, `<pm> run dev`, `cd `, `Would scaffold`, `dry-run complete`, `not yet bundled`, `git init skipped`, and the resolved name/template/pm values). Only the `[create-rell-app]`/`resolved configuration:` framing changes — no test asserts those literals.

---

## File structure

**CLI (`src/`):**
- `src/banner.ts` — **new.** Pure helpers: `resolveDevCommand(template, pm)` and `buildNextStepsLines(resolved, targetDir, cwd)` returning `string[]`. One responsibility: compose the post-scaffold banner.
- `src/index.ts` — **modify.** Add `--yes/-y`; wire defaults; call `buildNextStepsLines`; tidy console framing; de-stale placeholder message.
- `src/scaffold.ts` — **modify.** Add `materializeEnvLocal()` post-walk step + call it from `scaffoldProject()`.

**Templates (×4 app locations):** `templates/web`, `templates/mobile`, `templates/monolith/apps/web`, `templates/monolith/apps/mobile`
- `scripts/check-env.mjs` — **new, byte-identical in all four.**
- `package.json` — **modify.** Add `"check-env"` + `"predev"` (web apps) / `"prestart"` (mobile apps).
- `templates/monolith/apps/web/_env.example`, `templates/monolith/apps/mobile/_env.example` — **new** (split from root).
- `templates/monolith/_env.example` — **delete.**
- `templates/monolith/package.json` — **modify.** Root aggregate `"check-env"`.
- `templates/mobile/_env.example` — **modify.** Add commented `DATABASE_URL`.
- `templates/*/README.md`, `templates/monolith/README.md` — **modify.** Env step + `check-env` mention; monolith per-app env paths.

**Repo meta:**
- `package.json` — **modify.** Add `keywords`.
- `LICENSE` — **new.**
- `README.md` — **modify.** Flags table (`--no-git`, `--dry-run`, `--yes`); env-first quick start note.
- `.github/workflows/refresh-templates.yml` — **new.**

**Tests:**
- `tests/unit/banner.test.ts` — **new.**
- `tests/unit/check-env.test.ts` — **new** (imports pure helpers from the web copy).
- `tests/unit/cli.test.ts` — **modify** (`--yes` parsing + resolution; banner substrings still pass).
- `tests/unit/scaffold.test.ts` — **modify** (`materializeEnvLocal`).
- `tests/unit/templates-consistency.test.ts` — **modify** (per-app monolith env; `check-env.mjs` parity + wiring).
- `tests/smoke/smoke-helpers.mjs` — **modify** (add `.env.local` to required files).

---

## Phase 0 — Polish quick wins (no logic; fast, independent)

### Task 0.1: Add `keywords` to root `package.json`

**Files:** Modify `package.json`

- [ ] **Step 1: Edit.** Insert a `keywords` array immediately after the `"description"` line (line 4):

```json
  "keywords": [
    "clerk",
    "supabase",
    "drizzle",
    "nextjs",
    "expo",
    "react-native",
    "scaffold",
    "starter",
    "boilerplate",
    "saas",
    "rbac",
    "monorepo",
    "create-app"
  ],
```

- [ ] **Step 2: Verify JSON parses.** Run: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('ok')"` → Expected: `ok`
- [ ] **Step 3: Commit.**

```bash
git add package.json
git commit -m "chore(npm): add keywords for registry discoverability"
```

### Task 0.2: Add a `LICENSE` file

**Files:** Create `LICENSE`

- [ ] **Step 1: Create `LICENSE`** with the standard MIT text (matches `"license": "MIT"`, author "Wayne"):

```
MIT License

Copyright (c) 2026 Wayne (Novgn)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Verify npm will publish it.** Run: `npm pack --dry-run 2>&1 | grep -i license` → Expected: a line listing `LICENSE` in the tarball contents. (`files` is an allowlist but npm always includes `LICENSE`.)
- [ ] **Step 3: Commit.**

```bash
git add LICENSE
git commit -m "chore: add MIT LICENSE file"
```

### Task 0.3: Update root `README.md` flags table + env-first note

**Files:** Modify `README.md:52-61` (flags table) and the Quick start section.

- [ ] **Step 1: Replace the flags table** (the block starting `| Flag | Description | Example |`) with:

```markdown
| Flag | Description | Example |
|---|---|---|
| `--template`, `-t` | Template to use: `web`, `mobile`, or `monolith` | `--template web` |
| `--pm` | Package manager: `npm`, `pnpm`, or `yarn` | `--pm pnpm` |
| `--yes`, `-y` | Skip all prompts; default unspecified values to `web` + `npm` | `-y` |
| `--no-install` | Skip dependency installation after scaffolding | `--no-install` |
| `--no-git` | Skip git repository init + initial commit | `--no-git` |
| `--dry-run` | Show files that would be written without touching disk | `--dry-run` |
| `--version`, `-v` | Print the CLI version | `-v` |
| `--help`, `-h` | Show usage information | `--help` |
```

- [ ] **Step 2: Add an env-first note** right after the Quick start code block (after line 15), so users know the generated app needs keys:

```markdown
> After scaffolding, the generated project drops a ready-to-edit `.env.local`.
> Run `npm run check-env` inside it to see exactly which Clerk + Supabase keys
> are still needed (with links to where each one lives) before `npm run dev`.
```

- [ ] **Step 3: Commit.**

```bash
git add README.md
git commit -m "docs: document --no-git/--dry-run/--yes flags and env-first setup"
```

---

## Phase 1 — Tier-1 banner fix (`src/banner.ts`)

### Task 1.1: `resolveDevCommand` (failing test first)

**Files:** Create `src/banner.ts`, Create `tests/unit/banner.test.ts`

- [ ] **Step 1: Write the failing test** in `tests/unit/banner.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to verify it fails.** Run: `npx vitest run tests/unit/banner.test.ts` → Expected: FAIL (cannot find module `../../src/banner.ts`).

- [ ] **Step 3: Implement `src/banner.ts`:**

```ts
// Post-scaffold "next steps" banner composition for create-rell-app.
//
// Pure and unit-tested. `resolveDevCommand` maps a template to the command
// that actually starts its dev server — derived from a static map rather than
// the scaffolded package.json so it is deterministic (works in dry-run and in
// tests with bare fixtures). A consistency test asserts this map matches each
// template's real scripts.

import { posix as posixPath, resolve as platformResolve } from 'node:path';

import type { PackageManagerName, TemplateName } from './index.ts';
import { getPackageManagerCommands } from './install.ts';
import type { ResolvedInputs } from './prompts.ts';

/**
 * The command that starts the dev server for a given template, using the
 * chosen package manager. web/monolith use `run <script>`; mobile follows the
 * npm `start` convention (`<pm> start`).
 */
export function resolveDevCommand(template: TemplateName, pm: PackageManagerName): string {
  const { run } = getPackageManagerCommands(pm); // e.g. "npm run"
  const bin = run.split(' ')[0]; // e.g. "npm"
  switch (template) {
    case 'web':
      return `${run} dev`;
    case 'mobile':
      return `${bin} start`;
    case 'monolith':
      return `${run} dev:web`;
  }
}
```

- [ ] **Step 4: Run to verify it passes.** Run: `npx vitest run tests/unit/banner.test.ts` → Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/banner.ts tests/unit/banner.test.ts
git commit -m "feat(cli): add resolveDevCommand for template-aware dev command"
```

### Task 1.2: `buildNextStepsLines` (failing test first)

**Files:** Modify `src/banner.ts`, Modify `tests/unit/banner.test.ts`

- [ ] **Step 1: Add the failing test** to `tests/unit/banner.test.ts`:

```ts
import { buildNextStepsLines } from '../../src/banner.ts';

describe('buildNextStepsLines', () => {
  const resolved = { projectName: 'my-app', template: 'mobile', pm: 'npm' } as const;

  it('uses the template-correct dev command (mobile → npm start, not npm run dev)', () => {
    const lines = buildNextStepsLines(resolved, '/work/my-app', '/work').join('\n');
    expect(lines).toContain('npm start');
    expect(lines).not.toContain('npm run dev');
  });

  it('includes ordered env → migrate → dev steps and check-env', () => {
    const lines = buildNextStepsLines(resolved, '/work/my-app', '/work').join('\n');
    expect(lines).toContain('check-env');
    expect(lines).toContain('.env.local');
    expect(lines).toContain('db:migrate');
    expect(lines).toContain('Success!');
    expect(lines).toContain('cd ./my-app');
  });

  it('web banner still contains "<pm> run dev" (back-compat with cli.test.ts)', () => {
    const web = { projectName: 'w', template: 'web', pm: 'pnpm' } as const;
    const lines = buildNextStepsLines(web, '/work/w', '/work').join('\n');
    expect(lines).toContain('pnpm run dev');
  });
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npx vitest run tests/unit/banner.test.ts` → Expected: FAIL (`buildNextStepsLines` not exported).

- [ ] **Step 3: Implement `buildNextStepsLines` in `src/banner.ts`** (append):

```ts
/**
 * Compose the post-scaffold "next steps" banner as an array of plain lines
 * (no I/O, no chalk — the caller styles + prints). Mirrors the template
 * README order: configure .env.local → migrate → dev. The dev command is
 * template-correct so mobile/monolith never print a script that doesn't exist.
 */
export function buildNextStepsLines(
  resolved: ResolvedInputs,
  targetDir: string,
  cwd: string = process.cwd(),
): string[] {
  const cmds = getPackageManagerCommands(resolved.pm);
  const dev = resolveDevCommand(resolved.template, resolved.pm);
  const absolute = platformResolve(targetDir);
  const relative = absolute.startsWith(cwd)
    ? './' + posixPath.relative(cwd, absolute).split(/[\\/]/).join('/')
    : absolute;

  return [
    `Success! Created ${resolved.projectName} at ${targetDir}`,
    '',
    'Next steps:',
    `  cd ${relative}`,
    `  1. Fill in .env.local        → ${cmds.run} check-env   (shows what's missing + where to get it)`,
    `  2. ${cmds.run} db:migrate       (apply database migrations)`,
    `  3. ${dev}              (start the dev server)`,
    '',
  ];
}
```

- [ ] **Step 4: Run to verify it passes.** Run: `npx vitest run tests/unit/banner.test.ts` → Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/banner.ts tests/unit/banner.test.ts
git commit -m "feat(cli): build ordered env→migrate→dev next-steps banner"
```

### Task 1.3: Wire the banner into `src/index.ts` (replace `printNextSteps`)

**Files:** Modify `src/index.ts` (`printNextSteps` at lines ~411-439 and its call site ~379)

- [ ] **Step 1: Add the import** near the other local imports at the top of `src/index.ts`:

```ts
import { buildNextStepsLines } from './banner.ts';
```

- [ ] **Step 2: Replace the entire `printNextSteps` function body** with a thin printer that styles the pure lines (keep the `Success!`, `cd `, and `<pm> run dev` substrings the existing `cli.test.ts` asserts — the web banner provides `pnpm run dev`):

```ts
/**
 * Print the post-scaffold next-steps banner. Composition lives in
 * `buildNextStepsLines` (pure, tested); this only styles + writes.
 */
function printNextSteps(resolved: ResolvedInputs, targetDir: string): void {
  const lines = buildNextStepsLines(resolved, targetDir);
  console.log('');
  for (const line of lines) {
    if (line.startsWith('Success!')) {
      console.log(chalk.green('Success!') + line.slice('Success!'.length));
    } else if (/^\s+(cd |[0-9]\. )/.test(line)) {
      console.log(chalk.cyan(line));
    } else {
      console.log(line);
    }
  }
}
```

- [ ] **Step 3: Confirm the call site** at the end of `executeScaffoldFlow` still reads `printNextSteps(resolved, targetDir);` (signature unchanged — no edit needed if it already matches).

- [ ] **Step 4: Run the full CLI suite.** Run: `npx vitest run tests/unit/cli.test.ts tests/unit/banner.test.ts` → Expected: PASS (the `pnpm run dev`, `Success!`, `cd ` assertions in `cli.test.ts` still hold; mobile/monolith now correct).

- [ ] **Step 5: Typecheck.** Run: `npm run typecheck` → Expected: no errors.

- [ ] **Step 6: Commit.**

```bash
git add src/index.ts
git commit -m "fix(cli): template-aware next-steps banner (mobile/monolith no longer print non-existent scripts)"
```

---

## Phase 2 — Auto-create `.env.local` (`src/scaffold.ts`)

### Task 2.1: `materializeEnvLocal` (failing test first)

**Files:** Modify `src/scaffold.ts`, Modify `tests/unit/scaffold.test.ts`

- [ ] **Step 1: Write the failing test.** Append to `tests/unit/scaffold.test.ts` (match the existing import style — it already imports from `node:fs/promises`, `node:os`, `node:path`, and `../../src/scaffold.ts`):

```ts
import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scaffoldProject } from '../../src/scaffold.ts';

describe('scaffoldProject .env.local materialization', () => {
  it('creates .env.local alongside each .env.example with identical content', async () => {
    const root = await mkdtemp(join(tmpdir(), 'crapp-envlocal-'));
    const tpl = join(root, 'tpl');
    await mkdir(tpl, { recursive: true });
    await writeFile(join(tpl, '_env.example'), 'FOO=\n# DATABASE_URL=x\n', 'utf8');

    const target = join(root, 'out');
    await scaffoldProject({
      templateDir: tpl,
      targetDir: target,
      resolvedInputs: { projectName: 'p', template: 'web', pm: 'npm' },
    });

    const example = await readFile(join(target, '.env.example'), 'utf8');
    const local = await readFile(join(target, '.env.local'), 'utf8');
    expect(local).toBe(example);
  });

  it('does not overwrite an existing .env.local in the template', async () => {
    const root = await mkdtemp(join(tmpdir(), 'crapp-envlocal2-'));
    const tpl = join(root, 'tpl');
    await mkdir(tpl, { recursive: true });
    await writeFile(join(tpl, '_env.example'), 'FOO=\n', 'utf8');
    await writeFile(join(tpl, '_env.local'), 'FOO=already\n', 'utf8'); // renames to .env.local

    const target = join(root, 'out');
    await scaffoldProject({
      templateDir: tpl,
      targetDir: target,
      resolvedInputs: { projectName: 'p', template: 'web', pm: 'npm' },
    });

    const local = await readFile(join(target, '.env.local'), 'utf8');
    expect(local).toBe('FOO=already\n');
  });

  it('dry-run records .env.local in plannedFiles but writes nothing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'crapp-envlocal3-'));
    const tpl = join(root, 'tpl');
    await mkdir(tpl, { recursive: true });
    await writeFile(join(tpl, '_env.example'), 'FOO=\n', 'utf8');

    const target = join(root, 'out');
    const result = await scaffoldProject({
      templateDir: tpl,
      targetDir: target,
      resolvedInputs: { projectName: 'p', template: 'web', pm: 'npm' },
      dryRun: true,
    });

    expect(result.plannedFiles).toContain('.env.local');
    await expect(stat(join(target, '.env.local'))).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npx vitest run tests/unit/scaffold.test.ts -t "materialization"` → Expected: FAIL (`.env.local` not created).

- [ ] **Step 3: Implement.** In `src/scaffold.ts`, add the helper above `scaffoldProject` (note `_env.local` is already covered by `SPECIAL_FILENAME_RENAMES`? It is NOT — add it so a template-provided `_env.local` renames correctly):

First, extend `SPECIAL_FILENAME_RENAMES` (add one entry):

```ts
  ['_env.local', '.env.local'],
```

Then add the helper:

```ts
/**
 * After the template walk, ensure every `.env.example` has a sibling
 * `.env.local` the framework will actually load. Content is copied verbatim
 * from the example (single source of truth) so there is no second template
 * file to keep in sync. Never overwrites an existing `.env.local` (a template
 * may ship its own via `_env.local`). Dry-run records the path without writing.
 *
 * Returns the number of `.env.local` files created (or planned in dry-run).
 */
async function materializeEnvLocal(
  targetDir: string,
  plannedFiles: string[],
  dryRun: boolean,
): Promise<number> {
  const examples = plannedFiles.filter(
    (p) => p === '.env.example' || p.endsWith('/.env.example'),
  );
  let created = 0;
  for (const example of examples) {
    const local = example.replace(/\.env\.example$/, '.env.local');
    if (plannedFiles.includes(local)) continue; // template already shipped one
    if (dryRun) {
      plannedFiles.push(local);
      created += 1;
      continue;
    }
    const localAbs = platformResolve(targetDir, toPlatform(local));
    try {
      await stat(localAbs);
      continue; // already exists on disk — do not overwrite
    } catch {
      /* does not exist — create it */
    }
    const exampleAbs = platformResolve(targetDir, toPlatform(example));
    const content = await readFile(exampleAbs, 'utf8');
    await writeFile(localAbs, content, 'utf8');
    plannedFiles.push(local);
    created += 1;
  }
  return created;
}
```

Then, in `scaffoldProject`, after `walkAndCopy(...)` returns `filesWritten` and before `return`, call it:

```ts
  const envLocalCount = await materializeEnvLocal(targetDir, plannedFiles, dryRun);
  return { filesWritten: filesWritten + envLocalCount, targetDir, plannedFiles };
```

(`platformResolve`, `toPlatform`, `stat`, `readFile`, `writeFile` are already imported in `scaffold.ts`.)

- [ ] **Step 4: Run to verify it passes.** Run: `npx vitest run tests/unit/scaffold.test.ts` → Expected: PASS (new + existing).

- [ ] **Step 5: Typecheck.** Run: `npm run typecheck` → Expected: no errors.

- [ ] **Step 6: Commit.**

```bash
git add src/scaffold.ts tests/unit/scaffold.test.ts
git commit -m "feat(scaffold): auto-create .env.local from .env.example"
```

---

## Phase 3 — The env doctor (`scripts/check-env.mjs`) + monolith env fix

### Task 3.1: Write the doctor + its unit test (failing test first)

**Files:** Create `templates/web/scripts/check-env.mjs`, Create `tests/unit/check-env.test.ts`

- [ ] **Step 1: Write the failing test** in `tests/unit/check-env.test.ts` (imports the pure helpers directly from the web copy — the file uses no `{{tokens}}`, so it is valid importable JS):

```ts
import { describe, expect, it } from 'vitest';
import { parseEnvExample, parseDotenv, evaluate } from '../../templates/web/scripts/check-env.mjs';

describe('check-env parseEnvExample', () => {
  it('uncommented KEY= → required; commented # KEY= → optional', () => {
    const { required, optional } = parseEnvExample('A=\nB=\n# DATABASE_URL=x\n# C comment\n');
    expect(required).toEqual(['A', 'B']);
    expect(optional).toEqual(['DATABASE_URL']);
  });
});

describe('check-env parseDotenv', () => {
  it('parses KEY=VALUE, ignores comments/blanks, strips one quote pair, no eval', () => {
    const env = parseDotenv('A=1\n# c\n\nB="two"\nC=\n');
    expect(env).toEqual({ A: '1', B: 'two', C: '' });
  });
});

describe('check-env evaluate', () => {
  it('flags only non-empty-missing required keys; optional never blocks', () => {
    const spec = { required: ['A', 'B'], optional: ['DATABASE_URL'] };
    const { missingRequired, missingOptional } = evaluate(spec, { A: 'x', B: '', DATABASE_URL: '' });
    expect(missingRequired).toEqual(['B']);
    expect(missingOptional).toEqual(['DATABASE_URL']);
  });
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npx vitest run tests/unit/check-env.test.ts` → Expected: FAIL (module not found).

- [ ] **Step 3: Create `templates/web/scripts/check-env.mjs`** (dependency-free; exports pure helpers; `main()` runs only when invoked directly):

```js
#!/usr/bin/env node
// Environment doctor — dependency-free pre-flight check for this project.
//
// Reads `.env.example` to learn which keys this app needs (uncommented `KEY=`
// → required, commented `# KEY=` → optional) and `.env.local` + process.env to
// see which are set, then prints a friendly checklist with links to where each
// missing value comes from. Exits non-zero ONLY when a required key is missing,
// so the `predev`/`prestart` hook blocks before the framework throws a cryptic
// error. NEVER prints any env VALUES — only key names, status, and static links.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Where to get each known key. Unknown keys still render with a generic note.
const LINKS = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'Clerk → API keys: https://dashboard.clerk.com/last-active?path=api-keys',
  CLERK_SECRET_KEY: 'Clerk → API keys: https://dashboard.clerk.com/last-active?path=api-keys',
  CLERK_BILLING_WEBHOOK_SIGNING_SECRET: 'Clerk → Webhooks: https://dashboard.clerk.com/last-active?path=webhooks',
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase → Settings › API: https://supabase.com/dashboard/project/_/settings/api',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase → Settings › API: https://supabase.com/dashboard/project/_/settings/api',
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: 'Clerk → API keys: https://dashboard.clerk.com/last-active?path=api-keys',
  EXPO_PUBLIC_SUPABASE_URL: 'Supabase → Settings › API: https://supabase.com/dashboard/project/_/settings/api',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'Supabase → Settings › API: https://supabase.com/dashboard/project/_/settings/api',
  DATABASE_URL: 'Supabase → Settings › Database (connection string): https://supabase.com/dashboard/project/_/settings/database',
};

/** Classify keys from an .env.example: uncommented `KEY=` → required, `# KEY=` → optional. */
export function parseEnvExample(text) {
  const required = [];
  const optional = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === '') continue;
    const commented = line.startsWith('#');
    const body = commented ? line.replace(/^#+\s*/, '') : line;
    const m = body.match(/^([A-Z][A-Z0-9_]*)=/);
    if (!m) continue;
    const key = m[1];
    if (commented) {
      if (!optional.includes(key) && !required.includes(key)) optional.push(key);
    } else if (!required.includes(key)) {
      required.push(key);
    }
  }
  return { required, optional };
}

/** Minimal KEY=VALUE parser. No escapes, no expansion, no eval. */
export function parseDotenv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

/** A key is "set" if present and non-empty in `env`. Optional keys never block. */
export function evaluate(spec, env) {
  const isSet = (k) => typeof env[k] === 'string' && env[k].length > 0;
  return {
    isSet,
    missingRequired: spec.required.filter((k) => !isSet(k)),
    missingOptional: spec.optional.filter((k) => !isSet(k)),
  };
}

function readSafe(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

function main() {
  const root = process.cwd();
  const exampleText = readSafe(resolve(root, '.env.example'));
  if (exampleText === '') process.exit(0); // nothing to validate

  const spec = parseEnvExample(exampleText);
  const merged = { ...parseDotenv(readSafe(resolve(root, '.env.local'))), ...process.env };
  const { isSet, missingRequired, missingOptional } = evaluate(spec, merged);

  const tty = process.stdout.isTTY;
  const C = (code, s) => (tty ? `[${code}m${s}[0m` : s);
  const out = (s) => process.stdout.write(s);

  out('\n  Checking environment (.env.local)\n\n');
  for (const key of [...spec.required, ...spec.optional]) {
    const ok = isSet(key);
    const isOptional = spec.optional.includes(key);
    const mark = ok ? C('32', '✓') : isOptional ? C('33', '○') : C('31', '✗');
    out(`  ${mark} ${key}${ok ? '' : isOptional ? '  (optional)' : ''}\n`);
    if (!ok && LINKS[key]) out(C('2', `      ${LINKS[key]}\n`));
  }
  out('\n');

  if (missingRequired.length > 0) {
    const have = spec.required.length - missingRequired.length;
    out(C('31', `  ${have} of ${spec.required.length} required keys set. `));
    out('Fill the rest in .env.local, then re-run.\n\n');
    process.exit(1);
  }
  if (missingOptional.length > 0) {
    out(C('2', `  All required keys set. ${missingOptional.length} optional key(s) still empty (e.g. DATABASE_URL for db:migrate).\n\n`));
  } else {
    out(C('32', '  All environment keys set.\n\n'));
  }
  process.exit(0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 4: Run to verify it passes.** Run: `npx vitest run tests/unit/check-env.test.ts` → Expected: PASS.

- [ ] **Step 5: Manual smoke of the CLI behavior.** Run:

```bash
mkdir -p /tmp/doctor && printf 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=\n# DATABASE_URL=x\n' > /tmp/doctor/.env.example
( cd /tmp/doctor && node /Users/urelmattis/Developer/create-rell-app/templates/web/scripts/check-env.mjs ); echo "exit=$?"
```

Expected: a checklist showing `✗ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `○ DATABASE_URL (optional)`, then `exit=1`.

- [ ] **Step 6: Commit.**

```bash
git add templates/web/scripts/check-env.mjs tests/unit/check-env.test.ts
git commit -m "feat(templates): add dependency-free env doctor (check-env.mjs)"
```

### Task 3.2: Copy the doctor into the other three app locations

**Files:** Create (identical bytes) `templates/mobile/scripts/check-env.mjs`, `templates/monolith/apps/web/scripts/check-env.mjs`, `templates/monolith/apps/mobile/scripts/check-env.mjs`

- [ ] **Step 1: Copy the web doctor verbatim into the three locations.** Run:

```bash
cd /Users/urelmattis/Developer/create-rell-app
for d in templates/mobile templates/monolith/apps/web templates/monolith/apps/mobile; do
  mkdir -p "$d/scripts"
  cp templates/web/scripts/check-env.mjs "$d/scripts/check-env.mjs"
done
```

- [ ] **Step 2: Verify byte-identical.** Run:

```bash
for d in templates/mobile templates/monolith/apps/web templates/monolith/apps/mobile; do
  cmp templates/web/scripts/check-env.mjs "$d/scripts/check-env.mjs" && echo "ok: $d"
done
```

Expected: `ok:` for all three.

- [ ] **Step 3: Commit.**

```bash
git add templates/mobile/scripts/check-env.mjs templates/monolith/apps/web/scripts/check-env.mjs templates/monolith/apps/mobile/scripts/check-env.mjs
git commit -m "feat(templates): ship env doctor in mobile + both monolith apps"
```

### Task 3.3: Fix the monolith env to per-app placement

**Files:** Create `templates/monolith/apps/web/_env.example`, Create `templates/monolith/apps/mobile/_env.example`, Delete `templates/monolith/_env.example`, Modify `templates/monolith/README.md`

- [ ] **Step 1: Create `templates/monolith/apps/web/_env.example`** (web keys only — this is the file `apps/web` Next actually loads as `.env.local`):

```
# {{projectName}} (web) — environment variables
#
# Copy is created for you as apps/web/.env.local. Fill in the values below,
# then run `{{pmRunCmd}} check-env` (from apps/web) to verify. Never commit
# real credentials — .env.local is gitignored.

# Clerk — get these from https://dashboard.clerk.com/
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Clerk Billing webhook signing secret — Clerk Dashboard → Webhooks:
# https://dashboard.clerk.com/last-active?path=webhooks
CLERK_BILLING_WEBHOOK_SIGNING_SECRET=

# Supabase — Settings → API: https://supabase.com/dashboard/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Drizzle / direct Postgres connection (Supabase → Settings → Database)
# DATABASE_URL=postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres
```

- [ ] **Step 2: Create `templates/monolith/apps/mobile/_env.example`** (EXPO keys only):

```
# {{projectName}} (mobile) — environment variables
#
# Copy is created for you as apps/mobile/.env.local. Expo only exposes vars
# prefixed with EXPO_PUBLIC_ to the compiled bundle — do NOT put secrets here.
# Run `{{pmRunCmd}} check-env` (from apps/mobile) to verify.

EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Drizzle / direct Postgres connection (only needed to run db:migrate locally)
# DATABASE_URL=postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres
```

- [ ] **Step 3: Delete the root monolith example.** Run: `git rm templates/monolith/_env.example`

- [ ] **Step 4: Update `templates/monolith/README.md` Getting-started step 2** (replace the single "Copy `.env.example`…" line) with:

```markdown
2. Configure environment variables (a ready-to-edit `.env.local` is created for each app):

   ```sh
   {{pmRunCmd}} check-env          # reports which keys are still missing, with links
   ```

   Fill in `apps/web/.env.local` (Clerk + Supabase) and `apps/mobile/.env.local`
   (Expo public keys) before running the apps.
```

- [ ] **Step 5: Commit.**

```bash
git add templates/monolith/apps/web/_env.example templates/monolith/apps/mobile/_env.example templates/monolith/README.md
git commit -m "fix(monolith): per-app .env.example so Next/Expo load env from the right place"
```

### Task 3.4: Add the commented `DATABASE_URL` to solo mobile example

**Files:** Modify `templates/mobile/_env.example`

- [ ] **Step 1: Append** to `templates/mobile/_env.example`:

```

# Drizzle / direct Postgres connection (only needed to run db:migrate locally).
# Mobile ships db:* scripts and a migrations/ dir; set this to apply migrations.
# DATABASE_URL=postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres
```

- [ ] **Step 2: Confirm the consistency test still holds** (mobile example must NOT contain `NEXT_PUBLIC_` or server secrets — a commented `DATABASE_URL` is fine). Run: `npx vitest run tests/unit/templates-consistency.test.ts -t "mobile _env.example"` → Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add templates/mobile/_env.example
git commit -m "fix(mobile): document optional DATABASE_URL (ships db:migrate)"
```

### Task 3.5: Wire `check-env` + pre-hooks into template package.json files

**Files:** Modify `templates/web/package.json`, `templates/mobile/package.json`, `templates/monolith/apps/web/package.json`, `templates/monolith/apps/mobile/package.json`, `templates/monolith/package.json`

- [ ] **Step 1: `templates/web/package.json`** — add to `scripts` (web has `dev`, so use `predev`):

```json
    "check-env": "node scripts/check-env.mjs",
    "predev": "node scripts/check-env.mjs",
```

- [ ] **Step 2: `templates/monolith/apps/web/package.json`** — add the same two lines to its `scripts`.

- [ ] **Step 3: `templates/mobile/package.json`** — add (mobile uses `start`, so `prestart`):

```json
    "check-env": "node scripts/check-env.mjs",
    "prestart": "node scripts/check-env.mjs",
```

- [ ] **Step 4: `templates/monolith/apps/mobile/package.json`** — add the same two lines.

- [ ] **Step 5: `templates/monolith/package.json`** — add a root aggregate to `scripts` (runs both apps' doctors with the chosen pm):

```json
    "check-env": "{{pmRunCmd}} --prefix apps/web check-env && {{pmRunCmd}} --prefix apps/mobile check-env",
```

- [ ] **Step 6: Validate every edited package.json parses.** Run:

```bash
for f in templates/web/package.json templates/mobile/package.json templates/monolith/package.json templates/monolith/apps/web/package.json templates/monolith/apps/mobile/package.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" && echo "ok: $f"
done
```

Expected: `ok:` for all five. (Note the root monolith value contains `{{pmRunCmd}}`, which is valid JSON string content; substitution happens at scaffold time.)

- [ ] **Step 7: Commit.**

```bash
git add templates/web/package.json templates/mobile/package.json templates/monolith/package.json templates/monolith/apps/web/package.json templates/monolith/apps/mobile/package.json
git commit -m "feat(templates): wire check-env into predev/prestart + root aggregate"
```

### Task 3.6: Update solo web + mobile READMEs to lead with env

**Files:** Modify `templates/web/README.md`, `templates/mobile/README.md`

- [ ] **Step 1: `templates/web/README.md`** — replace Getting-started step 2 (the "Copy `.env.example`…" line) with:

```markdown
2. Configure environment variables (a ready-to-edit `.env.local` was created for you):

   ```sh
   {{pmRunCmd}} check-env
   ```

   This lists every Clerk + Supabase key still missing, with a link to where each
   one lives. `{{pmRunCmd}} dev` runs it automatically and stops until the
   required keys are set.
```

- [ ] **Step 2: `templates/mobile/README.md`** — if it has a Getting-started env step, apply the same change but reference `{{pmRunCmd}} start` instead of `dev`. If the mobile README has no env step, add the step 2 above (with `start`).

- [ ] **Step 3: Commit.**

```bash
git add templates/web/README.md templates/mobile/README.md
git commit -m "docs(templates): lead getting-started with check-env"
```

### Task 3.7: Update consistency tests for the doctor + per-app monolith env

**Files:** Modify `tests/unit/templates-consistency.test.ts`

- [ ] **Step 1: Update the monolith env-var naming tests.** Replace the `webTemplates`/`mobileTemplates` env blocks (lines ~200-237) so the monolith reads its per-app examples. Add these path constants near the other monolith dirs (after line 46):

```ts
const MONOLITH_WEB_ENV = join(MONOLITH_WEB_DIR, '_env.example');
const MONOLITH_MOBILE_ENV = join(MONOLITH_MOBILE_DIR, '_env.example');
```

Then replace the two `it.each(webTemplates)` / `it.each(mobileTemplates)` blocks with explicit per-file checks:

```ts
it('web examples document NEXT_PUBLIC_CLERK/SUPABASE keys + CLERK_SECRET_KEY', async () => {
  for (const p of [join(WEB_DIR, '_env.example'), MONOLITH_WEB_ENV]) {
    const text = await readFile(p, 'utf8');
    expect(text).toContain('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
    expect(text).toContain('CLERK_SECRET_KEY');
    expect(text).toContain('CLERK_BILLING_WEBHOOK_SIGNING_SECRET');
    expect(text).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(text).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
});

it('mobile examples document EXPO_PUBLIC_CLERK/SUPABASE keys (and no server secrets)', async () => {
  for (const p of [join(MOBILE_DIR, '_env.example'), MONOLITH_MOBILE_ENV]) {
    const text = await readFile(p, 'utf8');
    expect(text).toContain('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
    expect(text).toContain('EXPO_PUBLIC_SUPABASE_URL');
    expect(text).toContain('EXPO_PUBLIC_SUPABASE_ANON_KEY');
    expect(text).not.toContain('NEXT_PUBLIC_');
    expect(text).not.toContain('CLERK_SECRET_KEY');
  }
});
```

- [ ] **Step 2: Add a new describe block** asserting doctor parity + wiring (append to the file):

```ts
describe('cross-template env doctor', () => {
  const DOCTOR_PATHS = [
    join(WEB_DIR, 'scripts', 'check-env.mjs'),
    join(MOBILE_DIR, 'scripts', 'check-env.mjs'),
    join(MONOLITH_WEB_DIR, 'scripts', 'check-env.mjs'),
    join(MONOLITH_MOBILE_DIR, 'scripts', 'check-env.mjs'),
  ];

  it('check-env.mjs is byte-identical across all four app locations', async () => {
    const [web, ...rest] = await Promise.all(DOCTOR_PATHS.map((p) => readFile(p, 'utf8')));
    for (const text of rest) expect(text).toBe(web);
  });

  it('solo web + monolith web wire predev → check-env', async () => {
    for (const dir of [WEB_DIR, MONOLITH_WEB_DIR]) {
      const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
      expect(pkg.scripts['check-env']).toBe('node scripts/check-env.mjs');
      expect(pkg.scripts['predev']).toBe('node scripts/check-env.mjs');
    }
  });

  it('solo mobile + monolith mobile wire prestart → check-env', async () => {
    for (const dir of [MOBILE_DIR, MONOLITH_MOBILE_DIR]) {
      const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
      expect(pkg.scripts['check-env']).toBe('node scripts/check-env.mjs');
      expect(pkg.scripts['prestart']).toBe('node scripts/check-env.mjs');
    }
  });
});
```

- [ ] **Step 3: Add a dev-command map consistency test** (guards the static `resolveDevCommand` map against template drift). Append:

```ts
import { resolveDevCommand } from '../../src/banner.ts';

describe('resolveDevCommand matches real template scripts', () => {
  it('web/monolith dev script + mobile start script exist where the map points', async () => {
    const web = JSON.parse(await readFile(join(WEB_DIR, 'package.json'), 'utf8'));
    expect(web.scripts['dev']).toBeDefined();        // resolveDevCommand('web') → run dev
    const mobile = JSON.parse(await readFile(join(MOBILE_DIR, 'package.json'), 'utf8'));
    expect(mobile.scripts['start']).toBeDefined();    // resolveDevCommand('mobile') → start
    const mono = JSON.parse(await readFile(join(MONOLITH_DIR, 'package.json'), 'utf8'));
    expect(mono.scripts['dev:web']).toBeDefined();    // resolveDevCommand('monolith') → run dev:web
    expect(resolveDevCommand('mobile', 'npm')).toBe('npm start');
  });
});
```

- [ ] **Step 4: Run the consistency suite.** Run: `npx vitest run tests/unit/templates-consistency.test.ts` → Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add tests/unit/templates-consistency.test.ts
git commit -m "test(templates): doctor parity, per-app monolith env, dev-command map"
```

### Task 3.8: Add `.env.local` to the smoke required-files list

**Files:** Modify `tests/smoke/smoke-helpers.mjs`

- [ ] **Step 1: Read `tests/smoke/smoke-helpers.mjs`** and locate the `TEMPLATES` structure that lists each template's required output files (the smoke runner checks these exist after scaffold).

- [ ] **Step 2: Add `.env.local` and `scripts/check-env.mjs`** to each template's required-files array. For the monolith, use the per-app paths `apps/web/.env.local`, `apps/mobile/.env.local`, `apps/web/scripts/check-env.mjs`, `apps/mobile/scripts/check-env.mjs`. (Match the exact shape already used in the file — add string entries to the existing arrays.)

- [ ] **Step 3: Run the smoke-runner unit test** (covers the helper shape without a full scaffold). Run: `npx vitest run tests/unit/smoke-runner.test.ts` → Expected: PASS.

- [ ] **Step 4: Commit.**

```bash
git add tests/smoke/smoke-helpers.mjs
git commit -m "test(smoke): assert .env.local + check-env.mjs are scaffolded"
```

---

## Phase 4 — `--yes/-y` non-interactive defaults

### Task 4.1: Parse `--yes` (failing test first)

**Files:** Modify `src/index.ts` (`buildProgram`), Modify `tests/unit/cli.test.ts`

- [ ] **Step 1: Add the failing test** to the `describe('buildProgram')` block in `tests/unit/cli.test.ts`:

```ts
it('parses --yes / -y as yes: true', () => {
  const program = buildProgram();
  program.exitOverride();
  program.action(() => {});
  program.parse(['my-project', '-y'], { from: 'user' });
  expect(program.opts().yes).toBe(true);
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npx vitest run tests/unit/cli.test.ts -t "yes"` → Expected: FAIL (`yes` undefined).

- [ ] **Step 3: Add the option + type.** In `src/index.ts`, add to the `CliOptions` interface:

```ts
  /** Maps to `--yes`/`-y`: skip prompts, default unspecified values. */
  yes?: boolean;
```

And add the option in `buildProgram()` (after the `--pm` option):

```ts
    .option('-y, --yes', 'skip prompts; default unspecified values to web + npm')
```

- [ ] **Step 4: Run to verify it passes.** Run: `npx vitest run tests/unit/cli.test.ts -t "yes"` → Expected: PASS.

### Task 4.2: Apply `--yes` defaults in `runCli` (failing test first)

**Files:** Modify `src/index.ts` (`runCli`), Modify `tests/unit/cli.test.ts`

- [ ] **Step 1: Add the failing test** to the `describe('runCli (action handler)')` block:

```ts
it('with --yes and no flags in non-interactive mode, defaults to web + npm (no error)', async () => {
  const { driver, selectCallCount } = makeRecordingDriver();
  await runCli(
    'yes-project',
    { yes: true },
    {
      driver,
      gatherOptions: { interactive: false },
      templatesDir: join(legacyTempRoot, 'empty-templates'),
      targetDirOverride: join(legacyTempRoot, 'out-yes'),
      installDeps: false,
    },
  );
  const output = logSpy.mock.calls.map((c: unknown[]) => c.join(' ')).join('\n');
  expect(output).toContain('yes-project');
  expect(output).toContain('web');
  expect(output).toContain('npm');
  expect(selectCallCount.count).toBe(0); // no prompts
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npx vitest run tests/unit/cli.test.ts -t "with --yes"` → Expected: FAIL (currently throws `NonInteractiveStdinError` → process.exit(1)).

- [ ] **Step 3: Implement.** In `runCli`, after `const partial = buildPartialInputs(...)` (line ~230), insert:

```ts
    // `--yes`: fill any unspecified values with defaults and skip prompting.
    const useDefaults = options.yes === true;
    if (useDefaults) {
      partial.template ??= 'web';
      partial.pm ??= 'npm';
    }
```

Then change the `gatherInputs` call to force non-interactive when `useDefaults`:

```ts
      resolved = await gatherInputs(partial, driver, {
        interactive: useDefaults ? false : interactive,
      });
```

(`PartialInputs.template`/`pm` are mutable optional fields, so `??=` typechecks.)

- [ ] **Step 4: Run to verify it passes.** Run: `npx vitest run tests/unit/cli.test.ts` → Expected: PASS (all CLI tests).

- [ ] **Step 5: Typecheck + lint.** Run: `npm run typecheck && npm run lint` → Expected: clean.

- [ ] **Step 6: Commit.**

```bash
git add src/index.ts tests/unit/cli.test.ts
git commit -m "feat(cli): add --yes/-y to skip prompts with web+npm defaults"
```

### Task 4.3: De-stale the placeholder message + tidy console framing

**Files:** Modify `src/index.ts` (`executeScaffoldFlow` logs)

- [ ] **Step 1: De-stale the "not yet bundled" message** (the `console.log` near line 324). Keep the `not yet bundled` substring (a test asserts it); drop the "coming in Epic 2" wording:

```ts
    console.log(
      '[create-rell-app] template "%s" is not yet bundled in this build — skipping scaffold.',
      resolved.template,
    );
```

- [ ] **Step 2: Tidy the resolved-config block** (lines ~313-319). Keep the three values printed (tests assert them). Replace the `[create-rell-app] resolved configuration:` framing with a cleaner header — values unchanged:

```ts
  console.log('');
  console.log(chalk.bold('create-rell-app'));
  console.log('  project name : %s', resolved.projectName);
  console.log('  template     : %s', resolved.template);
  console.log('  package mgr  : %s', resolved.pm);
  if (dryRun) console.log('  mode         : %s', 'dry-run (no files written)');
```

(Leave the `scaffolded %d files into %s` success line and all dry-run lines untouched — tests assert `scaffolded`, `files into`, `Would scaffold`, `dry-run complete`.)

- [ ] **Step 3: Run the full unit suite.** Run: `npm run test` → Expected: PASS.

- [ ] **Step 4: Commit.**

```bash
git add src/index.ts
git commit -m "chore(cli): de-stale placeholder copy and tidy console header"
```

---

## Phase 5 — Dependency-freshness workflow

### Task 5.1: Add the scheduled refresh workflow

**Files:** Create `.github/workflows/refresh-templates.yml`

- [ ] **Step 1: Create the workflow:**

```yaml
# Weekly refresh of pinned template dependencies (Dependabot is intentionally
# disabled for template workspaces). Bumps each template package.json to the
# latest versions, runs the full smoke matrix, and opens a PR only when green.
# Never auto-merges — a human reviews the bump.

name: Refresh template deps

on:
  schedule:
    - cron: '0 6 * * 1' # Mondays 06:00 UTC
  workflow_dispatch: {}

permissions:
  contents: write
  pull-requests: write

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

      - name: Install CLI dev deps
        run: npm ci

      - name: Bump template dependencies to latest
        run: |
          set -e
          for f in \
            templates/web/package.json \
            templates/mobile/package.json \
            templates/monolith/package.json \
            templates/monolith/apps/web/package.json \
            templates/monolith/apps/mobile/package.json \
            templates/monolith/packages/shared/package.json; do
            echo "Bumping $f"
            npx --yes npm-check-updates -u --packageFile "$f"
          done

      - name: Build + smoke test all templates
        run: npm run test:smoke

      - name: Open PR with the bumped versions
        if: success()
        uses: peter-evans/create-pull-request@v6
        with:
          branch: chore/refresh-template-deps
          title: 'chore(templates): weekly dependency refresh'
          commit-message: 'chore(templates): refresh pinned dependencies'
          labels: dependencies, templates
          body: |
            Automated weekly bump of pinned template dependencies.
            The smoke matrix (scaffold → install → build → lint → typecheck for
            all three templates) passed on these versions. Review the diff before
            merging — major framework bumps may still need template code changes.
```

- [ ] **Step 2: Validate YAML syntax.** Run: `npx --yes js-yaml .github/workflows/refresh-templates.yml > /dev/null && echo "valid yaml"` → Expected: `valid yaml`.

- [ ] **Step 3: Commit.**

```bash
git add .github/workflows/refresh-templates.yml
git commit -m "ci: weekly template dependency refresh with smoke gate"
```

---

## Phase 6 — Full verification + smoke

### Task 6.1: Full local verification

- [ ] **Step 1: Typecheck.** Run: `npm run typecheck` → Expected: no errors.
- [ ] **Step 2: Lint.** Run: `npm run lint` → Expected: no errors. (If ESLint flags `templates/**/scripts/check-env.mjs`, confirm the existing eslint config ignores `templates/` — it ships `_eslint.config.mjs` per template and the root config already scopes to `src`/`tests`. If a new ignore is needed, add `templates/**` to the root `eslint.config.js` ignores and note it in the commit.)
- [ ] **Step 3: Unit tests + coverage.** Run: `npm run test:coverage` → Expected: all PASS.
- [ ] **Step 4: Build.** Run: `npm run build` → Expected: `dist/cli.js` produced.

### Task 6.2: End-to-end smoke (all three templates)

- [ ] **Step 1: Run the smoke suite.** Run: `npm run test:smoke` → Expected: per-template PASS summary, exit 0. This scaffolds each template, asserts `.env.local` + `scripts/check-env.mjs` exist, installs, builds, lints, typechecks.
- [ ] **Step 2: Manual one-command check.** Run:

```bash
node dist/cli.js demo-web --template web --pm npm --no-install --no-git
ls demo-web/.env.local demo-web/scripts/check-env.mjs        # both exist
( cd demo-web && node scripts/check-env.mjs ); echo "exit=$?" # checklist + exit=1 (no keys set)
rm -rf demo-web
```

Expected: `.env.local` and the doctor exist; the doctor prints the missing-keys checklist and exits 1.

- [ ] **Step 3: Verify the banner is template-correct for mobile + monolith** (the original Tier-1 bug). Run:

```bash
node dist/cli.js demo-mob --template mobile --pm npm --no-install --no-git | grep -E "npm (start|run dev)"
node dist/cli.js demo-mono --template monolith --pm npm --no-install --no-git | grep -E "npm run dev:web"
rm -rf demo-mob demo-mono
```

Expected: mobile prints `npm start` (NOT `npm run dev`); monolith prints `npm run dev:web`.

### Task 6.3: Update CHANGELOG + open PR

- [ ] **Step 1: Add an `Unreleased` section** to `CHANGELOG.md` summarizing: template-aware next-steps banner (fixes mobile/monolith); guided env doctor (`check-env`) + auto-created `.env.local`; per-app monolith env fix; `--yes/-y`; `keywords` + `LICENSE`; README flag docs; weekly template-dep refresh workflow.
- [ ] **Step 2: Commit.**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog for UX improvements"
```

- [ ] **Step 3: Push + open PR.**

```bash
git push -u origin feat/scaffold-ux-improvements
gh pr create --title "create-rell-app UX improvements" --body "Implements docs/superpowers/specs/2026-06-02-create-rell-app-ux-design.md — see CHANGELOG Unreleased."
```

---

## Self-review notes (author)

- **Spec coverage:** env onboarding (Phase 2 + 3), Tier-1 banner (Phase 1) + README flags (Task 0.3), polish bundle (Phase 0 + Task 4.3 + Phase 4), freshness (Phase 5). All four workstreams mapped.
- **Monolith open item from the spec is resolved:** confirmed `dev:web` runs `next dev` in `apps/web` with no root-env loading → per-app `.env.example`/`.env.local`/doctor (Task 3.3).
- **Type consistency:** `resolveDevCommand(template, pm)` and `buildNextStepsLines(resolved, targetDir, cwd?)` used identically in `banner.ts`, `index.ts`, and tests. `parseEnvExample`/`parseDotenv`/`evaluate` names match between `check-env.mjs` and `check-env.test.ts`.
- **Back-compat:** existing `cli.test.ts` assertions (`Success!`, `pnpm run dev`, `cd `, `scaffolded`, `files into`, `not yet bundled`, dry-run phrases) are all preserved by design.
- **Security:** doctor is pure string parsing (no eval/shell/expansion), prints no env values, uses static links; `.env.local` written with placeholder values only; path-traversal hardening untouched.
