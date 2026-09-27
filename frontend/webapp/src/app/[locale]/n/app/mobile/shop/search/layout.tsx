import { searchMetadata } from "@/lib/seo/robots-policy";

export const metadata = searchMetadata;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
