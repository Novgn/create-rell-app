// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
// Drizzle client factory for {{projectName}}.
//
// IMPORTANT: this module is for Node contexts only — migration scripts,
// Drizzle Kit, or Expo Router API routes / edge functions. Do NOT import
// it from React Native screens. Mobile screens should talk to Supabase
// through the `useSupabaseClient` hook in `lib/supabase/client.ts`,
// which goes over HTTPS and goes through RLS.
//
// The `postgres` client is **lazy-initialized**: we don't read
// `DATABASE_URL` or open a connection until the first time `db` is
// touched. That matters because mobile bundles never need it — only the
// migration tooling does. Once created, the connection pool is memoized
// so subsequent reads reuse the same pool.

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
      'DATABASE_URL is not set. Export it in the shell running Drizzle Kit, ' +
        'or pass it via a .env file that your tooling loads (see the README).',
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
