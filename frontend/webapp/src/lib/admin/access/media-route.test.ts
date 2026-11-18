/**
 * Regression: PATCH /api/admin/media/[id] used to accept ANY signed-in user (customers and providers
 * included) and can rewrite fileUrl/translations of any media-library row the public site renders.
 * It must require `media:manage`; the read stays available to signed-in users (pickers).
 */
import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireApiAdmin = vi.fn();
const requireApiUser = vi.fn();
const updateMedia = vi.fn();
const getMediaById = vi.fn();

vi.mock("@/lib/auth/api-guard", () => ({
  requireApiAdmin: (...args: unknown[]) => requireApiAdmin(...args),
  requireApiUser: (...args: unknown[]) => requireApiUser(...args),
}));
vi.mock("@/components/media/server/repository", () => ({
  updateMedia: (...args: unknown[]) => updateMedia(...args),
  getMediaById: (...args: unknown[]) => getMediaById(...args),
  deleteMedia: vi.fn(),
}));
vi.mock("@/components/media/server/storage-delete", () => ({ deleteStoredObject: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/components/media", () => ({}));

const forbidden = () => NextResponse.json({ error: "Forbidden: admin role required." }, { status: 403 });
const ctx = { params: Promise.resolve({ id: "m1" }) };
const patch = (body: unknown) =>
  new Request("http://localhost/api/admin/media/m1", { method: "PATCH", body: JSON.stringify(body) }) as never;

describe("PATCH /api/admin/media/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // A signed-in customer passes requireApiUser — that must no longer be enough.
    requireApiUser.mockResolvedValue({ userId: "customer", roles: ["customer"] });
  });

  it("refuses a signed-in non-admin and changes nothing", async () => {
    requireApiAdmin.mockResolvedValue(forbidden());
    const { PATCH } = await import("@/app/api/admin/media/[id]/route");
    const res = await PATCH(patch({ fileUrl: "https://evil.example/x.js" }), ctx);
    expect(res.status).toBe(403);
    expect(updateMedia).not.toHaveBeenCalled();
    expect(requireApiAdmin).toHaveBeenCalledWith("media", "manage");
  });

  it("lets a media manager update", async () => {
    requireApiAdmin.mockResolvedValue({ userId: "admin", roles: ["admin"] });
    updateMedia.mockResolvedValue({ id: "m1" });
    const { PATCH } = await import("@/app/api/admin/media/[id]/route");
    const res = await PATCH(patch({ altTranslations: { en: "x" } }), ctx);
    expect(res.status).toBe(200);
    expect(updateMedia).toHaveBeenCalledWith("m1", { altTranslations: { en: "x" } });
  });

  it("keeps the read open to signed-in users (pickers)", async () => {
    requireApiUser.mockResolvedValue({ userId: "customer", roles: ["customer"] });
    getMediaById.mockResolvedValue({ id: "m1" });
    const { GET } = await import("@/app/api/admin/media/[id]/route");
    const res = await GET(new Request("http://localhost/api/admin/media/m1") as never, ctx);
    expect(res.status).toBe(200);
    expect(requireApiAdmin).not.toHaveBeenCalled();
  });
});
