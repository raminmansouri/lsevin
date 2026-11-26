import { permanentRedirect } from "next/navigation";

import { consultationDoctorsHref, toQuery } from "@/features/consultation/lib/paths";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Old list URL. next.config.ts redirects it before it gets here; this is the
 * fallback, so the page can never render at the old address.
 */
export default async function LegacyConsultationDoctorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  permanentRedirect(`/${locale}${consultationDoctorsHref(toQuery(query))}`);
}
