// Browser-safe environment variables for {{projectName}} (web).
//
// This module is imported by BOTH client and server components. It may
// only reference `NEXT_PUBLIC_*` variables — Next.js statically replaces
// those at build time, so they're accessible in the browser bundle.
//
// Server-only secrets live in `./env-server.ts`, which imports `'server-only'`
// and throws if bundled into the browser. When you add a new secret, put
// it there — NOT here.

function requiredPublic(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local and fill in the value.`,
    );
  }
  return value;
}

export const env = {
  clerk: {
    publishableKey: requiredPublic('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
  },
  supabase: {
    url: requiredPublic('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requiredPublic('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  },
} as const;
