import "server-only";

import { getTranslations } from "next-intl/server";

import { absoluteUrl } from "./alternates";
import { breadcrumbList, collectionPage, graph, type ListedItem } from "./entity-schema";
import { JsonLd } from "./json-ld";

/**
 * Breadcrumb structured data (a Google Search feature) for pages that have no
 * entity of their own: landings, search and map views. Always starts at the
 * site home; `trail` is the rest, ending with this page. With `items`, the page
 * is also described as a CollectionPage of what it lists.
 */
export async function PageBreadcrumbs({
  locale,
  trail,
  items,
  description,
}: {
  locale: string;
  trail: { name: string; path: string }[];
  items?: ListedItem[];
  description?: unknown;
}) {
  const home = (await getTranslations({ locale, namespace: "LocaleLayout" }))("title");
  const crumbs = [
    { name: home, url: absoluteUrl(locale) },
    ...trail.map((step) => ({ name: step.name, url: absoluteUrl(locale, step.path) })),
  ];
  const self = crumbs[crumbs.length - 1];
  return (
    <JsonLd
      data={graph(
        items ? collectionPage({ url: self.url, name: self.name, description, locale, items }) : null,
        breadcrumbList(crumbs)
      )}
    />
  );
}
