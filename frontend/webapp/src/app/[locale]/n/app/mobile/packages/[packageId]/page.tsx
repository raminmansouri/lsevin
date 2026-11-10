import { redirectToPublicEntity } from "@/lib/seo/legacy-redirect";

// Moved to /<locale>/packages/<slug>. Checkout stays at ./checkout (private).
export const dynamic = "force-dynamic";

export default async function LegacyPackagePage({ params }: { params: Promise<{ locale: string; packageId: string }> }) {
  const { locale, packageId } = await params;
  return redirectToPublicEntity("package", locale, packageId);
}
