import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Story 2.4 will add `transpilePackages: ['@{{projectNameKebab}}/shared']`
  // once the shared workspace actually exports code that web imports
  // (Drizzle schema, typed queries). Leaving it out for now avoids a
  // dangling dependency on an empty package.
};

export default nextConfig;
