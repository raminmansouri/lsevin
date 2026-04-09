import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// pull from env
const filesUrl = new URL(
  process.env.NEXT_PUBLIC_FILES_URL || "http://localhost:5003"
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

  // Only use Next rewrites locally (or whenever you explicitly set BOOKING_ORIGIN)
  // In production behind Caddy, leave BOOKING_ORIGIN empty and rewrites will be disabled.
  const bookingOrigin = process.env.BOOKING_ORIGIN;

  if (!bookingOrigin) return [];

  return [
    // locale assets
    {
      source: `/:locale(${localePattern})/booking/assets/:path*`,
      destination: `${bookingOrigin}/booking/assets/:path*`,
    },
    // locale routes
    {
      source: `/:locale(${localePattern})/booking/:path*`,
      destination: `${bookingOrigin}/booking/:path*`,
    },
    // non-locale assets
    {
      source: `/booking/assets/:path*`,
      destination: `${bookingOrigin}/booking/assets/:path*`,
    },
    // non-locale routes
    {
      source: "/booking/:path*",
      destination: `${bookingOrigin}/booking/:path*`,
    },
    // roots
    {
      source: "/booking",
      destination: `${bookingOrigin}/booking/`,
    },
    {
      source: `/:locale(${localePattern})/booking`,
      destination: `${bookingOrigin}/booking/`,
    },
  ];
},
};

export default withNextIntl(nextConfig);