import { redirectToPublicEntity } from "@/lib/seo/legacy-redirect";

// Moved to /<locale>/services/<slug>.
export const dynamic = "force-dynamic";

export default async function LegacyServicePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return redirectToPublicEntity("service", locale, id);
}
