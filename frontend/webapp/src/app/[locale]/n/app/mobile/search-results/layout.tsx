import { SponsoredPlacementSlot } from "@/features/sponsered-slider/components/sponsored-placement-slot";

/**
 * The search-results page itself is a client component (it reads the query
 * string and fetches on the client), so it cannot host a server-rendered ad
 * slot. This layout is the seam: the results render as before and the
 * `search_results` placement is appended underneath them, without the page
 * file having to change at all.
 */
export default async function SearchResultsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      {children}
      <SponsoredPlacementSlot locale={locale} placement="search_results" />
    </>
  );
}
