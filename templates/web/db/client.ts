// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
// Drizzle client factory for {{projectName}}.
//
// This module reads `DATABASE_URL` directly from `process.env` rather than
// going through `lib/env-server.ts` so that Drizzle Kit (which imports the
// schema + this file at generate/migrate time) doesn't crash when the
// other server-only secrets aren't set. `getDb()` is the only place the
// env var is read.
//
// The `postgres` client is **lazy-initialized**: we don't read
// `DATABASE_URL` or open a connection until the first time `db` is
// touched. That matters because many auth-only dev flows don't need a
// DB connection, and a module-load throw would break `next build` on
// machines without the env set. Once created, the connection pool is
// memoized — subsequent reads of `db` reuse the same pool.

import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

type SchemaType = typeof schema;
type DrizzleDb = PostgresJsDatabase<SchemaType>;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url === '') {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local at the ' +
        'project root and fill in the Supabase direct-connection string ' +
        '(see the README).',
    );
  }
  return url;
}

let cachedDb: DrizzleDb | null = null;

/**
 * Lazy-initialized Drizzle client. The connection pool is created on the
 * first call and reused thereafter. Importing this module does not touch
 * the database.
 *
 * `prepare: false` disables prepared statements for compatibility with
 * Supabase pgbouncer in transaction mode, which does not support
 * session-level state.
 */
export function getDb(): DrizzleDb {
  if (cachedDb === null) {
    const queryClient = postgres(getDatabaseUrl(), { prepare: false });
    cachedDb = drizzle(queryClient, { schema });
  }
  return cachedDb;
}

export type DbClient = DrizzleDb;
