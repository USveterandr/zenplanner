import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // For Cloudflare Pages deployment
  // Use 'standalone' for Vercel/Docker, 'export' for static hosting
  output: process.env.BUILD_TARGET === 'cloudflare' ? undefined : 'standalone',

  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,

  // Required for Cloudflare
  images: {
    unoptimized: process.env.BUILD_TARGET === 'cloudflare' ? true : false,
  },

  // Experimental features for edge runtime
  experimental: {
    // Enable for Cloudflare Workers
    // runtime = 'edge'
  },
};

export default nextConfig;
