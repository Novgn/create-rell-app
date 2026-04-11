// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
// @{{projectNameKebab}}/shared — barrel export.
//
// This package holds code used by both `web/` and `mobile/`:
//   - Drizzle schema + typed queries (Story 2.4)
//   - RBAC role constants (also Story 2.4 via schema.ROLES)
//   - Shared TypeScript types are inferred from the schema
//
// Web and mobile both import via `@{{projectNameKebab}}/shared` thanks to
// the npm workspaces setup in the root package.json. Next.js picks up the
// raw TypeScript via `transpilePackages` in web/next.config.ts.

export * from './db/schema';
export * from './db/queries';
export { getDb, type DbClient } from './db/client';

// Shared Zod schemas — added in Story 4.2. Both web and mobile derive their
// form types from these schemas, and any server route accepting the same
// payloads should validate against them too.
export * from './validation/profile-form';
