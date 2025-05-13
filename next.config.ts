import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["cdn.dummyjson.com"], 
    minimumCacheTTL: 60, // Cache images for 60 seconds// allow external image URLs from this domain
  },
  typescript: {
    tsconfigPath: "./tsconfig.json"
  }
};

export default nextConfig;

