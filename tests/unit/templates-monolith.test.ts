import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { scaffoldProject } from '../../src/scaffold.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = resolve(HERE, '..', '..', 'templates');
const MONOLITH_DIR = join(TEMPLATES_DIR, 'monolith');

/**
 * Expected files in the monolith template after Story 2.1. These are the
 * paths inside `templates/monolith/` — underscore-prefixed files become
 * dotted on scaffold output (handled by src/scaffold.ts).
 */
const EXPECTED_TEMPLATE_FILES: ReadonlyArray<string> = [
  'package.json',
  'tsconfig.base.json',
  '_gitignore',
  '_env.example',
  'README.md',
  'web/package.json',
  'web/next.config.ts',
  'web/tsconfig.json',
  'web/next-env.d.ts',
  'web/app/layout.tsx',
  'web/app/page.tsx',
  'web/app/error.tsx',
  'web/app/loading.tsx',
  'web/app/globals.css',
  // Story 2.2 additions
  'web/lib/env.ts',
  'web/lib/supabase/client.ts',
  'web/lib/supabase/server.ts',
  'mobile/package.json',
  'mobile/app.json',
  'mobile/babel.config.js',
  'mobile/tsconfig.json',
  'mobile/app/_layout.tsx',
  'mobile/app/index.tsx',
  // Story 2.2 additions
  'mobile/lib/env.ts',
  'mobile/lib/token-cache.ts',
  'mobile/lib/supabase/client.ts',
  'shared/package.json',
  'shared/tsconfig.json',
  'shared/index.ts',
];

describe('templates/monolith static file shape', () => {
  it('contains every expected template file', async () => {
    const missing: string[] = [];
    for (const relative of EXPECTED_TEMPLATE_FILES) {
      try {
        await stat(join(MONOLITH_DIR, relative));
      } catch {
        missing.push(relative);
      }
    }
    expect(missing).toEqual([]);
  });

  it('root package.json declares workspaces and references {{projectName}}', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'package.json'), 'utf8');
    expect(text).toContain('"workspaces"');
    expect(text).toContain('"web"');
    expect(text).toContain('"mobile"');
    expect(text).toContain('"shared"');
    expect(text).toContain('{{projectName}}');
  });

  it('root package.json scripts reference {{pmRunCmd}} for workspace forwarding', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'package.json'), 'utf8');
    expect(text).toContain('{{pmRunCmd}}');
  });

  it('web/package.json pins Next.js + React to exact versions', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'package.json'), 'utf8');
    const parsed = JSON.parse(text) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    // Exact-version regex: no `^`, `~`, `>=`, or tags like `latest`.
    const exactVersion = /^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/;
    for (const [name, version] of Object.entries(parsed.dependencies)) {
      expect(
        exactVersion.test(version),
        `web dependency ${name} is not pinned exact: ${version}`,
      ).toBe(true);
    }
    for (const [name, version] of Object.entries(parsed.devDependencies)) {
      expect(
        exactVersion.test(version),
        `web devDependency ${name} is not pinned exact: ${version}`,
      ).toBe(true);
    }
    expect(parsed.dependencies.next).toBeDefined();
    expect(parsed.dependencies.react).toBeDefined();
    expect(parsed.dependencies['react-dom']).toBeDefined();
  });

  it('mobile/package.json pins Expo + React Native to exact versions', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'mobile', 'package.json'), 'utf8');
    const parsed = JSON.parse(text) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const exactVersion = /^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/;
    for (const [name, version] of Object.entries(parsed.dependencies)) {
      expect(
        exactVersion.test(version),
        `mobile dependency ${name} is not pinned exact: ${version}`,
      ).toBe(true);
    }
    expect(parsed.dependencies.expo).toBeDefined();
    expect(parsed.dependencies['expo-router']).toBeDefined();
    expect(parsed.dependencies['react-native']).toBeDefined();
  });

  it('shared/package.json uses the scoped @{{projectNameKebab}}/shared name', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'shared', 'package.json'), 'utf8');
    expect(text).toContain('@{{projectNameKebab}}/shared');
  });

  it('web root layout includes the {{projectName}} metadata token', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'app', 'layout.tsx'), 'utf8');
    expect(text).toContain("title: '{{projectName}}'");
  });

  it('mobile app.json references {{projectName}} and {{projectNameKebab}}', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'mobile', 'app.json'), 'utf8');
    expect(text).toContain('{{projectName}}');
    expect(text).toContain('{{projectNameKebab}}');
  });

  it('README documents workspace layout with {{projectName}}', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'README.md'), 'utf8');
    expect(text).toContain('{{projectName}}');
    expect(text).toContain('web/');
    expect(text).toContain('mobile/');
    expect(text).toContain('shared/');
  });
});

// === Story 2.2 — Clerk + Supabase native 3P auth assertions ===

describe('templates/monolith Clerk + Supabase wiring (Story 2.2)', () => {
  it('web root layout imports ClerkProvider from @clerk/nextjs and wraps children', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'app', 'layout.tsx'), 'utf8');
    expect(text).toContain("import { ClerkProvider } from '@clerk/nextjs'");
    expect(text).toContain('<ClerkProvider>');
    expect(text).toContain('{children}');
  });

  it('web Supabase client uses the accessToken callback (native 3P auth)', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'lib', 'supabase', 'client.ts'), 'utf8');
    expect(text).toContain("from '@supabase/supabase-js'");
    expect(text).toContain("from '@clerk/nextjs'");
    expect(text).toContain('accessToken');
    expect(text).toContain('useSession');
    expect(text).toContain('getToken');
  });

  it('web server Supabase client uses auth() from @clerk/nextjs/server', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'lib', 'supabase', 'server.ts'), 'utf8');
    expect(text).toContain("from '@clerk/nextjs/server'");
    expect(text).toContain("import 'server-only'");
    expect(text).toContain('accessToken');
  });

  it('mobile root layout imports ClerkProvider from @clerk/clerk-expo', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'mobile', 'app', '_layout.tsx'),
      'utf8',
    );
    expect(text).toContain("from '@clerk/clerk-expo'");
    expect(text).toContain('<ClerkProvider');
    expect(text).toContain('tokenCache');
  });

  it('mobile Supabase client uses the accessToken callback', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'mobile', 'lib', 'supabase', 'client.ts'),
      'utf8',
    );
    expect(text).toContain("from '@supabase/supabase-js'");
    expect(text).toContain("from '@clerk/clerk-expo'");
    expect(text).toContain('accessToken');
    expect(text).toContain('useAuth');
  });

  it('mobile tokenCache is backed by expo-secure-store', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'mobile', 'lib', 'token-cache.ts'), 'utf8');
    expect(text).toContain("from 'expo-secure-store'");
    expect(text).toContain('getToken');
    expect(text).toContain('saveToken');
  });

  it('web/lib/env.ts validates all required clerk + supabase keys', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'lib', 'env.ts'), 'utf8');
    expect(text).toContain('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
    expect(text).toContain('CLERK_SECRET_KEY');
    expect(text).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(text).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  });

  it('mobile/lib/env.ts validates all required EXPO_PUBLIC keys', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'mobile', 'lib', 'env.ts'), 'utf8');
    expect(text).toContain('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
    expect(text).toContain('EXPO_PUBLIC_SUPABASE_URL');
    expect(text).toContain('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  });

  it('_env.example documents every required key', async () => {
    const text = await readFile(join(MONOLITH_DIR, '_env.example'), 'utf8');
    const requiredKeys = [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'EXPO_PUBLIC_SUPABASE_URL',
      'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    ];
    for (const key of requiredKeys) {
      expect(text).toContain(key);
    }
  });

  it('web package.json pins @clerk/nextjs and @supabase/supabase-js', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'package.json'), 'utf8');
    const parsed = JSON.parse(text) as { dependencies: Record<string, string> };
    expect(parsed.dependencies['@clerk/nextjs']).toMatch(/^\d+\.\d+\.\d+$/);
    expect(parsed.dependencies['@supabase/supabase-js']).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('mobile package.json pins @clerk/clerk-expo, @supabase/supabase-js, expo-secure-store', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'mobile', 'package.json'), 'utf8');
    const parsed = JSON.parse(text) as { dependencies: Record<string, string> };
    expect(parsed.dependencies['@clerk/clerk-expo']).toMatch(/^\d+\.\d+\.\d+$/);
    expect(parsed.dependencies['@supabase/supabase-js']).toMatch(/^\d+\.\d+\.\d+$/);
    expect(parsed.dependencies['expo-secure-store']).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('no template file uses the deprecated getToken({ template: "supabase" }) JWT pattern', async () => {
    const filesToCheck: string[] = [];
    async function walk(dir: string): Promise<void> {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const childPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(childPath);
        } else if (entry.isFile()) {
          filesToCheck.push(childPath);
        }
      }
    }
    await walk(MONOLITH_DIR);

    const offenders: string[] = [];
    const deprecatedPatterns = [
      /template:\s*['"]supabase['"]/,
      /getToken\s*\(\s*\{\s*template:/,
    ];
    for (const file of filesToCheck) {
      const text = await readFile(file, 'utf8');
      for (const pattern of deprecatedPatterns) {
        if (pattern.test(text)) {
          offenders.push(`${file}: matched ${pattern}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('templates/monolith end-to-end scaffold', () => {
  let tempRoot: string;
  let targetDir: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'crapp-mono-scaffold-'));
    targetDir = join(tempRoot, 'my-app');
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  async function walkAllFiles(root: string): Promise<string[]> {
    const out: string[] = [];
    async function visit(dir: string, relative: string): Promise<void> {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const childAbs = join(dir, entry.name);
        const childRel = relative === '' ? entry.name : relative + '/' + entry.name;
        if (entry.isDirectory()) {
          await visit(childAbs, childRel);
        } else if (entry.isFile()) {
          out.push(childRel);
        }
      }
    }
    await visit(root, '');
    return out;
  }

  it('produces a scaffold with no {{...}} tokens remaining in text files', async () => {
    const result = await scaffoldProject({
      templateDir: MONOLITH_DIR,
      targetDir,
      resolvedInputs: { projectName: 'my-app', template: 'monolith', pm: 'pnpm' },
    });

    expect(result.filesWritten).toBe(EXPECTED_TEMPLATE_FILES.length);

    const files = await walkAllFiles(targetDir);
    const textExtensions = new Set([
      '.ts',
      '.tsx',
      '.js',
      '.json',
      '.md',
      '.css',
      '.example',
      '',
    ]);
    // Files that intentionally keep unknown tokens (e.g. the README's list of
    // token examples referencing {{pmInstallCmd}} after substitution) are
    // covered by the pm* substitutions — after Story 1.4 those tokens all
    // resolve. Any leftover {{...}} at this point is a bug.
    const leftoverTokens: Array<{ path: string; matches: string[] }> = [];
    for (const rel of files) {
      const ext = rel.includes('.') ? rel.slice(rel.lastIndexOf('.')) : '';
      if (!textExtensions.has(ext)) continue;
      const text = await readFile(join(targetDir, rel), 'utf8');
      const matches = text.match(/\{\{[\w]+\}\}/g);
      if (matches) leftoverTokens.push({ path: rel, matches });
    }

    expect(leftoverTokens).toEqual([]);
  });

  it('renames _gitignore to .gitignore and _env.example to .env.example', async () => {
    await scaffoldProject({
      templateDir: MONOLITH_DIR,
      targetDir,
      resolvedInputs: { projectName: 'my-app', template: 'monolith', pm: 'pnpm' },
    });

    const files = await walkAllFiles(targetDir);
    expect(files).toContain('.gitignore');
    expect(files).toContain('.env.example');
    expect(files).not.toContain('_gitignore');
    expect(files).not.toContain('_env.example');
  });

  it('substitutes projectName correctly across web + mobile entry files', async () => {
    await scaffoldProject({
      templateDir: MONOLITH_DIR,
      targetDir,
      resolvedInputs: { projectName: 'my-app', template: 'monolith', pm: 'pnpm' },
    });

    const layout = await readFile(join(targetDir, 'web', 'app', 'layout.tsx'), 'utf8');
    expect(layout).toContain("title: 'my-app'");

    const appJson = await readFile(join(targetDir, 'mobile', 'app.json'), 'utf8');
    expect(appJson).toContain('"name": "my-app"');
    expect(appJson).toContain('"slug": "my-app"');

    const sharedPkg = await readFile(join(targetDir, 'shared', 'package.json'), 'utf8');
    expect(sharedPkg).toContain('@my-app/shared');
  });

  it('substitutes pm-specific commands in the README', async () => {
    await scaffoldProject({
      templateDir: MONOLITH_DIR,
      targetDir,
      resolvedInputs: { projectName: 'my-app', template: 'monolith', pm: 'pnpm' },
    });

    const readme = await readFile(join(targetDir, 'README.md'), 'utf8');
    expect(readme).toContain('pnpm install');
    expect(readme).toContain('pnpm run');
  });
});
