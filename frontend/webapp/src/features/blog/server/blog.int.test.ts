import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { lexicalFromText } from "../blocks/lexical";

/**
 * Real-Postgres checks for the blog: guarded actions, validation vs infrastructure errors, the
 * publish rules, per-language visibility, slug history, revisions/autosave and the public reads.
 * Opt-in: needs ACCOUNTING_TEST_DATABASE_URL pointing at a LOCAL database with migration 0120
 * applied (`pnpm test:local-env --suite blog`). Every row it creates is removed.
 */

const admin = vi.hoisted(() => ({ isAdmin: true, userId: "9b2a3c1d-1111-b222-2333-444455556666" as string | undefined }));
vi.mock("@/lib/auth/admin-guard", () => ({
  getAdminContext: vi.fn(async () => ({ isAdmin: admin.isAdmin, userId: admin.userId })),
  adminMay: (ctx: { isAdmin: boolean }) => ctx.isAdmin,
}));
const revalidate = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidateTag: revalidate, revalidatePath: vi.fn(), unstable_cache: (fn: unknown) => fn }));

const url = process.env.ACCOUNTING_TEST_DATABASE_URL;
const host = url ? new URL(url).hostname : "";
const LOCAL = ["localhost", "127.0.0.1", "::1"].includes(host);
const sql = LOCAL ? postgres(url as string, { max: 4, prepare: false }) : null;
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
type Media = typeof import("./media");
let actions: Actions;
let repo: Repo;
let media: Media;

const tag = `itblog${Date.now().toString(36)}`;
const slugOf = (name: string) => `${tag}-${name}`;
const createdPosts: string[] = [];
const createdCategories: string[] = [];
const createdAuthors: string[] = [];
const mediaIds: string[] = [];
const FA = "fa-IR";
const EN = "en-US";

const heading = (text: string) => ({ id: `h-${Math.random().toString(36).slice(2, 8)}`, type: "heading", level: 2, text });
const para = (text: string) => ({ id: `p-${Math.random().toString(36).slice(2, 8)}`, type: "richtext", lexical: lexicalFromText(text) });

async function newPost(name: string, title = `Post ${name}`, localeKey = FA) {
  const result = await actions.createPostAction({ slug: slugOf(name), title, localeKey });
  if (!result.ok) throw new Error(`createPost failed: ${JSON.stringify(result)}`);
  const id = (result as { ok: true; data: { id: string } }).data.id;
  createdPosts.push(id);
  return id;
}

const translation = (postId: string, over: Record<string, unknown> = {}) => ({
  postId,
  localeKey: FA,
  title: "عنوان تست",
  excerpt: "چکیده",
  blocks: [heading("بخش اول"), para("متن مقاله")],
  seoTitle: "",
  seoDescription: "",
  ogMedia: null,
  intent: "save" as const,
  ...over,
});

d("blog (real database)", () => {
  beforeAll(async () => {
    actions = await import("../actions");
    repo = await import("./repository");
    media = await import("./media");
  });

  beforeEach(() => {
    admin.isAdmin = true;
    revalidate.mockClear();
  });

  afterAll(async () => {
    if (!sql) return;
    if (createdPosts.length) await sql`delete from content.posts where id::text in ${sql(createdPosts)}`;
    await sql`delete from content.posts where slug like ${`${tag}-%`}`;
    if (createdCategories.length) await sql`delete from content.post_categories where id::text in ${sql(createdCategories)}`;
    await sql`delete from content.post_categories where slug like ${`${tag}-%`}`;
    if (createdAuthors.length) await sql`delete from content.post_authors where id::text in ${sql(createdAuthors)}`;
    if (mediaIds.length) await sql`delete from media.media_library where id::text in ${sql(mediaIds)}`;
    await sql.end();
  });

  describe("creating and saving", () => {
    it("creates a post with one draft translation and revalidates the blog cache", async () => {
      const id = await newPost("create", "Created post");
      const rows = await sql!`select slug from content.posts where id::text = ${id}`;
      expect(rows[0].slug).toBe(slugOf("create"));
      const translations = await sql!`select locale_key, status, title from content.post_translations where post_id::text = ${id}`;
      expect(translations).toHaveLength(1);
      expect(translations[0]).toMatchObject({ locale_key: FA, status: "draft", title: "Created post" });
      expect(revalidate).toHaveBeenCalledWith("global:blog");
    });

    it("refuses a duplicate slug as CONFLICT and an invalid slug as INVALID", async () => {
      await newPost("dupe");
      const again = await actions.createPostAction({ slug: slugOf("dupe"), title: "Other", localeKey: FA });
      expect(again).toMatchObject({ ok: false, code: "CONFLICT" });
      const bad = await actions.createPostAction({ slug: "Not A Slug!", title: "x", localeKey: FA });
      expect(bad).toMatchObject({ ok: false, code: "INVALID" });
      const noTitle = await actions.createPostAction({ slug: slugOf("notitle"), title: "  ", localeKey: FA });
      expect(noTitle).toMatchObject({ ok: false, code: "INVALID" });
      const badLocale = await actions.createPostAction({ slug: slugOf("badlocale"), title: "x", localeKey: "xx" });
      expect(badLocale).toMatchObject({ ok: false, code: "INVALID" });
      expect(await sql!`select 1 from content.posts where slug = ${slugOf("notitle")}`).toHaveLength(0);
    });

    it("saves blocks and reads them back; a save adds a revision and clears the autosave", async () => {
      const id = await newPost("save");
      const auto = await actions.autosaveTranslationAction({ postId: id, localeKey: FA, title: "draft", excerpt: "", blocks: [heading("temp")] });
      expect(auto.ok).toBe(true);

      const saved = await actions.saveTranslationAction(translation(id));
      expect(saved).toMatchObject({ ok: true, data: { status: "draft" } });

      const post = await repo.getAdminPost(id);
      expect(post!.translations[FA].title).toBe("عنوان تست");
      expect(post!.translations[FA].blocks.map((b) => b.type)).toEqual(["heading", "richtext"]);
      expect(post!.translations[FA].autosave).toBeNull();
      const revisions = await sql!`select kind from content.post_revisions where post_id::text = ${id} order by created_at`;
      expect(revisions.map((r) => r.kind)).toEqual(["save"]);
    });

    it("rejects invalid blocks with block-level issues and writes nothing", async () => {
      const id = await newPost("invalid");
      const before = await sql!`select updated_at, blocks from content.post_translations where post_id::text = ${id}`;
      const result = await actions.saveTranslationAction(
        translation(id, { blocks: [heading("ok"), { id: "bad", type: "image", mediaId: "javascript:alert(1)", alt: "", caption: "" }, { id: "evil", type: "html", html: "<script>" }] }),
      );
      expect(result).toMatchObject({ ok: false, code: "INVALID" });
      const issues = (result as { blockIssues?: { index: number }[] }).blockIssues ?? [];
      expect(issues.map((issue) => issue.index)).toEqual(expect.arrayContaining([1, 2]));
      const after = await sql!`select updated_at, blocks from content.post_translations where post_id::text = ${id}`;
      expect(after[0].blocks).toEqual(before[0].blocks);
      expect(String(after[0].updated_at)).toBe(String(before[0].updated_at));
    });

    it("sanitises stored text: an unsafe link keeps its words but loses the link", async () => {
      const id = await newPost("sanitise");
      const lexical = {
        root: { type: "root", children: [{ type: "paragraph", children: [{ type: "link", url: "javascript:alert(1)", children: [{ type: "text", text: "click", format: 0 }] }] }] },
      };
      const result = await actions.saveTranslationAction(translation(id, { blocks: [{ id: "r1", type: "richtext", lexical }] }));
      expect(result.ok).toBe(true);
      const [row] = await sql!`select blocks::text as blocks from content.post_translations where post_id::text = ${id}`;
      expect(row.blocks).not.toContain("javascript");
      expect(row.blocks).toContain("click");
    });

    it("ignores fields the caller must not control (status cannot be set through a plain save)", async () => {
      const id = await newPost("massassign");
      const result = await actions.saveTranslationAction({ ...translation(id), status: "published", publishedAt: undefined } as never);
      expect(result).toMatchObject({ ok: true, data: { status: "draft" } });
      expect((await sql!`select status from content.post_translations where post_id::text = ${id}`)[0].status).toBe("draft");
    });

    it("keeps only 30 manual revisions and one autosave row per language", async () => {
      const id = await newPost("prune");
      for (let i = 0; i < 33; i++) {
        const r = await actions.saveTranslationAction(translation(id, { title: `v${i}` }));
        expect(r.ok).toBe(true);
      }
      await actions.autosaveTranslationAction({ postId: id, localeKey: FA, title: "a1", excerpt: "", blocks: [] });
      await actions.autosaveTranslationAction({ postId: id, localeKey: FA, title: "a2", excerpt: "", blocks: [] });
      const saves = await sql!`select count(*)::int as n from content.post_revisions where post_id::text = ${id} and kind = 'save'`;
      const autos = await sql!`select title from content.post_revisions where post_id::text = ${id} and kind = 'autosave'`;
      expect(saves[0].n).toBe(30);
      expect(autos).toHaveLength(1);
      expect(autos[0].title).toBe("a2");
      // The newest saves survive.
      const titles = await sql!`select title from content.post_revisions where post_id::text = ${id} and kind = 'save' order by created_at desc limit 1`;
      expect(titles[0].title).toBe("v32");
    });

    it("recovers an autosave newer than the saved copy", async () => {
      const id = await newPost("recover");
      await actions.saveTranslationAction(translation(id, { title: "saved title" }));
      await new Promise((resolve) => setTimeout(resolve, 15));
      await actions.autosaveTranslationAction({ postId: id, localeKey: FA, title: "unsaved title", excerpt: "", blocks: [heading("unsaved")] });
      const post = await repo.getAdminPost(id);
      expect(post!.translations[FA].title).toBe("saved title");
      expect(post!.translations[FA].autosave).toMatchObject({ title: "unsaved title" });
    });

    it("concurrent saves of one language both succeed and leave a single row (last writer wins)", async () => {
      const id = await newPost("race");
      const [a, b] = await Promise.all([actions.saveTranslationAction(translation(id, { title: "A" })), actions.saveTranslationAction(translation(id, { title: "B" }))]);
      expect(a.ok && b.ok).toBe(true);
      const rows = await sql!`select title from content.post_translations where post_id::text = ${id}`;
      expect(rows).toHaveLength(1);
      expect(["A", "B"]).toContain(rows[0].title);
    });
  });

  describe("publishing and public reads", () => {
    const readyBlocks = () => [heading("بخش"), para("متن کامل مقاله برای انتشار")];

    it("refuses to publish an image without alt text, then publishes once fixed", async () => {
      const id = await newPost("ready");
      const fileId = catalogId();
      const blocks = [...readyBlocks(), { id: "img1", type: "image", mediaId: fileId, alt: "", caption: "", decorative: false }];
      const refused = await actions.saveTranslationAction(translation(id, { blocks, intent: "publish" }));
      expect(refused).toMatchObject({ ok: false, code: "NOT_READY" });
      expect((refused as { readiness: { code: string }[] }).readiness.map((i) => i.code)).toContain("image-missing-alt");
      expect((await sql!`select status from content.post_translations where post_id::text = ${id}`)[0].status).toBe("draft");

      const fixed = [...readyBlocks(), { id: "img1", type: "image", mediaId: fileId, alt: "A clinic room", caption: "", decorative: false }];
      const ok = await actions.saveTranslationAction(translation(id, { blocks: fixed, intent: "publish" }));
      expect(ok).toMatchObject({ ok: true, data: { status: "published" } });
      expect((await sql!`select status, published_at from content.post_translations where post_id::text = ${id}`)[0].published_at).not.toBeNull();
      const kinds = await sql!`select kind from content.post_revisions where post_id::text = ${id} order by created_at`;
      expect(kinds.map((k) => k.kind)).toContain("publish");
    });

    it("shows a published language, hides drafts, falls back with isFallback, and unpublish hides it again", async () => {
      const id = await newPost("visible");
      await actions.saveTranslationAction(translation(id, { title: "Persian title", blocks: readyBlocks(), intent: "publish" }));
      // English exists only as a draft.
      await actions.saveTranslationAction(translation(id, { localeKey: EN, title: "English draft", blocks: readyBlocks() }));

      const fa = await repo.getPublishedPost(slugOf("visible"), "fa");
      expect(fa).toMatchObject({ isFallback: false });
      expect(fa!.post.title).toBe("Persian title");
      expect(fa!.locales).toEqual(["fa"]);

      // en has no PUBLISHED translation: the Persian one is shown as a fallback (and would be noindex).
      const en = await repo.getPublishedPost(slugOf("visible"), "en");
      expect(en).toMatchObject({ isFallback: true });
      expect(en!.post.title).toBe("Persian title");

      const off = await actions.saveTranslationAction(translation(id, { title: "Persian title", blocks: readyBlocks(), intent: "unpublish" }));
      expect(off).toMatchObject({ ok: true, data: { status: "draft" } });
      expect(await repo.getPublishedPost(slugOf("visible"), "fa")).toBeNull();
    });

    it("hides a post scheduled for the future and shows it once the date passes", async () => {
      const id = await newPost("scheduled");
      const future = new Date(Date.now() + 3_600_000).toISOString();
      const result = await actions.saveTranslationAction(translation(id, { blocks: readyBlocks(), intent: "publish", publishedAt: future }));
      expect(result).toMatchObject({ ok: true, data: { status: "published" } });
      expect(await repo.getPublishedPost(slugOf("scheduled"), "fa")).toBeNull();
      expect((await repo.getPublishedPosts("fa")).items.map((p) => p.slug)).not.toContain(slugOf("scheduled"));

      await sql!`update content.post_translations set published_at = now() - interval '1 minute' where post_id::text = ${id}`;
      expect(await repo.getPublishedPost(slugOf("scheduled"), "fa")).not.toBeNull();
    });

    it("lists published posts per language with category filter, newest first, and paginates", async () => {
      const category = await actions.saveCategoryAction({ slug: slugOf("cat"), name: { [FA]: "دسته", [EN]: "Category" }, sortOrder: 1, isActive: true });
      expect(category.ok).toBe(true);
      const categoryId = (category as { ok: true; data: { id: string } }).data.id;
      createdCategories.push(categoryId);

      const ids: string[] = [];
      for (const n of ["l1", "l2", "l3"]) {
        const id = await newPost(n, `Listed ${n}`);
        ids.push(id);
        await actions.savePostSettingsAction({ id, slug: slugOf(n), categoryId, isFeatured: false, isMedical: false });
        await actions.saveTranslationAction(translation(id, { title: `Listed ${n}`, blocks: readyBlocks(), intent: "publish" }));
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      const all = await repo.getPublishedPosts("fa", { categorySlug: slugOf("cat"), pageSize: 2 });
      expect(all.total).toBe(3);
      expect(all.items).toHaveLength(2);
      expect(all.items[0].slug).toBe(slugOf("l3")); // newest first
      const second = await repo.getPublishedPosts("fa", { categorySlug: slugOf("cat"), pageSize: 2, page: 2 });
      expect(second.items.map((p) => p.slug)).toEqual([slugOf("l1")]);
      // No English translation was published: the English list is empty for this category.
      expect((await repo.getPublishedPosts("en", { categorySlug: slugOf("cat") })).total).toBe(0);
      expect((await repo.getPublicCategories("fa")).find((c) => c.slug === slugOf("cat"))).toMatchObject({ name: "دسته", count: 3 });
      const related = await repo.getRelatedPosts(ids[0], "fa", 5);
      expect(related.map((p) => p.slug)).toEqual(expect.arrayContaining([slugOf("l2"), slugOf("l3")]));
    });

    // Regression (found by the Playwright preview test): previewing a draft that was never published has no publish
    // date, and the page crashed formatting an empty date (HTTP 500).
    it("previews a never-published draft with a usable date, and prefers a newer autosave", async () => {
      const id = await newPost("preview", "Draft title", FA);
      await actions.saveTranslationAction(translation(id, { title: "Saved draft", blocks: [heading("h"), para("body")] }));
      const saved = await repo.getPreviewPost(id, "fa");
      expect(saved!.post.title).toBe("Saved draft");
      expect(Number.isNaN(new Date(saved!.post.publishedAt).getTime())).toBe(false);
      expect(await repo.getPublishedPost(slugOf("preview"), "fa")).toBeNull(); // still not public

      await new Promise((resolve) => setTimeout(resolve, 15));
      await actions.autosaveTranslationAction({ postId: id, localeKey: FA, title: "Newer autosave", excerpt: "", blocks: [heading("auto")] });
      const auto = await repo.getPreviewPost(id, "fa");
      expect(auto!.post.title).toBe("Newer autosave");
      expect(await repo.getPreviewPost(randomUUID(), "fa")).toBeNull();
    });

    it("exposes published slugs and their locales for the sitemap", async () => {
      const id = await newPost("sitemap");
      await actions.saveTranslationAction(translation(id, { blocks: readyBlocks(), intent: "publish" }));
      await actions.saveTranslationAction(translation(id, { localeKey: EN, title: "En", blocks: readyBlocks(), intent: "publish" }));
      const entry = (await repo.getPublishedPostIndex()).find((e) => e.slug === slugOf("sitemap"));
      expect(entry!.locales.sort()).toEqual(["en", "fa"]);
    });
  });

  describe("slugs", () => {
    it("keeps the old URL working after a slug change and refuses to reuse a retired slug of another post", async () => {
      const id = await newPost("slug-a");
      await actions.saveTranslationAction(translation(id, { blocks: [heading("x"), para("body")], intent: "publish" }));
      const renamed = await actions.savePostSettingsAction({ id, slug: slugOf("slug-b"), isFeatured: false, isMedical: false });
      expect(renamed).toMatchObject({ ok: true, data: { slug: slugOf("slug-b") } });
      expect(await repo.getSlugRedirect(slugOf("slug-a"))).toBe(slugOf("slug-b"));
      expect(await repo.getPublishedPost(slugOf("slug-b"), "fa")).not.toBeNull();
      expect(await repo.getPublishedPost(slugOf("slug-a"), "fa")).toBeNull();

      const other = await newPost("slug-c");
      const stolen = await actions.savePostSettingsAction({ id: other, slug: slugOf("slug-a"), isFeatured: false, isMedical: false });
      expect(stolen).toMatchObject({ ok: false, code: "CONFLICT" });
      const taken = await actions.savePostSettingsAction({ id: other, slug: slugOf("slug-b"), isFeatured: false, isMedical: false });
      expect(taken).toMatchObject({ ok: false, code: "CONFLICT" });

      // Renaming back drops the stale history entry instead of redirecting to itself.
      const back = await actions.savePostSettingsAction({ id, slug: slugOf("slug-a"), isFeatured: false, isMedical: false });
      expect(back.ok).toBe(true);
      expect(await repo.getSlugRedirect(slugOf("slug-a"))).toBeNull();
      expect(await repo.getSlugRedirect(slugOf("slug-b"))).toBe(slugOf("slug-a"));
    });
  });

  describe("taxonomy, authors, media and deletion", () => {
    it("manages categories and authors; a retired author disappears from public pages", async () => {
      const badCategory = await actions.saveCategoryAction({ slug: "Bad Slug", name: { [EN]: "x" } });
      expect(badCategory).toMatchObject({ ok: false, code: "INVALID" });
      const noName = await actions.saveCategoryAction({ slug: slugOf("noname"), name: {} });
      expect(noName).toMatchObject({ ok: false, code: "INVALID" });

      const author = await actions.saveAuthorAction({ name: { [EN]: "Dr Test", [FA]: "دکتر تست" }, bio: {}, credentials: { [EN]: "MD" }, isMedicalReviewer: true });
      expect(author.ok).toBe(true);
      const authorId = (author as { ok: true; data: { id: string } }).data.id;
      createdAuthors.push(authorId);

      const id = await newPost("authored");
      expect(await actions.savePostSettingsAction({ id, slug: slugOf("authored"), authorId, reviewerId: authorId, isMedical: true, isFeatured: false })).toMatchObject({ ok: true });
      await actions.saveTranslationAction(translation(id, { blocks: [heading("x"), para("body")], intent: "publish" }));
      const published = await repo.getPublishedPost(slugOf("authored"), "fa");
      expect(published!.post.author).toMatchObject({ name: "دکتر تست" });
      expect(published!.post.reviewer).toMatchObject({ name: "دکتر تست" });
      expect(published!.post.isMedical).toBe(true);

      expect(await actions.deleteAuthorAction({ id: authorId })).toMatchObject({ ok: true });
      const after = await repo.getPublishedPost(slugOf("authored"), "fa");
      expect(after!.post.author).toBeNull();
      expect(await actions.deleteAuthorAction({ id: authorId })).toMatchObject({ ok: false, code: "NOT_FOUND" });
    });

    it("resolves media: a production-shaped (non-RFC) library id, a stored key, and skips a deleted file", async () => {
      const id = catalogId();
      await sql!`
        insert into media.media_library (id, original_name, stored_name, file_url, storage_path, storage_key, mime_type, extension, media_type, file_size, width, height, alt_translations, title_translations, description_translations, is_public)
        values (${id}, 'it.png', 'it.png', ${`blog-test/${tag}.png`}, ${`blog-test/${tag}.png`}, ${`blog-test/${tag}.png`}, 'image/png', 'png', 'image', 123, 640, 480, ${sql!.json({ [FA]: "متن جایگزین" })}, '{}'::jsonb, '{}'::jsonb, true)`;
      mediaIds.push(id);
      const resolved = await media.resolveMedia([id, "files/x/y.png", catalogId()]);
      expect(resolved[id]).toMatchObject({ mimeType: "image/png", width: 640, height: 480, alt: { [FA]: "متن جایگزین" } });
      expect(resolved[id].url).toContain(`blog-test/${tag}.png`);
      expect(resolved["files/x/y.png"].url).toContain("files/x/y.png");
      expect(Object.keys(resolved)).toHaveLength(2);

      // The public page renders with the file's real URL and alt fallback.
      const postId = await newPost("media");
      await actions.savePostSettingsAction({ id: postId, slug: slugOf("media"), featuredMedia: id, isFeatured: false, isMedical: false });
      await actions.saveTranslationAction(translation(postId, { blocks: [heading("x"), { id: "i1", type: "image", mediaId: id, alt: "", caption: "cap", decorative: true }, para("t")], intent: "publish" }));
      const post = await repo.getPublishedPost(slugOf("media"), "fa");
      expect(post!.post.imageUrl).toContain(`${tag}.png`);
      expect(post!.post.imageAlt).toBe("متن جایگزین");
      expect(post!.post.media[id].url).toContain(`${tag}.png`);
    });

    it("deleting a post removes its translations, revisions and slug history; deleting a language keeps the rest", async () => {
      const id = await newPost("delete");
      await actions.saveTranslationAction(translation(id));
      await actions.saveTranslationAction(translation(id, { localeKey: EN, title: "English" }));
      await actions.savePostSettingsAction({ id, slug: slugOf("delete-2"), isFeatured: false, isMedical: false });

      expect(await actions.deleteTranslationAction({ postId: id, localeKey: EN })).toMatchObject({ ok: true });
      expect((await sql!`select locale_key from content.post_translations where post_id::text = ${id}`).map((r) => r.locale_key)).toEqual([FA]);
      expect(await actions.deleteTranslationAction({ postId: id, localeKey: EN })).toMatchObject({ ok: false, code: "NOT_FOUND" });

      expect(await actions.deletePostAction({ id })).toMatchObject({ ok: true });
      for (const table of ["post_translations", "post_revisions", "post_slug_history"]) {
        expect(await sql!.unsafe(`select 1 from content.${table} where ${table === "post_slug_history" ? "post_id" : "post_id"}::text = '${id}'`)).toHaveLength(0);
      }
      expect(await actions.deletePostAction({ id })).toMatchObject({ ok: false, code: "NOT_FOUND" });
      expect(await actions.saveTranslationAction(translation(id))).toMatchObject({ ok: false, code: "NOT_FOUND" });
    });

    it("lists and loads revisions", async () => {
      const id = await newPost("revisions");
      await actions.saveTranslationAction(translation(id, { title: "first" }));
      await actions.saveTranslationAction(translation(id, { title: "second", blocks: [heading("changed"), para("body")] }));
      const listed = await actions.listRevisionsAction({ postId: id, localeKey: FA });
      expect(listed.ok).toBe(true);
      const rows = (listed as { ok: true; data: { id: string; title: string }[] }).data;
      expect(rows.map((r) => r.title)).toEqual(["second", "first"]);
      const loaded = await actions.getRevisionAction({ revisionId: rows[1].id });
      expect(loaded).toMatchObject({ ok: true, data: { title: "first" } });
      expect(await actions.getRevisionAction({ revisionId: randomUUID() })).toMatchObject({ ok: false, code: "NOT_FOUND" });
    });
  });

  describe("security and failure behaviour", () => {
    it("refuses every write for a non-admin and writes nothing", async () => {
      admin.isAdmin = false;
      const id = randomUUID();
      const results = await Promise.all([
        actions.createPostAction({ slug: slugOf("denied"), title: "x", localeKey: FA }),
        actions.savePostSettingsAction({ id, slug: slugOf("denied"), isFeatured: false, isMedical: false }),
        actions.saveTranslationAction(translation(id)),
        actions.autosaveTranslationAction({ postId: id, localeKey: FA, title: "", excerpt: "", blocks: [] }),
        actions.deleteTranslationAction({ postId: id, localeKey: FA }),
        actions.deletePostAction({ id }),
        actions.listRevisionsAction({ postId: id, localeKey: FA }),
        actions.getRevisionAction({ revisionId: id }),
        actions.saveCategoryAction({ slug: slugOf("denied"), name: { [EN]: "x" } }),
        actions.deleteCategoryAction({ id }),
        actions.saveAuthorAction({ name: { [EN]: "x" }, bio: {}, credentials: {} }),
        actions.deleteAuthorAction({ id }),
      ]);
      for (const result of results) expect(result).toMatchObject({ ok: false, code: "FORBIDDEN" });
      expect(await sql!`select 1 from content.posts where slug = ${slugOf("denied")}`).toHaveLength(0);
      expect(await sql!`select 1 from content.post_categories where slug = ${slugOf("denied")}`).toHaveLength(0);
      expect(revalidate).not.toHaveBeenCalled();
    });

    it("reports a database failure as FAILED (logged without content), never as a validation error", async () => {
      const id = await newPost("dbfail");
      const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const original = sql; // the actions use the app's own client; make that client's transaction fail once
      void original;
      const app = (await import("@/config/database/db")).default as unknown as { begin: (...args: unknown[]) => unknown };
      const begin = vi.spyOn(app, "begin").mockRejectedValueOnce(new Error("connection terminated"));
      const result = await actions.saveTranslationAction(translation(id, { title: "SECRET-TITLE-123" }));
      begin.mockRestore();
      expect(result).toMatchObject({ ok: false, code: "FAILED" });
      expect((result as { message: string }).message).not.toMatch(/invalid/iu);
      expect(spy).toHaveBeenCalled();
      expect(JSON.stringify(spy.mock.calls)).not.toContain("SECRET-TITLE-123");
      spy.mockRestore();
    });

    it("a missing post is NOT_FOUND on every post-scoped write", async () => {
      const ghost = randomUUID();
      expect(await actions.saveTranslationAction(translation(ghost))).toMatchObject({ ok: false, code: "NOT_FOUND" });
      expect(await actions.autosaveTranslationAction({ postId: ghost, localeKey: FA, title: "", excerpt: "", blocks: [] })).toMatchObject({ ok: false, code: "NOT_FOUND" });
      expect(await actions.savePostSettingsAction({ id: ghost, slug: slugOf("ghost"), isFeatured: false, isMedical: false })).toMatchObject({ ok: false, code: "NOT_FOUND" });
    });

    it("rejects a category or author that no longer exists when saving settings", async () => {
      const id = await newPost("fk");
      const result = await actions.savePostSettingsAction({ id, slug: slugOf("fk"), categoryId: randomUUID(), isFeatured: false, isMedical: false });
      expect(result).toMatchObject({ ok: false, code: "NOT_FOUND" });
    });

    it("the database itself refuses a published row without a date and non-array blocks", async () => {
      const id = await newPost("constraints");
      await expect(sql!`update content.post_translations set status = 'published', published_at = null where post_id::text = ${id}`).rejects.toThrow(/ck_content_post_translations_published/u);
      await expect(sql!`update content.post_translations set blocks = '{}'::jsonb where post_id::text = ${id}`).rejects.toThrow();
      await expect(sql!`insert into content.posts (slug) values ('Bad Slug')`).rejects.toThrow();
    });
  });
});
