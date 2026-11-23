import { searchMetadata } from "@/lib/seo/robots-policy";

// Every mobile-app URL is a duplicate or app-only view. Keep its links crawlable.
export const metadata = searchMetadata;

export default function AppOnlyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
