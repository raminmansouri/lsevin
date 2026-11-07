/**
 * Public URLs (docs/seo/lsevin-url-tasks.md): `/<locale>/<section>/<slug>`, no
 * `/n/app/mobile`. Private screens (profile, bookings, cart, checkout, orders,
 * search, ...) keep their `/n/app/mobile/...` paths.
 *
 * `toPublicPath` maps an old mobile path (with or without its query) to the
 * public one and returns any other path unchanged. Safe on the client.
 */
const MOBILE = '/n/app/mobile';

const RULES: [RegExp, string][] = [
  [/^\/service\/([^/?#]+)\/gallery(?=$|[?#])/, '/services/$1/gallery'],
  [/^\/service\/([^/?#]+)(?=$|[?#])/, '/services/$1'],
  [/^\/provider\/([^/?#]+)(?=$|[?#])/, '/providers/$1'],
  [/^\/specialist\/([^/?#]+)(?=$|[?#])/, '/specialists/$1'],
  [/^\/packages\/([^/?#]+)(?=$|[?#])/, '/packages/$1'],
  [/^\/shop\/product\/([^/?#]+)(?=$|[?#])/, '/products/$1'],
  [/^\/shop\/category\/([^/?#]+)(?=$|[?#])/, '/shop/$1'],
  [/^\/map-discovery(?=$|[?#])/, '/map'],
  [/^\/(explore|categories|offers|featured|packages|providers|shop)(?=$|[?#])/, '/$1'],
];

export type PublicEntity = 'provider' | 'service' | 'specialist' | 'package' | 'specialty';

const ENTITY_SECTION: Record<PublicEntity, string> = {
  provider: '/providers/',
  service: '/services/',
  specialist: '/specialists/',
  package: '/packages/',
  specialty: '/specialties/',
};

/**
 * Link to a catalog entity's public page: by slug, or by id when the data has
 * no slug (the page then redirects the id to the slug once).
 */
export function entityPath(kind: PublicEntity, entity: { slug?: string | null; id: string }): string {
  return ENTITY_SECTION[kind] + encodeURIComponent(entity.slug || entity.id);
}

// Optional origin and locale in front of the mobile prefix, as admins type links.
const PREFIX = /^((?:https?:\/\/[^/?#]+)?(?:\/[a-z]{2})?)\/n\/app\/mobile(\/.*)$/;

export function toPublicPath(path: string): string {
  const match = PREFIX.exec(path);
  if (!match) return path;
  const [, head, rest] = match;
  for (const [pattern, replacement] of RULES) {
    if (pattern.test(rest)) return head + rest.replace(pattern, replacement);
  }
  return path;
}
