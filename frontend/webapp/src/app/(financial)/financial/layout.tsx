import { privateMetadata } from "@/lib/seo/robots-policy";

import { RootDocument } from "../../root-document";

export const metadata = privateMetadata;

// The financial panel is Persian only and sits outside [locale], so it renders
// its own document (the root layout no longer does).
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RootDocument lang="fa" dir="rtl">
      {children}
    </RootDocument>
  );
}
