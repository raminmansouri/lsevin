import type { Metadata } from "next";

// Keep these at the narrowest server layout boundary. Public entity pages must
// never inherit the policies of adjacent account or search routes.
export const privateMetadata = {
  robots: { index: false, follow: false },
} satisfies Metadata;

export const searchMetadata = {
  robots: { index: false, follow: true },
} satisfies Metadata;
