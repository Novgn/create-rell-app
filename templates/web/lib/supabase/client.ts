// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
'use client';

// Browser-side Supabase client for {{projectName}}.
//
// Uses Clerk's **native third-party auth** integration: the Supabase client
// is created with an `accessToken` callback that returns a Clerk session
// token. Supabase's RLS policies reference `auth.jwt()->>'sub'` to match
// the Clerk user ID.
//
// Do **NOT** use the deprecated JWT-template pattern (passing a template
// name to Clerk's getToken call) — that integration path was phased out in
// April 2025. The callback form below is the supported integration going
// forward.
//
// This module is a client component ('use client' directive) because it
// depends on Clerk's `useSession()` hook. Never import it from a server
// component; use `./server.ts` instead.

import { useSession } from '@clerk/nextjs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

import { env } from '../env';

/**
 * Memoized browser Supabase client bound to the current Clerk session.
 *
 * The Supabase client is created once per session and re-uses the same
 * `accessToken` callback — every outgoing request pulls a fresh Clerk token,
 * so RLS policies see a valid `sub` claim even after the session refreshes.
 */
export function useSupabaseClient(): SupabaseClient {
  const { session } = useSession();

  return useMemo(
    () =>
      createClient(env.supabase.url, env.supabase.anonKey, {
        async accessToken() {
          return (await session?.getToken()) ?? null;
        },
      }),
    [session],
  );
}
