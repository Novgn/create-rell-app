// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
import 'server-only';

// Server-side Supabase client for {{projectName}}.
//
// Uses Clerk's **native third-party auth** integration: the Supabase client
// is created with an `accessToken` callback that returns a Clerk session
// token from `@clerk/nextjs/server.auth()`. Supabase's RLS policies
// reference `auth.jwt()->>'sub'` to match the Clerk user ID.
//
// Do **NOT** use the deprecated JWT-template pattern (passing a template
// name to Clerk's getToken call) — that integration path was phased out
// in April 2025.
//
// The `server-only` import at the top of this module hard-errors if it is
// ever bundled into a client component. That prevents leaking the service
// role key (or any other server-only value) to the browser.

import { auth } from '@clerk/nextjs/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from '../env';

/**
 * Create a server-side Supabase client tied to the current request's Clerk
 * session. Call this inside route handlers, server actions, or server
 * components — never share the returned client across requests, because the
 * `accessToken` callback closes over `auth()` from the current request scope.
 */
export function createServerSupabaseClient(): SupabaseClient {
  return createClient(env.supabase.url, env.supabase.anonKey, {
    async accessToken() {
      return (await (await auth()).getToken()) ?? null;
    },
  });
}
