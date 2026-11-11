import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import postgres from "postgres";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

/**
 * Real-Postgres tests of the provider-portal side of the Shop API (provider shop phase 1), through
 * the route handlers: the signed portal assertion and the DB membership/role checks, shop
 * activation and admin decisions, allowed categories, listing review, blocking, and that only
 * approved offers of active shops reach the storefront price summary.
 * Opt-in: needs ACCOUNTING_TEST_DATABASE_URL pointing at a LOCAL database with migration 0096.
 * Fixtures use fresh ids and are removed afterwards.
 */

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

const SECRET = "test-portal-assertion-secret-0123456789abcdef";
process.env.SHOP_PORTAL_ASSERTION_SECRET = SECRET;

const url = process.env.ACCOUNTING_TEST_DATABASE_URL;
const host = url ? new URL(url).hostname : "";
const LOCAL = ["localhost", "127.0.0.1", "::1"].includes(host);
const sql = LOCAL ? postgres(url as string, { max: 2, prepare: false }) : null;
const d = LOCAL ? describe : describe.skip;

const tag = `pt${Date.now().toString(36)}`;
const ids = {
  provider: randomUUID(),
  otherProvider: randomUUID(),
  owner: randomUUID(),
  viewer: randomUUID(),
  staff: randomUUID(),
  outsider: randomUUID(),
  admin: randomUUID(),
  plainUser: randomUUID(),
  catParent: randomUUID(),
  catChild: randomUUID(),
  catOther: randomUUID(),
  prodChild: randomUUID(),
  prodParent: randomUUID(),
  prodOther: randomUUID(),
};

type Routes = {
  shop: typeof import("@/app/api/shop/v1/portal/shop/route");
  activation: typeof import("@/app/api/shop/v1/portal/shop/activation/route");
  catalog: typeof import("@/app/api/shop/v1/portal/catalog/route");
  offers: typeof import("@/app/api/shop/v1/portal/offers/route");
  offer: typeof import("@/app/api/shop/v1/portal/offers/[offerId]/route");
  requests: typeof import("@/app/api/shop/v1/portal/requests/route");
  queue: typeof import("@/app/api/shop/v1/portal/admin/queue/route");
  shopDecision: typeof import("@/app/api/shop/v1/portal/admin/shops/[sellerId]/decision/route");
  offerDecision: typeof import("@/app/api/shop/v1/portal/admin/offers/[offerId]/decision/route");
  proposals: typeof import("@/app/api/shop/v1/portal/proposals/route");
  orders: typeof import("@/app/api/shop/v1/portal/orders/route");
  ordersSummary: typeof import("@/app/api/shop/v1/portal/orders/summary/route");
  orderStatus: typeof import("@/app/api/shop/v1/portal/orders/[orderId]/status/route");
  adminProposals: typeof import("@/app/api/shop/v1/portal/admin/proposals/route");
  proposalDecision: typeof import("@/app/api/shop/v1/portal/admin/proposals/[proposalId]/decision/route");
  auth: typeof import("./server/auth");
  assertion: typeof import("./server/portal-assertion");
};
let r: Routes;

type Who = {
  userId: string;
  kind: "provider" | "admin";
  providerId?: string | null;
  iat?: number;
  exp?: number;
};

async function call(
  handler: (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ) => Promise<Response>,
  options: {
    as?: Who | null;
    assertion?: string;
    method?: string;
    path?: string;
    body?: unknown;
    params?: Record<string, string>;
  }
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-forwarded-for": "203.0.113.9",
  };
  const token =
    options.assertion ??
    (options.as
      ? r.assertion.signPortalAssertion(
          {
            userId: options.as.userId,
            kind: options.as.kind,
            providerId: options.as.providerId ?? null,
            iat: options.as.iat,
            exp: options.as.exp,
          },
          SECRET
        )
      : null);
  if (token) headers["x-lsevin-portal-assertion"] = token;
  const request = new NextRequest(
    `http://localhost/api/shop/v1/portal${options.path ?? "/"}`,
    {
      method: options.method ?? "GET",
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    }
  );
  const response = await handler(request, {
    params: Promise.resolve(options.params ?? {}),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

const owner = (): Who => ({
  userId: ids.owner,
  kind: "provider",
  providerId: ids.provider,
});
const viewer = (): Who => ({
  userId: ids.viewer,
  kind: "provider",
  providerId: ids.provider,
});
const staff = (): Who => ({
  userId: ids.staff,
  kind: "provider",
  providerId: ids.provider,
});
const adminUser = (): Who => ({ userId: ids.admin, kind: "admin" });

async function summary(productId: string) {
  const [row] = await sql!<
    { min_price: string; seller_count: number; best_offer_id: string | null }[]
  >`
    select min_price::text as min_price, seller_count, best_offer_id::text as best_offer_id
    from shop.v_product_price_summary where product_id = ${productId}::uuid
  `;
  return row;
}

d("shop api: provider portal (real database)", () => {
  beforeAll(async () => {
    const s = sql!;
    const [type] = await s<
      { id: string }[]
    >`select provider_type_id::text as id from category.service_providers limit 1`;
    for (const [id, name] of [
      [ids.provider, "clinic"],
      [ids.otherProvider, "other"],
    ] as const) {
      await s`
        insert into category.service_providers (id, is_active, provider_type_id, city, country, email, phone_number_country_code, phone_number,
          name_translations, description_translations, slug)
        values (${id}::uuid, true, ${type.id}::uuid, 'Tehran', 'IR', ${`${tag}-${name}@example.test`}, '+98', '9120000000',
          ${s.json({ fa: `کلینیک ${tag} ${name}`, en: `${tag} ${name}` })}, ${s.json({})}, ${`${tag}-${name}`})
      `;
    }
    for (const id of [
      ids.owner,
      ids.viewer,
      ids.staff,
      ids.outsider,
      ids.admin,
      ids.plainUser,
    ]) {
      const email = `${tag}-${id.slice(0, 8)}@example.test`;
      const phone = `9${String(Math.floor(Math.random() * 1e9)).padStart(9, "0")}`;
      await s`
        insert into identity.asp_net_users (id, lockout_enabled, access_failed_count, first_name, last_name, phone_number_country_code,
          user_name, normalized_user_name, email, normalized_email, email_confirmed, phone_number, phone_number_confirmed, two_factor_enabled)
        values (${id}::uuid, false, 0, 'Test', ${tag}, '+98', ${email}, ${email.toUpperCase()}, ${email}, ${email.toUpperCase()}, true, ${phone}, false, false)
      `;
    }
    for (const [user, role] of [
      [ids.owner, "owner"],
      [ids.viewer, "viewer"],
      [ids.staff, "staff"],
    ] as const) {
      await s`
        insert into provider_portal.provider_members (service_provider_id, user_id, role, status)
        values (${ids.provider}::uuid, ${user}::uuid, ${role}::provider_portal.membership_role, 'active')
      `;
    }
    await s`
      insert into identity.asp_net_user_roles (user_id, role_id)
      select ${ids.admin}::uuid, id from identity.asp_net_roles where normalized_name = 'ADMIN'
    `;
    await s`
      insert into identity.asp_net_user_roles (user_id, role_id)
      select ${ids.plainUser}::uuid, id from identity.asp_net_roles where normalized_name = 'USER'
    `;
    await s`insert into shop.categories (id, slug, name_translations) values (${ids.catParent}::uuid, ${`${tag}-skin`}, ${s.json({ fa: "پوست" })})`;
    await s`
      insert into shop.categories (id, parent_id, slug, name_translations)
      values (${ids.catChild}::uuid, ${ids.catParent}::uuid, ${`${tag}-serum`}, ${s.json({ fa: "سرم" })})
    `;
    await s`insert into shop.categories (id, slug, name_translations) values (${ids.catOther}::uuid, ${`${tag}-tools`}, ${s.json({ fa: "ابزار" })})`;
    for (const [id, cat, price] of [
      [ids.prodChild, ids.catChild, 300000],
      [ids.prodParent, ids.catParent, 200000],
      [ids.prodOther, ids.catOther, 100000],
    ] as const) {
      await s`
        insert into shop.products (id, product_type, status, slug, base_currency, base_price, name_translations, published_at, primary_category_id)
        values (${id}::uuid, 'simple', 'active', ${`${tag}-${id.slice(0, 6)}`}, 'IRR', ${price}, ${s.json({ fa: `محصول ${tag}` })}, now(), ${cat}::uuid)
      `;
      await s`insert into shop.product_categories (product_id, category_id, is_primary) values (${id}::uuid, ${cat}::uuid, true)`;
    }
    r = {
      shop: await import("@/app/api/shop/v1/portal/shop/route"),
      activation: await import(
        "@/app/api/shop/v1/portal/shop/activation/route"
      ),
      catalog: await import("@/app/api/shop/v1/portal/catalog/route"),
      offers: await import("@/app/api/shop/v1/portal/offers/route"),
      offer: await import("@/app/api/shop/v1/portal/offers/[offerId]/route"),
      requests: await import("@/app/api/shop/v1/portal/requests/route"),
      queue: await import("@/app/api/shop/v1/portal/admin/queue/route"),
      shopDecision: await import(
        "@/app/api/shop/v1/portal/admin/shops/[sellerId]/decision/route"
      ),
      offerDecision: await import(
        "@/app/api/shop/v1/portal/admin/offers/[offerId]/decision/route"
      ),
      proposals: await import("@/app/api/shop/v1/portal/proposals/route"),
      orders: await import("@/app/api/shop/v1/portal/orders/route"),
      ordersSummary: await import("@/app/api/shop/v1/portal/orders/summary/route"),
      orderStatus: await import("@/app/api/shop/v1/portal/orders/[orderId]/status/route"),
      adminProposals: await import(
        "@/app/api/shop/v1/portal/admin/proposals/route"
      ),
      proposalDecision: await import(
        "@/app/api/shop/v1/portal/admin/proposals/[proposalId]/decision/route"
      ),
      auth: await import("./server/auth"),
      assertion: await import("./server/portal-assertion"),
    };
  });

  beforeEach(() => r?.auth.resetRateLimits());

  afterAll(async () => {
    if (!sql) return;
    const products = [ids.prodChild, ids.prodParent, ids.prodOther];
    const sellers = (
      await sql<{ id: string }[]>`
      select id::text as id from shop.sellers where service_provider_id in ${sql([ids.provider, ids.otherProvider])}
    `
    ).map((row) => row.id);
    if (orderIds.length) {
      await sql`delete from shop.seller_order_pickups where order_id in ${sql(orderIds)}`;
      await sql`delete from shop.order_addresses where order_id in ${sql(orderIds)}`;
      await sql`delete from shop.order_items where order_id in ${sql(orderIds)}`;
      await sql`delete from shop.order_status_history where order_id in ${sql(orderIds)}`;
      await sql`delete from shop.orders where id in ${sql(orderIds)}`;
    }
    // Catalog products created by approved proposals (with their media, categories and offers).
    const created = sellers.length
      ? (
          await sql<{ id: string }[]>`
            select created_product_id::text as id from shop.product_proposals
            where seller_id in ${sql(sellers)} and created_product_id is not null
          `
        ).map((row) => row.id)
      : [];
    if (sellers.length)
      await sql`delete from shop.product_proposals where seller_id in ${sql(sellers)}`;
    if (created.length) {
      await sql`delete from shop.offer_price_history where offer_id in (select id from shop.offers where product_id in ${sql(created)})`;
      await sql`delete from shop.offers where product_id in ${sql(created)}`;
      await sql`delete from shop.product_media where product_id in ${sql(created)}`;
      await sql`delete from shop.product_categories where product_id in ${sql(created)}`;
      await sql`delete from shop.products where id in ${sql(created)}`;
    }
    if (sellers.length) {
      await sql`delete from shop.api_audit_log where seller_id in ${sql(sellers)}`;
      await sql`delete from shop.offers where seller_id in ${sql(sellers)}`;
      await sql`delete from shop.sellers where id in ${sql(sellers)}`;
    }
    await sql`delete from shop.offer_price_history where offer_id in (select id from shop.offers where product_id in ${sql(products)})`;
    await sql`delete from shop.offers where product_id in ${sql(products)}`;
    await sql`delete from shop.products where id in ${sql(products)}`;
    await sql`delete from shop.categories where id in ${sql([ids.catChild, ids.catParent, ids.catOther])}`;
    const users = [
      ids.owner,
      ids.viewer,
      ids.staff,
      ids.outsider,
      ids.admin,
      ids.plainUser,
    ];
    await sql`delete from provider_portal.provider_members where user_id in ${sql(users)}`;
    await sql`delete from identity.asp_net_user_roles where user_id in ${sql(users)}`;
    await sql`delete from identity.asp_net_users where id in ${sql(users)}`;
    await sql`delete from category.service_providers where id in ${sql([ids.provider, ids.otherProvider])}`;
    await sql.end({ timeout: 5 });
  });

  // -------------------------------------------------------------------------------------------
  it("rejects missing, malformed, wrongly signed, expired, too-long-lived and wrong-kind assertions with 401", async () => {
    const now = Math.floor(Date.now() / 1000);
    const good = r.assertion.signPortalAssertion(
      { userId: ids.owner, kind: "provider", providerId: ids.provider },
      SECRET
    );
    const [payload] = good.split(".");
    const cases = [
      undefined,
      "not-a-token",
      `${payload}.${"A".repeat(43)}`,
      r.assertion.signPortalAssertion(
        { userId: ids.owner, kind: "provider", providerId: ids.provider },
        "another-secret-that-is-long-enough-1234"
      ),
      r.assertion.signPortalAssertion(
        {
          userId: ids.owner,
          kind: "provider",
          providerId: ids.provider,
          iat: now - 300,
          exp: now - 200,
        },
        SECRET
      ),
      r.assertion.signPortalAssertion(
        {
          userId: ids.owner,
          kind: "provider",
          providerId: ids.provider,
          iat: now,
          exp: now + 600,
        },
        SECRET
      ),
      r.assertion.signPortalAssertion(
        { userId: ids.admin, kind: "admin" },
        SECRET
      ), // admin token on a provider route
    ];
    for (const assertion of cases) {
      const response = await call(r.shop.GET, {
        assertion: assertion ?? "",
        path: "/shop",
      });
      expect(response.status, String(assertion)).toBe(401);
      expect(response.body.error.code).toBe("unauthorized");
    }
    // A provider token on an admin route is also a 401.
    expect(
      (await call(r.queue.GET, { as: owner(), path: "/admin/queue" })).status
    ).toBe(401);
  });

  it("checks membership in the database: non-member and staff are 403, viewer reads but cannot write", async () => {
    expect(
      (
        await call(r.shop.GET, {
          as: {
            userId: ids.outsider,
            kind: "provider",
            providerId: ids.provider,
          },
        })
      ).status
    ).toBe(403);
    // A real member of another provider cannot use this provider's id.
    expect(
      (
        await call(r.shop.GET, {
          as: {
            userId: ids.owner,
            kind: "provider",
            providerId: ids.otherProvider,
          },
        })
      ).status
    ).toBe(403);
    expect((await call(r.shop.GET, { as: staff() })).status).toBe(403);
    const read = await call(r.shop.GET, { as: viewer() });
    expect(read.status).toBe(200);
    expect(read.body.data.state).toBe("none");
    const write = await call(r.activation.POST, {
      as: viewer(),
      method: "POST",
      body: { name: "x shop", categoryIds: [ids.catParent] },
    });
    expect(write.status).toBe(403);
    // Admin routes need a shop admin role.
    expect(
      (
        await call(r.queue.GET, {
          as: { userId: ids.plainUser, kind: "admin" },
        })
      ).status
    ).toBe(403);
    expect((await call(r.queue.GET, { as: adminUser() })).status).toBe(200);
  });

  let sellerId = "";

  it("requests a shop: prefilled from the provider, unique slug, clinic pickup, duplicate request is a conflict", async () => {
    const before = await call(r.shop.GET, { as: owner() });
    expect(before.body.data.provider.name).toContain(tag);
    const invalid = await call(r.activation.POST, {
      as: owner(),
      method: "POST",
      body: { name: "Shop", categoryIds: [] },
    });
    expect(invalid.status).toBe(422);
    const created = await call(r.activation.POST, {
      as: owner(),
      method: "POST",
      body: {
        name: "فروشگاه تست",
        categoryIds: [ids.catParent],
        licenceUrl: "/media/licence.pdf",
      },
    });
    expect(created.status).toBe(201);
    expect(created.body.data.state).toBe("requested");
    expect(created.body.data.seller.fulfillmentMode).toBe("clinic_pickup");
    expect(
      created.body.data.seller.requestedCategories.map(
        (c: { id: string }) => c.id
      )
    ).toEqual([ids.catParent]);
    sellerId = created.body.data.seller.id;
    const [row] =
      await sql!`select slug, phone, shop_status, service_provider_id::text as provider from shop.sellers where id = ${sellerId}::uuid`;
    expect(row).toMatchObject({
      slug: `${tag}-clinic`,
      shop_status: "requested",
      provider: ids.provider,
    });
    expect(row.phone).toBe("+989120000000");
    const again = await call(r.activation.POST, {
      as: owner(),
      method: "POST",
      body: { name: "Again", categoryIds: [ids.catParent] },
    });
    expect(again.status).toBe(409);
    // Not active yet: no listing.
    const offer = await call(r.offers.POST, {
      as: owner(),
      method: "POST",
      body: { productId: ids.prodChild, price: 1, stockQuantity: 1 },
    });
    expect(offer.status).toBe(403);
  });

  it("admin: reject needs a reason; the provider re-requests; approve needs categories; every decision is audited", async () => {
    const queue = await call(r.queue.GET, {
      as: adminUser(),
      path: "/admin/queue?status=pending",
    });
    const item = queue.body.data.items.find(
      (i: { id: string }) => i.id === sellerId
    );
    expect(item.type).toBe("shop_activation");
    expect(item.activation.licenceUrl).toBe("/media/licence.pdf");
    expect(queue.body.data.pendingCount).toBeGreaterThanOrEqual(1);

    const decide = (body: unknown) =>
      call(r.shopDecision.POST, {
        as: adminUser(),
        method: "POST",
        body,
        params: { sellerId },
      });
    expect((await decide({ decision: "reject" })).status).toBe(422);
    expect((await decide({ decision: "reject", reason: "  " })).status).toBe(
      422
    );
    expect(
      (await decide({ decision: "reject", reason: "مجوز ناخوانا است" })).status
    ).toBe(200);
    const rejected = await call(r.shop.GET, { as: owner() });
    expect(rejected.body.data.state).toBe("rejected");
    expect(rejected.body.data.seller.reason).toBe("مجوز ناخوانا است");

    const again = await call(r.activation.POST, {
      as: owner(),
      method: "POST",
      body: { name: "فروشگاه تست", categoryIds: [ids.catParent, ids.catOther] },
    });
    expect(again.status).toBe(201);
    expect(again.body.data.state).toBe("requested");

    expect(
      (await decide({ decision: "approve", categoryIds: [] })).status
    ).toBe(422);
    expect((await decide({ decision: "approve" })).status).toBe(422);
    // Admin allows only the parent category (not "tools").
    expect(
      (await decide({ decision: "approve", categoryIds: [ids.catParent] }))
        .status
    ).toBe(200);
    expect(
      (await decide({ decision: "approve", categoryIds: [ids.catParent] }))
        .status
    ).toBe(409);
    const active = await call(r.shop.GET, { as: owner() });
    expect(active.body.data.state).toBe("active");
    expect(
      active.body.data.seller.allowedCategories.map((c: { id: string }) => c.id)
    ).toEqual([ids.catParent]);

    const audit = await sql!`
      select action, source, actor_user_id::text as actor, token_id, note from shop.api_audit_log
      where seller_id = ${sellerId}::uuid order by id
    `;
    expect(audit.map((a) => a.action)).toEqual([
      "shop.request",
      "shop.reject",
      "shop.re_request",
      "shop.approve",
    ]);
    expect(
      audit.every((a) => a.source === "portal" && a.token_id === null)
    ).toBe(true);
    expect(audit[1]).toMatchObject({
      actor: ids.admin,
      note: "مجوز ناخوانا است",
    });
    expect(audit[0].actor).toBe(ids.owner);
  });

  it("catalog marks products allowed by category (child of an allowed parent counts)", async () => {
    const response = await call(r.catalog.GET, {
      as: owner(),
      path: `/catalog?search=${tag}`,
    });
    expect(response.status).toBe(200);
    const byId = new Map(
      response.body.data.map((row: { productId: string }) => [
        row.productId,
        row,
      ])
    );
    expect(byId.get(ids.prodChild)).toMatchObject({
      allowed: true,
      sellerCount: 1,
      ownOfferId: null,
    });
    expect(byId.get(ids.prodParent)).toMatchObject({ allowed: true });
    expect(byId.get(ids.prodOther)).toMatchObject({ allowed: false });
    expect((byId.get(ids.prodChild) as { minPrice: number }).minPrice).toBe(
      300000
    );
  });

  let offerId = "";

  it("lists a product as pending; refuses missing stock, negative price, disallowed categories and duplicates", async () => {
    const post = (body: unknown) =>
      call(r.offers.POST, { as: owner(), method: "POST", body });
    expect(
      (await post({ productId: ids.prodOther, price: 1000, stockQuantity: 3 }))
        .status
    ).toBe(403);
    expect((await post({ productId: ids.prodChild, price: 1000 })).status).toBe(
      422
    );
    expect(
      (
        await post({
          productId: ids.prodChild,
          price: 1000,
          stockQuantity: null,
        })
      ).status
    ).toBe(422);
    expect(
      (await post({ productId: ids.prodChild, price: -1, stockQuantity: 3 }))
        .status
    ).toBe(422);
    expect(
      (
        await call(r.offers.POST, {
          as: viewer(),
          method: "POST",
          body: { productId: ids.prodChild, price: 1, stockQuantity: 1 },
        })
      ).status
    ).toBe(403);

    const before = await summary(ids.prodChild);
    const created = await post({
      productId: ids.prodChild,
      price: 250000,
      stockQuantity: 5,
      handlingDays: 2,
      warranty: "اصالت کالا",
    });
    expect(created.status).toBe(201);
    offerId = created.body.data.id;
    const [row] =
      await sql!`select admin_status, stock_quantity, warranty_translations from shop.offers where id = ${offerId}::uuid`;
    expect(row).toMatchObject({
      admin_status: "pending",
      stock_quantity: 5,
      warranty_translations: { fa: "اصالت کالا" },
    });
    // Pending: not live, the storefront summary is unchanged.
    expect(await summary(ids.prodChild)).toEqual(before);
    expect(
      (await post({ productId: ids.prodChild, price: 1, stockQuantity: 1 }))
        .status
    ).toBe(409);
  });

  it("the database itself refuses a provider seller's offer without stock", async () => {
    await expect(sql!`
      insert into shop.offers (product_id, seller_id, currency, price, stock_quantity)
      values (${ids.prodParent}::uuid, ${sellerId}::uuid, 'IRR', 1, null)
    `).rejects.toMatchObject({ code: "23514" });
  });

  it("admin approves: the offer is live and wins the buy box with the lowest price", async () => {
    const decide = (body: unknown) =>
      call(r.offerDecision.POST, {
        as: adminUser(),
        method: "POST",
        body,
        params: { offerId },
      });
    const queue = await call(r.queue.GET, {
      as: adminUser(),
      path: "/admin/queue?status=pending",
    });
    const item = queue.body.data.items.find(
      (i: { id: string }) => i.id === offerId
    );
    expect(item).toMatchObject({
      type: "listing",
      listing: { price: 250000, stockQuantity: 5, categoryAllowed: true },
    });
    expect(item.listing.otherSellers).toMatchObject({
      count: 1,
      minPrice: 300000,
      maxPrice: 300000,
    });
    expect((await decide({ decision: "reject" })).status).toBe(422);
    expect((await decide({ decision: "approve" })).status).toBe(200);
    expect((await decide({ decision: "approve" })).status).toBe(409);
    const live = await summary(ids.prodChild);
    expect(live).toMatchObject({
      min_price: "250000.00",
      seller_count: 2,
      best_offer_id: offerId,
    });
    const requests = await call(r.requests.GET, { as: owner() });
    expect(requests.body.data.offers[0]).toMatchObject({
      id: offerId,
      adminStatus: "approved",
      isWinner: true,
      cheaperSellers: 0,
    });
  });

  it("PATCH applies price and stock at once, refuses clearing stock, and viewer cannot patch", async () => {
    const patch = (body: unknown, as = owner()) =>
      call(r.offer.PATCH, { as, method: "PATCH", body, params: { offerId } });
    expect((await patch({ stockQuantity: null })).status).toBe(422);
    expect((await patch({})).status).toBe(422);
    expect((await patch({ price: 1 }, viewer())).status).toBe(403);
    const updated = await patch({
      price: 240000,
      stockQuantity: 4,
      sellerSku: "SKU-1",
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({
      price: 240000,
      stockQuantity: 4,
      sellerSku: "SKU-1",
    });
    expect((await summary(ids.prodChild)).min_price).toBe("240000.00");
    // Resubmitting is only for rejected listings.
    expect((await patch({ resubmit: true })).status).toBe(409);
  });

  it("admin blocks: the offer leaves the storefront and the provider cannot switch it back on; unblock restores it", async () => {
    const decide = (body: unknown) =>
      call(r.offerDecision.POST, {
        as: adminUser(),
        method: "POST",
        body,
        params: { offerId },
      });
    expect((await decide({ decision: "block" })).status).toBe(422);
    expect(
      (await decide({ decision: "block", reason: "مجوز بهداشت منقضی شده" }))
        .status
    ).toBe(200);
    expect(await summary(ids.prodChild)).toMatchObject({
      min_price: "300000.00",
      seller_count: 1,
    });
    const on = await call(r.offer.PATCH, {
      as: owner(),
      method: "PATCH",
      body: { isActive: true },
      params: { offerId },
    });
    expect(on.status).toBe(403);
    expect(on.body.error.message).toContain("مجوز بهداشت منقضی شده");
    const blockedQueue = await call(r.queue.GET, {
      as: adminUser(),
      path: "/admin/queue?status=blocked",
    });
    expect(
      blockedQueue.body.data.items.find((i: { id: string }) => i.id === offerId)
        ?.type
    ).toBe("blocked");
    // Price and stock may still be edited while blocked (it stays off).
    expect(
      (
        await call(r.offer.PATCH, {
          as: owner(),
          method: "PATCH",
          body: { stockQuantity: 3 },
          params: { offerId },
        })
      ).status
    ).toBe(200);
    expect((await decide({ decision: "unblock" })).status).toBe(200);
    const [row] =
      await sql!`select admin_status, is_active from shop.offers where id = ${offerId}::uuid`;
    expect(row).toMatchObject({ admin_status: "approved", is_active: false });
    expect(
      (
        await call(r.offer.PATCH, {
          as: owner(),
          method: "PATCH",
          body: { isActive: true },
          params: { offerId },
        })
      ).status
    ).toBe(200);
    expect((await summary(ids.prodChild)).best_offer_id).toBe(offerId);
  });

  it("a rejected listing is fixed and resubmitted back to pending", async () => {
    const created = await call(r.offers.POST, {
      as: owner(),
      method: "POST",
      body: { productId: ids.prodParent, price: 190000, stockQuantity: 2 },
    });
    expect(created.status).toBe(201);
    const id = created.body.data.id;
    expect(
      (
        await call(r.offerDecision.POST, {
          as: adminUser(),
          method: "POST",
          body: { decision: "reject", reason: "عکس کیفیت پایین" },
          params: { offerId: id },
        })
      ).status
    ).toBe(200);
    const requests = await call(r.requests.GET, { as: owner() });
    expect(
      requests.body.data.offers.find((o: { id: string }) => o.id === id)
    ).toMatchObject({ adminStatus: "rejected", reason: "عکس کیفیت پایین" });
    const resubmit = await call(r.offer.PATCH, {
      as: owner(),
      method: "PATCH",
      body: { price: 185000, resubmit: true },
      params: { offerId: id },
    });
    expect(resubmit.status).toBe(200);
    const [row] =
      await sql!`select admin_status, admin_status_reason, price::text as price from shop.offers where id = ${id}::uuid`;
    expect(row).toMatchObject({
      admin_status: "pending",
      admin_status_reason: null,
      price: "185000.00",
    });
  });

  it("suspending the shop takes all its offers out of the storefront; unsuspend brings them back", async () => {
    const decide = (body: unknown) =>
      call(r.shopDecision.POST, {
        as: adminUser(),
        method: "POST",
        body,
        params: { sellerId },
      });
    expect((await decide({ decision: "suspend" })).status).toBe(422);
    expect(
      (await decide({ decision: "suspend", reason: "شکایت مشتری" })).status
    ).toBe(200);
    expect((await summary(ids.prodChild)).seller_count).toBe(1);
    expect((await call(r.shop.GET, { as: owner() })).body.data).toMatchObject({
      state: "suspended",
      seller: { reason: "شکایت مشتری" },
    });
    expect(
      (
        await call(r.offers.POST, {
          as: owner(),
          method: "POST",
          body: { productId: ids.prodChild, price: 1, stockQuantity: 1 },
        })
      ).status
    ).toBe(403);
    expect((await decide({ decision: "unsuspend" })).status).toBe(200);
    expect((await summary(ids.prodChild)).seller_count).toBe(2);
  });

  let proposalId = "";

  it("proposes a new product: allowed categories only (children count), stock required, viewer cannot write", async () => {
    const post = (body: unknown, as = owner()) =>
      call(r.proposals.POST, { as, method: "POST", body });
    const body = {
      name: { fa: `سرم تازه ${tag}`, en: `${tag} fresh serum` },
      description: { fa: "برای پوست خشک" },
      categoryId: ids.catChild,
      brand: "Test Lab",
      images: ["/media/serum-1.jpg", "/media/serum-2.jpg"],
      price: 410000,
      stockQuantity: 6,
    };
    expect((await post(body, viewer())).status).toBe(403);
    const other = await post({ ...body, categoryId: ids.catOther });
    expect(other.status).toBe(403);
    expect(other.body.error.details).toMatchObject({ reason: "category_not_allowed" });
    expect((await post({ ...body, stockQuantity: 0 })).status).toBe(422);
    expect((await post({ ...body, name: { en: "x" } })).status).toBe(422);

    const created = await post(body);
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ status: "pending", categoryId: ids.catChild, price: 410000, stockQuantity: 6 });
    proposalId = created.body.data.id;

    const list = await call(r.proposals.GET, { as: viewer() });
    expect(list.status).toBe(200);
    expect(list.body.data.proposals[0]).toMatchObject({ id: proposalId, status: "pending", images: body.images });
    const allowed = list.body.data.categories.map((c: { id: string }) => c.id);
    expect(allowed).toEqual(expect.arrayContaining([ids.catParent, ids.catChild]));
    expect(allowed).not.toContain(ids.catOther);
    // Nothing reaches the catalog while pending.
    const [{ n }] = await sql!`select count(*)::int as n from shop.products where name_translations->>'en' = ${body.name.en}`;
    expect(n).toBe(0);
  });

  it("admin approves a proposal: one transaction creates the live catalog product and the shop's approved offer", async () => {
    const queue = await call(r.queue.GET, { as: adminUser(), path: "/admin/queue?status=pending" });
    const item = queue.body.data.items.find((i: { id: string }) => i.id === proposalId);
    expect(item).toMatchObject({ type: "product_proposal", proposal: { categoryAllowed: true, stockQuantity: 6 } });
    const listed = await call(r.adminProposals.GET, { as: adminUser(), path: "/admin/proposals?status=pending" });
    expect(listed.body.data.items.some((i: { id: string }) => i.id === proposalId)).toBe(true);
    expect((await call(r.adminProposals.GET, { as: owner() })).status).toBe(401);

    const decide = (body: unknown) =>
      call(r.proposalDecision.POST, { as: adminUser(), method: "POST", body, params: { proposalId } });
    expect((await decide({ decision: "reject" })).status).toBe(422);
    expect((await decide({ decision: "approve", categoryId: ids.catOther })).status).toBe(422);
    const approved = await decide({ decision: "approve", price: 400000 });
    expect(approved.status).toBe(200);
    const { productId, offerId } = approved.body.data;
    expect((await decide({ decision: "approve" })).status).toBe(409);

    const [product] = await sql!`
      select status::text as status, owner_seller_id, primary_category_id::text as category, base_currency, name_translations
      from shop.products where id = ${productId}::uuid
    `;
    expect(product).toMatchObject({ status: "active", owner_seller_id: null, category: ids.catChild, base_currency: "IRR" });
    expect(product.name_translations).toMatchObject({ en: `${tag} fresh serum` });
    const media = await sql!`select url, is_primary from shop.product_media where product_id = ${productId}::uuid order by display_order`;
    expect(media.map((m) => m.url)).toEqual(["/media/serum-1.jpg", "/media/serum-2.jpg"]);
    expect(media[0].is_primary).toBe(true);
    const [offer] = await sql!`
      select seller_id::text as seller_id, admin_status, price::text as price, stock_quantity, is_active
      from shop.offers where id = ${offerId}::uuid
    `;
    expect(offer).toMatchObject({ seller_id: sellerId, admin_status: "approved", price: "400000.00", stock_quantity: 6, is_active: true });
    // Only the clinic sells it: no live default-seller offer.
    const live = await sql!`select seller_id::text as seller_id from shop.offers where product_id = ${productId}::uuid and deleted_at is null`;
    expect(live.map((o) => o.seller_id)).toEqual([sellerId]);
    expect(await summary(productId)).toMatchObject({ min_price: "400000.00", seller_count: 1, best_offer_id: offerId });

    const mine = await call(r.proposals.GET, { as: owner() });
    expect(mine.body.data.proposals.find((p: { id: string }) => p.id === proposalId)).toMatchObject({
      status: "approved", createdProductId: productId, price: 400000,
    });
    const requests = await call(r.requests.GET, { as: owner() });
    expect(requests.body.data.offers.some((o: { id: string }) => o.id === offerId)).toBe(true);
    const audit = await sql!`select action from shop.api_audit_log where seller_id = ${sellerId}::uuid and action like 'proposal.%' order by id`;
    expect(audit.map((a) => a.action)).toEqual(["proposal.create", "proposal.approve"]);
  });

  it("admin rejects a proposal with a reason the clinic sees; nothing is created", async () => {
    const created = await call(r.proposals.POST, {
      as: owner(), method: "POST",
      body: { name: { fa: `ابزار ${tag}` }, categoryId: ids.catParent, price: 1000, stockQuantity: 1 },
    });
    expect(created.status).toBe(201);
    const id = created.body.data.id;
    const rejected = await call(r.proposalDecision.POST, {
      as: adminUser(), method: "POST", body: { decision: "reject", reason: "تصویر ندارد" }, params: { proposalId: id },
    });
    expect(rejected.status).toBe(200);
    const mine = await call(r.proposals.GET, { as: owner() });
    expect(mine.body.data.proposals.find((p: { id: string }) => p.id === id)).toMatchObject({
      status: "rejected", reason: "تصویر ندارد", createdProductId: null,
    });
    expect((await call(r.proposalDecision.POST, {
      as: adminUser(), method: "POST", body: { decision: "approve" }, params: { proposalId: id },
    })).status).toBe(409);
  });

  const orderIds: string[] = [];
  async function makeOrder(status: string, paid: boolean, lines: Array<{ sellerId: string | null; qty: number; price: number }>) {
    const [order] = await sql!<{ id: string }[]>`
      insert into shop.orders (order_number, email, currency, status, payment_status, grand_total, paid_at)
      values (${`${tag}-${orderIds.length}`}, 'buyer@example.test', 'IRR', ${status}, ${paid ? "captured" : "pending"},
        ${lines.reduce((sum, line) => sum + line.qty * line.price, 0)}, ${paid ? sql!`now()` : sql!`null`})
      returning id::text as id
    `;
    orderIds.push(order.id);
    await sql!`
      insert into shop.order_addresses (order_id, address_type, full_name, phone_number_country_code, phone_number, country, city, address_line_1)
      values (${order.id}::uuid, 'shipping', 'مریم احمدی', '+98', '9121234567', 'IR', 'Tehran', '-')
    `;
    for (const line of lines) {
      await sql!`
        insert into shop.order_items (order_id, product_id, quantity, currency, unit_price_snapshot, line_total_snapshot, product_name_snapshot, seller_id)
        values (${order.id}::uuid, ${ids.prodChild}::uuid, ${line.qty}, 'IRR', ${line.price}, ${line.qty * line.price},
          ${sql!.json({ fa: `سرم ${tag}` })}, ${line.sellerId}::uuid)
      `;
    }
    return order.id;
  }

  it("clinic orders: only paid orders with the clinic's lines; new -> ready -> picked up; viewer reads only", async () => {
    const [defaultSeller] = await sql!<{ id: string | null }[]>`select shop.default_seller_id()::text as id`;
    const paid = await makeOrder("paid", true, [
      { sellerId: sellerId, qty: 2, price: 250000 },
      { sellerId: defaultSeller.id, qty: 1, price: 999 },
    ]);
    const unpaid = await makeOrder("awaiting_payment", false, [{ sellerId: sellerId, qty: 1, price: 250000 }]);
    const cancelled = await makeOrder("cancelled", true, [{ sellerId: sellerId, qty: 1, price: 250000 }]);

    const list = await call(r.orders.GET, { as: viewer(), path: "/orders?status=new" });
    expect(list.status).toBe(200);
    const listed = list.body.data.orders.map((o: { id: string }) => o.id);
    expect(listed).toContain(paid);
    expect(listed).not.toContain(unpaid);
    expect(listed).not.toContain(cancelled);
    const row = list.body.data.orders.find((o: { id: string }) => o.id === paid);
    // Only this clinic's line and total, with the buyer's name and phone.
    expect(row).toMatchObject({ pickupStatus: "new", quantity: 2, total: 500000, buyer: { name: "مریم احمدی", phone: "+989121234567" } });
    expect(row.items).toHaveLength(1);
    expect(list.body.data.counts).toMatchObject({ new: 1, cancelled: 1 });
    expect((await call(r.ordersSummary.GET, { as: owner() })).body.data).toMatchObject({ new: 1 });

    const move = (orderId: string, status: string, as = owner()) =>
      call(r.orderStatus.POST, { as, method: "POST", body: { status }, params: { orderId } });
    expect((await move(paid, "ready_for_pickup", viewer())).status).toBe(403);
    expect((await move(paid, "new")).status).toBe(422);
    expect((await move(unpaid, "ready_for_pickup")).status).toBe(409);
    expect((await move(cancelled, "picked_up")).status).toBe(409);
    expect((await move(randomUUID(), "picked_up")).status).toBe(404);
    expect((await move(paid, "ready_for_pickup")).status).toBe(200);
    expect((await move(paid, "ready_for_pickup")).status).toBe(409);
    const [lines] = await sql!`select array_agg(fulfillment_status::text order by quantity) as fs from shop.order_items where order_id = ${paid}::uuid`;
    expect(lines.fs).toEqual(["pending", "packed"]);
    expect((await move(paid, "picked_up")).status).toBe(200);
    const picked = await call(r.orders.GET, { as: owner(), path: "/orders?status=picked_up" });
    expect(picked.body.data.orders.find((o: { id: string }) => o.id === paid)).toMatchObject({ pickupStatus: "picked_up" });
    // The default seller's line is not delivered yet, so the whole order is not either.
    const [order] = await sql!`select fulfillment_status::text as fs from shop.orders where id = ${paid}::uuid`;
    expect(order.fs).not.toBe("delivered");
    expect((await call(r.ordersSummary.GET, { as: owner() })).body.data).toMatchObject({ new: 0 });
    const audit = await sql!`select action from shop.api_audit_log where entity_id = ${paid}::uuid order by id`;
    expect(audit.map((a) => a.action)).toEqual(["order.ready_for_pickup", "order.picked_up"]);
  });

  it("decisions tell the portal which clinic to notify", async () => {
    const created = await call(r.proposals.POST, {
      as: owner(), method: "POST",
      body: { name: { fa: `اعلان ${tag}` }, categoryId: ids.catParent, price: 10, stockQuantity: 1 },
    });
    const decided = await call(r.proposalDecision.POST, {
      as: adminUser(), method: "POST", body: { decision: "reject", reason: "تکراری" }, params: { proposalId: created.body.data.id },
    });
    expect(decided.body.data).toMatchObject({ providerId: ids.provider, title: `اعلان ${tag}`, reason: "تکراری" });
  });

  it("rate-limits per portal user, not one bucket for the whole portal", () => {
    const start = 1_000_000;
    for (let i = 0; i < r.auth.SHOP_API_RATE_LIMIT_PER_MINUTE; i += 1)
      r.auth.checkRateLimit(`portal:${ids.owner}`, start + i);
    expect(() =>
      r.auth.checkRateLimit(`portal:${ids.owner}`, start + 500)
    ).toThrow();
    expect(() =>
      r.auth.checkRateLimit(`portal:${ids.viewer}`, start + 500)
    ).not.toThrow();
  });
});
