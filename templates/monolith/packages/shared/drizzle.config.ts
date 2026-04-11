// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
import type { Config } from 'drizzle-kit';

// Drizzle Kit config for {{projectName}}. Points at the shared schema and
// outputs migration SQL to `db/migrations/`. Drizzle Kit is a dev-time
// tool — it runs locally or in CI, never at application startup.
export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  // Ensure generated SQL is idempotent where possible.
  verbose: true,
  strict: true,
} satisfies Config;
