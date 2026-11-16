import fs from "node:fs";
import path from "node:path";

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearEdgeAccessCache } from "./edge";
import { enforceAdminAccess } from "./gate";
import type { AdminAccess } from "./policy";

/**
 * The middleware gate, with the Node server's answer faked. This is the layer a limited admin
 * meets first — and the one that once failed to run at all because the repository has two
 * middleware files — so every outcome is pinned here, independent of any browser.
 */
const limited: AdminAccess = { kind: "limited", grants: { editorial: "manage", dashboard: "view" } };

const fetchMock = vi.fn();
beforeEach(() => {
  clearEdgeAccessCache();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const answer = (access: AdminAccess) =>
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ access }) });

const run = (path: string, opts: { method?: string; roles?: string[]; userId?: string } = {}) =>
  enforceAdminAccess({
    request: new NextRequest(`http://localhost:3140/en${path}`, { method: opts.method ?? "GET", headers: { cookie: "authjs.session-token=x" } }),
    userId: opts.userId ?? `u-${Math.random()}`,
    roles: opts.roles ?? ["admin"],
    pathnameWithoutLocale: path,
    localePrefix: "/en",
  });

describe("enforceAdminAccess", () => {
  it("never narrows a super admin, and does not even ask the server", async () => {
    expect(await run("/admin/access-control", { roles: ["superadmin", "admin"] })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ignores everything that is not the admin area", async () => {
    expect(await run("/profile")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lets an unlimited admin through", async () => {
    answer({ kind: "unlimited", reason: "admin" });
    expect(await run("/admin/bookings")).toBeNull();
  });

  it("lets a limited admin open what they hold", async () => {
    answer(limited);
    expect(await run("/admin/editorial")).toBeNull();
    expect(await run("/admin/dashboard")).toBeNull();
  });

  it("redirects a limited admin from a page they do not hold to the no-access page, remembering where they went", async () => {
    answer(limited);
    const response = await run("/admin/bookings");
    expect(response?.status).toBe(307);
    const location = new URL(response!.headers.get("location")!);
    expect(location.pathname).toBe("/en/admin/access-denied");
    expect(location.searchParams.get("from")).toBe("/admin/bookings");
  });

  it("refuses a write to a page they may only view with a 403 — not a redirect", async () => {
    answer(limited);
    const response = await run("/admin/dashboard", { method: "POST" });
    expect(response?.status).toBe(403);
    expect(response?.headers.get("location")).toBeNull();
  });

  it("refuses the privileged screens even when a stale row for them exists", async () => {
    answer({ kind: "limited", grants: { "access-control": "manage", "identity-users": "manage" } });
    expect((await run("/admin/access-control"))?.status).toBe(307);
    expect((await run("/admin/identity-users/abc/update"))?.status).toBe(307);
    expect((await run("/admin"))?.status).toBe(307);
  });

  it("sends a revoked admin home, as if they were any visitor", async () => {
    answer({ kind: "none", reason: "disabled" });
    const response = await run("/admin/editorial");
    expect(response?.status).toBe(307);
    expect(new URL(response!.headers.get("location")!).pathname).toBe("/en/");
  });

  it("answers 503 — never 'allow' — when the access service cannot be reached", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));
    const response = await run("/admin/editorial");
    expect(response?.status).toBe(503);
    expect(response?.headers.get("retry-after")).toBe("5");
    expect(fetchMock).toHaveBeenCalledTimes(2); // one retry, then give up
  });

  it("survives one transient failure (a cold start) without bothering the admin", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("The operation was aborted"))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access: limited }) });
    expect(await run("/admin/editorial")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("a retried failure never turns into access for a page the person does not hold", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access: limited }) });
    expect((await run("/admin/bookings"))?.status).toBe(307);
  });

  it("answers 503 for a non-OK or malformed reply, too", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
    expect((await run("/admin/editorial"))?.status).toBe(503);
    clearEdgeAccessCache();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    expect((await run("/admin/editorial"))?.status).toBe(503);
  });

  it("caches a user's answer briefly, so prefetching a menu is not a stampede", async () => {
    answer(limited);
    const userId = "same-user";
    await run("/admin/editorial", { userId });
    await run("/admin/dashboard", { userId });
    await run("/admin/bookings", { userId });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("forwards the caller's cookie, and nothing else, to the internal endpoint", async () => {
    answer(limited);
    await run("/admin/editorial");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/internal\/admin-access$/);
    expect(init.headers).toEqual({ cookie: "authjs.session-token=x" });
    expect(init.cache).toBe("no-store");
  });
});

describe("both middleware files enforce the gate", () => {
  // The repository has `middleware.ts` (root) and `src/middleware.ts`. Which one Next builds depends
  // on version and mode, and `next dev` here compiled the one the SEO notes call dead — so a gate
  // added to only one of them silently did nothing. Keep them in step until one is deleted.
  const root = path.resolve(__dirname, "../../../..");
  for (const file of ["middleware.ts", "src/middleware.ts"]) {
    it(`${file} calls enforceAdminAccess inside its admin branch`, () => {
      const text = fs.readFileSync(path.join(root, file), "utf8");
      const adminBranch = text.slice(text.indexOf("if (isAdminRoute)"));
      expect(adminBranch).toContain("enforceAdminAccess(");
      // ...and it runs after the role check, not instead of it.
      expect(adminBranch.indexOf("canAccessAdmin")).toBeLessThan(adminBranch.indexOf("enforceAdminAccess("));
    });
  }
});
