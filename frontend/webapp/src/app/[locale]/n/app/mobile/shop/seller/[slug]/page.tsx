import { permanentRedirect } from "next/navigation";

export default async function LegacySellerPage({ params }: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  permanentRedirect(`/${locale}/shop/seller/${encodeURIComponent(slug)}`);
}
