# Admin access control

Who may open and change what in `/admin`. Read this before adding an admin page, a menu entry,
a server action or an `/api/admin/**` route.

## The model

| Person | Access |
|---|---|
| identity `superadmin` | Everything, always. Never narrowed. |
| identity `admin`, **not** in `auth.staff_members` | Everything (today's behaviour — nobody lost access when this shipped). |
| identity `admin`, in `auth.staff_members`, `active` | Only what their **custom roles** grant. No role = no access. |
| identity `admin`, in `auth.staff_members`, `disabled` | Nothing, even while an old JWT still says `admin`. |
| anyone else | Nothing. |

A limited admin **still carries the identity `admin` role**, because the .NET backend authorizes
its admin endpoints by that role. What narrows them is this layer, enforced by the Next.js app.

A *permission* is a `(resource, level)` pair. A resource is one admin area — a row of the admin
sidebar, e.g. `bookings`, `shop.orders`, `finance.currencies`. A level is `view` (open and read)
or `manage` (also change; includes `view`).

Roles live in `auth.roles` / `auth.user_roles` (custom roles have `is_system = false`);
permissions in `auth.role_admin_permissions`. The management UI is `/admin/access-control`.

## Never grantable

* `access-control`, `identity-users`, `table-browser` — holding any of these is holding everything.
* Areas listed in `NOT_YET_GRANTABLE_PREFIXES` (`policy.ts`) — their server-side checks are not
  connected to roles yet, so a grant would silently do nothing.

## How a request is checked

1. **Middleware** (`middleware.ts` → `edge.ts`). For a plain `admin` token it asks
   `/api/internal/admin-access` (cached 5 s) and `decideAdminRequest()` maps the URL to a resource
   with `resolver.ts`. `GET` needs `view`; anything else — a server action is a POST to its page —
   needs `manage`. A database failure is a **503**, never "let them in".
2. **Guards** (the real boundary — middleware cannot see which action an action id belongs to):
   * server actions / server components: `assertAdmin("shop.orders", "manage")`
   * route handlers: `requireApiAdmin("bookings", "view")`
   * non-throwing: `adminMay(ctx, "categories")`
   * With **no resource** they admit unlimited admins only. That is deliberate: a guard written
     before this existed refuses limited admins instead of silently admitting them.
   * `ctx.roles` / `auth.roles` have `admin`/`superadmin` removed for a limited admin, so older code
     that tests `roles.includes("admin")` fails closed too.
3. **Sidebar / ⌘K** are filtered with the same `can()` (`admin-nav-filter.ts`).

Access is cached per process for 10 s (`ACCESS_CACHE_TTL_MS`); a change made on this pod is live
immediately, on another pod/site within that window.

## When you add an admin page

Nothing to register — but do these:

1. Put the page under `src/app/[locale]/(admin)/admin/…` and add its **sidebar row** in
   `src/features/shared/config/admin-nav.ts` (that row *is* the permission resource).
   A page without a row still works for unlimited admins; limited admins are denied until someone
   grants it, and it appears in the matrix flagged "Not in menu".
2. Run `pnpm admin-access:manifest` and commit `manifest.generated.ts`. (`pnpm build` runs it; the
   unit test `resolver.test.ts` fails if it is stale.)
3. Guard every server action and `/api/admin/**` handler **with the resource** — see above. The
   unit test fails if a guard names a resource that does not exist, or if an `/api/admin` handler
   calls `requireApiAdmin()` without a resource and without saying why it is unlimited-only.
4. If the page's actions are not wired yet, add its prefix to `NOT_YET_GRANTABLE_PREFIXES`.
5. Money, personal data or anything that can lock people out? Add its prefix to
   `SENSITIVE_PREFIXES` in `catalog.ts` so the matrix flags it.

## Migrating an area (removing it from `NOT_YET_GRANTABLE_PREFIXES`)

Replace each `assertAdmin()` / `getAdminContext().isAdmin` in the area with
`assertAdmin("<resource>", "<level>")` / `adminMay(ctx, "<resource>")`, make sure pages that call a
guard in render use `"view"`, then delete the prefix and add a test.

## Known limits

* Server actions that never had a Next-side guard (most .NET-backed modules authorize in the
  backend only) are protected at the **route** level. A limited admin who replays another area's
  action id, or calls the backend directly with their own token, is not stopped by this layer.
  Closing it needs per-action guards and/or backend permission checks.
* Cross-pod/site propagation is up to `ACCESS_CACHE_TTL_MS` (+ replication lag for site A/B).
