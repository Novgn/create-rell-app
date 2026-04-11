// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
// Mobile Supabase client for {{projectName}}.
//
// Uses Clerk's **native third-party auth** integration: the Supabase client
// is created with an `accessToken` callback that returns a Clerk session
// token. RLS policies reference `auth.jwt()->>'sub'` to match the Clerk
// user ID.
//
// Do **NOT** use the deprecated JWT-template pattern (passing a template
// name to Clerk's getToken call) — that integration path was phased out
// in April 2025.
//
// This hook returns a Supabase client bound to the currently signed-in
// Clerk user. Unlike the web counterpart, React Native has no global
// `window` so we construct the client with the minimal set of options.

import { useAuth } from '@clerk/clerk-expo';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

import { env } from '../env';

export function useSupabaseClient(): SupabaseClient {
  const { getToken } = useAuth();

  return useMemo(
    () =>
      createClient(env.supabase.url, env.supabase.anonKey, {
        async accessToken() {
          return (await getToken()) ?? null;
        },
      }),
    [getToken],
  );
}
