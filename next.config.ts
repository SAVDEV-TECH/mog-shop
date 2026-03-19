 import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

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
    ignoreBuildErrors: true,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withPWA(nextConfig);