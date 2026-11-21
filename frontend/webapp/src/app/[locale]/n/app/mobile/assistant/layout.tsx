import { appOnlyMetadata } from "@/lib/seo/robots-policy";

export const metadata = appOnlyMetadata;

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return children;
}
