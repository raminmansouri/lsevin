import { expect, it, vi } from "vitest";
const read = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cacheLife: vi.fn(), unstable_cacheTag: vi.fn() }));
vi.mock("@/features/service-providers/server/provider-page.repository", () => ({ getProviderPageDataFromDb: read }));
import { getProviderPageDataFromDbCached } from "@/features/service-providers/server/provider-page.repository.cached";
it("rejects transient provider results so the cache cannot store them as successful values", async () => {
  read.mockResolvedValue({data: null, error: {status: 500, detail: "internal detail"}});
  await expect(getProviderPageDataFromDbCached({providerId: "fixture"})).rejects.toThrow(/^Could not load provider page\.$/);
});
it.each([400,404])("preserves permanent %s results", async status => {
  const result = {data: null, error: {status}}; read.mockResolvedValue(result);
  expect(await getProviderPageDataFromDbCached({providerId: "fixture"})).toBe(result);
});

import { getProviderPageAction } from "@/features/service-providers/actions/provider-page";
it("client action preserves a sanitized structured failure", async () => {
  read.mockResolvedValue({error: {status: 500, detail: "internal detail"}});
  expect(await getProviderPageAction({providerId: "fixture"})).toEqual({error: {status: 500, title: "Could not load provider page."}});
});
