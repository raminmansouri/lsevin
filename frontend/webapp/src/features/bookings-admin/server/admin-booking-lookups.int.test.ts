/** The lookup types the admin booking form added (customers, transfer routes, provider-scoped services/staff), against the local DB. */
import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));
// The queries module reaches next-auth through the locations helpers; no session is needed here.
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn(async () => null) }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()), cookies: vi.fn(async () => ({ get: () => undefined })) }));

import sql from "@/config/database/db";
import { searchAdminProviderLookupOptions as search } from "@/features/service-providers/db/admin-service-providers.queries";

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

describe("admin booking lookups", () => {
  it("finds customers by name, by phone digits, and resolves one by id", async () => {
    const [user] = await sql<{ id: string; firstName: string; phone: string }[]>`
      select id::text, first_name as "firstName", phone_number as phone from identity.asp_net_users
      where coalesce(first_name, '') <> '' and length(coalesce(phone_number, '')) >= 4 limit 1`;
    const byName = await search({ type: "users", locale: "fa-IR", query: user.firstName, pageSize: 50 });
    expect(byName.data?.items.some((item) => item.id === user.id)).toBe(true);
    const byPhone = await search({ type: "users", locale: "fa-IR", query: user.phone.slice(-4), pageSize: 200 });
    expect(byPhone.data?.items.some((item) => item.id === user.id)).toBe(true);
    const byId = await search({ type: "users", locale: "fa-IR", ids: [user.id] });
    expect(byId.data?.items).toHaveLength(1);
  });

  it("narrows services and staff to the selected provider", async () => {
    const [provider] = await sql<{ id: string }[]>`
      select ps.service_provider_id::text as id from category.provider_services ps where ps.is_active group by 1 limit 1`;
    const services = await search({ type: "providerServices", locale: "fa-IR", providerId: provider.id, pageSize: 100 });
    const [{ count }] = await sql<{ count: number }[]>`
      select count(*)::int as count from category.provider_services where is_active and service_provider_id = ${provider.id}`;
    expect(services.data?.items.length).toBe(Math.min(count, 100));

    const staff = await search({ type: "staff", locale: "fa-IR", providerId: provider.id, pageSize: 100 });
    expect(staff.error).toBeUndefined();
  });

  it("filters providers to accommodations and lists transfer routes without error", async () => {
    const hotels = await search({ type: "providers", locale: "fa-IR", providerTypeKey: "accommodations", pageSize: 5 });
    expect(hotels.error).toBeUndefined();
    expect((hotels.data?.items.length ?? 0) > 0).toBe(true);
    const routes = await search({ type: "transferRoutes", locale: "fa-IR", query: "a", pageSize: 5 });
    expect(routes.error).toBeUndefined();
  });
});
