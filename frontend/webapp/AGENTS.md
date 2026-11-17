# Rules for AI agents working in `frontend/webapp`

These are in addition to the repository-level rules (`CLAUDE.md` at the repo root).

## Admin pages, menus and actions MUST be permission-aware

The admin panel has role-based access control (`src/lib/admin/access`, managed at
`/admin/access-control`). A *limited admin* may only open and change the areas their roles grant.
Anything you add under `/admin` must take part, or limited admins either cannot use it or — worse —
can use it without having been granted it.

Read `src/lib/admin/access/README.md` first. The short version:

1. **A new admin page needs a sidebar row.** Add it to `src/features/shared/config/admin-nav.ts`.
   That row is the permission resource (`/admin/shop/orders` → `shop.orders`). Never add an admin page
   that is reachable only by typing its URL.
2. **Regenerate the manifest** after adding, moving or deleting an admin `page.tsx` or
   `/api/admin/**/route.ts`: `pnpm admin-access:manifest`, and commit
   `src/lib/admin/access/manifest.generated.ts`. `resolver.test.ts` fails when it is stale.
3. **Guard every server action and every `/api/admin/**` handler with the resource**:
   * `await assertAdmin("shop.orders", "manage")` — actions (use `"view"` for page renders)
   * `await requireApiAdmin("bookings", "view")` — route handlers
   * `adminMay(ctx, "categories")` — when you return a result object instead of throwing
   * A guard with **no resource** admits unlimited admins only. Use that for anything that must never
     be delegated (and say why in a comment: `requireApiAdmin() /* unlimited admins only: … */`).
   Never write `roles.includes("admin")`, `UserRole.Admin` checks or `session.user.roles` tests to
   decide admin access — a limited admin carries the `admin` token role. Use the guards above.
4. **Never trust the menu or the middleware alone.** Hiding a link and gating a URL are conveniences;
   the guard inside the action/handler is the boundary (an action id is callable without its page).
5. **Money, personal data, or anything that changes who may do what** is sensitive: add its prefix to
   `SENSITIVE_PREFIXES` (`catalog.ts`), and keep destructive/ledger operations on unlimited-only
   guards unless the task explicitly says otherwise.
6. **Backend admin routes** (`src/API/LSevin.Api`, `…/admin/<segment>`): add the segment to
   `AdminAccessPolicy.ResourceFor` in `src/API/LSevin.Api/Middleware/AdminAccess/`, with a test in
   `tests/shared/LSevin.UnitTests/Middlewares/AdminAccessTests.cs`. An unmapped admin route is refused
   for limited admins.
7. If you cannot wire an area's server-side checks now, add its prefix to
   `NOT_YET_GRANTABLE_PREFIXES` (`policy.ts`) so it cannot be granted until it is — do not leave a
   grant that silently does nothing.
8. **Tests:** keep `src/lib/admin/access/*.test.ts` green (they fail on a stale manifest, an unknown
   resource name in a guard, or a resource-less `requireApiAdmin()` in `/api/admin`), and add a case to
   `e2e/admin-access-control.spec.ts` when you add a guarded area.

The same rule applies to `lsevin-portal` and to any other surface that exposes admin data: decide who
may use it, write the guard, write the test — in the same change.
