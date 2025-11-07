 import type { NextConfig } from "next";
// import withPWAInit from "@ducanh2912/next-pwa";

// const withPWA = withPWAInit({
//   dest: "public",
//   cacheOnFrontEndNav: true,
//   aggressiveFrontEndNavCaching: true,
//   reloadOnOnline: true,
//   swcMinify: true,
//   disable: process.env.NODE_ENV === "development",
//   workboxOptions: {
//     disableDevLogs: true,
//   },
//   // fallbacks: {
//   //   document: "/offline", // Optional: if you create an offline page
//   // },
// });

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

export default nextConfig