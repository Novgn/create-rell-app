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
  // Story 2.3 additions
  'web/middleware.ts',
  'web/app/(auth)/sign-in/[[...sign-in]]/page.tsx',
  'web/app/(auth)/sign-up/[[...sign-up]]/page.tsx',
  'web/app/dashboard/layout.tsx',
  'web/app/dashboard/page.tsx',
  'mobile/package.json',
  'mobile/app.json',
  'mobile/babel.config.js',
  'mobile/tsconfig.json',
  'mobile/app/_layout.tsx',
  // Story 2.2 additions
  'mobile/lib/env.ts',
  'mobile/lib/token-cache.ts',
  'mobile/lib/supabase/client.ts',
  // Story 2.3 additions (mobile auth flows, replaces mobile/app/index.tsx)
  'mobile/app/(auth)/_layout.tsx',
  'mobile/app/(auth)/sign-in.tsx',
  'mobile/app/(auth)/sign-up.tsx',
  'mobile/app/(tabs)/_layout.tsx',
  'mobile/app/(tabs)/index.tsx',
  'shared/package.json',
  'shared/tsconfig.json',
  'shared/index.ts',
  // Story 2.4 additions
  'shared/drizzle.config.ts',
  'shared/db/schema.ts',
  'shared/db/client.ts',
  'shared/db/queries.ts',
  'shared/db/migrations/0000_initial.sql',
  // Story 3.1 additions
  'web/lib/auth/current-user.ts',
  'web/app/dashboard/billing/page.tsx',
  // Story 3.2 additions
  'web/lib/env-server.ts',
  'web/lib/billing/plan-to-role.ts',
  'web/lib/billing/event-handler.ts',
  'web/app/api/webhooks/clerk-billing/route.ts',
  // Story 3.3 additions
  'web/lib/auth/roles.ts',
  'web/lib/auth/use-role.ts',
  'web/app/api/me/role/route.ts',
  'mobile/lib/auth/use-role.ts',
  'shared/db/migrations/0001_rbac_helpers.sql',
  // Story 3.4 additions
  'web/components/auth/RoleGate.tsx',
  'web/components/auth/PaywallPrompt.tsx',
  'web/app/dashboard/paid-feature/page.tsx',
  'mobile/components/auth/RoleGate.tsx',
  'mobile/components/auth/PaywallPrompt.tsx',
  // Story 4.1 additions
  'web/stores/app-store.ts',
  'web/components/shared/OnboardingGreeting.tsx',
  'mobile/stores/app-store.ts',
  // Story 4.2 additions
  'shared/validation/profile-form.ts',
  'web/components/forms/ProfileForm.tsx',
  'web/app/dashboard/settings/page.tsx',
  'mobile/components/forms/ProfileForm.tsx',
  'mobile/app/(tabs)/settings.tsx',
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

  it('web/lib/env.ts validates public (NEXT_PUBLIC_) keys; server secrets live in env-server.ts', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'lib', 'env.ts'), 'utf8');
    expect(text).toContain('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
    expect(text).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(text).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    const serverText = await readFile(
      join(MONOLITH_DIR, 'web', 'lib', 'env-server.ts'),
      'utf8',
    );
    expect(serverText).toContain('CLERK_SECRET_KEY');
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

  it('mobile/lib/env.ts does not reference CLERK_SECRET_KEY (secret must stay server-side)', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'mobile', 'lib', 'env.ts'), 'utf8');
    expect(text).not.toContain('CLERK_SECRET_KEY');
    expect(text).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  // === Story 2.3 — middleware + sign-in/sign-up + protected routes ===

  it('web middleware uses clerkMiddleware and createRouteMatcher from @clerk/nextjs/server', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'middleware.ts'), 'utf8');
    expect(text).toContain("from '@clerk/nextjs/server'");
    expect(text).toContain('clerkMiddleware');
    expect(text).toContain('createRouteMatcher');
    expect(text).toContain('auth.protect');
    expect(text).toContain('matcher');
  });

  it('web middleware protects (dashboard) route group with no bypass', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'middleware.ts'), 'utf8');
    expect(text).toContain('dashboard');
    // Matcher must not have a loose "public routes skip auth" pattern.
    expect(text).not.toContain('publicRoutes');
  });

  it('web sign-in page imports SignIn from @clerk/nextjs', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'app', '(auth)', 'sign-in', '[[...sign-in]]', 'page.tsx'),
      'utf8',
    );
    expect(text).toContain("import { SignIn } from '@clerk/nextjs'");
    expect(text).toContain('<SignIn />');
  });

  it('web sign-up page imports SignUp from @clerk/nextjs', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'app', '(auth)', 'sign-up', '[[...sign-up]]', 'page.tsx'),
      'utf8',
    );
    expect(text).toContain("import { SignUp } from '@clerk/nextjs'");
    expect(text).toContain('<SignUp />');
  });

  it('web dashboard layout uses auth() + redirects unauthenticated users', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'app', 'dashboard', 'layout.tsx'),
      'utf8',
    );
    expect(text).toContain("from '@clerk/nextjs/server'");
    expect(text).toContain('auth()');
    expect(text).toContain('redirect');
  });

  it('web dashboard layout uses UserButton', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'app', 'dashboard', 'layout.tsx'),
      'utf8',
    );
    expect(text).toContain('UserButton');
  });

  it('web middleware dashboard matcher targets the real /dashboard URL (not a parenthesized group)', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'middleware.ts'), 'utf8');
    expect(text).toContain("'/dashboard(.*)'");
    // The parenthesized route group form is a bug — it would never match.
    expect(text).not.toContain('/(dashboard)');
  });

  it('mobile (auth)/sign-in uses useSignIn from @clerk/clerk-expo', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'mobile', 'app', '(auth)', 'sign-in.tsx'),
      'utf8',
    );
    expect(text).toContain("import { useSignIn } from '@clerk/clerk-expo'");
    expect(text).toContain('signIn.create');
  });

  it('mobile (auth)/sign-up uses useSignUp from @clerk/clerk-expo', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'mobile', 'app', '(auth)', 'sign-up.tsx'),
      'utf8',
    );
    expect(text).toContain("import { useSignUp } from '@clerk/clerk-expo'");
    expect(text).toContain('signUp.create');
  });

  it('mobile (tabs)/_layout.tsx redirects unauthenticated users via useAuth', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'mobile', 'app', '(tabs)', '_layout.tsx'),
      'utf8',
    );
    expect(text).toContain("from '@clerk/clerk-expo'");
    expect(text).toContain('useAuth');
    expect(text).toContain('Redirect');
    expect(text).toContain('sign-in');
  });

  it('mobile root layout uses Slot (routing delegated to nested layouts)', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'mobile', 'app', '_layout.tsx'), 'utf8');
    expect(text).toContain("from 'expo-router'");
    expect(text).toContain('Slot');
    // Old Story 2.1 used Stack.Screen name="index" — confirm we migrated.
    expect(text).not.toContain('Stack.Screen');
  });

  it('mobile/app/index.tsx was removed (replaced by (tabs)/index.tsx)', async () => {
    await expect(stat(join(MONOLITH_DIR, 'mobile', 'app', 'index.tsx'))).rejects.toBeDefined();
  });

  // === Story 2.4 — Drizzle schema, queries, migrations ===

  it('shared/package.json pins drizzle-orm, postgres, drizzle-kit', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'shared', 'package.json'), 'utf8');
    const parsed = JSON.parse(text) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const exact = /^\d+\.\d+\.\d+$/;
    expect(parsed.dependencies['drizzle-orm']).toMatch(exact);
    expect(parsed.dependencies['postgres']).toMatch(exact);
    expect(parsed.devDependencies['drizzle-kit']).toMatch(exact);
  });

  it('shared/db/schema.ts defines user_roles table with correct columns and naming', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'shared', 'db', 'schema.ts'), 'utf8');
    // Table name — relax whitespace matching by searching for the literal
    // first-arg string anywhere in the file.
    expect(text).toMatch(/pgTable\(\s*'user_roles'/);
    // Column names (snake_case strings) — Drizzle uses `.text('clerk_user_id')`
    expect(text).toContain("'clerk_user_id'");
    expect(text).toContain("'created_at'");
    expect(text).toContain("'updated_at'");
    // Index name
    expect(text).toContain('idx_user_roles_clerk_user_id');
    // Role enum
    expect(text).toContain("'super_admin'");
    expect(text).toContain("'paid'");
    expect(text).toContain("'free'");
  });

  it('shared/db/schema.ts exports UserRole + NewUserRole + Role types', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'shared', 'db', 'schema.ts'), 'utf8');
    expect(text).toContain('export type UserRole');
    expect(text).toContain('export type NewUserRole');
    expect(text).toContain('export type Role');
    expect(text).toContain('$inferSelect');
    expect(text).toContain('$inferInsert');
  });

  it('shared/db/client.ts uses drizzle + postgres and reads DATABASE_URL lazily', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'shared', 'db', 'client.ts'), 'utf8');
    expect(text).toContain("from 'drizzle-orm/postgres-js'");
    expect(text).toContain("from 'postgres'");
    expect(text).toContain('DATABASE_URL');
    // Lazy-initialized client (review fix: module-load throw would break
    // next build on machines without DATABASE_URL set).
    expect(text).toContain('export function getDb');
    expect(text).toContain('cachedDb');
  });

  it('shared/db/queries.ts exports typed select + upsert helpers', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'shared', 'db', 'queries.ts'), 'utf8');
    expect(text).toContain('getUserRoleByClerkId');
    expect(text).toContain('setUserRole');
    expect(text).toContain('eq');
    expect(text).toContain('onConflictDoUpdate');
    expect(text).toContain('returning');
  });

  it('shared/db/migrations/0000_initial.sql creates user_roles with RLS + auth.jwt sub policy', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'shared', 'db', 'migrations', '0000_initial.sql'),
      'utf8',
    );
    expect(text).toContain('CREATE TABLE');
    expect(text).toContain('user_roles');
    expect(text).toContain('ENABLE ROW LEVEL SECURITY');
    expect(text).toContain("auth.jwt()->>'sub'");
    expect(text).toContain('select_user_roles_own');
    expect(text).toContain('CREATE POLICY');
    // The 'super_admin' literal appears in the CHECK constraint on the
    // role column even though the admin SELECT policy is intentionally
    // deferred to Story 3.3 (avoids recursive RLS lookup).
    expect(text).toContain("'super_admin'");
  });

  it('shared/index.ts re-exports schema and queries', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'shared', 'index.ts'), 'utf8');
    expect(text).toContain("from './db/schema'");
    expect(text).toContain("from './db/queries'");
  });

  it('web/next.config.ts transpiles @{{projectNameKebab}}/shared', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'next.config.ts'), 'utf8');
    expect(text).toContain('transpilePackages');
    expect(text).toContain('@{{projectNameKebab}}/shared');
  });

  it('monolith root package.json has db:generate / db:migrate / db:studio scripts', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'package.json'), 'utf8');
    expect(text).toContain('db:generate');
    expect(text).toContain('db:migrate');
    expect(text).toContain('db:studio');
  });

  it('shared/drizzle.config.ts points at the schema and Postgres dialect', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'shared', 'drizzle.config.ts'), 'utf8');
    expect(text).toContain("schema: './db/schema.ts'");
    expect(text).toContain("dialect: 'postgresql'");
    expect(text).toContain('DATABASE_URL');
  });

  // === Story 3.1 — Clerk Billing pricing page ===

  it('current-user helper reads auth() + getDb + getUserRoleByClerkId', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'lib', 'auth', 'current-user.ts'),
      'utf8',
    );
    expect(text).toContain("import 'server-only'");
    expect(text).toContain("from '@clerk/nextjs/server'");
    expect(text).toContain('getUserRoleByClerkId');
    expect(text).toContain('getDb');
    expect(text).toContain('getCurrentUserWithRole');
    // Default to 'free' when no row exists
    expect(text).toContain("'free'");
  });

  it('billing page uses Clerk PricingTable and shows the current role', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'app', 'dashboard', 'billing', 'page.tsx'),
      'utf8',
    );
    expect(text).toContain("import { PricingTable } from '@clerk/nextjs'");
    expect(text).toContain('<PricingTable />');
    expect(text).toContain('getCurrentUserWithRole');
    expect(text).toContain('Current plan');
  });

  it('dashboard landing page links to /dashboard/billing', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'app', 'dashboard', 'page.tsx'),
      'utf8',
    );
    expect(text).toContain("from 'next/link'");
    expect(text).toContain('/dashboard/billing');
  });

  it('_env.example documents CLERK_BILLING_WEBHOOK_SIGNING_SECRET', async () => {
    const text = await readFile(join(MONOLITH_DIR, '_env.example'), 'utf8');
    expect(text).toContain('CLERK_BILLING_WEBHOOK_SIGNING_SECRET');
  });

  // === Story 3.2 — Billing webhook ===

  it('web package.json pins svix for webhook signature verification', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'package.json'), 'utf8');
    const parsed = JSON.parse(text) as { dependencies: Record<string, string> };
    expect(parsed.dependencies['svix']).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('web/lib/env-server.ts reads CLERK_BILLING_WEBHOOK_SIGNING_SECRET behind server-only guard', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'lib', 'env-server.ts'), 'utf8');
    expect(text).toContain("import 'server-only'");
    expect(text).toContain('CLERK_BILLING_WEBHOOK_SIGNING_SECRET');
    expect(text).toContain('billingWebhookSigningSecret');
    expect(text).toContain('CLERK_SECRET_KEY');
    expect(text).toContain('export const serverEnv');
  });

  it('web/lib/env.ts is browser-safe and does not reference server secrets', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'lib', 'env.ts'), 'utf8');
    expect(text).not.toContain("import 'server-only'");
    expect(text).not.toContain('CLERK_SECRET_KEY');
    expect(text).not.toContain('CLERK_BILLING_WEBHOOK_SIGNING_SECRET');
    // Only NEXT_PUBLIC_* keys allowed in the browser-safe env.
    expect(text).toContain('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
    expect(text).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(text).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  });

  it('plan-to-role.ts maps paid_tier to paid and defaults unknown to free', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'lib', 'billing', 'plan-to-role.ts'),
      'utf8',
    );
    expect(text).toContain("'paid_tier'");
    expect(text).toContain("return 'paid'");
    expect(text).toContain("'admin_tier'");
    expect(text).toContain("return 'super_admin'");
    expect(text).toContain("return 'free'");
    // Unknown plan must default to free (least privilege).
    expect(text).toContain('unknown plan');
  });

  it('event-handler.ts handles user.created + subscription.created + subscription.cancelled', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'lib', 'billing', 'event-handler.ts'),
      'utf8',
    );
    expect(text).toContain("import 'server-only'");
    expect(text).toContain("'user.created'");
    expect(text).toContain("'subscription.created'");
    expect(text).toContain("'subscription.updated'");
    expect(text).toContain("'subscription.cancelled'");
    expect(text).toContain("'subscription.deleted'");
    expect(text).toContain('setUserRole');
    expect(text).toContain('getDb');
    expect(text).toContain('planToRole');
  });

  it('event-handler downgrades cancelled subscriptions to free', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'lib', 'billing', 'event-handler.ts'),
      'utf8',
    );
    // Look for the cancelled+deleted case block setting role 'free'.
    expect(text).toMatch(/subscription\.cancelled[\s\S]*setUserRole[\s\S]*'free'/);
  });

  it('event-handler returns processed:false for unknown event types', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'lib', 'billing', 'event-handler.ts'),
      'utf8',
    );
    expect(text).toContain('processed: false');
    expect(text).toContain('default:');
  });

  it('clerk-billing route.ts reads raw body BEFORE any JSON parsing (svix requires raw HMAC body)', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'app', 'api', 'webhooks', 'clerk-billing', 'route.ts'),
      'utf8',
    );
    // Confirm req.text() appears before any req.json()
    expect(text).toContain('req.text()');
    expect(text).not.toContain('req.json()');
  });

  it('clerk-billing route.ts verifies svix signature and returns 400 on failure', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'app', 'api', 'webhooks', 'clerk-billing', 'route.ts'),
      'utf8',
    );
    expect(text).toContain("from 'svix'");
    expect(text).toContain('Webhook');
    expect(text).toContain('wh.verify');
    expect(text).toContain('svix-id');
    expect(text).toContain('svix-timestamp');
    expect(text).toContain('svix-signature');
    expect(text).toContain('status: 400');
  });

  it('clerk-billing route.ts delegates to handleBillingEvent and returns 500 on handler error', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'app', 'api', 'webhooks', 'clerk-billing', 'route.ts'),
      'utf8',
    );
    expect(text).toContain('handleBillingEvent');
    expect(text).toContain('status: 500');
  });

  it('clerk-billing route.ts does not leak internal errors in the response body', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'app', 'api', 'webhooks', 'clerk-billing', 'route.ts'),
      'utf8',
    );
    // Generic error responses only.
    expect(text).toContain("error: 'Invalid signature'");
    expect(text).toContain("error: 'Webhook processing failed'");
    // No stack trace or raw error message in the response.
    expect(text).not.toMatch(/error:\s*\(err as Error\)\.message/);
  });

  it('billing page documents that subscription management lives in Clerk UserButton', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'app', 'dashboard', 'billing', 'page.tsx'),
      'utf8',
    );
    expect(text).toContain('UserButton');
  });

  // === Story 3.3 — Three-tier RBAC ===

  it('web/lib/auth/roles.ts exports hasRole / isAdmin / isPaid with server-only guard', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'lib', 'auth', 'roles.ts'), 'utf8');
    expect(text).toContain("import 'server-only'");
    expect(text).toContain('export async function hasRole');
    expect(text).toContain('export async function isAdmin');
    expect(text).toContain('export async function isPaid');
    expect(text).toContain('getUserRoleByClerkId');
    expect(text).toContain('getDb');
    // isPaid must return true for super_admin (admins implicitly have paid access)
    expect(text).toMatch(/isPaid[\s\S]*super_admin/);
  });

  it('web/lib/auth/use-role.ts is a client hook fetching /api/me/role', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'lib', 'auth', 'use-role.ts'),
      'utf8',
    );
    expect(text).toContain("'use client'");
    expect(text).toContain("from '@clerk/nextjs'");
    expect(text).toContain('useAuth');
    expect(text).toContain("'/api/me/role'");
    expect(text).toContain('useState');
    expect(text).toContain('useEffect');
    expect(text).toContain('export function useRole');
  });

  it('/api/me/role route handler reads auth() and returns JSON', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'app', 'api', 'me', 'role', 'route.ts'),
      'utf8',
    );
    expect(text).toContain('export async function GET');
    expect(text).toContain("from '@clerk/nextjs/server'");
    expect(text).toContain('auth()');
    expect(text).toContain('status: 401');
    expect(text).toContain('role');
    expect(text).toContain('getCurrentUserWithRole');
  });

  it('mobile/lib/auth/use-role.ts queries Supabase directly via useSupabaseClient', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'mobile', 'lib', 'auth', 'use-role.ts'),
      'utf8',
    );
    expect(text).toContain("from '@clerk/clerk-expo'");
    expect(text).toContain('useSupabaseClient');
    expect(text).toContain("'user_roles'");
    expect(text).toContain('clerk_user_id');
    expect(text).toContain('export function useRole');
  });

  it('0001_rbac_helpers.sql creates is_super_admin SECURITY DEFINER function', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'shared', 'db', 'migrations', '0001_rbac_helpers.sql'),
      'utf8',
    );
    expect(text).toContain('CREATE OR REPLACE FUNCTION public.is_super_admin');
    expect(text).toContain('SECURITY DEFINER');
    expect(text).toContain('SET search_path = public');
    expect(text).toContain("auth.jwt()->>'sub'");
    expect(text).toContain("role = 'super_admin'");
    expect(text).toContain('GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated');
  });

  it('0001_rbac_helpers.sql adds the select_user_roles_admin policy using the helper', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'shared', 'db', 'migrations', '0001_rbac_helpers.sql'),
      'utf8',
    );
    expect(text).toContain('CREATE POLICY "select_user_roles_admin"');
    expect(text).toContain('public.is_super_admin()');
    expect(text).toContain('FOR SELECT');
    expect(text).toContain('TO authenticated');
  });

  // === Story 3.4 — Paywall + RoleGate ===

  it('web RoleGate is a client component using useRole + hierarchy check', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'components', 'auth', 'RoleGate.tsx'),
      'utf8',
    );
    expect(text).toContain("'use client'");
    expect(text).toContain('useRole');
    expect(text).toContain('hasRequiredRole');
    expect(text).toContain('HIERARCHY');
    // Super admin > paid > free ordering
    expect(text).toMatch(/'free'[\s\S]*'paid'[\s\S]*'super_admin'/);
    expect(text).toContain('PaywallPrompt');
    expect(text).toContain('isLoading');
  });

  it('web RoleGate renders fallback on insufficient role and default to PaywallPrompt', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'components', 'auth', 'RoleGate.tsx'),
      'utf8',
    );
    expect(text).toContain('fallback ?? <PaywallPrompt />');
  });

  it('web PaywallPrompt links to /dashboard/billing via next/link', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'components', 'auth', 'PaywallPrompt.tsx'),
      'utf8',
    );
    expect(text).toContain("from 'next/link'");
    expect(text).toContain('/dashboard/billing');
  });

  it('demo paid-feature page uses RoleGate with requiredRole="paid"', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'app', 'dashboard', 'paid-feature', 'page.tsx'),
      'utf8',
    );
    expect(text).toContain('RoleGate');
    expect(text).toContain('requiredRole="paid"');
  });

  it('mobile RoleGate uses the mobile useRole hook', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'mobile', 'components', 'auth', 'RoleGate.tsx'),
      'utf8',
    );
    expect(text).toContain('useRole');
    expect(text).toContain('PaywallPrompt');
    expect(text).toContain('HIERARCHY');
    // Mobile imports from the relative path, not an '@' alias
    expect(text).toContain("from '../../lib/auth/use-role'");
  });

  it('mobile PaywallPrompt uses expo-router Link + React Native primitives', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'mobile', 'components', 'auth', 'PaywallPrompt.tsx'),
      'utf8',
    );
    expect(text).toContain("from 'expo-router'");
    expect(text).toContain("from 'react-native'");
    expect(text).toContain('Text');
    expect(text).toContain('View');
  });

  it('hierarchy ordering is the same on web and mobile RoleGate', async () => {
    const webText = await readFile(
      join(MONOLITH_DIR, 'web', 'components', 'auth', 'RoleGate.tsx'),
      'utf8',
    );
    const mobileText = await readFile(
      join(MONOLITH_DIR, 'mobile', 'components', 'auth', 'RoleGate.tsx'),
      'utf8',
    );
    // Both files should define the same hierarchy literal.
    const pattern = /HIERARCHY[^\n]*=[^\n]*\['free',\s*'paid',\s*'super_admin'\]/;
    expect(webText).toMatch(pattern);
    expect(mobileText).toMatch(pattern);
  });

  // === Story 4.1 — Zustand stores with persistence ===

  it('web app-store is a client module using zustand + persist + createJSONStorage', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'stores', 'app-store.ts'),
      'utf8',
    );
    expect(text).toContain("'use client'");
    expect(text).toContain("from 'zustand'");
    expect(text).toContain("from 'zustand/middleware'");
    expect(text).toContain('persist');
    expect(text).toContain('createJSONStorage');
    expect(text).toContain('useAppStore');
  });

  it('web app-store returns undefined storage on the server (SSR-safe)', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'stores', 'app-store.ts'),
      'utf8',
    );
    // Guard the window reference so Next.js server components don't crash.
    expect(text).toContain("typeof window !== 'undefined'");
    expect(text).toContain('window.localStorage');
  });

  it('web app-store partialize excludes ephemeral drawerOpen from persistence', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'stores', 'app-store.ts'),
      'utf8',
    );
    expect(text).toContain('partialize');
    // The partialized object must mention theme + onboardingComplete but NOT drawerOpen.
    expect(text).toMatch(/partialize:[\s\S]*theme:[\s\S]*onboardingComplete/);
    expect(text).not.toMatch(/partialize:[\s\S]*drawerOpen/);
  });

  it('web app-store uses the projectNameKebab-app storage key token', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'stores', 'app-store.ts'),
      'utf8',
    );
    expect(text).toContain('{{projectNameKebab}}-app');
  });

  it('mobile app-store uses zustand + persist backed by react-native-mmkv', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'mobile', 'stores', 'app-store.ts'),
      'utf8',
    );
    expect(text).toContain("from 'zustand'");
    expect(text).toContain("from 'zustand/middleware'");
    expect(text).toContain("from 'react-native-mmkv'");
    expect(text).toContain('new MMKV');
    expect(text).toContain('persist');
    expect(text).toContain('createJSONStorage');
    expect(text).toContain('useAppStore');
  });

  it('mobile app-store wraps MMKV in a StateStorage adapter', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'mobile', 'stores', 'app-store.ts'),
      'utf8',
    );
    expect(text).toContain('StateStorage');
    expect(text).toContain('getItem');
    expect(text).toContain('setItem');
    expect(text).toContain('removeItem');
  });

  it('mobile app-store partialize excludes drawerOpen from persistence', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'mobile', 'stores', 'app-store.ts'),
      'utf8',
    );
    expect(text).toContain('partialize');
    expect(text).toMatch(/partialize:[\s\S]*theme:[\s\S]*onboardingComplete/);
    expect(text).not.toMatch(/partialize:[\s\S]*drawerOpen/);
  });

  it('web AppState and mobile AppState share the same slice shape', async () => {
    const webText = await readFile(
      join(MONOLITH_DIR, 'web', 'stores', 'app-store.ts'),
      'utf8',
    );
    const mobileText = await readFile(
      join(MONOLITH_DIR, 'mobile', 'stores', 'app-store.ts'),
      'utf8',
    );
    // Both files must export the same AppState shape so shared code can
    // depend on it without forking on platform.
    const fields = ['theme: Theme', 'onboardingComplete: boolean', 'drawerOpen: boolean'];
    for (const field of fields) {
      expect(webText).toContain(field);
      expect(mobileText).toContain(field);
    }
    for (const action of ['setTheme', 'completeOnboarding', 'toggleDrawer']) {
      expect(webText).toContain(action);
      expect(mobileText).toContain(action);
    }
  });

  it('web dashboard page imports OnboardingGreeting (store demo consumer)', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'app', 'dashboard', 'page.tsx'),
      'utf8',
    );
    expect(text).toContain('OnboardingGreeting');
    expect(text).toContain('@/components/shared/OnboardingGreeting');
  });

  it('web OnboardingGreeting is a client component reading useAppStore', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'components', 'shared', 'OnboardingGreeting.tsx'),
      'utf8',
    );
    expect(text).toContain("'use client'");
    expect(text).toContain('useAppStore');
    expect(text).toContain('onboardingComplete');
    expect(text).toContain('@/stores/app-store');
  });

  it('mobile home tab imports useAppStore to prove the store works', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'mobile', 'app', '(tabs)', 'index.tsx'),
      'utf8',
    );
    expect(text).toContain('useAppStore');
    expect(text).toContain('../../stores/app-store');
  });

  it('web package.json pins zustand', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'package.json'), 'utf8');
    const parsed = JSON.parse(text) as { dependencies: Record<string, string> };
    expect(parsed.dependencies['zustand']).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('mobile package.json pins zustand + react-native-mmkv', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'mobile', 'package.json'), 'utf8');
    const parsed = JSON.parse(text) as { dependencies: Record<string, string> };
    expect(parsed.dependencies['zustand']).toMatch(/^\d+\.\d+\.\d+$/);
    expect(parsed.dependencies['react-native-mmkv']).toMatch(/^\d+\.\d+\.\d+$/);
  });

  // === Story 4.2 — React Hook Form + Zod ===

  it('shared profile-form schema uses z.object and derives its type via z.infer', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'shared', 'validation', 'profile-form.ts'),
      'utf8',
    );
    expect(text).toContain("from 'zod'");
    expect(text).toContain('export const profileFormSchema');
    expect(text).toContain('z.object');
    expect(text).toContain('export type ProfileFormValues');
    expect(text).toContain('z.infer<typeof profileFormSchema>');
  });

  it('shared profile-form schema defines displayName + bio + website with validation', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'shared', 'validation', 'profile-form.ts'),
      'utf8',
    );
    expect(text).toContain('displayName');
    expect(text).toContain('.min(2');
    expect(text).toContain('.max(60');
    expect(text).toContain('bio');
    expect(text).toContain('.max(280');
    expect(text).toContain('website');
    expect(text).toContain('.url(');
  });

  it('shared/index.ts re-exports the profile-form schema', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'shared', 'index.ts'), 'utf8');
    expect(text).toContain("from './validation/profile-form'");
  });

  it('shared/package.json pins zod', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'shared', 'package.json'), 'utf8');
    const parsed = JSON.parse(text) as { dependencies: Record<string, string> };
    expect(parsed.dependencies['zod']).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('web ProfileForm is a client component using useForm + zodResolver', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'components', 'forms', 'ProfileForm.tsx'),
      'utf8',
    );
    expect(text).toContain("'use client'");
    expect(text).toContain("from 'react-hook-form'");
    expect(text).toContain("from '@hookform/resolvers/zod'");
    expect(text).toContain('useForm');
    expect(text).toContain('zodResolver(profileFormSchema)');
  });

  it('web ProfileForm imports the shared schema via the workspace package', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'components', 'forms', 'ProfileForm.tsx'),
      'utf8',
    );
    expect(text).toContain('@{{projectNameKebab}}/shared');
    expect(text).toContain('profileFormSchema');
    expect(text).toContain('ProfileFormValues');
  });

  it('web ProfileForm renders inline per-field error messages with role="alert"', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'components', 'forms', 'ProfileForm.tsx'),
      'utf8',
    );
    expect(text).toContain('role="alert"');
    expect(text).toContain('errors.displayName');
    expect(text).toContain('errors.bio');
    expect(text).toContain('errors.website');
  });

  it('web settings page renders <ProfileForm />', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'web', 'app', 'dashboard', 'settings', 'page.tsx'),
      'utf8',
    );
    expect(text).toContain("from '@/components/forms/ProfileForm'");
    expect(text).toContain('<ProfileForm />');
  });

  it('mobile ProfileForm uses Controller (RHF pattern for uncontrolled RN inputs)', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'mobile', 'components', 'forms', 'ProfileForm.tsx'),
      'utf8',
    );
    expect(text).toContain("from 'react-hook-form'");
    expect(text).toContain('Controller');
    expect(text).toContain("from 'react-native'");
    expect(text).toContain('TextInput');
  });

  it('mobile ProfileForm imports the shared schema via the workspace package', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'mobile', 'components', 'forms', 'ProfileForm.tsx'),
      'utf8',
    );
    expect(text).toContain('@{{projectNameKebab}}/shared');
    expect(text).toContain('profileFormSchema');
    expect(text).toContain('ProfileFormValues');
  });

  it('mobile settings tab renders <ProfileForm />', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'mobile', 'app', '(tabs)', 'settings.tsx'),
      'utf8',
    );
    expect(text).toContain('ProfileForm');
    expect(text).toContain('../../components/forms/ProfileForm');
  });

  it('mobile tabs layout registers the settings tab', async () => {
    const text = await readFile(
      join(MONOLITH_DIR, 'mobile', 'app', '(tabs)', '_layout.tsx'),
      'utf8',
    );
    expect(text).toContain('name="settings"');
  });

  it('web package.json pins react-hook-form, @hookform/resolvers, zod', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'web', 'package.json'), 'utf8');
    const parsed = JSON.parse(text) as { dependencies: Record<string, string> };
    expect(parsed.dependencies['react-hook-form']).toMatch(/^\d+\.\d+\.\d+$/);
    expect(parsed.dependencies['@hookform/resolvers']).toMatch(/^\d+\.\d+\.\d+$/);
    expect(parsed.dependencies['zod']).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('mobile package.json pins react-hook-form, @hookform/resolvers, zod', async () => {
    const text = await readFile(join(MONOLITH_DIR, 'mobile', 'package.json'), 'utf8');
    const parsed = JSON.parse(text) as { dependencies: Record<string, string> };
    expect(parsed.dependencies['react-hook-form']).toMatch(/^\d+\.\d+\.\d+$/);
    expect(parsed.dependencies['@hookform/resolvers']).toMatch(/^\d+\.\d+\.\d+$/);
    expect(parsed.dependencies['zod']).toMatch(/^\d+\.\d+\.\d+$/);
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
