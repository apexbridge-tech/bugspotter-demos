import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable experimental features for subdomain routing
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Allow images from various sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
