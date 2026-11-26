/**
 * Public URLs of the video consultation pages (docs/seo/lsevin-url-tasks.md):
 * no /n/app/mobile and no UUID. Locale-less: pass them to the i18n Link or
 * router, which add the locale. Safe on the client.
 *
 *   /consultation/doctors               the doctors a patient can book (public)
 *   /consultation/doctors/<slug>/book   booking one doctor (sign-in, noindex)
 *
 * A doctor without a slug yet (migration 0123 not applied) is linked by id;
 * the booking page then answers one permanent redirect to the slug URL.
 */
export const CONSULTATION_DOCTORS_PATH = "/consultation/doctors";

export function consultationDoctorsHref(query?: URLSearchParams | string): string {
  const search = query?.toString();
  return search ? `${CONSULTATION_DOCTORS_PATH}?${search}` : CONSULTATION_DOCTORS_PATH;
}

export function consultationBookHref(
  doctor: { id: string; slug?: string | null },
  query?: URLSearchParams | string
): string {
  const search = query?.toString();
  const path = `${CONSULTATION_DOCTORS_PATH}/${encodeURIComponent(doctor.slug || doctor.id)}/book`;
  return search ? `${path}?${search}` : path;
}

/** A page's searchParams as a query string, repeated keys kept. */
export function toQuery(params: Record<string, string | string[] | undefined>): URLSearchParams {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const v of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, v);
  }
  return query;
}
