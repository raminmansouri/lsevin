import { redirectToPublicEntity } from "@/lib/seo/legacy-redirect";

// The old marketing template; the provider type lives at /<locale>/specialties/<slug>.
export const dynamic = "force-dynamic";

export default async function LegacyProviderTypePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return redirectToPublicEntity("specialty", locale, id);
}
