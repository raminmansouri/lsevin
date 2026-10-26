import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { currentActor } from "@/features/tours/server/platform/access";
import { cardsByIds, wishlistIds } from "@/features/tours/server/platform/catalog";
import { WishlistView } from "@/features/tours/ui/customer/wishlist-view";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TourApp.wishlist" });
  return { title: t("title") };
}

/** Wishlist (C-104): synced for signed-in customers, device-local for guests. */
export default async function WishlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const actor = await currentActor();
  const cards = actor.userId ? await cardsByIds(await wishlistIds(actor.userId), contentLocaleFor(locale)) : null;
  return <WishlistView serverCards={cards} />;
}
