import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce the self-contained server used by the production Docker image.
  output: "standalone",
  experimental: {
    // Keep builds predictable on constrained CI hosts.
    cpus: 1,
    workerThreads: false,
    webpackBuildWorker: false,
  },
  typedRoutes: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
