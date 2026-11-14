import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Isolate local production verification from an already-running dev server.
  distDir: process.env.FLARE_PREVIEW === '1' ? '.next-preview' : '.next',
  reactStrictMode: true,
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
