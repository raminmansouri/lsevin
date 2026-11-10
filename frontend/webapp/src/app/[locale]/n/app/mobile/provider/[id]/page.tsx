import { redirectToPublicEntity } from "@/lib/seo/legacy-redirect";

// Moved to /<locale>/providers/<slug>.
export const dynamic = "force-dynamic";

export default async function LegacyProviderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return redirectToPublicEntity("provider", locale, id);
}
