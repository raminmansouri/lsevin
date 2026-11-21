import type { Metadata } from "next";

// App-only screens inherit this rule. Public pages served from this tree
// explicitly opt in through their own metadata at the canonical URL.
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
