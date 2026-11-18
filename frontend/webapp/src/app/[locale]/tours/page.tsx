import { setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { isIntroCompleted, listTaxonomy } from "@/features/tours/server/actions/customer/state";
import { currentActor, ownerKey } from "@/features/tours/server/platform/access";
import {
  listBestSelling,
  listDestinations,
  listMostViewed,
  listEditorialModules,
  listOffers,
  listRecentViews,
  searchTours,
  wishlistIds,
  type RankedTour,
} from "@/features/tours/server/platform/catalog";
import { ToursHome } from "@/features/tours/ui/customer/home/tours-home";
import { redirect } from "@/i18n/navigation";
import { PageFaq } from "@/features/site-content/components/faq-section";

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
  // Rankings are extras: if they fail (e.g. migration 0116 not applied yet) the rest of the page still renders.
  const ranking = (load: Promise<RankedTour[]>) =>
    load.catch((err) => {
      console.error("[tours] home ranking unavailable", err);
      return [] as RankedTour[];
    });
  const [recent, destinations, offers, modules, taxonomy, saved, mostViewed, bestSellingMonth, bestSellingAll] = await Promise.all([
    owner ? listRecentViews(owner, content, 10) : Promise.resolve([]),
    listDestinations(content, { limit: 12 }),
    listOffers(content, 8),
    listEditorialModules(content),
    listTaxonomy(locale),
    actor.userId ? wishlistIds(actor.userId) : Promise.resolve([] as string[]),
    ranking(listMostViewed(content, 4)),
    ranking(listBestSelling(content, { sinceDays: 30, limit: 4 })),
    ranking(listBestSelling(content, { limit: 4 })),
  ]);
  // Suggested tours always show; Recently Viewed, when there is history, sits above them.
  const discovery = (await searchTours({ sort: "popularity", pageSize: 8 }, content)).items;

  return (
    <>
      <ToursHome
        recent={recent}
        discovery={discovery}
        destinations={destinations}
        offers={offers}
        modules={modules}
        categories={taxonomy.category ?? []}
        savedIds={saved}
        rankings={{ mostViewed, bestSellingMonth, bestSellingAll }}
      />
      <PageFaq target={{ scope: "app", entityKey: "tours" }} locale={locale} />
    </>
  );
}
