import { redirectToPublicEntity } from "@/lib/seo/legacy-redirect";

// Moved to /<locale>/specialists/<slug>.
export const dynamic = "force-dynamic";

export default async function LegacySpecialistPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return redirectToPublicEntity("specialist", locale, id);
}
