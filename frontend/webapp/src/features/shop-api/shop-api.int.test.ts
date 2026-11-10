import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import postgres from "postgres";
import { NextRequest } from "next/server";

/**
 * Real-Postgres tests of the Shop API through its route handlers: authentication, scopes,
 * seller isolation, the review flow and the admin side. Opt-in: needs ACCOUNTING_TEST_DATABASE_URL
 * pointing at a LOCAL database with migration 0091 (`pnpm test:local-env --suite shop-api`).
 * Fixtures use fresh ids and are removed afterwards.
 */

const admin = vi.hoisted(() => ({ roles: ["admin"] as string[], userId: "0e2e0000-0000-4000-8000-0000000000ad" }));
vi.mock("@/lib/auth/admin-guard", () => ({
  getAdminContext: vi.fn(async () => ({ userId: admin.userId, roles: admin.roles, isAdmin: admin.roles.includes("admin") })),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn(), unstable_cache: (fn: unknown) => fn }));

const url = process.env.ACCOUNTING_TEST_DATABASE_URL;
const host = url ? new URL(url).hostname : "";
const LOCAL = ["localhost", "127.0.0.1", "::1"].includes(host);
const sql = LOCAL ? postgres(url as string, { max: 2, prepare: false }) : null;
const d = LOCAL ? describe : describe.skip;

// Production-shaped catalog ids (GUIDs without RFC version/variant bits).
const catalogId = () => { const p = randomUUID().split("-"); p[2] = `b${p[2].slice(1)}`; p[3] = `2${p[3].slice(1)}`; return p.join("-"); };
const tag = `it${Date.now().toString(36)}`;
const ids = { sellerA: randomUUID(), sellerB: randomUUID(), sellerOff: randomUUID(), category: catalogId(), catalogProduct: catalogId() };
const tokens: Record<string, string> = {};
const ALL = ["products:read", "products:write", "products:delete", "offers:read", "offers:write", "offers:delete", "catalog:read"];

async function issue(name: string, sellerId: string, scopes: string[], extra: { revoked?: boolean; expired?: boolean } = {}) {
  const token = `lsv_${randomBytes(32).toString("base64url")}`;
  await sql!`
    insert into shop.api_tokens (seller_id, name, token_prefix, token_hash, scopes, expires_at, revoked_at)
    values (${sellerId}::uuid, ${`${tag}-${name}`}, ${token.slice(0, 12)}, ${createHash("sha256").update(token).digest("hex")}, ${scopes},
      ${extra.expired ? new Date(Date.now() - 1000) : null}, ${extra.revoked ? new Date() : null})
  `;
  tokens[name] = token;
}

type Routes = {
  me: typeof import("@/app/api/shop/v1/me/route");
  products: typeof import("@/app/api/shop/v1/products/route");
  product: typeof import("@/app/api/shop/v1/products/[productId]/route");
  offers: typeof import("@/app/api/shop/v1/offers/route");
  offer: typeof import("@/app/api/shop/v1/offers/[offerId]/route");
  catalog: typeof import("@/app/api/shop/v1/catalog/products/route");
  categories: typeof import("@/app/api/shop/v1/catalog/categories/route");
  admin: typeof import("./server/admin");
  auth: typeof import("./server/auth");
};
let r: Routes;

/** Calls a route handler like Next would. */
async function call(
  handler: (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<Response>,
  options: { token?: string | null; method?: string; path?: string; body?: unknown; params?: Record<string, string>; rawBody?: string },
) {
  const headers: Record<string, string> = { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" };
  if (options.token !== null && options.token !== undefined) headers.authorization = `Bearer ${options.token}`;
  const request = new NextRequest(`http://localhost/api/shop/v1${options.path ?? "/"}`, {
    method: options.method ?? "GET",
    headers,
    body: options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
  });
  const response = await handler(request, { params: Promise.resolve(options.params ?? {}) });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null, headers: response.headers };
}

d("shop api (real database)", () => {
  beforeAll(async () => {
    const s = sql!;
    for (const [id, slug, active] of [[ids.sellerA, "a", true], [ids.sellerB, "b", true], [ids.sellerOff, "off", false]] as const) {
      await s`insert into shop.sellers (id, slug, name_translations, is_active) values (${id}::uuid, ${`${tag}-${slug}`}, ${s.json({ fa: `فروشنده ${slug}` })}, ${active})`;
    }
    await s`insert into shop.categories (id, slug, name_translations, is_active) values (${ids.category}::uuid, ${`${tag}-cat`}, ${s.json({ fa: "دسته" })}, true)`;
    await s`
      insert into shop.products (id, product_type, status, slug, base_currency, base_price, name_translations, published_at)
      values (${ids.catalogProduct}::uuid, 'simple', 'active', ${`${tag}-catalog`}, 'IRR', 100000, ${s.json({ fa: `کاتالوگ ${tag}` })}, now())
    `;
    await issue("a", ids.sellerA, ALL);
    await issue("aRead", ids.sellerA, ["products:read", "offers:read"]);
    await issue("b", ids.sellerB, ALL);
    await issue("revoked", ids.sellerA, ALL, { revoked: true });
    await issue("expired", ids.sellerA, ALL, { expired: true });
    await issue("off", ids.sellerOff, ALL);
    r = {
      me: await import("@/app/api/shop/v1/me/route"),
      products: await import("@/app/api/shop/v1/products/route"),
      product: await import("@/app/api/shop/v1/products/[productId]/route"),
      offers: await import("@/app/api/shop/v1/offers/route"),
      offer: await import("@/app/api/shop/v1/offers/[offerId]/route"),
      catalog: await import("@/app/api/shop/v1/catalog/products/route"),
      categories: await import("@/app/api/shop/v1/catalog/categories/route"),
      admin: await import("./server/admin"),
      auth: await import("./server/auth"),
    };
  });

  beforeEach(() => {
    admin.roles = ["admin"];
    r?.auth.resetRateLimits();
  });

  afterAll(async () => {
    if (!sql) return;
    const sellers = [ids.sellerA, ids.sellerB, ids.sellerOff];
    await sql`delete from shop.api_audit_log where seller_id in ${sql(sellers)}`;
    await sql`delete from shop.offers where seller_id in ${sql(sellers)}`;
    await sql`delete from shop.offers where product_id = ${ids.catalogProduct}::uuid`;
    await sql`delete from shop.products where owner_seller_id in ${sql(sellers)} or id = ${ids.catalogProduct}::uuid`;
    await sql`delete from shop.api_tokens where seller_id in ${sql(sellers)}`;
    await sql`delete from shop.sellers where id in ${sql(sellers)}`;
    await sql`delete from shop.categories where id = ${ids.category}::uuid`;
    await sql.end({ timeout: 5 });
  });

  // -------------------------------------------------------------------------------------------
  it("authenticates: me works; missing, malformed, unknown, revoked, expired and inactive-seller tokens are 401", async () => {
    const me = await call(r.me.GET, { token: tokens.a, path: "/me" });
    expect(me.status).toBe(200);
    expect(me.body.data.seller.id).toBe(ids.sellerA);
    expect(me.headers.get("cache-control")).toBe("no-store");
    for (const token of [null, "abc", `lsv_${"x".repeat(43)}`, tokens.revoked, tokens.expired, tokens.off]) {
      const response = await call(r.me.GET, { token, path: "/me" });
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("unauthorized");
      expect(response.headers.get("www-authenticate")).toContain("Bearer");
    }
    const [row] = await sql!`select last_used_at, last_used_ip from shop.api_tokens where name = ${`${tag}-a`}`;
    expect(row.last_used_at).not.toBeNull();
    expect(row.last_used_ip).toBe("203.0.113.7");
  });

  let productId = "";
  let offerId = "";

  it("creates a product as a pending draft owned by the seller, with its offer and no automatic L Sevin offer", async () => {
    const created = await call(r.products.POST, {
      token: tokens.a, method: "POST", path: "/products",
      body: {
        name: { fa: `ویتامین ${tag}`, en: "Vitamin D3" },
        shortDescription: { fa: "۶۰ کپسول" },
        categoryIds: [ids.category], primaryCategoryId: ids.category,
        images: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
        offer: { price: 450000, compareAtPrice: 500000, stockQuantity: 12, sellerSku: "D3" },
      },
    });
    expect(created.status).toBe(201);
    const product = created.body.data;
    productId = product.id;
    expect(product).toMatchObject({ status: "draft", review: { status: "pending" }, slug: "vitamin-d3", currency: "IRR", categoryIds: [ids.category], images: ["https://example.com/a.jpg", "https://example.com/b.jpg"] });
    const offers = await sql!`select seller_id::text as seller_id, price::float as price, stock_quantity from shop.offers where product_id = ${productId}::uuid and deleted_at is null`;
    // Regression: 0086's trigger also gave the default seller (L Sevin) an offer on every new product.
    expect(offers).toEqual([{ seller_id: ids.sellerA, price: 450000, stock_quantity: 12 }]);
    const [db] = await sql!`select owner_seller_id::text as owner, status::text as status from shop.products where id = ${productId}::uuid`;
    expect(db).toEqual({ owner: ids.sellerA, status: "draft" });
    offerId = (await call(r.offers.GET, { token: tokens.a, path: "/offers" })).body.data.find((o: { productId: string }) => o.productId === productId).id;
  });

  it("validates: bad bodies are 422 with field details, unknown categories are rejected, huge bodies 413", async () => {
    const bad = await call(r.products.POST, { token: tokens.a, method: "POST", path: "/products", body: { name: {}, offer: { price: -5 } } });
    expect(bad.status).toBe(422);
    expect(bad.body.error.code).toBe("validation_error");
    expect(bad.body.error.details.map((x: { field: string }) => x.field)).toEqual(expect.arrayContaining(["name", "offer.price"]));
    const notJson = await call(r.products.POST, { token: tokens.a, method: "POST", path: "/products", rawBody: "{oops" });
    expect(notJson.status).toBe(422);
    const unknownCategory = await call(r.products.POST, { token: tokens.a, method: "POST", path: "/products", body: { name: { fa: "x" }, categoryIds: [catalogId()] } });
    expect(unknownCategory.status).toBe(422);
    const huge = await call(r.products.POST, { token: tokens.a, method: "POST", path: "/products", rawBody: JSON.stringify({ name: { fa: "x".repeat(300_000) } }) });
    expect(huge.status).toBe(413);
    const [{ count }] = await sql!`select count(*)::int as count from shop.products where owner_seller_id = ${ids.sellerA}::uuid`;
    expect(count).toBe(1);
  });

  it("enforces scopes per operation", async () => {
    expect((await call(r.products.GET, { token: tokens.aRead, path: "/products" })).status).toBe(200);
    const write = await call(r.products.POST, { token: tokens.aRead, method: "POST", path: "/products", body: { name: { fa: "x" } } });
    expect(write.status).toBe(403);
    expect(write.body.error.details.requiredScope).toBe("products:write");
    expect((await call(r.product.DELETE, { token: tokens.aRead, method: "DELETE", params: { productId } })).status).toBe(403);
    expect((await call(r.offer.PATCH, { token: tokens.aRead, method: "PATCH", params: { offerId }, body: { price: 1 } })).status).toBe(403);
    expect((await call(r.catalog.GET, { token: tokens.aRead, path: "/catalog/products" })).status).toBe(403);
  });

  it("isolates sellers: B cannot see, list, change or delete A's product or offer (404, nothing written)", async () => {
    expect((await call(r.product.GET, { token: tokens.b, params: { productId } })).status).toBe(404);
    expect((await call(r.products.GET, { token: tokens.b, path: "/products" })).body.total).toBe(0);
    expect((await call(r.product.PATCH, { token: tokens.b, method: "PATCH", params: { productId }, body: { slug: "hijack" } })).status).toBe(404);
    expect((await call(r.product.DELETE, { token: tokens.b, method: "DELETE", params: { productId } })).status).toBe(404);
    expect((await call(r.offer.GET, { token: tokens.b, params: { offerId } })).status).toBe(404);
    expect((await call(r.offer.PATCH, { token: tokens.b, method: "PATCH", params: { offerId }, body: { price: 1 } })).status).toBe(404);
    expect((await call(r.offer.DELETE, { token: tokens.b, method: "DELETE", params: { offerId } })).status).toBe(404);
    expect((await call(r.offers.GET, { token: tokens.b, path: "/offers" })).body.total).toBe(0);
    // B may not attach an offer to A's (unapproved) product either.
    expect((await call(r.offers.POST, { token: tokens.b, method: "POST", path: "/offers", body: { productId, price: 1 } })).status).toBe(404);
    const [p] = await sql!`select slug, deleted_at from shop.products where id = ${productId}::uuid`;
    expect(p).toEqual({ slug: "vitamin-d3", deleted_at: null });
    const [o] = await sql!`select price::float as price, deleted_at from shop.offers where id = ${offerId}::uuid`;
    expect(o).toEqual({ price: 450000, deleted_at: null });
    expect((await call(r.product.GET, { token: tokens.b, params: { productId: "not-a-guid" } })).status).toBe(404);
  });

  it("edits an unapproved product in place and keeps it in review", async () => {
    const edited = await call(r.product.PATCH, { token: tokens.a, method: "PATCH", params: { productId }, body: { shortDescription: { fa: "۹۰ کپسول" } } });
    expect(edited.status).toBe(200);
    expect(edited.body.pendingReview).toBe(false);
    expect(edited.body.data.shortDescription).toEqual({ fa: "۹۰ کپسول" });
    expect(edited.body.data.review.status).toBe("pending");
  });

  it("admin review: approve publishes; later edits wait as a change request until approved", async () => {
    const queue = await r.admin.listReviewQueue();
    expect(queue.products.map((p) => p.id)).toContain(productId);
    await r.admin.reviewNewProduct({ productId, decision: "approve" });
    const live = await call(r.product.GET, { token: tokens.a, params: { productId } });
    expect(live.body.data).toMatchObject({ status: "active", review: { status: "approved" } });

    const edit = await call(r.product.PATCH, { token: tokens.a, method: "PATCH", params: { productId }, body: { name: { fa: "ویتامین جدید" } } });
    expect(edit.status).toBe(202);
    expect(edit.body.pendingReview).toBe(true);
    expect(edit.body.data.name.fa).toBe(`ویتامین ${tag}`); // live product unchanged
    expect(edit.body.data.review.pendingChanges).toEqual({ name: { fa: "ویتامین جدید" } });
    // A second edit merges into the same pending request.
    await call(r.product.PATCH, { token: tokens.a, method: "PATCH", params: { productId }, body: { slug: "vitamin-new" } });
    const pending = await sql!`select id::text as id, changes from shop.product_change_requests where product_id = ${productId}::uuid and status = 'pending'`;
    expect(pending).toHaveLength(1);
    expect(pending[0].changes).toEqual({ name: { fa: "ویتامین جدید" }, slug: "vitamin-new" });

    await r.admin.reviewChangeRequest({ requestId: pending[0].id, decision: "approve" });
    const after = await call(r.product.GET, { token: tokens.a, params: { productId } });
    expect(after.body.data).toMatchObject({ name: { fa: "ویتامین جدید" }, slug: "vitamin-new", review: { pendingChanges: null } });
  });

  it("admin review: rejecting needs a reason, which the seller then sees", async () => {
    const second = await call(r.products.POST, { token: tokens.a, method: "POST", path: "/products", body: { name: { fa: `دوم ${tag}` } } });
    await expect(r.admin.reviewNewProduct({ productId: second.body.data.id, decision: "reject" })).rejects.toThrow(/reason/);
    await r.admin.reviewNewProduct({ productId: second.body.data.id, decision: "reject", note: "تصویر ندارد" });
    const seen = await call(r.product.GET, { token: tokens.a, params: { productId: second.body.data.id } });
    expect(seen.body.data).toMatchObject({ status: "draft", review: { status: "rejected", note: "تصویر ندارد" } });
    // Fixing it puts it back in the queue.
    const fixed = await call(r.product.PATCH, { token: tokens.a, method: "PATCH", params: { productId: second.body.data.id }, body: { images: ["https://example.com/c.jpg"] } });
    expect(fixed.body.data.review).toMatchObject({ status: "pending", note: null });
  });

  it("offers: price/stock apply immediately; validation; one offer per item; catalog products only when live and unowned", async () => {
    const patched = await call(r.offer.PATCH, { token: tokens.a, method: "PATCH", params: { offerId }, body: { price: 430000, stockQuantity: 3 } });
    expect(patched.status).toBe(200);
    expect(patched.body.data).toMatchObject({ price: 430000, stockQuantity: 3, compareAtPrice: 500000, currency: "IRR" });
    expect((await call(r.offer.PATCH, { token: tokens.a, method: "PATCH", params: { offerId }, body: { price: 600000 } })).status).toBe(422); // above compareAtPrice
    const dup = await call(r.offers.POST, { token: tokens.a, method: "POST", path: "/offers", body: { productId, price: 1 } });
    expect(dup.status).toBe(409);

    const catalog = await call(r.catalog.GET, { token: tokens.b, path: "/catalog/products", });
    expect(catalog.body.data.map((p: { id: string }) => p.id)).toContain(ids.catalogProduct);
    expect(catalog.body.data.map((p: { id: string }) => p.id)).not.toContain(productId); // seller products are not catalog
    const bOffer = await call(r.offers.POST, { token: tokens.b, method: "POST", path: "/offers", body: { productId: ids.catalogProduct, price: 95000, stockQuantity: 4 } });
    expect(bOffer.status).toBe(201);
    expect(bOffer.body.data.currency).toBe("IRR");
    const categories = await call(r.categories.GET, { token: tokens.b, path: "/catalog/categories" });
    expect(categories.body.data.map((c: { id: string }) => c.id)).toContain(ids.category);

    const removed = await call(r.offer.DELETE, { token: tokens.b, method: "DELETE", params: { offerId: bOffer.body.data.id } });
    expect(removed.status).toBe(204);
    expect((await call(r.offer.GET, { token: tokens.b, params: { offerId: bOffer.body.data.id } })).status).toBe(404);
  });

  it("deletes a product with its offers and pending edits; audit log records the writes", async () => {
    await call(r.product.PATCH, { token: tokens.a, method: "PATCH", params: { productId }, body: { slug: "pending-before-delete" } });
    const deleted = await call(r.product.DELETE, { token: tokens.a, method: "DELETE", params: { productId } });
    expect(deleted.status).toBe(204);
    expect((await call(r.product.GET, { token: tokens.a, params: { productId } })).status).toBe(404);
    expect((await call(r.product.DELETE, { token: tokens.a, method: "DELETE", params: { productId } })).status).toBe(404);
    const [state] = await sql!`
      select (select count(*)::int from shop.offers where product_id = ${productId}::uuid and deleted_at is null) as live_offers,
             (select count(*)::int from shop.product_change_requests where product_id = ${productId}::uuid and status = 'pending') as pending
    `;
    expect(state).toEqual({ live_offers: 0, pending: 0 });
    const actions = (await sql!`select action from shop.api_audit_log where seller_id = ${ids.sellerA}::uuid order by id`).map((row) => row.action);
    expect(actions).toEqual(expect.arrayContaining(["product.create", "product.update", "product.change_request", "offer.update", "product.delete"]));
  });

  it("admin tokens: only admins; no token for the default seller; secret returned once and only its hash stored; revoke takes effect", async () => {
    admin.roles = ["customer"];
    await expect(r.admin.listApiTokens()).rejects.toThrow(/Forbidden/);
    await expect(r.admin.createApiToken({ name: "x", sellerId: ids.sellerA, scopes: ["products:read"], expiresInDays: 30 })).rejects.toThrow(/Forbidden/);
    admin.roles = ["admin"];
    const [defaultSeller] = await sql!`select id::text as id from shop.sellers where is_default limit 1`;
    await expect(r.admin.createApiToken({ name: "x", sellerId: defaultSeller.id, scopes: ["products:read"], expiresInDays: null })).rejects.toThrow(/default seller/);
    await expect(r.admin.createApiToken({ name: "x", sellerId: ids.sellerA, scopes: ["nope"], expiresInDays: null })).rejects.toThrow(/permission/);

    const created = await r.admin.createApiToken({ name: `${tag}-admin`, sellerId: ids.sellerB, scopes: ["products:read"], expiresInDays: 30 });
    expect(created.token).toMatch(/^lsv_/);
    const [stored] = await sql!`select token_hash, token_prefix, expires_at, created_by_user_id::text as by from shop.api_tokens where id = ${created.id}::uuid`;
    expect(stored.token_hash).toBe(createHash("sha256").update(created.token).digest("hex"));
    expect(JSON.stringify(stored)).not.toContain(created.token);
    expect(stored.by).toBe(admin.userId);
    expect((await call(r.me.GET, { token: created.token, path: "/me" })).status).toBe(200);
    await r.admin.revokeApiToken(created.id);
    expect((await call(r.me.GET, { token: created.token, path: "/me" })).status).toBe(401);
  });

  it("rate limits each token", async () => {
    r.auth.resetRateLimits();
    let last = 0;
    for (let i = 0; i <= r.auth.SHOP_API_RATE_LIMIT_PER_MINUTE; i += 1) last = (await call(r.me.GET, { token: tokens.aRead, path: "/me" })).status;
    expect(last).toBe(429);
    expect((await call(r.me.GET, { token: tokens.b, path: "/me" })).status).toBe(200);
  });
});
