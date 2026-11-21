import { appOnlyMetadata } from "@/lib/seo/robots-policy";

export const metadata = appOnlyMetadata;

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
