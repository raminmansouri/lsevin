import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import postgres from "postgres";
import { randomUUID } from "node:crypto";

import { blocksToLexical, textToLexical } from "../lib/lexical";

/**
 * Real-Postgres checks for admin → Editorial: guarded actions, insert/update,
 * validation vs infrastructure errors, and the public reads (locale picking,
 * entity FAQ replacing the scope-wide set). Opt-in: needs
 * ACCOUNTING_TEST_DATABASE_URL pointing at a LOCAL database with migrations
 * 0085/0086 applied (`pnpm test:local-env`). Rows it creates are removed.
 */

const admin = vi.hoisted(() => ({ isAdmin: true, userId: "9b2a3c1d-1111-b222-2333-444455556666" as string | undefined }));
vi.mock("@/lib/auth/admin-guard", () => ({
  getAdminContext: vi.fn(async () => ({ isAdmin: admin.isAdmin, userId: admin.userId })),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn(), unstable_cache: (fn: unknown) => fn }));

const url = process.env.ACCOUNTING_TEST_DATABASE_URL;
const host = url ? new URL(url).hostname : "";
const LOCAL = ["localhost", "127.0.0.1", "::1"].includes(host);
const sql = LOCAL ? postgres(url as string, { max: 2, prepare: false }) : null;
const d = LOCAL ? describe : describe.skip;

// Production-shaped id: a GUID without RFC version/variant bits.
const catalogId = () => {
  const p = randomUUID().split("-");
  p[2] = `b${p[2].slice(1)}`;
  p[3] = `2${p[3].slice(1)}`;
  return p.join("-");
};

type Actions = typeof import("../actions");
type Repo = typeof import("./repository");
let actions: Actions;
let repo: Repo;
let pageBackup: Record<string, unknown> | null = null;
const createdFaqs: string[] = [];
const providerTypeId = catalogId();
const tag = `it-editorial-${Date.now()}`;

d("site content (real database)", () => {
  beforeAll(async () => {
    const s = sql!;
    // Keep whatever the seed or an earlier run put in pricing-fees; the test restores it.
    pageBackup = (await s`select * from content.site_pages where slug = 'pricing-fees'`)[0] ?? null;
    await s`delete from content.site_pages where slug = 'pricing-fees'`;
    await s`insert into category.provider_types (id, name_translations, description_translations, is_active, is_addon_only)
            values (${providerTypeId}, ${s.json({ "en-US": tag })}, '{}', true, false)`;
    actions = await import("../actions");
    repo = await import("./repository");
  });

  beforeEach(() => {
    admin.isAdmin = true;
  });

  afterAll(async () => {
    if (!sql) return;
    if (createdFaqs.length) await sql`delete from content.faq_items where id in ${sql(createdFaqs)}`;
    await sql`delete from content.site_pages where slug = 'pricing-fees'`;
    if (pageBackup) await sql`insert into content.site_pages ${sql(pageBackup)}`;
    await sql`delete from category.provider_types where id = ${providerTypeId}`;
    await sql.end();
  });

  const page = (overrides: Record<string, unknown> = {}) => ({
    slug: "pricing-fees" as const,
    title: { translations: { "en-US": `${tag} Pricing`, "fa-IR": "قیمت‌ها و هزینه‌ها" } },
    summary: { translations: { "en-US": "What you pay and when." } },
    body: {
      translations: {
        "en-US": blocksToLexical([{ type: "h2", text: "Prices" }, { type: "p", text: "Prices are shown before you pay." }]),
        "fa-IR": blocksToLexical([{ type: "p", text: "قیمت پیش از پرداخت نمایش داده می‌شود." }], "rtl"),
      },
    },
    isPublished: true,
    showInFooter: true,
    displayOrder: 4,
    ...overrides,
  });

  it("refuses non-admins without writing", async () => {
    admin.isAdmin = false;
    const result = await actions.saveSitePageAction(page());
    expect(result).toMatchObject({ ok: false, code: "FORBIDDEN" });
    expect(await sql!`select 1 from content.site_pages where slug = 'pricing-fees'`).toHaveLength(0);
  });

  it("returns field errors for invalid input, not a server failure", async () => {
    const result = await actions.saveSitePageAction(page({ body: { translations: {} } }));
    expect(result).toMatchObject({ ok: false, code: "INVALID" });
  });

  it("creates, updates and publishes a page; public reads pick the locale", async () => {
    const created = await actions.saveSitePageAction(page({ isPublished: false }));
    expect(created.ok).toBe(true);
    expect(await repo.getPublishedSitePage("pricing-fees", "en")).toBeNull();

    const updated = await actions.saveSitePageAction(page());
    expect(updated.ok).toBe(true);
    const rows = await sql!`select count(*)::int as n, max(updated_by::text) as by from content.site_pages where slug = 'pricing-fees'`;
    expect(rows[0]).toMatchObject({ n: 1, by: admin.userId });

    const en = await repo.getPublishedSitePage("pricing-fees", "en");
    expect(en).toMatchObject({ isFallback: false, page: { title: `${tag} Pricing` } });
    expect(en?.locales.sort()).toEqual(["en", "fa"]);
    // No German text: English is shown, flagged as a fallback (rendered noindex).
    const de = await repo.getPublishedSitePage("pricing-fees", "de");
    expect(de).toMatchObject({ isFallback: true, page: { title: `${tag} Pricing` } });
    expect((await repo.getFooterPages("fa")).find((link) => link.slug === "pricing-fees")?.title).toBe("قیمت‌ها و هزینه‌ها");
    expect((await repo.getPublishedSitePageIndex()).find((entry) => entry.slug === "pricing-fees")?.locales.sort()).toEqual(["en", "fa"]);
  });

  it("does not store an emptied editor tab as a translation", async () => {
    await actions.saveSitePageAction(
      page({ body: { translations: { ...page().body.translations, "de-DE": blocksToLexical([{ type: "p", text: "" }]) } } }),
    );
    const [row] = await sql!`select body_translations from content.site_pages where slug = 'pricing-fees'`;
    expect(Object.keys(row.body_translations).sort()).toEqual(["en-US", "fa-IR"]);
  });

  it("saves FAQs; an entity's own FAQ replaces the scope-wide set", async () => {
    const qa = (q: string) => ({
      question: { translations: { "en-US": q } },
      answer: { translations: { "en-US": textToLexical(`${q} answer`) } },
    });
    const general = await actions.saveFaqAction({ scope: "provider_type", ...qa(`${tag} general`) });
    const specific = await actions.saveFaqAction({ scope: "provider_type", entityId: providerTypeId, ...qa(`${tag} specific`) });
    expect(general.ok && specific.ok).toBe(true);
    if (general.ok) createdFaqs.push(general.data.id);
    if (specific.ok) createdFaqs.push(specific.data.id);

    const forEntity = await repo.getFaqs({ scope: "provider_type", entityId: providerTypeId }, "en");
    expect(forEntity.map((item) => item.question)).toEqual([`${tag} specific`]);
    const forOther = await repo.getFaqs({ scope: "provider_type", entityId: catalogId() }, "en");
    expect(forOther.map((item) => item.question)).toContain(`${tag} general`);
    expect(await repo.getFaqs({ scope: "provider_type", entityId: catalogId(), exact: true }, "en")).toEqual([]);
    // No Persian text: nothing in Persian (never another language's text).
    expect((await repo.getFaqs({ scope: "provider_type", entityId: providerTypeId }, "fa")).length).toBe(0);
  });

  it("rejects an FAQ for an entity that does not exist", async () => {
    const result = await actions.saveFaqAction({
      scope: "provider_type",
      entityId: catalogId(),
      question: { translations: { "en-US": "Q?" } },
      answer: { translations: { "en-US": textToLexical("A.") } },
    });
    expect(result).toMatchObject({ ok: false, code: "NOT_FOUND" });
  });

  it("updates and deletes an FAQ; deleting twice is NOT_FOUND", async () => {
    const id = createdFaqs[0];
    const updated = await actions.saveFaqAction({
      id,
      scope: "provider_type",
      isActive: false,
      question: { translations: { "en-US": `${tag} general v2` } },
      answer: { translations: { "en-US": textToLexical("v2") } },
    });
    expect(updated.ok).toBe(true);
    expect((await repo.getAdminFaq(id))?.isActive).toBe(false);
    expect(await actions.deleteFaqAction({ id })).toMatchObject({ ok: true });
    expect(await actions.deleteFaqAction({ id })).toMatchObject({ ok: false, code: "NOT_FOUND" });
    admin.isAdmin = false;
    expect(await actions.deleteFaqAction({ id: createdFaqs[1] })).toMatchObject({ ok: false, code: "FORBIDDEN" });
  });
});
