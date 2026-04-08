// Drizzle client factory for {{projectName}}.
//
// `shared/` can't import from `web/lib/env.ts` or `mobile/lib/env.ts`
// directly — shared is platform-neutral and must read its own env. We
// inline a minimal validator here instead of pulling in a heavy
// env-validation library.
//
// The `postgres` client below uses a single shared connection pool at
// module load time. Importing this file twice in the same process reuses
// the same pool. Avoid creating ad-hoc `postgres(...)` instances in
// application code — use the exported `db` singleton.

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url === '') {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local at the monolith ' +
        'root and fill in the Supabase direct-connection string (see the README).',
    );
  }
  return url;
}

// Single shared postgres connection pool. `prepare: false` disables
// prepared statements for compatibility with Supabase pgbouncer in
// transaction mode, which does not support session-level state.
const queryClient = postgres(getDatabaseUrl(), { prepare: false });

export const db = drizzle(queryClient, { schema });
export type DbClient = typeof db;
