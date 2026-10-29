import { getLocale } from "next-intl/server";

import FavoritesPageClient from "./FavoritesPageClient";
import { getFavoritesPageDataAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const data = await getFavoritesPageDataAction(await getLocale());

  return <FavoritesPageClient initialData={data} />;
}
