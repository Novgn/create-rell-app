import type { Config } from 'drizzle-kit';

// Drizzle Kit config for {{projectName}}. Points at the local schema and
// outputs migration SQL to `db/migrations/`. Drizzle Kit is a dev-time
// tool — it runs locally or in CI, never at application startup.
export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  verbose: true,
  strict: true,
} satisfies Config;
