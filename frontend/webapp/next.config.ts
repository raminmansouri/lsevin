import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// pull from env
const filesUrl = new URL(
  process.env.NEXT_PUBLIC_FILES_URL || "http://localhost:5000"
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
  
   typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",

  // Next compresses with gzip by default. Caddy sits in front of it with
  // `encode zstd gzip` (deployments/docker/Caddyfile.server) but will not
  // re-compress a response that already carries a Content-Encoding, so every
  // HTML, JS, CSS and RSC response was going out as gzip while only the .NET
  // API's responses — which arrive uncompressed — got zstd. Handing Caddy the
  // raw bytes lets it pick the best encoding the browser offers.
  compress: false,

  experimental: {
    authInterrupts: true,
    // NOTE: switched from `cacheComponents` to `useCache` for the production build.
    // cacheComponents (PPR) makes static prerender strict — any request-data access
    // without a Suspense boundary is a fatal build error (e.g. next-intl getLocale in
    // the root layout, and most [locale] pages). `useCache` keeps every `"use cache"`
    // directive working while letting request-driven pages render dynamically.
    useCache: true,
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

  // "sponsered-slider" was the canonical admin URL for this section, spelled wrong.
  // The correct spelling is canonical now; the old one is a permanent redirect so
  // existing bookmarks and the browser history of anyone who used the admin keep
  // working. Both the bare and the locale-prefixed form are covered, because the
  // intl middleware only adds the prefix on a plain page request.
  async redirects() {
    return [
      {
        source: "/admin/sponsered-slider/:path*",
        destination: "/admin/sponsored-slider/:path*",
        permanent: true,
      },
      {
        source: "/:locale/admin/sponsered-slider/:path*",
        destination: "/:locale/admin/sponsored-slider/:path*",
        permanent: true,
      },
    ];
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