// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
/*
 * Security headers for {{projectName}}.
 *
 * This config ships a conservative set of protective headers that work
 * out-of-the-box with Clerk + Supabase. A full Content-Security-Policy is
 * intentionally NOT enabled here because Clerk's hosted UI (modals, captcha,
 * telemetry), Supabase Realtime's wss:// connection, and Next.js's inline
 * script bootstrap all need tailored directives that depend on your
 * deployment's exact domains.
 *
 * To enable CSP yourself, follow Clerk's official guide:
 *   https://clerk.com/docs/security/clerk-csp
 *
 * Add the CSP header to `securityHeaders` below once you've confirmed it
 * doesn't break sign-in or realtime subscriptions in your environment.
 */
import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Transpile the local workspace package so Next.js can import Drizzle
  // schema and typed queries as raw TypeScript. Without this, Next would
  // refuse to handle the `.ts` source files from `shared/`.
  transpilePackages: ['@{{projectNameKebab}}/shared'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
