import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { currentActor } from "@/features/tours/server/platform/access";
import { listWishlist } from "@/features/stays/server/catalog";
import { WishlistView } from "@/features/stays/ui/wishlist-view";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function StayWishlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const actor = await currentActor();
  const t = await getTranslations({ locale, namespace: "StayApp.wishlist" });
  if (!actor.userId) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center" data-testid="stay-wishlist-signin">
        <h1 className="text-xl font-bold">{t("signIn")}</h1>
        <Link href={`/sign-in?redirectTo=${encodeURIComponent(`/${locale}/stays/wishlist`)}`} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-5 text-sm font-bold text-white">
          {t("title")}
        </Link>
      </div>
    );
  }
  const items = await listWishlist(actor.userId, contentLocaleFor(locale));
  return <WishlistView items={items} />;
}
