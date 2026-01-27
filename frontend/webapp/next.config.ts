import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: [
      "./messages/en.json",
      "./messages/fa.json",
      "./messages/tr.json",
      "./messages/ar.json",
      "./messages/es.json",
      "./messages/ku.json",
      "./messages/de.json",
      "./messages/fr.json",
    ],
  },
});

// Use environment variable directly instead of importing from @/config
const filesUrl = new URL(
  process.env.NEXT_PUBLIC_FILES_URL || "http://localhost:3000"
);

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    authInterrupts: true,
    cacheComponents: true,
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  reactCompiler: true,
  transpilePackages: ["mapbox-gl", "react-map-gl"],
  turbopack: {
    root: process.cwd(),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: filesUrl.protocol.slice(0, -1) as "http" | "https",
        hostname: filesUrl.hostname,
        port: filesUrl.port,
        pathname: "/files/**",
      },
    ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default withNextIntl(nextConfig);
