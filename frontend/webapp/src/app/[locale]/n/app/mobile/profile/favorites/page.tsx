import FavoritesPageClient from "./FavoritesPageClient";
import { getFavoritesPageDataAction } from "./actions";

export default async function FavoritesPage() {
  const data = await getFavoritesPageDataAction("en");

  return <FavoritesPageClient initialData={data} />;
}
