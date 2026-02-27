import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// pull from env
const filesUrl = new URL(
  process.env.NEXT_PUBLIC_FILES_URL || "http://localhost:3000"
);

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

  turbopack: {
    root: process.cwd(),
  },

  transpilePackages: ["mapbox-gl", "react-map-gl"],

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

  async rewrites() {
  const localePattern = "en|fa|tr|ar|es|ku|de|fr";

  // use service name in docker, localhost in local dev
  const bookingOrigin =
    process.env.BOOKING_ORIGIN ?? "http://localhost:4002";

  return [
    { source: "/booking", destination: `${bookingOrigin}/booking/` },
    { source: "/booking/:path*", destination: `${bookingOrigin}/booking/:path*` },

    { source: `/:locale(${localePattern})/booking`, destination: `${bookingOrigin}/booking/` },
    { source: `/:locale(${localePattern})/booking/:path*`, destination: `${bookingOrigin}/booking/:path*` },
  ];
},
};

export default withNextIntl(nextConfig);