/**
 * The pure rules of admin access control. No I/O, no framework imports — this module is
 * bundled into the Edge middleware as well as the Node server, and it is unit-tested directly.
 *
 * See README.md in this folder for the whole model.
 */

export type AccessLevel = "view" | "manage";

/**
 * What a signed-in person may do in the admin panel.
 *
 *  - `unlimited`  superadmin, or an admin nobody has put under access management yet.
 *  - `limited`    a managed admin: only the listed resources, at the listed level.
 *  - `none`       not an admin at all, or a managed admin whose access was revoked.
 */
export type AdminAccess =
  | { kind: "unlimited"; reason: "superadmin" | "admin" }
  | { kind: "limited"; grants: Readonly<Record<string, AccessLevel>> }
  | { kind: "none"; reason: "not-admin" | "disabled" };

/**
 * Resources that can never be granted to a custom role, because holding them is the same as
 * holding everything:
 *  - `access-control`  edits roles — a limited admin could grant themselves anything.
 *  - `identity-users`  assigns identity roles (`admin`, `superadmin`) and edits accounts.
 *  - `table-browser`   raw CRUD over every table, including auth.* and the ledgers.
 */
export const UNLIMITED_ONLY_RESOURCES: ReadonlySet<string> = new Set([
  "access-control",
  "identity-users",
  "table-browser",
]);

/**
 * Areas whose server-side guards have not been taught about access management yet. Their pages
 * would open for a limited admin but the actions and queries behind them still insist on an
 * unlimited admin, so a grant would silently do nothing. Until each is migrated they cannot be
 * granted, and the permission screen says so. Remove a prefix here when its guards call
 * `assertAdmin(resource, level)` — see README.md, "Migrating an area".
 */
export const NOT_YET_GRANTABLE_PREFIXES: readonly string[] = ["tours-platform", "tours", "tour-gatherings", "stays"];

export function isPendingMigration(resource: string): boolean {
  return NOT_YET_GRANTABLE_PREFIXES.some((p) => resource === p || resource.startsWith(`${p}.`));
}

/**
 * Read-only pickers every admin form leans on (relation selects, user search, notifications).
 * They are not an area people are granted on their own: any managed admin who holds at least one
 * `view` may call them for `view`, and nobody gets them for `manage`.
 */
export const SHARED_LOOKUPS = "shared-lookups";

/** Reachable by every admin, so a denied person has somewhere to land. */
export const ALWAYS_ALLOWED_PAGES: readonly string[] = ["/admin/access-denied"];

/** Resource key given to a route nothing in the manifest explains. Never grantable. */
export const UNCLASSIFIED = "unclassified";

/** `manage` includes `view`. */
export function levelSatisfies(granted: AccessLevel, required: AccessLevel): boolean {
  return granted === "manage" || required === "view";
}

export function isGrantable(resource: string): boolean {
  return (
    resource !== UNCLASSIFIED &&
    resource !== SHARED_LOOKUPS &&
    !UNLIMITED_ONLY_RESOURCES.has(resource) &&
    !isPendingMigration(resource)
  );
}

/** Does the person hold at least `level` on `prefix` or anything beneath it (`shop` -> `shop.orders`)? */
export function canArea(access: AdminAccess, prefix: string, level: AccessLevel = "view"): boolean {
  if (access.kind === "unlimited") return true;
  if (access.kind === "none") return false;
  return Object.entries(access.grants).some(
    ([key, granted]) =>
      (key === prefix || key.startsWith(`${prefix}.`)) && isGrantable(key) && levelSatisfies(granted, level)
  );
}

export function can(
  access: AdminAccess,
  resource: string,
  level: AccessLevel = "view"
): boolean {
  switch (access.kind) {
    case "unlimited":
      return true;
    case "none":
      return false;
    case "limited": {
      if (resource === SHARED_LOOKUPS) {
        return level === "view" && Object.keys(access.grants).length > 0;
      }
      if (!isGrantable(resource)) return false;
      const granted = access.grants[resource];
      return granted !== undefined && levelSatisfies(granted, level);
    }
  }
}

/** True for a person who can reach the admin area at all (even if only one page of it). */
export function hasAnyAdminAccess(access: AdminAccess): boolean {
  return access.kind === "unlimited" || (access.kind === "limited" && Object.keys(access.grants).length > 0);
}

/**
 * What a request is trying to do. A page render and a read-only fetch are `view`; anything that
 * can change state — a server action is always a POST — needs `manage`.
 */
export function levelForMethod(method: string | undefined | null): AccessLevel {
  const m = (method ?? "GET").toUpperCase();
  return m === "GET" || m === "HEAD" || m === "OPTIONS" ? "view" : "manage";
}

/** Only these shapes may be stored; anything else coming from a form is rejected. */
export function isAccessLevel(value: unknown): value is AccessLevel {
  return value === "view" || value === "manage";
}

/**
 * Decide an access from what the database says about one person. Kept pure so every branch of
 * the model is covered by a unit test without a database.
 */
export function deriveAccess(input: {
  jwtRoles: readonly string[];
  staffStatus: "active" | "disabled" | null;
  grants: ReadonlyArray<{ resourceKey: string; level: string }>;
}): AdminAccess {
  const roles = input.jwtRoles.map((r) => String(r).trim().toLowerCase());
  if (roles.includes("superadmin")) return { kind: "unlimited", reason: "superadmin" };
  if (!roles.includes("admin")) return { kind: "none", reason: "not-admin" };
  if (input.staffStatus === null) return { kind: "unlimited", reason: "admin" };
  if (input.staffStatus === "disabled") return { kind: "none", reason: "disabled" };

  const grants: Record<string, AccessLevel> = {};
  for (const { resourceKey, level } of input.grants) {
    if (!isAccessLevel(level)) continue;
    // Union across roles: `manage` beats `view`.
    if (grants[resourceKey] !== "manage") grants[resourceKey] = level;
  }
  return { kind: "limited", grants };
}
