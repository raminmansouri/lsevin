import { privateMetadata } from "@/lib/seo/robots-policy";

export const metadata = privateMetadata;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
