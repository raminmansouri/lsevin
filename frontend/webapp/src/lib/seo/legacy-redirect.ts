import 'server-only';

import { notFound, permanentRedirect } from 'next/navigation';

import { type PublicEntityKind, resolvePublicEntity } from '@/lib/seo/public-slugs';

const SECTION: Record<PublicEntityKind, string> = {
  provider: 'providers',
  specialty: 'specialties',
  service: 'services',
  specialist: 'specialists',
  package: 'packages',
};

/** The public path of a catalog entity: `/providers/<slug>`, falling back to the id while it has no slug. */
export function publicEntityPath(kind: PublicEntityKind, segment: string, suffix = ''): string {
  return `/${SECTION[kind]}/${segment}${suffix}`;
}

/**
 * Old `/n/app/mobile/...` and `/type`, `/service-providers` addresses: one
 * permanent redirect to the entity's final public URL (no chain through the
 * UUID form). Unknown or inactive entities stay a 404, as before.
 */
export async function redirectToPublicEntity(
  kind: PublicEntityKind,
  locale: string,
  identifier: string,
  suffix = '',
): Promise<never> {
  const ref = await resolvePublicEntity(kind, identifier);
  if (!ref) notFound();
  permanentRedirect(`/${locale}${publicEntityPath(kind, ref.slug ?? ref.id, suffix)}`);
}
