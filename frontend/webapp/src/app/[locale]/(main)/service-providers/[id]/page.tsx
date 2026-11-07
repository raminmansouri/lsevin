import { redirectToPublicEntity } from "@/lib/seo/legacy-redirect";

// The old marketing template; the provider lives at /<locale>/providers/<slug>.
export const dynamic = "force-dynamic";

export default async function LegacyServiceProviderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return redirectToPublicEntity("provider", locale, id);
}
