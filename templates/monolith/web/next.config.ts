import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow importing TypeScript source from the `shared` workspace without a build step.
  // Story 2.4 wires Drizzle + shared schema — until then this is a forward-looking hook.
  transpilePackages: ['@{{projectNameKebab}}/shared'],
};

export default nextConfig;
