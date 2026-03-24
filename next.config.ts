 import withPWAInit from "next-pwa";

// @ts-ignore - next-pwa types not yet compatible with Next.js 16
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  // Turbopack config (required for Next.js 16)
  turbopack: {},

  // Images configuration for external domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.dummyjson.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com", // ✅ added
        pathname: "/**",
      },
    ],
    minimumCacheTTL: 60,
    unoptimized: true,
  },

  // TypeScript configuration
  typescript: {
    tsconfigPath: "./tsconfig.json",
    ignoreBuildErrors: true,
  },
};

// @ts-ignore
export default withPWA(nextConfig);