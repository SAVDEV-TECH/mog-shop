 import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Images configuration for external domains
  images: {
    domains: ["cdn.dummyjson.com"],
    minimumCacheTTL: 60,
    unoptimized: true,
  },

  // TypeScript configuration
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  
  // Explicitly set output to not use 'export' for Vercel deployment
  // output: 'export', // Commented out for Vercel deployment
};

export default nextConfig;
