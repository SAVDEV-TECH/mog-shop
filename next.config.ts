 import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Cloudflare Pages (static export)
   
  
  // Image Optimization (works only with `next start` or Vercel)
  images: {
    domains: ["cdn.dummyjson.com"],
    minimumCacheTTL: 60,
    unoptimized: true, // Disable optimization for static export
  },

  // TypeScript
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },

  // Optional: Enable Edge Runtime if using Cloudflare Workers
  // experimental: {
  //   runtime: "experimental-edge",
  // },
};

export default nextConfig;

