import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Transpile the local workspace package so Next.js can import Drizzle
  // schema and typed queries as raw TypeScript. Without this, Next would
  // refuse to handle the `.ts` source files from `shared/`.
  transpilePackages: ['@{{projectNameKebab}}/shared'],
};

export default nextConfig;
