/**
 * The route that answers an old, locale-less catalog link with one permanent
 * redirect to its slug URL, or null for any other path. Edge-safe (middleware).
 *
 *   /n/app/mobile/provider/<id>        -> /n/app/mobile/provider/<id>
 *   /service-providers/<id>            -> /service-providers/<id>
 *   /providers/<uuid>                  -> /n/app/mobile/provider/<uuid>
 *
 * The caller prefixes the default locale. Slug paths without a locale are not
 * matched: the intl middleware's single locale redirect already reaches them.
 */
const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

const OLD = /^\/(?:n\/app\/mobile\/(?:(?:provider|specialist)\/[^/]+|service\/[^/]+(?:\/gallery)?|packages\/[^/]+)|service-providers\/[^/]+|type\/[^/]+)$/;

const NEW_WITH_UUID = new RegExp(`^/(providers|services|specialists|packages)/(${UUID})(/gallery)?$`);

const LEGACY_SECTION: Record<string, string> = {
  providers: "provider",
  services: "service",
  specialists: "specialist",
  packages: "packages",
};

export function legacyEntityRoute(pathname: string): string | null {
  if (OLD.test(pathname)) return pathname;
  const match = NEW_WITH_UUID.exec(pathname);
  if (!match) return null;
  const [, section, id, gallery = ""] = match;
  if (gallery && section !== "services") return null;
  return `/n/app/mobile/${LEGACY_SECTION[section]}/${id}${gallery}`;
}
