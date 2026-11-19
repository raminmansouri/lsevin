import { expect, test, type BrowserContext, type Page, type TestInfo } from "@playwright/test";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { encode } from "next-auth/jwt";

/**
 * Blog, end to end: the admin block editor (blocks, rich text, FAQ, image via the media picker,
 * video, keyboard and drag reordering, languages, readiness, autosave/server failure), publishing,
 * the public pages (structured data, fallback language, RTL, redirect, feed), taxonomy, permissions
 * and the legacy editor regression (lists and links). Real Next dev server, real Postgres.
 *
 * Needs E2E_BASE_URL, E2E_DATABASE_URL, E2E_AUTH_SECRET, all localhost only
 * (`pnpm test:local-env --suite blog`). Rows it creates are removed afterwards.
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
test.skip(!RUNNABLE, "Run through `pnpm test:local-env --suite blog` (needs a local database with migration 0120 and AUTH_SECRET).");

const sql = RUNNABLE ? postgres(DB_URL, { max: 2, prepare: false }) : null;
const tag = `qb${Date.now().toString(36)}`;
const SLUG = `${tag}-main`;
const adminId = randomUUID();
const customerId = randomUUID();
const mediaId = randomUUID();
const MEDIA_NAME = `bq-${tag.slice(-5)}.png`;
const TITLE_FA = `مقاله آزمایشی ${tag}`;
let postId = "";

async function shot(page: Page, testInfo: TestInfo, name: string) {
  const file = testInfo.outputPath(`blog__${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await testInfo.attach(name, { path: file, contentType: "image/png" });
}

async function signIn(context: BrowserContext, userId: string, roles: string[]) {
  const now = Date.now();
  const value = await encode({
    secret: SECRET,
    salt: "authjs.session-token",
    token: { sub: userId, user: { id: userId, roles, accessToken: "e2e", accessTokenExpires: now + 3_600_000, refreshTokenExpires: now + 7_200_000 } } as never,
  });
  await context.clearCookies();
  await context.addCookies([{ name: "authjs.session-token", value, domain: new URL(BASE).hostname, path: "/", httpOnly: true, sameSite: "Lax" }]);
}

/** Console errors, page errors and failed responses of one journey. Expected negative responses are allow-listed per test. */
function watch(page: Page, allow: RegExp[] = []) {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) problems.push(`${response.status()} ${response.url()}`);
  });
  // Third-party and dev-tooling noise that is not the application.
  // The admin shell polls /api/admin/notifications/count on the .NET API, which the test environment only stubs.
  // The browser's generic "Failed to load resource" console line always has a matching response entry, which is
  // still checked, so ignoring the console duplicate hides nothing.
  // The video block embeds Aparat (an allow-listed third party). The fixture id is fake, so Aparat answers 404 and its
  // player script raises "Request failed: 404": third-party behaviour, not the application.
  const noise = [/aparat\.com/iu, /^pageerror: Request failed: 404$/iu, /\/api\/admin\/notifications\//iu, /^console: Failed to load resource/iu, /hotjar/iu, /google-analytics|googletagmanager/iu, /favicon/iu, /\/_next\/webpack-hmr/iu, /Download the React DevTools/iu, /ERR_(CONNECTION|NAME|INTERNET)/iu, ...allow];
  return { clean: () => problems.filter((entry) => !noise.some((rule) => rule.test(entry))) };
}

/** Clicks on server-rendered markup before React hydrates are lost: wait until the interactive root has its React props. */
async function hydrated(page: Page) {
  // Nothing interactive on the page (denied, redirected): nothing to wait for.
  if ((await page.locator('[data-testid="new-post"], [data-testid="post-editor"]').count()) === 0) return;
  await page.waitForFunction(
    () => {
      const root = document.querySelector('[data-testid="new-post"], [data-testid="post-editor"]');
      return Boolean(root && Object.keys(root).some((key) => key.startsWith("__reactProps")));
    },
    undefined,
    { timeout: 120_000 },
  );
}

async function goto(page: Page, path: string) {
  // The first request to a route compiles it in dev; allow one retry for a transient 404/5xx while compiling.
  let response = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await page.goto(path, { waitUntil: "domcontentloaded" });
    if (response && response.status() < 400) break;
    await page.waitForTimeout(1500);
  }
  if (/\/admin\/blog(\/|$)/u.test(path) && !/preview/u.test(path) && response && response.status() < 400 && page.url().includes("/admin/blog")) await hydrated(page);
  return response;
}

/**
 * HTML5 drag and drop from one block's handle onto another block's header strip. Playwright needs real mouse
 * movement for the browser to start the drag and to keep sending dragover before the drop.
 */
async function dragBlock(page: Page, from: number, to: number) {
  // The sticky top bar covers the first blocks once the page is scrolled: start from the top.
  await page.mouse.wheel(0, -10_000);
  await page.waitForTimeout(300);
  const cards = page.getByTestId("blocks").locator("[data-block-id]");
  const handle = await cards.nth(from).getByTestId("block-drag").boundingBox();
  const header = await cards.nth(to).getByTestId("block-header").boundingBox();
  if (!handle || !header) throw new Error("block handle or header not found");
  const sx = handle.x + handle.width / 2;
  const sy = handle.y + handle.height / 2;
  const tx = header.x + header.width / 2;
  const ty = header.y + header.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + 8, sy + 8, { steps: 4 });
  await page.mouse.move(tx, ty, { steps: 12 });
  for (const d of [3, 6, 9]) await page.mouse.move(tx + d, ty, { steps: 2 });
  await page.mouse.up();
}

/** The Persian admin shows Latin digits as Persian digits (۰-۹): match text with either script. */
const anyDigits = (text: string) =>
  new RegExp(
    text
      .replace(/[.*+?^${}()|[\]\\]/gu, (char) => `\\${char}`)
      .replace(/[0-9]/gu, (digit) => `[${digit}${String.fromCharCode(0x06f0 + Number(digit))}]`),
    "u",
  );

const block = (page: Page, type: string) => page.getByTestId(`block-${type}`);
async function addBlock(page: Page, index: number, type: string) {
  await page.getByTestId(`add-block-${index}`).click();
  await page.getByTestId(`insert-${type}`).click();
}
const toast = (page: Page) => page.locator("[data-sonner-toast]");

async function pickImage(page: Page, scope: ReturnType<Page["locator"]>) {
  await scope.getByTestId("image-file-choose").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator("input").first().fill(MEDIA_NAME);
  const card = dialog.getByRole("button").filter({ hasText: MEDIA_NAME });
  await expect(card.first()).toBeVisible();
  await card.first().click();
  await expect(dialog).toBeHidden();
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const s = sql!;
  for (const [id, label] of [[adminId, "editor"], [customerId, "customer"]] as const) {
    await s`insert into identity.asp_net_users (id, first_name, last_name, phone_number_country_code, user_name, normalized_user_name, email, normalized_email, email_confirmed, phone_number, phone_number_confirmed, two_factor_enabled, lockout_enabled, access_failed_count)
            values (${id}, 'E2E', ${label}, '98', ${`${tag}-${label}`}, ${`${tag}-${label}`.toUpperCase()}, ${`${tag}-${label}@example.com`}, ${`${tag}-${label}@EXAMPLE.COM`.toUpperCase()}, true, ${`912${Math.floor(1000000 + Math.random() * 8999999)}`}, true, false, false, 0)`;
  }
  // A library image the picker can find. Empty alt on purpose: publishing must be refused until the editor writes one.
  await s`insert into media.media_library (id, original_name, stored_name, file_url, storage_path, storage_key, mime_type, extension, media_type, file_size, width, height, alt_translations, title_translations, description_translations, is_public)
          values (${mediaId}, ${MEDIA_NAME}, ${MEDIA_NAME}, ${`blog-e2e/${tag}.png`}, ${`blog-e2e/${tag}.png`}, ${`blog-e2e/${tag}.png`}, 'image/png', 'png', 'image', 1024, 640, 360, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, true)`;
});

test.afterAll(async () => {
  const s = sql;
  if (!s) return;
  await s`delete from content.posts where slug like ${`${tag}-%`}`;
  await s`delete from content.post_categories where slug like ${`${tag}-%`}`;
  await s`delete from content.post_authors where name_translations::text like ${`%${tag}%`}`;
  await s`delete from media.media_library where id = ${mediaId}`;
  await s`delete from identity.asp_net_users where id in (${adminId}, ${customerId})`;
  await s.end({ timeout: 5 });
});

test.describe("permissions", () => {
  test("signed-out visitors and customers cannot open the blog admin @critical", async ({ page, context }, testInfo) => {
    await context.clearCookies();
    await goto(page, "/fa/admin/blog");
    await expect(page).toHaveURL(/sign-in|login|auth/u);
    await expect(page.getByTestId("admin-blog")).toHaveCount(0);

    await signIn(context, customerId, ["customer"]);
    await goto(page, "/fa/admin/blog");
    await expect(page.getByTestId("admin-blog")).toHaveCount(0);
    await expect(page.getByTestId("new-post")).toHaveCount(0);
    await shot(page, testInfo, "customer-denied");
  });
});

test.describe("admin: create and edit", () => {
  test("rejects an invalid or duplicate URL name and an empty title @regression", async ({ page, context }, testInfo) => {
    await signIn(context, adminId, ["admin"]);
    const run = watch(page);
    await goto(page, "/fa/admin/blog");
    await expect(page.getByTestId("admin-blog")).toBeVisible();
    await page.getByTestId("new-post").click();
    await page.getByTestId("new-post-title").fill(TITLE_FA);
    await page.getByTestId("new-post-slug").fill("Not A Slug!");
    await page.getByTestId("new-post-submit").click();
    await expect(page.getByTestId("new-post-form").getByRole("alert")).toBeVisible();
    await shot(page, testInfo, "invalid-slug");
    await expect(page).toHaveURL(/\/admin\/blog$/u);
    expect(await sql!`select 1 from content.posts where slug like ${`${tag}-%`}`).toHaveLength(0);
    expect(run.clean()).toEqual([]);
  });

  test("creates a post, builds it from blocks, saves, survives a refresh @critical", async ({ page, context }, testInfo) => {
    await signIn(context, adminId, ["admin"]);
    const run = watch(page);
    await goto(page, "/fa/admin/blog");
    await page.getByTestId("new-post").click();
    await page.getByTestId("new-post-title").fill(TITLE_FA);
    await page.getByTestId("new-post-slug").fill(SLUG);
    await shot(page, testInfo, "new-post-filled");
    await page.getByTestId("new-post-submit").click();
    await expect(page).toHaveURL(/\/admin\/blog\/[0-9a-f-]{36}/u);
    postId = page.url().match(/\/admin\/blog\/([0-9a-f-]{36})/u)![1];
    await expect(page.getByTestId("post-editor")).toBeVisible();
    await expect(page.getByTestId("post-title")).toHaveValue(TITLE_FA);
    await expect(page.getByTestId("post-status")).toContainText("پیش‌نویس");

    // excerpt + heading
    await page.getByTestId("post-excerpt").fill("چکیده مقاله آزمایشی");
    await addBlock(page, 0, "heading");
    await block(page, "heading").getByTestId("heading-text").fill("بخش نخست");

    // rich text: paragraph with bold + link, then a bullet list
    await addBlock(page, 1, "richtext");
    const rich = block(page, "richtext").first();
    const editable = rich.locator('[contenteditable="true"]');
    await editable.click();
    await page.keyboard.type("docs");
    await page.keyboard.press("Control+A");
    await rich.getByTestId("rt-bold").click();
    await rich.getByTestId("rt-link").click();
    await rich.getByTestId("rt-link-input").fill("javascript:alert(1)");
    await rich.getByTestId("rt-link-apply").click();
    await expect(rich.getByTestId("rt-link-form").getByRole("alert")).toBeVisible(); // unsafe link refused in the UI
    await rich.getByTestId("rt-link-input").fill("https://example.com/docs");
    await rich.getByTestId("rt-link-apply").click();
    await expect(editable.locator('a[href="https://example.com/docs"]')).toHaveCount(1);
    await editable.click();
    await page.keyboard.press("Control+End");
    await page.keyboard.press("Enter");
    await rich.getByTestId("rt-bullets").click();
    await page.keyboard.type("اولین مورد");
    await page.keyboard.press("Enter");
    await page.keyboard.type("دومین مورد");
    await expect(editable.locator("ul li")).toHaveCount(2);

    // FAQ with two items, second moved to the top with the keyboard
    await addBlock(page, 2, "faq");
    const faq = block(page, "faq");
    await faq.getByTestId("faq-title").fill("پرسش‌ها");
    await faq.getByTestId("faq-question").first().fill("پرسش اول؟");
    await faq.locator('[data-testid="faq-answer-0-editable"]').click();
    await page.keyboard.type("پاسخ اول");
    await faq.getByTestId("faq-add-item").click();
    await faq.getByTestId("faq-question").nth(1).fill("پرسش دوم؟");
    await faq.locator('[data-testid="faq-answer-1-editable"]').click();
    await page.keyboard.type("پاسخ دوم");
    await faq.getByTestId("faq-item-up").nth(1).focus();
    await page.keyboard.press("Enter");
    await expect(faq.getByTestId("faq-question").first()).toHaveValue("پرسش دوم؟");

    // image from the media picker (alt stays empty on purpose)
    await addBlock(page, 3, "image");
    await pickImage(page, block(page, "image"));
    await expect(block(page, "image").getByTestId("image-alt")).toHaveValue("");

    // video embed
    await addBlock(page, 4, "video");
    await block(page, "video").getByTestId("video-url").fill("https://www.aparat.com/v/AbC12xy");
    await block(page, "video").getByTestId("video-title").fill("ویدئوی آزمایشی");

    await page.getByTestId("post-featured-image-choose").click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("input").first().fill(MEDIA_NAME);
    await dialog.getByRole("button").filter({ hasText: MEDIA_NAME }).first().click();
    await expect(dialog).toBeHidden();

    await shot(page, testInfo, "editor-built");
    await expect(page.getByTestId("save-state")).toContainText("ذخیره‌نشده");
    await page.getByTestId("save-draft").click();
    await expect(toast(page).first()).toBeVisible();
    await expect(page.getByTestId("save-state")).toContainText("ذخیره شد");

    // persisted: DB row, then the editor after a full reload
    const rows = await sql!`select status, title, jsonb_array_length(blocks) as n, reading_minutes from content.post_translations where post_id::text = ${postId} and locale_key = 'fa-IR'`;
    expect(rows[0]).toMatchObject({ status: "draft", title: TITLE_FA, n: 5 });
    await page.reload();
    await expect(page.getByTestId("post-title")).toHaveValue(TITLE_FA);
    await expect(page.getByTestId("blocks").locator("[data-block-id]")).toHaveCount(5);
    await expect(block(page, "faq").getByTestId("faq-question").first()).toHaveValue("پرسش دوم؟");
    await expect(block(page, "richtext").locator("a[href='https://example.com/docs']")).toHaveCount(1);
    await expect(block(page, "richtext").locator("ul li")).toHaveCount(2);
    await shot(page, testInfo, "editor-after-reload");
    expect(run.clean()).toEqual([]);

    // a draft is not public
    const draft = await page.request.get(`/fa/blog/${SLUG}`);
    expect(draft.status()).toBe(404);
  });

  test("refuses to publish until every image has alt text, then publishes @critical", async ({ page, context }, testInfo) => {
    await signIn(context, adminId, ["admin"]);
    await goto(page, `/fa/admin/blog/${postId}`);
    await expect(page.getByTestId("post-editor")).toBeVisible();
    await page.getByTestId("publish").click();
    await expect(page.getByTestId("readiness").locator('[data-code="image-missing-alt"]')).toBeVisible();
    await expect(page.getByTestId("readiness").locator('[data-severity="error"]').first()).toBeVisible();
    await shot(page, testInfo, "publish-refused");
    expect((await sql!`select status from content.post_translations where post_id::text = ${postId}`)[0].status).toBe("draft");

    await block(page, "image").getByTestId("image-alt").fill("اتاق کلینیک");
    await page.getByTestId("publish").click();
    await expect(page.getByTestId("post-status")).toContainText("منتشرشده");
    expect((await sql!`select status, published_at from content.post_translations where post_id::text = ${postId}`)[0]).toMatchObject({ status: "published" });
    await page.reload();
    await expect(page.getByTestId("post-status")).toContainText("منتشرشده");
    await expect(page.getByTestId("view-public")).toBeVisible();
    await shot(page, testInfo, "published");
  });

  test("keyboard: open the inserter with Enter, pick with the keyboard, save with Ctrl+S @regression", async ({ page, context }) => {
    await signIn(context, adminId, ["admin"]);
    await goto(page, `/fa/admin/blog/${postId}`);
    const before = await page.getByTestId("blocks").locator("[data-block-id]").count();
    const add = page.getByTestId(`add-block-${before}`);
    await add.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("inserter")).toBeVisible();
    // The admin is in Persian: filter by the Persian label of the quote block («نقل‌قول»).
    await page.keyboard.type("نقل");
    await expect(page.getByTestId("insert-quote")).toBeVisible();
    await expect(page.getByTestId("insert-heading")).toHaveCount(0);
    await page.getByTestId("insert-quote").focus();
    await page.keyboard.press("Enter");
    await expect(block(page, "quote")).toHaveCount(1);
    await block(page, "quote").getByTestId("quote-text").fill("نقل‌قول آزمایشی");
    await page.keyboard.press("Control+s");
    await expect(page.getByTestId("save-state")).toContainText("ذخیره شد");
    const blocks = await sql!`select jsonb_array_length(blocks) as n from content.post_translations where post_id::text = ${postId} and locale_key = 'fa-IR'`;
    expect(blocks[0].n).toBe(before + 1);
    // Escape closes the inserter
    await page.getByTestId(`add-block-0`).click();
    await expect(page.getByTestId("inserter")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("inserter")).toHaveCount(0);
  });

  test("reorders blocks with the buttons and by dragging; the order persists @regression", async ({ page, context }, testInfo) => {
    await page.setViewportSize({ width: 1400, height: 1100 });
    await signIn(context, adminId, ["admin"]);
    await goto(page, `/fa/admin/blog/${postId}`);
    const types = async () => page.getByTestId("blocks").locator("[data-block-id]").evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")));
    const initial = await types();
    expect(initial[0]).toBe("block-heading");
    // button: move the heading down, then back up
    await page.getByTestId("blocks").locator("[data-block-id]").first().getByTestId("block-down").click();
    expect((await types())[1]).toBe("block-heading");
    await page.getByTestId("blocks").locator("[data-block-id]").nth(1).getByTestId("block-up").click();
    expect(await types()).toEqual(initial);
    // drag: drop the first block on the second block's header (the first block moves after it)
    await dragBlock(page, 0, 1);
    const dragged = await types();
    expect(dragged[0]).toBe(initial[1]);
    expect(dragged[1]).toBe(initial[0]);
    await shot(page, testInfo, "after-drag");
    await page.getByTestId("save-draft").click();
    await expect(page.getByTestId("save-state")).toContainText("ذخیره شد");
    await page.reload();
    expect(await types()).toEqual(dragged);
    // restore the original order for later tests
    await page.getByTestId("blocks").locator("[data-block-id]").nth(1).getByTestId("block-up").click();
    await page.getByTestId("save-draft").click();
    await expect(page.getByTestId("save-state")).toContainText("ذخیره شد");
  });

  test("a CTA with an unsafe link is refused by the server and nothing is saved @regression", async ({ page, context }, testInfo) => {
    await signIn(context, adminId, ["admin"]);
    const run = watch(page);
    await goto(page, `/fa/admin/blog/${postId}`);
    const before = (await sql!`select updated_at from content.post_translations where post_id::text = ${postId} and locale_key = 'fa-IR'`)[0].updated_at;
    await addBlock(page, await page.getByTestId("blocks").locator("[data-block-id]").count(), "cta");
    await block(page, "cta").getByTestId("cta-label").fill("رزرو");
    await block(page, "cta").getByTestId("cta-link").fill("javascript:alert(1)");
    await expect(block(page, "cta").getByRole("alert")).toBeVisible(); // inline UI validation
    await page.getByTestId("save-draft").click();
    await expect(toast(page).first()).toBeVisible();
    await shot(page, testInfo, "unsafe-link-refused");
    const after = (await sql!`select updated_at from content.post_translations where post_id::text = ${postId} and locale_key = 'fa-IR'`)[0].updated_at;
    expect(String(after)).toBe(String(before));
    await expect(page.getByTestId("save-state")).toContainText("ذخیره‌نشده");
    // fix it and it saves
    await block(page, "cta").getByTestId("cta-link").fill("/consulting");
    await page.getByTestId("save-draft").click();
    await expect(page.getByTestId("save-state")).toContainText("ذخیره شد");
    expect(run.clean()).toEqual([]);
  });

  test("a failing server request keeps the draft and reports an error; retry succeeds @regression", async ({ page, context }, testInfo) => {
    await signIn(context, adminId, ["admin"]);
    await goto(page, `/fa/admin/blog/${postId}`);
    await page.getByTestId("post-excerpt").fill(`چکیده جدید ${tag}`);
    let failing = true;
    await page.route(/\/admin\/blog\//u, (route) => (failing && route.request().method() === "POST" ? route.fulfill({ status: 500, body: "boom" }) : route.continue()));
    await page.getByTestId("save-draft").click();
    await expect(toast(page).first()).toBeVisible();
    await expect(page.getByTestId("save-state")).toContainText("ذخیره‌نشده");
    await expect(page.getByTestId("post-excerpt")).toHaveValue(`چکیده جدید ${tag}`);
    await shot(page, testInfo, "server-error-draft-kept");
    expect((await sql!`select excerpt from content.post_translations where post_id::text = ${postId} and locale_key = 'fa-IR'`)[0].excerpt).not.toContain(tag);
    failing = false;
    await page.getByTestId("save-draft").click();
    await expect(page.getByTestId("save-state")).toContainText("ذخیره شد");
    expect((await sql!`select excerpt from content.post_translations where post_id::text = ${postId} and locale_key = 'fa-IR'`)[0].excerpt).toContain(tag);
  });

  test("autosave keeps a recovery copy and offers it after the page is closed @regression", async ({ page, context }, testInfo) => {
    await signIn(context, adminId, ["admin"]);
    await goto(page, `/fa/admin/blog/${postId}`);
    await page.getByTestId("post-title").fill(`${TITLE_FA} (autosave)`);
    // autosave fires ~4 s after the last change
    await expect.poll(async () => (await sql!`select title from content.post_revisions where post_id::text = ${postId} and kind = 'autosave'`)[0]?.title, { timeout: 20_000 }).toContain("(autosave)");
    expect((await sql!`select title from content.post_translations where post_id::text = ${postId} and locale_key = 'fa-IR'`)[0].title).toBe(TITLE_FA);
    await page.goto("about:blank");
    await goto(page, `/fa/admin/blog/${postId}`);
    await expect(page.getByTestId("autosave-offer")).toBeVisible();
    await shot(page, testInfo, "autosave-offer");
    await page.getByTestId("autosave-restore").click();
    await expect(page.getByTestId("post-title")).toHaveValue(`${TITLE_FA} (autosave)`);
    // put the real title back and save (also clears the autosave row)
    await page.getByTestId("post-title").fill(TITLE_FA);
    await page.getByTestId("save-draft").click();
    await expect(page.getByTestId("save-state")).toContainText("ذخیره شد");
    expect(await sql!`select 1 from content.post_revisions where post_id::text = ${postId} and kind = 'autosave'`).toHaveLength(0);
  });

  test("history lists saved versions and loads one back into the editor @regression", async ({ page, context }) => {
    await signIn(context, adminId, ["admin"]);
    await goto(page, `/fa/admin/blog/${postId}`);
    await page.getByTestId("side-tab-history").click();
    const items = page.getByTestId("history").getByTestId("history-load");
    await expect.poll(async () => items.count()).toBeGreaterThan(1);
    await items.last().click();
    await expect(toast(page).first()).toBeVisible();
    await expect(page.getByTestId("save-state")).toContainText("ذخیره‌نشده");
    await page.reload(); // discard the loaded revision: nothing was saved
    await expect(page.getByTestId("post-title")).toHaveValue(TITLE_FA);
  });
});

test.describe("public pages", () => {
  test("the published post renders in Persian with structure, FAQ, image, video and structured data @critical", async ({ page, context }, testInfo) => {
    await context.clearCookies();
    const run = watch(page);
    await goto(page, `/fa/blog/${SLUG}`);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(TITLE_FA);
    await expect(page.locator(`[data-blog-post="${SLUG}"]`)).toHaveAttribute("data-blog-post", SLUG);
    await expect(page.locator("div[dir=rtl]").first()).toBeVisible();
    await expect(page.locator("h2", { hasText: "بخش نخست" })).toBeVisible();
    await expect(page.locator("[data-blog-body] a[href='https://example.com/docs']")).toHaveAttribute("rel", /noopener/u);
    await expect(page.locator("[data-blog-body] strong").first()).toContainText("docs"); // bold stays active for the typed list items too
    await expect(page.locator("[data-blog-body] ul li")).toHaveCount(2);
    // Interact only after React has hydrated: a native <details> toggle before that is a (harmless) hydration mismatch.
    await page.waitForFunction(() => {
      const root = document.querySelector("[data-blog-post]");
      return Boolean(root && Object.keys(root).some((key) => key.startsWith("__reactProps")));
    });
    // FAQ order (moved with the keyboard) and details/summary
    const questions = await page.locator("[data-blog-block=faq] summary span:first-child").allTextContents();
    expect(questions).toEqual(["پرسش دوم؟", "پرسش اول؟"]);
    await page.locator("[data-blog-block=faq] summary").first().click();
    await expect(page.locator("[data-blog-block=faq] details").first()).toHaveAttribute("open", "");
    // image with the alt text the editor wrote, from the file host
    const img = page.locator("[data-blog-block=image] img");
    await expect(img).toHaveAttribute("alt", "اتاق کلینیک");
    await expect(img).toHaveAttribute("src", new RegExp(`blog-e2e/${tag}\\.png$`, "u"));
    // privacy-friendly allow-listed embed
    await expect(page.locator("[data-blog-block=video] iframe")).toHaveAttribute("src", /aparat\.com\/video\/video\/embed\/videohash\/AbC12xy/u);
    await expect(page.locator("[data-blog-block=cta] a")).toHaveAttribute("href", "/consulting");
    await shot(page, testInfo, "public-post-fa");

    const graphs = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((text) => JSON.parse(text));
    const types = graphs.flatMap((g) => (g["@graph"] ?? [g]).map((n: { "@type": string }) => n["@type"]));
    expect(types).toEqual(expect.arrayContaining(["BlogPosting", "BreadcrumbList", "FAQPage"]));
    const faq = graphs.flatMap((g) => g["@graph"] ?? [g]).find((n: { "@type": string }) => n["@type"] === "FAQPage");
    expect(faq.mainEntity.map((q: { name: string }) => q.name)).toEqual(["پرسش دوم؟", "پرسش اول؟"]);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/fa/blog/${SLUG}$`, "u"));
    expect(await page.locator('meta[name="robots"]').count() === 0 || !/noindex/u.test((await page.locator('meta[name="robots"]').first().getAttribute("content")) ?? "")).toBe(true);
    expect(run.clean()).toEqual([]);
  });

  test("the blog index, category-less listing and the feed include the post; other languages fall back and are not indexed @critical", async ({ page, context }, testInfo) => {
    await context.clearCookies();
    await goto(page, "/fa/blog");
    await expect(page.locator("h1")).toHaveText("وبلاگ");
    await expect(page.locator(`[data-blog-card="${SLUG}"]`)).toBeVisible();
    await page.locator(`[data-blog-card="${SLUG}"] a`).click();
    await expect(page).toHaveURL(new RegExp(`/fa/blog/${SLUG}$`, "u"));
    await page.goBack();
    await expect(page).toHaveURL(/\/fa\/blog$/u);
    await shot(page, testInfo, "public-index-fa");

    const feed = await page.request.get("/fa/blog/feed.xml");
    expect(feed.status()).toBe(200);
    expect(feed.headers()["content-type"]).toContain("rss+xml");
    expect(await feed.text()).toContain(`/fa/blog/${SLUG}`);

    // English has no published translation: the Persian text is shown as a fallback, noindex
    await goto(page, `/en/blog/${SLUG}`);
    await expect(page.locator("[data-blog-fallback]")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/u);
    await expect(page.locator("h1")).toHaveText(TITLE_FA);
    // and the English index lists nothing
    await goto(page, "/en/blog");
    await expect(page.locator(`[data-blog-card="${SLUG}"]`)).toHaveCount(0);
    await expect(page.locator("[data-blog-empty]")).toBeVisible(); // nothing is published in English yet
    await shot(page, testInfo, "public-fallback-en");
  });

  test("an unknown slug is a 404 and a malformed one never reaches the database @regression", async ({ page }) => {
    expect((await page.request.get("/fa/blog/does-not-exist-" + tag)).status()).toBe(404);
    expect((await page.request.get("/fa/blog/Bad%20Slug")).status()).toBe(404);
    expect((await page.request.get("/fa/blog/category/does-not-exist")).status()).toBe(404);
  });

  test("mobile width: the public post and the editor do not scroll sideways @regression", async ({ page, context }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await context.clearCookies();
    await goto(page, `/fa/blog/${SLUG}`);
    await expect(page.locator("h1")).toBeVisible();
    const overflow = async () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await overflow()).toBeLessThanOrEqual(1);
    await shot(page, testInfo, "public-mobile");
    await signIn(context, adminId, ["admin"]);
    await goto(page, `/fa/admin/blog/${postId}`);
    await expect(page.getByTestId("post-editor")).toBeVisible();
    expect(await overflow()).toBeLessThanOrEqual(1);
    await shot(page, testInfo, "editor-mobile");
  });
});

test.describe("languages, settings, preview and lifecycle", () => {
  test("adds English by copying the Persian structure, saves it as a draft, then publishes it @critical", async ({ page, context }, testInfo) => {
    await signIn(context, adminId, ["admin"]);
    await goto(page, `/fa/admin/blog/${postId}`);
    await page.getByTestId("lang-tab-en-US").click();
    await expect(page.getByTestId("copy-from-fa-IR")).toBeVisible();
    await page.getByTestId("copy-from-fa-IR").click();
    await expect(page.getByTestId("blocks").locator("[data-block-id]").first()).toBeVisible();
    await page.getByTestId("post-title").fill(`Test article ${tag}`);
    await page.getByTestId("save-draft").click();
    await expect(page.getByTestId("save-state")).toContainText("ذخیره شد");
    const rows = await sql!`select locale_key, status from content.post_translations where post_id::text = ${postId} order by locale_key`;
    expect(rows.map((r) => `${r.locale_key}:${r.status}`)).toEqual(["en-US:draft", "fa-IR:published"]);
    // still fallback publicly (English is a draft)
    await goto(page, `/en/blog/${SLUG}`);
    await expect(page.locator("[data-blog-fallback]")).toBeVisible();

    await goto(page, `/fa/admin/blog/${postId}?locale=en-US`);
    await expect(page.getByTestId("post-title")).toHaveValue(`Test article ${tag}`);
    await page.getByTestId("publish").click();
    await expect(page.getByTestId("post-status")).toContainText("منتشرشده");
    await context.clearCookies();
    await goto(page, `/en/blog/${SLUG}`);
    await expect(page.locator("[data-blog-fallback]")).toHaveCount(0);
    await expect(page.locator("h1")).toHaveText(`Test article ${tag}`);
    await expect(page.locator("div[dir=ltr]").first()).toBeVisible();
    // indexable: a robots tag may exist (the site emits one), but it must not say noindex
    const robots = await page.locator('meta[name="robots"]').evaluateAll((els) => els.map((el) => el.getAttribute("content") ?? ""));
    expect(robots.some((content) => /noindex/iu.test(content))).toBe(false);
    await shot(page, testInfo, "public-post-en");
    await goto(page, "/en/blog");
    await expect(page.locator(`[data-blog-card="${SLUG}"]`)).toBeVisible();
  });

  test("a draft preview shows the saved content in the public layout and is not public @regression", async ({ page, context }, testInfo) => {
    await signIn(context, adminId, ["admin"]);
    await goto(page, `/fa/admin/blog/${postId}`);
    await page.getByTestId("lang-tab-tr-TR").click();
    await page.getByTestId("post-title").fill(`Taslak ${tag}`);
    await addBlock(page, 0, "heading");
    await block(page, "heading").getByTestId("heading-text").fill("Başlık");
    await page.getByTestId("save-draft").click();
    await expect(page.getByTestId("save-state")).toContainText("ذخیره شد");
    const [preview] = await Promise.all([context.waitForEvent("page"), page.getByTestId("preview-link").click()]);
    await preview.waitForLoadState("domcontentloaded");
    await expect(preview.locator("[data-blog-preview]")).toBeVisible();
    await expect(preview.locator("h1")).toHaveText(`Taslak ${tag}`);
    await shot(preview, testInfo, "preview");
    await preview.close();
    // the Turkish draft does not exist publicly: Persian/English fallback is shown instead
    await context.clearCookies();
    await goto(page, `/tr/blog/${SLUG}`);
    await expect(page.locator("h1")).not.toHaveText(`Taslak ${tag}`);
  });

  test("changing the URL name keeps the old URL working with a redirect; settings persist @critical", async ({ page, context }, testInfo) => {
    await signIn(context, adminId, ["admin"]);
    await goto(page, `/fa/admin/blog/${postId}`);
    await page.getByTestId("post-slug").fill(`${tag}-renamed`);
    await page.getByTestId("post-featured").check();
    await page.getByTestId("save-draft").click();
    await expect(page.getByTestId("save-state")).toContainText("ذخیره شد");
    await expect(page.getByTestId("preview-link")).toBeVisible();
    await context.clearCookies();
    await goto(page, `/fa/blog/${SLUG}`);
    await expect(page).toHaveURL(new RegExp(`/fa/blog/${tag}-renamed$`, "u"));
    await expect(page.locator("h1")).toHaveText(TITLE_FA);
    await shot(page, testInfo, "after-slug-change-redirect");
    // a second post cannot take the old URL name or the new one
    await signIn(context, adminId, ["admin"]);
    await goto(page, "/fa/admin/blog");
    await page.getByTestId("new-post").click();
    await page.getByTestId("new-post-title").fill("Second post");
    await page.getByTestId("new-post-slug").fill(`${tag}-renamed`);
    await page.getByTestId("new-post-submit").click();
    await expect(page.getByTestId("new-post-form").getByRole("alert")).toBeVisible();
    // settings persisted
    const post = (await sql!`select slug, is_featured from content.posts where id::text = ${postId}`)[0];
    expect(post).toMatchObject({ slug: `${tag}-renamed`, is_featured: true });
  });

  test("categories and authors: create, assign, and see them on the public page @regression", async ({ page, context }, testInfo) => {
    await signIn(context, adminId, ["admin"]);
    await goto(page, "/fa/admin/blog");
    await page.getByTestId("category-new").click();
    await page.getByTestId("category-slug").fill(`${tag}-cat`);
    await page.getByTestId("category-form").getByRole("textbox").nth(1).fill("دسته آزمایشی");
    await page.getByTestId("category-save").click();
    await expect(page.getByTestId("category-row").filter({ hasText: anyDigits(`${tag}-cat`) })).toBeVisible();

    await page.getByTestId("author-new").click();
    await page.getByTestId("author-form").getByRole("textbox").nth(0).fill(`نویسنده ${tag}`);
    await page.getByTestId("author-reviewer").check();
    await page.getByTestId("author-save").click();
    await expect(page.getByTestId("author-row").filter({ hasText: anyDigits(tag) })).toBeVisible();
    await shot(page, testInfo, "taxonomy");

    await goto(page, `/fa/admin/blog/${postId}`);
    await page.getByTestId("post-category").selectOption({ label: "دسته آزمایشی" });
    await page.getByTestId("post-author").selectOption({ label: `نویسنده ${tag}` });
    await page.getByTestId("post-medical").check();
    await page.getByTestId("post-reviewer").selectOption({ label: `نویسنده ${tag}` });
    await page.getByTestId("save-draft").click();
    await expect(page.getByTestId("save-state")).toContainText("ذخیره شد");

    await context.clearCookies();
    await goto(page, `/fa/blog/${tag}-renamed`);
    await expect(page.locator("[data-blog-author]")).toContainText(`نویسنده ${tag}`);
    await expect(page.locator("[data-blog-reviewer]")).toContainText(tag);
    const graphs = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((text) => JSON.parse(text));
    const nodes = graphs.flatMap((g) => g["@graph"] ?? [g]);
    expect(nodes.map((n: { "@type": string }) => n["@type"])).toContain("MedicalWebPage");
    await goto(page, `/fa/blog/category/${tag}-cat`);
    await expect(page.locator(`[data-blog-card="${tag}-renamed"]`)).toBeVisible();
    await expect(page.locator("h1")).toHaveText("دسته آزمایشی");
    await shot(page, testInfo, "public-category");
  });

  test("unpublishing hides the language; deleting the post removes it everywhere @critical", async ({ page, context }, testInfo) => {
    await signIn(context, adminId, ["admin"]);
    await goto(page, `/fa/admin/blog/${postId}?locale=en-US`);
    await page.getByTestId("unpublish").click();
    await expect(page.getByTestId("post-status")).toContainText("پیش‌نویس");
    await context.clearCookies();
    await goto(page, `/en/blog/${tag}-renamed`);
    await expect(page.locator("[data-blog-fallback]")).toBeVisible(); // only Persian remains published

    await signIn(context, adminId, ["admin"]);
    await goto(page, "/fa/admin/blog");
    const row = page.locator(`tr[data-slug="${tag}-renamed"]`);
    await expect(row).toBeVisible();
    await shot(page, testInfo, "list-before-delete");
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByTestId("delete-post").click();
    await expect(row).toHaveCount(0);
    expect(await sql!`select 1 from content.posts where id::text = ${postId}`).toHaveLength(0);
    await context.clearCookies();
    expect((await page.request.get(`/fa/blog/${tag}-renamed`)).status()).toBe(404);
    expect((await page.request.get(`/fa/blog/${SLUG}`)).status()).toBe(404); // the old URL no longer redirects
  });
});

test.describe("legacy editorial editor (regression for lists and links)", () => {
  test("the site-page editor now creates lists and links @regression", async ({ page, context }, testInfo) => {
    await signIn(context, adminId, ["admin"]);
    await goto(page, "/fa/admin/editorial/pages/pricing-fees");
    const editable = page.locator('[contenteditable="true"]').first();
    await expect(editable).toBeVisible();
    await editable.click();
    await page.keyboard.press("Control+End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("ITEM-ONE");
    // block menu → bulleted list (the control that used to do nothing)
    await page.locator("form button, form [role=combobox]").filter({ hasText: /Paragraph|Heading/u }).first().click();
    await page.locator("[role=option], [role=menuitem]").filter({ hasText: /bullet/iu }).first().click();
    await expect(editable.locator("ul li")).toContainText(["ITEM-ONE"]);
    // link button asks for the address instead of inserting "https://"
    page.once("dialog", (dialog) => dialog.accept("https://example.com/legacy"));
    await page.keyboard.press("Shift+Home");
    await page.getByRole("button", { name: "Toggle link" }).click();
    await expect(editable.locator('a[href="https://example.com/legacy"]')).toHaveCount(1);
    await shot(page, testInfo, "legacy-editor-list-link");
    // nothing was saved: leave the page without pressing Save
    page.on("dialog", (dialog) => dialog.accept());
    await goto(page, "/fa/admin/editorial");
    expect(await sql!`select 1 from content.site_pages where body_translations::text like '%ITEM-ONE%'`).toHaveLength(0);
  });
});
