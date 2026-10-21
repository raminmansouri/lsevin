import { setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { isIntroCompleted, listTaxonomy } from "@/features/tours/server/actions/customer/state";
import { currentActor, ownerKey } from "@/features/tours/server/platform/access";
import {
  listDestinations,
  listEditorialModules,
  listOffers,
  listRecentViews,
  searchTours,
  wishlistIds,
} from "@/features/tours/server/platform/catalog";
import { ToursHome } from "@/features/tours/ui/customer/home/tours-home";
import { redirect } from "@/i18n/navigation";

/**
 * Tours Home (C-009..C-020). First eligible visit goes through the intro
 * (C-002); Recently Viewed is the first module whenever the visitor has
 * history, otherwise a discovery module takes its place.
 */
export default async function ToursHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const actor = await currentActor();
  if (!(await isIntroCompleted(actor))) {
    redirect({ href: "/tours/intro", locale });
  }
  const content = contentLocaleFor(locale);
  const owner = await ownerKey(actor);
  const [recent, destinations, offers, modules, taxonomy, saved] = await Promise.all([
    owner ? listRecentViews(owner, content, 10) : Promise.resolve([]),
    listDestinations(content, { limit: 12 }),
    listOffers(content, 8),
    listEditorialModules(content),
    listTaxonomy(locale),
    actor.userId ? wishlistIds(actor.userId) : Promise.resolve([] as string[]),
  ]);
  const discovery = recent.length === 0 ? (await searchTours({ sort: "popularity", pageSize: 8 }, content)).items : [];

  return (
    <ToursHome
      recent={recent}
      discovery={discovery}
      destinations={destinations}
      offers={offers}
      modules={modules}
      categories={taxonomy.category ?? []}
      savedIds={saved}
    />
  );
}
