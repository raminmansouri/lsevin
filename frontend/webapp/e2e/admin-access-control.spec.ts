import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { type Browser, type BrowserContext, expect, type Page, test } from "@playwright/test";
import { encode } from "next-auth/jwt";
import postgres from "postgres";

/**
 * Admin access control, end to end: the real admin screens, middleware, guards and Postgres.
 *
 *   an admin      (the ordinary `admin` role — most admins here never held superadmin) creates a role,
 *                 ticks permissions, adds a person                                  (UI, persisted, reload)
 *   limited admin sees only what the role grants, is refused everything else — by menu,
 *                 by URL, by API and by write — and loses/gains access live when the role changes
 *   edge cases    disabled admin, last role removed, customer, anonymous, bad input, server failure
 *
 * Needs E2E_BASE_URL, E2E_DATABASE_URL, E2E_AUTH_SECRET — all localhost only. Run through
 * `pnpm test:local-env --suite admin-access`. Fixtures are created and removed by the spec.
 */
const BASE = process.env.E2E_BASE_URL || "http://localhost:3140";
const DB_URL = process.env.E2E_DATABASE_URL || "";
const SECRET = process.env.E2E_AUTH_SECRET || "";
const isLocal = (value: string) => {
  try {
    return ["localhost", "127.0.0.1", "::1"].includes(new URL(value).hostname);
  } catch {
    return false;
  }
};
const RUNNABLE = Boolean(DB_URL && SECRET && isLocal(DB_URL) && isLocal(BASE));
test.skip(!RUNNABLE, "Run through `pnpm test:local-env --suite admin-access` (needs a local database and AUTH_SECRET).");

// Letters only: the Persian UI renders Latin digits as Persian ones.
const tag = `qa${Date.now().toString(36).replace(/[0-9]/g, (d) => "abcdefghij"[Number(d)])}`;
const ids = { super: randomUUID(), plain: randomUUID(), limited: randomUUID(), customer: randomUUID() };
const ROLE = `${tag} Editor`;
const sql = RUNNABLE ? postgres(DB_URL, { max: 2, prepare: false }) : null;
const created = { roleIds: [] as string[] };
let adminRoleId = "";

test.describe.configure({ mode: "serial" });

async function makeUser(id: string, label: string) {
  await sql!`insert into identity.asp_net_users (id, first_name, last_name, phone_number_country_code, user_name, normalized_user_name, email, normalized_email, email_confirmed, phone_number, phone_number_confirmed, two_factor_enabled, lockout_enabled, access_failed_count)
             values (${id}, ${label}, 'Qa', '98', ${`${tag}-${label}`}, ${`${tag}-${label}`.toUpperCase()}, ${`${tag}-${label}@example.com`}, ${`${tag}-${label}@EXAMPLE.COM`.toUpperCase()}, true, ${`9${Math.floor(Math.random() * 1e9).toString().padStart(9, "0")}`}, true, false, false, 0)`;
}

test.beforeAll(async () => {
  const s = sql!;
  adminRoleId = (await s<{ id: string }[]>`select id::text as id from identity.asp_net_roles where lower(name) = 'admin'`)[0]?.id;
  expect(adminRoleId, "identity role 'admin' must exist in the test database").toBeTruthy();
  for (const [key, label] of [["super", "super"], ["plain", "plain"], ["limited", "limited"], ["customer", "customer"]] as const) {
    await makeUser(ids[key], label);
  }
  await s`insert into identity.asp_net_user_roles (user_id, role_id) values (${ids.super}, ${adminRoleId}), (${ids.plain}, ${adminRoleId}), (${ids.limited}, ${adminRoleId})`;
});

test.afterAll(async () => {
  const s = sql;
  if (!s) return;
  const users = Object.values(ids);
  const roles = (await s<{ id: string }[]>`select id::text as id from auth.roles where name like ${`${tag}%`}`).map((r) => r.id);
  await s`delete from auth.admin_access_audit where actor_user_id in ${s(users)} or target_user_id in ${s(users)}`;
  await s`delete from auth.user_roles where user_id in ${s(users)}`;
  if (roles.length) await s`delete from auth.roles where id in ${s(roles)}`;
  await s`delete from auth.staff_members where user_id in ${s(users)}`;
  await s`delete from identity.asp_net_user_roles where user_id in ${s(users)}`;
  await s`delete from identity.asp_net_users where id in ${s(users)}`;
  await s.end();
});

/** A browser context signed in with a minted session (the real middleware and guards read it). */
async function signedIn(browser: Browser, userId: string, roles: string[]): Promise<BrowserContext> {
  const context = await browser.newContext({ baseURL: BASE });
  const now = Date.now();
  const value = await encode({
    secret: SECRET,
    salt: "authjs.session-token",
    token: { sub: userId, user: { id: userId, roles, accessToken: "e2e", accessTokenExpires: now + 3_600_000, refreshTokenExpires: now + 7_200_000 } } as never,
  });
  await context.addCookies([{ name: "authjs.session-token", value, domain: new URL(BASE).hostname, path: "/", httpOnly: true, sameSite: "Lax" }]);
  return context;
}

/** Dev servers compile a page on first request; retry the navigation, not the assertion. */
async function open(page: Page, path: string) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 180_000 });
      // 503 is the gate failing CLOSED while the dev server compiles its internal endpoint for the
      // first time. That is correct behaviour, not a verdict about access: wait and ask again.
      if (response?.status() === 503) throw new Error("admin access service not ready yet");
      // A cold dev server answers 404 for routes it has not finished indexing. None of the pages
      // this spec opens is ever legitimately a 404, so treat it the same way: wait, ask again.
      if (response?.status() === 404) throw new Error("dev server has not indexed this route yet");
      await hydrated(page);
      return;
    } catch (error) {
      if (attempt >= 10) throw error;
      await page.waitForTimeout(5_000);
    }
  }
}

/**
 * Set one area's level in the permission matrix and save, then confirm the result in the database.
 * Re-entrant on purpose: a dev server can hot-reload the page between the click and the save and
 * silently drop the unsaved selection, so the whole step is retried until the database agrees.
 */
async function savePermission(page: Page, id: string, key: string, level: "none" | "view" | "manage", expected: Record<string, string>) {
  const sorted = (o: Record<string, string>) => JSON.stringify(Object.entries(o).sort(([x], [y]) => x.localeCompare(y)));
  await expect(async () => {
    await hydrated(page);
    await page.getByTestId(`perm-${key}-${level}`).click();
    await expect(page.getByTestId(`perm-${key}-${level}`)).toHaveAttribute("aria-checked", "true");
    const save = page.getByTestId("matrix-save");
    if (await save.isEnabled()) await save.click();
    await expect.poll(async () => sorted(await grantsOf(id)), { timeout: 20_000 }).toBe(sorted(expected));
  }).toPass({ timeout: 180_000 });
  await expect(page.getByTestId("matrix-unsaved")).toHaveCount(0);
}

/**
 * The panels are server-rendered first; a click before React attaches its handlers lands on inert
 * HTML. Wait until every panel on the page reports it is live.
 */
async function hydrated(page: Page) {
  await expect(page.locator('[data-hydrated="false"]')).toHaveCount(0, { timeout: 120_000 });
}

async function shot(page: Page, name: string, testInfo: import("@playwright/test").TestInfo) {
  const file = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await testInfo.attach(name, { path: file, contentType: "image/png" });
}

const toast = (page: Page, text: string | RegExp) => page.locator("[data-sonner-toast]", { hasText: text }).first();
const sidebar = (page: Page) => page.locator('[data-sidebar="content"]');
const roleId = async () => (await sql!<{ id: string }[]>`select id::text as id from auth.roles where name = ${ROLE}`)[0]?.id;
const grantsOf = async (id: string) =>
  Object.fromEntries((await sql!<{ k: string; l: string }[]>`select resource_key as k, level as l from auth.role_admin_permissions where role_id = ${id}`).map((r) => [r.k, r.l]));

/** Console/page errors during a journey are failures (a hydration crash would hide behind passing asserts). */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

test.describe("full-access admins are unaffected @critical", () => {
  test("an unmanaged admin still opens every area, including access control", async ({ browser }, testInfo) => {
    const context = await signedIn(browser, ids.plain, ["admin"]);
    const page = await context.newPage();
    const errors = watchErrors(page);
    await open(page, "/en/admin/access-control");
    await expect(page.getByRole("heading", { name: "Access control", level: 1 })).toBeVisible();
    await expect(page).toHaveURL(/\/en\/admin\/access-control$/);
    // The whole menu is there.
    await expect(sidebar(page)).toContainText("Bookings");
    await expect(sidebar(page)).toContainText("Platform");
    // …and it lists them as a full-access admin that can be limited.
    await expect(page.getByTestId(`unmanaged-row-${ids.plain}`)).toBeVisible();
    await shot(page, "01-unmanaged-admin-full-menu", testInfo);
    expect(errors).toEqual([]);
    await context.close();
  });
});

test.describe("super admin manages roles @critical", () => {
  test("creates a role, ticks permissions, saves, and they survive a reload", async ({ browser }, testInfo) => {
    const context = await signedIn(browser, ids.super, ["admin"]);
    const page = await context.newPage();
    const errors = watchErrors(page);
    await open(page, "/en/admin/access-control");
    await expect(page.getByTestId("roles-panel")).toBeVisible();

    await page.getByLabel("Role name").fill(ROLE);
    await page.getByLabel("Description (optional)").fill("Edits the website content");
    await shot(page, "02-new-role-filled", testInfo);
    await page.getByRole("button", { name: "Create role" }).click();
    await expect(page.getByTestId("role-title")).toHaveText(ROLE);
    await expect(page).toHaveURL(/\/admin\/access-control\/roles\/[0-9a-f-]{36}$/);
    created.roleIds.push((await roleId())!);

    // Grant Editorial: manage; Dashboard: view.
    await page.getByTestId("perm-editorial-manage").click();
    await page.getByTestId("perm-dashboard-view").click();
    await expect(page.getByTestId("perm-editorial-manage")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("matrix-unsaved")).toBeVisible();
    await expect(page.getByTestId("matrix-summary")).toContainText("2 areas granted");
    await shot(page, "03-permissions-picked", testInfo);

    await page.getByTestId("matrix-save").click();
    await expect(toast(page, "Permissions saved.")).toBeVisible();
    await expect(page.getByTestId("matrix-unsaved")).toHaveCount(0);
    expect(await grantsOf((await roleId())!)).toEqual({ editorial: "manage", dashboard: "view" });

    await page.reload();
    await hydrated(page);
    await expect(page.getByTestId("perm-editorial-manage")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("perm-dashboard-view")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("perm-bookings-none")).toHaveAttribute("aria-checked", "true");
    await shot(page, "04-permissions-after-reload", testInfo);
    expect(errors).toEqual([]);
    await context.close();
  });

  test("the privileged and not-yet-wired areas cannot be ticked", async ({ browser }) => {
    const context = await signedIn(browser, ids.super, ["admin"]);
    const page = await context.newPage();
    await open(page, `/en/admin/access-control/roles/${await roleId()}`);
    for (const key of ["access-control", "identity-users", "table-browser"]) {
      await expect(page.getByTestId(`perm-${key}-manage`)).toBeDisabled();
    }
    await expect(page.getByTestId("perm-tours-platform-manage")).toBeDisabled();
    await expect(page.getByTestId("matrix-row-bookings")).toBeVisible();
    await context.close();
  });

  test("adds a person by searching for them; the membership persists", async ({ browser }, testInfo) => {
    const context = await signedIn(browser, ids.super, ["admin"]);
    const page = await context.newPage();
    await open(page, `/en/admin/access-control/roles/${await roleId()}`);
    await page.getByLabel("Search people").fill(`${tag}-limited`);
    await page.getByTestId(`member-add-${ids.limited}`).click();
    await expect(toast(page, "Member added.")).toBeVisible();
    await expect(page.getByTestId("members-list")).toContainText(`${tag}-limited`);
    await shot(page, "05-member-added", testInfo);

    await page.reload();
    await hydrated(page);
    await expect(page.getByTestId("members-list")).toContainText(`${tag}-limited`);
    const staff = await sql!`select status, admin_role_auto_granted as auto from auth.staff_members where user_id = ${ids.limited}`;
    expect(staff).toHaveLength(1);
    expect(staff[0]).toMatchObject({ status: "active", auto: false }); // they already had the admin role
    await context.close();
  });

  test("rejects bad input with specific messages and keeps the Create button honest", async ({ browser }) => {
    const context = await signedIn(browser, ids.super, ["admin"]);
    const page = await context.newPage();
    await open(page, "/en/admin/access-control");
    const create = page.getByRole("button", { name: "Create role" });
    await expect(create).toBeDisabled();
    await page.getByLabel("Role name").fill("x");
    await expect(create).toBeDisabled();

    await page.getByLabel("Role name").fill("Admin");
    await create.click();
    await expect(toast(page, "built-in role name")).toBeVisible();

    await page.getByLabel("Role name").fill(ROLE.toUpperCase());
    await create.click();
    await expect(toast(page, "already exists")).toBeVisible();
    expect(await sql!`select 1 from auth.roles where lower(name) = ${ROLE.toLowerCase()}`).toHaveLength(1);
    await context.close();
  });

  test("a failing server is reported as a server problem and nothing is saved", async ({ browser }) => {
    const context = await signedIn(browser, ids.super, ["admin"]);
    const page = await context.newPage();
    const id = (await roleId())!;
    await open(page, `/en/admin/access-control/roles/${id}`);
    await page.getByTestId("perm-bookings-view").click();
    await page.route("**/admin/access-control/roles/**", (route) =>
      route.request().method() === "POST" ? route.fulfill({ status: 500, body: "boom" }) : route.continue()
    );
    await page.getByTestId("matrix-save").click();
    await expect(toast(page, "Something went wrong on our side")).toBeVisible();
    await expect(page.getByText(/boom|Internal|stack/i)).toHaveCount(0);
    expect(await grantsOf(id)).toEqual({ editorial: "manage", dashboard: "view" });
    await page.unroute("**/admin/access-control/roles/**");
    await context.close();
  });
});

test.describe("limited admin @critical", () => {
  test("sees only the granted areas in the menu and can use them", async ({ browser }, testInfo) => {
    const context = await signedIn(browser, ids.limited, ["admin"]);
    const page = await context.newPage();
    const errors = watchErrors(page);
    await open(page, "/en/admin/editorial");
    await expect(page).toHaveURL(/\/en\/admin\/editorial$/);
    await expect(page.getByRole("heading", { name: "Editorial" }).first()).toBeVisible();
    await expect(sidebar(page)).toContainText("Content");
    for (const hidden of ["Bookings", "Finance", "Platform", "Customers", "Marketing"]) {
      await expect(sidebar(page)).not.toContainText(hidden);
    }
    await shot(page, "06-limited-admin-menu", testInfo);
    expect(errors).toEqual([]);
    await context.close();
  });

  test("is sent to the no-access page for everything else, including the privileged screens", async ({ browser }, testInfo) => {
    const context = await signedIn(browser, ids.limited, ["admin"]);
    const page = await context.newPage();
    const errors = watchErrors(page);
    for (const denied of ["/en/admin/bookings", "/en/admin/access-control", "/en/admin/identity-users", "/en/admin", "/en/admin/shop/orders", "/en/admin/bookings/add"]) {
      await open(page, denied);
      await expect(page, denied).toHaveURL(/\/en\/admin\/access-denied/);
      await expect(page.getByTestId("access-denied")).toBeVisible();
    }
    // The landing page offers exactly what they may open — and nothing else.
    await expect(page.getByTestId("denied-allowed")).toContainText("Editorial");
    await expect(page.getByTestId("denied-allowed")).not.toContainText("Bookings");
    await shot(page, "07-access-denied", testInfo);
    expect(errors).toEqual([]);
    await context.close();
  });

  test("API routes and writes are refused too, not just pages", async ({ browser }) => {
    const context = await signedIn(browser, ids.limited, ["admin"]);
    const api = context.request;
    // Not granted -> 403 (and never 401: they are signed in).
    for (const path of ["/api/admin/bookings", "/api/admin/bookings/00000000-0000-4000-8000-000000000000"]) {
      expect((await api.get(path)).status(), path).toBe(403);
    }
    // Table-driven / personal-data lookups are unlimited-only, even though they hold a grant.
    for (const path of ["/api/admin/users/search?q=ab", "/api/admin/lazy-search-options", "/api/admin/relation-options"]) {
      expect((await api.get(path)).status(), path).toBe(403);
    }
    // A write to a page they may only VIEW is refused before it reaches the action (dashboard: view).
    const write = await api.post("/en/admin/dashboard", { data: {}, headers: { "next-action": "00" } });
    expect(write.status()).toBe(403);
    // Anonymous is still 401, not 403.
    const anon = await (await signedInAnonymous(browser)).request.get("/api/admin/bookings");
    expect(anon.status()).toBe(401);
    await context.close();
  });

  test("server actions are checked by id: another area's action cannot be replayed through a page they hold", async ({ browser }) => {
    const limitedCtx = await signedIn(browser, ids.limited, ["admin"]);
    const page = await limitedCtx.newPage();
    // Warm the pages whose actions we need, so the dev server has put them in its action manifest.
    await open(page, "/en/admin/editorial");
    await open(page, "/en/admin/editorial/pages/about-us"); // the page editor is what imports saveSitePageAction
    const manager = await signedIn(browser, ids.super, ["admin"]);
    const managerPage = await manager.newPage();
    await open(managerPage, `/en/admin/access-control/roles/${await roleId()}`);

    const idOf = async (exportedName: string, onlyUnder: string) => {
      let found: string | undefined;
      await expect
        .poll(() => {
          const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), ".next/server/server-reference-manifest.json"), "utf8"));
          found = Object.entries<{ exportedName?: string; workers?: unknown }>(manifest.node).find(
            ([, a]) => {
              // `workers` is an array in this Next version and an object keyed by page in others.
              const pages = Array.isArray(a.workers) ? (a.workers as string[]) : Object.keys((a.workers ?? {}) as object);
              return a.exportedName === exportedName && pages.length > 0 && pages.every((w) => w.includes(onlyUnder));
            }
          )?.[0];
          return Boolean(found);
        }, { timeout: 120_000, intervals: [2_000] })
        .toBe(true);
      return found!;
    };
    const rolesAction = await idOf("createRoleAction", "/admin/access-control");
    const ownAction = await idOf("saveSitePageAction", "/admin/editorial");

    const post = (action?: string) =>
      limitedCtx.request.post("/en/admin/editorial", {
        headers: { "content-type": "text/plain;charset=UTF-8", ...(action ? { "next-action": action } : {}) },
        data: "[]",
      });

    // The limited admin may manage `editorial`, so this POST to /admin/editorial passes the URL gate…
    // …but the action it names belongs to access control: refused.
    expect((await post(rolesAction)).status()).toBe(403);
    // Their own area's action gets past the gate (what it then does is the action's business).
    const own = await post(ownAction);
    expect([403, 503]).not.toContain(own.status());
    // An id nobody can account for, and a write that names no action at all: refused.
    expect((await post("deadbeefdeadbeefdeadbeefdeadbeefdeadbeef")).status()).toBe(403);
    expect((await post()).status()).toBe(403);
    // …and nothing was created by the replay.
    expect(await sql!`select 1 from auth.roles where name like ${`${tag}%`} and name <> ${ROLE}`).toHaveLength(0);
    await manager.close();
    await limitedCtx.close();
  });

  test("a grant takes effect without signing in again, and so does taking it away", async ({ browser }) => {
    const superCtx = await signedIn(browser, ids.super, ["admin"]);
    const limitedCtx = await signedIn(browser, ids.limited, ["admin"]);
    const admin = await superCtx.newPage();
    const limited = await limitedCtx.newPage();
    const id = (await roleId())!;

    await open(limited, "/en/admin/support/tags");
    await expect(limited).toHaveURL(/access-denied/);

    const base = { editorial: "manage", dashboard: "view" };
    await open(admin, `/en/admin/access-control/roles/${id}`);
    await savePermission(admin, id, "support.tags", "view", { ...base, "support.tags": "view" });

    // The Edge and server caches are a few seconds; poll rather than sleep.
    await expect
      .poll(async () => {
        await open(limited, "/en/admin/support/tags");
        return new URL(limited.url()).pathname;
      }, { timeout: 60_000, intervals: [2_000] })
      .toBe("/en/admin/support/tags");

    await savePermission(admin, id, "support.tags", "none", base);
    await expect
      .poll(async () => {
        await open(limited, "/en/admin/support/tags");
        return new URL(limited.url()).pathname;
      }, { timeout: 60_000, intervals: [2_000] })
      .toBe("/en/admin/access-denied");
    await superCtx.close();
    await limitedCtx.close();
  });

  test("a disabled admin loses the admin area entirely, even though their token still says admin", async ({ browser }, testInfo) => {
    const superCtx = await signedIn(browser, ids.super, ["admin"]);
    const limitedCtx = await signedIn(browser, ids.limited, ["admin"]);
    const admin = await superCtx.newPage();
    const limited = await limitedCtx.newPage();

    await open(admin, "/en/admin/access-control");
    const row = admin.getByTestId(`staff-row-${ids.limited}`);
    await expect(row).toContainText("Active");
    await row.getByRole("button", { name: "Disable" }).click();
    await expect(row).toContainText("Disabled");
    await shot(admin, "08-staff-disabled", testInfo);

    // Asserted at the HTTP level: a disabled admin is sent to the public home page, and that page is
    // not what this test is about (it is slow to compile on a dev server). The gate's answer is.
    await expect
      .poll(async () => {
        const response = await limitedCtx.request.get("/en/admin/editorial", { maxRedirects: 0 });
        return `${response.status()} ${new URL(response.headers()["location"] ?? "http://x/none", BASE).pathname}`;
      }, { timeout: 60_000, intervals: [2_000] })
      .toBe("307 /en/");

    await row.getByRole("button", { name: "Enable" }).click();
    await expect(row).toContainText("Active");
    await expect
      .poll(async () => (await limitedCtx.request.get("/en/admin/editorial", { maxRedirects: 0 })).status(), {
        timeout: 60_000,
        intervals: [2_000],
      })
      .toBe(200);
    await superCtx.close();
    await limitedCtx.close();
  });

  test("removing the last role leaves them with no access — they do not become unlimited", async ({ browser }, testInfo) => {
    const superCtx = await signedIn(browser, ids.super, ["admin"]);
    const limitedCtx = await signedIn(browser, ids.limited, ["admin"]);
    const admin = await superCtx.newPage();
    const limited = await limitedCtx.newPage();

    await open(admin, `/en/admin/access-control/roles/${await roleId()}`);
    await admin.getByTestId(`member-remove-${ids.limited}`).click();
    await expect(toast(admin, "Member removed.")).toBeVisible();
    await expect(admin.getByTestId("members-empty")).toBeVisible();

    await expect
      .poll(async () => {
        await open(limited, "/en/admin/dashboard");
        return new URL(limited.url()).pathname;
      }, { timeout: 60_000, intervals: [2_000] })
      .toBe("/en/admin/access-denied");
    await expect(limited.getByTestId("denied-none")).toBeVisible();
    await shot(limited, "09-no-roles-no-access", testInfo);
    expect(await sql!`select 1 from auth.staff_members where user_id = ${ids.limited}`).toHaveLength(1);
    await superCtx.close();
    await limitedCtx.close();
  });

  test("releasing them to full access restores everything", async ({ browser }) => {
    const superCtx = await signedIn(browser, ids.super, ["admin"]);
    const limitedCtx = await signedIn(browser, ids.limited, ["admin"]);
    const admin = await superCtx.newPage();
    const limited = await limitedCtx.newPage();

    await open(admin, "/en/admin/access-control");
    const row = admin.getByTestId(`staff-row-${ids.limited}`);
    await row.getByTestId(`release-${ids.limited}`).click();
    await admin.getByTestId(`release-${ids.limited}-confirm`).click();
    await expect(admin.getByTestId(`unmanaged-row-${ids.limited}`)).toBeVisible();

    await expect
      .poll(async () => {
        await open(limited, "/en/admin/access-control");
        return new URL(limited.url()).pathname;
      }, { timeout: 60_000, intervals: [2_000] })
      .toBe("/en/admin/access-control");
    await superCtx.close();
    await limitedCtx.close();
  });
});

test.describe("everyone else", () => {
  test("a customer is sent home from the admin area", async ({ browser }) => {
    const context = await signedIn(browser, ids.customer, ["user"]);
    const response = await context.request.get("/en/admin/access-control", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(new URL(response.headers()["location"], BASE).pathname).toBe("/en/");
    // …and the API refuses them too.
    expect((await context.request.get("/api/admin/bookings")).status()).toBe(403);
    await context.close();
  });

  test("an anonymous visitor is sent to sign in", async ({ browser }) => {
    const context = await signedInAnonymous(browser);
    const page = await context.newPage();
    await open(page, "/en/admin/access-control");
    await expect(page).toHaveURL(/sign-in/);
    await context.close();
  });
});

test.describe("presentation", () => {
  test("the screens work on a phone without horizontal scrolling", async ({ browser }, testInfo) => {
    const context = await signedIn(browser, ids.super, ["admin"]);
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, `/en/admin/access-control/roles/${await roleId()}`);
    await expect(page.getByTestId("permission-matrix")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await shot(page, "10-phone-width", testInfo);
    await context.close();
  });

  test("Persian renders right-to-left with translated labels", async ({ browser }, testInfo) => {
    const context = await signedIn(browser, ids.super, ["admin"]);
    const page = await context.newPage();
    await open(page, "/fa/admin/access-control");
    await expect(page.getByRole("heading", { name: "مدیریت دسترسی‌ها", level: 1 })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByText("MISSING_MESSAGE")).toHaveCount(0);
    await shot(page, "11-persian-rtl", testInfo);
    await context.close();
  });

  test("the role can be deleted; it disappears and its permissions go with it", async ({ browser }) => {
    const context = await signedIn(browser, ids.super, ["admin"]);
    const page = await context.newPage();
    const id = (await roleId())!;
    await open(page, `/en/admin/access-control/roles/${id}`);
    await page.getByTestId("delete-role").click();
    await page.getByTestId("delete-role-confirm").click();
    await expect(toast(page, "Role deleted.")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/access-control$/);
    // The list itself is not rendered when this was the last role (empty state), so assert on the name.
    await expect(page.getByText(ROLE, { exact: false })).toHaveCount(0);
    expect(await sql!`select 1 from auth.role_admin_permissions where role_id = ${id}`).toHaveLength(0);
    expect(await sql!`select 1 from auth.roles where id = ${id}`).toHaveLength(0);
    await context.close();
  });
});

async function signedInAnonymous(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({ baseURL: BASE });
}
