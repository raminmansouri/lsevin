# LSevin Blog & Block Editor — analysis and design

Status: **proposal for review** (nothing implemented). Date: 2026-11-18.
Scope: the webapp served on lsevincare.com, lsevin.ir (site A) and appmain.lsevin.com (same app).
Audience: the product owner and the engineers who will build it.

---

## 1. What exists today (analysis of `/admin/editorial`)

Method: code review of the deployed feature (`src/features/site-content`, released 2026-11-02, migrations 0085/0086), then a **read-only session in the live admin** on 2026-11-18 (the user signed in to a fresh Chrome profile; I drove it over CDP and saved nothing to production). Items marked "(live)" were observed in the browser.

Live observations: the hub lists the 9 pages (about-us and services published; the other 7 are drafts; all show 11/11 languages), the page form matches the code, and the admin sidebar group **«محتوا» (Content)** holds *Site content, Home sections, Enamad, Ad slider, Special packages, Login content, Media library* — the natural home for a Blog entry.

### 1.1 The editorial hub

| Part | How it works |
|---|---|
| Route | `/admin/editorial` has two tabs: **Pages** and **FAQs**. Sub-routes: `/pages/[slug]`, `/faqs/new`, `/faqs/[id]`. |
| Pages | A **fixed list of 9 slugs** (about-us, services, contact-us, licenses-certifications, pricing-fees, shipping-delivery, returns-refunds, terms-conditions, privacy-policy). Editors cannot create or delete a page. |
| Page form | Published switch, show-in-footer switch, display order, title / summary / body per language (11 language tabs), one hero image from the media picker. |
| FAQs | Separate list. Each item has a **scope** (home, explore, search, map, categories, provider, specialist, service, category, provider_type, app, site_page), an optional target entity, question + answer per language, order, active flag. |
| Storage | Schema `content`: `site_pages`, `faq_items`. Every text field is a `jsonb` map keyed by locale header (`fa-IR`, `en-US`, …). Bodies and FAQ answers are **one serialized Lexical state per language**. |
| Public side | `/{locale}/{slug}` is static (SSG) with ISR (1 h) and `revalidateTag("global:site-content")` on every save. The build renders bundled seed content because `next build` has no database. A locale without a translation shows the English/Persian copy with `noindex`. JSON-LD (WebPage/AboutPage/ContactPage + BreadcrumbList), FAQPage, sitemap and llms.txt are wired. |
| Permissions | Server actions call `adminMay(ctx, "editorial")` (RBAC from 2026-11-17). |
| Tests | `e2e/site-content.spec.ts` (6 Playwright tests), `site-content.int.test.ts`, unit tests. |

`/admin/tours-platform/editorial` is a different thing (tour landing modules). It is not part of this design.

### 1.2 The rich-text editor (the biggest gap)

- `components/blocks/editor-00` is Lexical 0.37 with **only four node types registered**: `HeadingNode`, `ParagraphNode`, `TextNode`, `QuoteNode` (`nodes.ts`).
- The toolbar offers bulleted / numbered / check lists and links, but `ListNode`, `ListItemNode` and `LinkNode` are **not registered** and no list/link plugin is mounted. The comment in `lib/lexical.ts` confirms the project hit this ("a list node would make the editor fail to load"). **(live) Confirmed on production:** with the cursor in a paragraph, choosing "Bulleted List" from the block menu produced no `<ul>`/`<li>`, and "Toggle link" on a selection produced no `<a>` and no URL prompt. The toolbar shows Undo, Redo, block menu (Paragraph, H1–H3, Bulleted, Numbered, Check, Quote), Bold, Italic, Underline, Strikethrough, Toggle link, four alignments, Outdent, Indent, Clear formatting — no image, video, table or embed control. Editing the 11 languages means 11 language tabs per field. The same limited editor is used for FAQ answers.
- (live) The body is one long continuous document; H2 headings render very large with a bottom border in the editor, so editors cannot judge how the page will look.
- `LexicalRenderer` (public side) is hand-written and handles text, paragraph, heading, quote, list. It has **no link, image, table or embed support**.
- **No images, video, tables, columns, callouts or FAQ inside the body.** The only image is the single hero.
- `LocalizedInput.hasContent` counts only paragraphs, so a heading-only body shows as empty in the language tab.
- Each of the 11 language tabs is a separate editor with its own copy of the content; there is no "copy structure from another language".

### 1.3 Other building blocks we can reuse

- **Media picker** (`features/media-picker-addon`): `MediaPickerModal` (single/multiple, image/video/file filter, upload with progress, search) returns `MediaItem` with `id, fileUrl, mimeType, width, height, durationSeconds, altTranslations, titleTranslations`. `/api/admin/media` backs it. (live) The library holds roughly 6,400 items (268 pages of 24), is searched by file name only, and the picker shows name, type and size but no alt text, tags or folders; with that volume editors need search by alt/title, an "unused" filter and recently-used first. Known pre-existing issue: its `GET`/`POST` accept any signed-in user (`requireApiUser`).
- **FAQ rendering** (`faq-section.tsx`): accessible `<details>` accordion and `faqPageSchema()`.
- **SEO stack** (`lib/seo`): `buildPublicMetadata`, `JsonLd`, `entity-schema` graph helpers, `directionFor`, sitemap and llms.txt hooks, per-locale eligibility.
- **RBAC** (`lib/admin/access`): resource catalog + action-id manifest (must be regenerated when actions are added).
- **Slug history pattern** from products (0110) and tours (0111).

### 1.4 What does not exist

- **No blog in the app.** `lsevin.com` is still WordPress with **37 blog posts** (`/blog/<category>/<slug>/`), 55+53+1 procedure pages and 171 doctor profiles (`docs/seo/lsevin-com-wordpress-urls.csv`). The domain plan makes lsevin.com the primary domain, so this content must land somewhere.
- 14 long **guides** (`/medical-tourism/...`, fa/ar/en) are hard-coded TypeScript in `features/guides/content`; an editor cannot change them without a deploy.
- No draft/preview, revisions, scheduling, categories, authors, SEO fields (title/description/OG image), slug history or redirects for editorial content.

### 1.5 Findings that affect the design

1. **Replication.** I found no reference to `content.*` tables in the SymmetricDS runbook or `register-schema-tables.sql`. If they are unregistered, an edit saved on B (lsevincare.com) never reaches A (lsevin.ir) except through migrations. **Unverified** (needs a read-only query of `sym_trigger` on prod). Whatever we build must register its tables.
2. **WordPress content may be tainted.** A text summary of one lsevin.com post listed unrelated "Also Read" cards ("Our Son 2026 BluRay x264") — typical of injected spam. Treat the WordPress export as untrusted input and review before import.
3. **Iran reachability.** lsevin.ir users cannot reach YouTube. The video block needs Aparat and self-hosted video as first-class options.
4. Migration numbers: `origin/Lsevin-New` is at **0118**; other developers add migrations concurrently, so take the next free number at merge time.

---

## 2. Requirements

**Goal:** a "Gutenberg-lite" editor. Editors compose a post from typed blocks, in each language independently, using the existing media picker, and publish safely to three hostnames. Deliberately not Elementor: no free-form layout, no custom CSS, no raw HTML.

### 2.1 Editor (MUST unless noted)

| # | Requirement |
|---|---|
| E1 | Create, edit, duplicate, archive and delete **posts** (not only 9 fixed pages). |
| E2 | Compose a post from **ordered blocks**: add via `+` menu and `/` command, reorder by drag **and** by keyboard/buttons, duplicate, delete, undo/redo. |
| E3 | **Structure & format**: headings H2–H4, paragraphs, bold/italic/underline/strikethrough, inline code, links (internal/external, `nofollow`/`sponsored` option), bulleted/numbered lists, quote, divider, table of contents (auto from headings), text alignment, RTL/LTR per block. |
| E4 | **Images** from the media picker: alt text and caption **per language**, size (content/wide/full), alignment, optional link. Gallery from several images. |
| E5 | **Video**: media-library video (with required poster), or an embed from an allow-list (Aparat, YouTube no-cookie, Vimeo). Stored as `{provider, id}`, never as pasted HTML. |
| E6 | **FAQ block**: question/answer pairs with rich-text answers, reorder, accordion on the page, contributes to one `FAQPage` JSON-LD node. "Insert from FAQ library" (existing `faq_items`) is a SHOULD. |
| E7 | **Callout** (info, tip, warning, medical disclaimer), **button/CTA** (label + internal/external/booking link), **pull quote** with attribution. |
| E8 | **Per-language documents**: each language has its own title, excerpt, blocks and SEO fields. "Add language" with "copy structure from…" (copies blocks, keeps media, marks text as untranslated). Language-tab dot shows status. |
| E9 | **Post settings**: slug, category, author, featured image, excerpt, SEO title/description, social image, publish date, "featured" flag. |
| E10 | **Status workflow per language**: draft → published (and archived). **Scheduling** by `published_at` in the future (SHOULD). |
| E11 | **Autosave** (draft only, never touches the published copy), **revisions** with restore, unsaved-changes guard. |
| E12 | **Preview** of the draft in the real public template, mobile/desktop width, noindex, not cached. |
| E13 | **Readiness checklist** before publish: title, slug, excerpt length, featured image alt, every image has alt, ≥1 H2, meta description length, language has body, medical posts have a reviewer. Errors block publishing; warnings do not. |
| E14 | Same editor later for the 9 site pages (SHOULD, phase 2): their Lexical body becomes one rich-text block, losslessly. |
| E15 | COULD: columns (2–3, one level), table, reusable blocks (saved CTA/disclaimer), entity card (provider/service/tour/product), related posts, tags. |

### 2.2 Public site

| # | Requirement |
|---|---|
| P1 | `/{locale}/blog` (paginated list, category chips), `/{locale}/blog/{slug}`, `/{locale}/blog/category/{slug}`, `/{locale}/blog/feed.xml`. |
| P2 | Server-rendered, static + ISR, **no client JS for reading** except the video facade and accordion. Core Web Vitals budget as the rest of the site. |
| P3 | RTL/LTR per language, one `h1`, heading ids for anchors, breadcrumb, last-updated date, reading time, author box, related posts, share links. |
| P4 | Structured data: `BlogPosting`, `BreadcrumbList`, one merged `FAQPage`, `ImageObject`, `VideoObject` (needs poster + upload date), `MedicalWebPage` with `reviewedBy` **only** when a reviewer is set. |
| P5 | `hreflang`/sitemap/`llms.txt` only for languages with a published translation; other languages show the fallback with `noindex` (same rule as site pages). Canonical on lsevincare.com via `seoOrigin()`. |
| P6 | Old slug → 308 to the current slug (slug history); WordPress URLs map to the new ones. |
| P7 | The same content is served on lsevin.ir and appmain.lsevin.com (replication, section 8). |

### 2.3 Non-functional

- **Security:** no raw HTML anywhere; embeds from an allow-list; link schemes limited to `https`, `http`, `mailto`, `tel`, relative; media referenced by id and validated; every block validated by zod on the server on every save; limits (≤ 300 blocks, ≤ 1 MB per document).
- **Authorization:** every action checks RBAC server-side; unpublished content never leaves the admin/preview route.
- **Accessibility:** editor usable by keyboard only; images need alt (or an explicit "decorative" flag); accordion and tables semantic.
- **Resilience:** database failure on the public side keeps serving the last good page (existing pattern); an editor save failure never shows as a validation error.
- **Compatibility:** content stored with a `schema_version`; renderers ignore unknown block types instead of crashing.

---

## 3. Key decisions

### D1. A block tree, not one big rich-text document

Store each language's body as an **ordered array of typed blocks** (`jsonb`). Text blocks keep Lexical state inside; structural blocks (image, video, FAQ, callout…) are plain validated JSON.

Why: an FAQ block must be machine-readable for JSON-LD; images and videos must reference media by id (so alt text, poster and CDN URL resolve at render time); each block can be validated, imported from WordPress, or sent to the Flutter apps as JSON. A single Lexical document with custom nodes would also work, but we would own a nonstandard serialization inside Lexical anyway, and validation/rendering by block type is simpler.

### D2. Editor technology: our own block list + Lexical inside text blocks

| Option | Verdict |
|---|---|
| **Own block list (dnd-kit) + one small Lexical editor per text block** | **Recommended.** Reuses Lexical 0.37 and existing content (site pages and FAQ answers are already Lexical JSON, so no content migration). We own RTL, a11y and the JSON schema. Cost: we build slash menu, block toolbar, reorder. |
| TipTap / ProseMirror | Strong, but a second editor technology and a different JSON; Persian RTL behaviour would need its own verification. |
| BlockNote (TipTap-based, slash menu and drag handles built in) | Fastest first demo. Risks: schema owned by a library, RTL unverified, check the licence of its `xl-*` packages. **Fallback** if the 2-day spike in phase 0 shows our own block list is slower than expected. |
| Editor.js / Puck | Editor.js has weak RTL and upkeep; Puck is a page builder (too Elementor-like). Not chosen. |

New dependency needed: `@dnd-kit/core` + `@dnd-kit/sortable` (not installed). `@lexical/list`, `@lexical/link`, `@lexical/table` are already in `package.json`.

### D3. One independent document per language (not a shared structure)

Matches how the site already works (`*_translations` maps, no mixed-language pages, noindex fallback) and the reality that most posts will exist in 1–3 languages. A shared-structure model (WPML/Elementor style) forces identical layouts and a much harder editor. The "copy structure from another language" action covers the convenience.

### D4. One shared ASCII slug per post

`/blog/<slug>` is the same in every language, which keeps `hreflang`, the language switcher and redirects simple, and matches products/tours. Changing a slug writes `content.post_slug_history` and old URLs 308 to the new one. Per-language slugs are a possible later addition.

### D5. Flat URLs, category as a filter

New URL `/blog/{slug}`; WordPress `/blog/{category}/{slug}/` is mapped to it by the redirect plan (the `app_target` column of the URL inventory exists for this). Cheaper to keep correct when an editor re-categorises a post.

### D6. Scheduling without a job runner

A post is public when `status = published and published_at <= now()` — evaluated in the query. ISR revalidate of 300 s on the blog routes plus `revalidateTag` on every save means a scheduled post appears within 5 minutes without a cron service. The sitemap uses the same predicate.

### D7. FAQ: inline block first, library second

The FAQ block stores its own Q/A (post-specific). The existing `content.faq_items` stays for page-level FAQs; the block can **import** items from it (copy, not link, so an edit to the library never silently rewrites a published post). All FAQ blocks on a page merge into one `FAQPage` node.

---

## 4. Block catalogue and JSON model

Common envelope (per block): `{ id: ulid, type, v: 1, ...props }`. Unknown `type` → skipped on render, preserved on save.

```jsonc
// content.post_translations.blocks  (one array per post per language)
[
  { "id": "01H…", "type": "heading",  "v": 1, "level": 2, "text": "When can you drive?" },
  { "id": "01H…", "type": "richtext", "v": 1, "lexical": { "root": { … } } },   // existing Lexical JSON + List/Link nodes
  { "id": "01H…", "type": "image",    "v": 1, "mediaId": "uuid", "alt": "…", "caption": "…",
    "size": "content", "align": "center", "href": null, "decorative": false },
  { "id": "01H…", "type": "video",    "v": 1, "source": "library", "mediaId": "uuid", "posterMediaId": "uuid",
    "title": "…", "caption": "…" },                                             // or {"source":"embed","provider":"aparat","videoId":"x7y8z"}
  { "id": "01H…", "type": "faq",      "v": 1, "title": "Common questions",
    "items": [ { "id": "…", "question": "…", "answer": { "lexical": { … } } } ] },
  { "id": "01H…", "type": "callout",  "v": 1, "tone": "medical", "title": "…", "body": { "lexical": { … } } },
  { "id": "01H…", "type": "cta",      "v": 1, "label": "…", "link": { "kind": "internal", "path": "/consulting" }, "style": "primary" }
]
```

Alt text, caption and titles live **in the block of that language**; the media library's `altTranslations` is only the default suggested when the image is inserted.

| Phase | Blocks |
|---|---|
| **MVP** | heading, richtext (paragraph, lists, quote, links, marks), image, gallery, video, faq, callout, cta, divider, quote/pull-quote, auto table of contents |
| **v1.1** | table, columns (1 level), key takeaways, entity card (provider/service/tour/product by id, resolved live), related posts |
| **Later** | reusable blocks, tags, AI assist, page builder for the 9 site pages |
| **Never** | raw HTML / script / iframe paste, custom CSS, arbitrary nesting |

Renderer: a server `BlockRenderer` with a registry `type → component`, shared by the public page, the preview and the editor canvas (so "what you see" is the same code). Existing `LexicalRenderer` gains link, and richtext keeps using it.

---

## 5. Data model (new migration; additive only)

Schema `content`. Existing `site_pages` and `faq_items` are untouched.

```sql
content.post_categories   (id, slug unique, name_translations jsonb, sort_order, is_active)
content.authors           (id, user_id uuid null, name_translations, bio_translations, avatar_media text,
                           credentials_translations jsonb, is_medical_reviewer bool)
content.posts             (id, slug unique, category_id, author_id, reviewer_id null, last_reviewed_at null,
                           featured_media text, is_featured bool, source_url text unique null,   -- WordPress import key
                           created_at, updated_at, updated_by)
content.post_translations (post_id, locale_key text,          -- 'fa-IR', 'en-US', …  PK (post_id, locale_key)
                           status text check (draft|published|archived),
                           title text, excerpt text, blocks jsonb, schema_version int,
                           seo_title text, seo_description text, og_media text,
                           published_at timestamptz null, reading_minutes int,
                           search_text text, updated_at, updated_by)
content.post_revisions    (id, post_id, locale_key, title, blocks jsonb, kind text, created_by, created_at)  -- insert-only
content.post_slug_history (old_slug text primary key, post_id, changed_at)
-- indexes: (status, published_at desc) partial on published; post_translations(locale_key, status);
--          GIN on search_text (to_tsvector) in v1.1
```

Rules: slug `^[a-z0-9]+(-[a-z0-9]+)*$`; a language can publish only if it has a title and ≥ 1 non-empty block (enforced in the action, mirrored by a `check`); `blocks` is `jsonb_typeof = 'array'`; revisions keep the last 30 autosaves plus every publish.

Operational requirements (from the existing dual-site setup):
- **Register every new table with SymmetricDS** so site A receives edits; use the allow-list guard of `register-schema-tables.sql`. Avoid `DEFERRABLE` constraints (they broke initial load for `tour.itinerary_stops`, 2026-10-26).
- Revisions are insert-only (cheap to replicate, no conflicts). Posts/translations use last-writer-wins by `updated_at`; with two admin sites, edit one post from one site at a time.
- Media files replicate by rclone bisync; media rows by their existing registration. Blocks reference media by id, so URLs resolve per host.

---

## 6. Server design

Feature folder `src/features/blog/` (mirrors `site-content`):

```
blog/
  blocks/        schema.ts (zod discriminated union, v1), registry.ts, sanitize.ts (link/embed rules), toc.ts, jsonld.ts, reading-time.ts
  server/        repository.ts (public reads: unstable_cache + build-phase seed fallback; admin reads)
  actions/       savePost, saveTranslation (autosave vs save), publish/unpublish, delete, restoreRevision (media comes from the existing picker, no new upload path)
  components/
    public/      BlogIndex, BlogPost, BlockRenderer, blocks/* (one server component per type)
    admin/       PostList, PostEditor (canvas, inserter, inspector, outline, top bar), block editors, ReadinessPanel
```

- **Actions** return the existing `EditorialActionResult` shape; infrastructure failures are `FAILED` with a logged error, never `INVALID` (CLAUDE.md §4). Every action: `adminMay(ctx, "editorial.blog", level)`.
- **Autosave** writes a `post_revisions` row (`kind='autosave'`) and the draft `post_translations` row, never a published one. MVP model: **editing a published language changes it live only on an explicit Save; autosave writes revisions only**, and the editor offers "Restore autosave" after a crash. A separate "pending draft beside the live copy" is deferred (decision Q5).
- **Revalidation:** tags `blog:list`, `blog:post:{id}`, `blog:locale:{key}` instead of the global site tag; sitemap and llms.txt read through the same cached loaders.
- **Public loaders** never throw on database failure: return `undefined` so ISR keeps the last good page (as `getPublishedSitePage` does). `next build` renders seed/empty because there is no database at build.
- **RBAC:** add resources `editorial.blog` (view/manage = open/edit drafts) and `editorial.blog.publish` (publish, schedule, delete, restore). Register in `catalog.ts`/`resolver.ts`, regenerate the action manifest, follow `lib/admin/access/README.md`. Also fix `/api/admin/media` `GET`/`POST` to require an admin permission, since the picker is the entry point for images.
- **Sanitisation:** a single module validates link targets and embed ids; `rel="noopener noreferrer"` always; `target=_blank` only for external; Lexical text is stored as JSON and rendered by our renderer, so no HTML string is ever injected.

### Editor UI (admin)

Route `/admin/editorial/blog` (list: search, status/language/category filters, "missing translation" badges) and `/admin/editorial/blog/[id]` (editor). The Editorial hub gets a third tab: **Blog**.

```
┌ top bar: ← Posts │ fa en ar tr … (+ add language) │ Saved ✓ │ Undo Redo │ List view │ Preview ▾(mobile/desktop) │ Save │ Publish ▾ ┐
├──────────────┬──────────────────────────────────────────────────────┬───────────────────────────┤
│ Outline /    │  Canvas: blocks rendered with the public components  │ Inspector tabs:           │
│ block list   │  [+] between blocks, "/" inserts, drag handle,       │  Post (slug, category,    │
│ (reorder,    │  block toolbar (move ↑↓, duplicate, delete, align)   │  author, featured, dates) │
│  jump)       │  rich text: inline toolbar (B I U link, list, H2/H3) │  Block (selected props)   │
│              │  image/video: opens media picker                     │  SEO · Readiness          │
└──────────────┴──────────────────────────────────────────────────────┴───────────────────────────┘
```

Keyboard: `/` inserts, `Enter` new paragraph, `Backspace` on an empty block removes it, `Alt+↑/↓` moves a block, `Ctrl/Cmd+S` saves, `Ctrl/Cmd+Z/Y` undo/redo (block-level history above Lexical's own), `Esc` closes pickers. Phone widths: the inspector becomes a bottom sheet, the outline a drawer.

Only the active language's editor is mounted (11 mounted Lexical editors would be slow); switching language autosaves first.

### Public pages

`/{locale}/blog` and `/{locale}/blog/{slug}` live in `app/[locale]/(site)/blog/...` inside the existing site layout (customer chrome, footer). `generateStaticParams` returns empty (render on demand, then cache) because the post set changes at runtime; `revalidate = 300`. The post page assembles one JSON-LD `@graph` (BlogPosting, BreadcrumbList, FAQPage, VideoObject, optional MedicalWebPage). The blog index page links to posts with readable URLs and shows only languages that have a translation.

---

## 7. WordPress and guides migration

1. **Importer** `scripts/blog-import-wp.mjs`, run by an admin (not a SQL migration, because it uploads media): reads `lsevin.com/wp-json/wp/v2/posts` (37), converts HTML → blocks (`h2–h4`, `p`, `ul/ol`, `blockquote`, `figure/img`, `table`, `iframe` for known providers); anything unknown becomes a plain rich-text block and is listed in a report. Images are downloaded and uploaded through the existing media pipeline. Idempotent by `source_url`. Imported posts arrive as **drafts** for human review.
2. **Sanitise first:** strip scripts, "Also Read"/"Read Also" widgets, sidebar forms and any link whose host is not on a reviewed list (see finding 1.5.2).
3. **Redirects:** emit the WordPress→new-slug map into `post_slug_history`-style redirects and the lsevin.com cutover plan (`docs/seo/lsevin-com-migration.md`). Do not switch `PRIMARY_PUBLIC_ORIGIN` before lsevin.com serves the app.
4. **Guides** (14 × fa/ar/en in TypeScript): convert later with a one-off script into posts of a "Guides" category, then delete the code copy once URLs are verified. Not part of the MVP.
5. **Site pages:** phase 2 adds a `body_blocks` column and the block editor to pages; `body_translations` stays until verified.

---

## 8. Delivery plan

Sizes are rough engineer-days for one engineer familiar with the codebase; they are estimates, not measured.

| Phase | Content | Size |
|---|---|---|
| **0 Prerequisites** | Decide open questions (§10). Register `ListNode`/`LinkNode` + plugins and add link rendering (a real bug fix on its own, with regression test). Verify whether `content.*` replicates to A. 2-day editor spike (own block list vs BlockNote). | 4–5 |
| **1 MVP** | Migration + SymmetricDS registration; zod block schema and unit tests; admin post list and editor (heading, richtext, image, gallery, video, faq, callout, cta, divider, quote, TOC); media picker integration; per-language documents and copy-structure; autosave + revisions; preview; readiness checklist; public index/post/category, sitemap, llms.txt, RSS, JSON-LD; RBAC resources; slug history; E2E and integration tests. | 20–28 |
| **2** | WordPress importer + review + redirects; table, columns, entity cards, related posts; scheduling UI; search; site pages on the block editor; revision diff. | 12–18 |
| **3** | Guides conversion, reusable blocks, tags, AI-assisted translate/alt-text (existing assistant), post-level analytics. | later |

### Verification plan (per CLAUDE.md)

- **Unit:** every block schema (valid, invalid, boundary, unknown type), link/embed sanitiser (`javascript:`, `data:`, `vbscript:`, protocol-relative, unicode tricks), WordPress converter fixtures, JSON-LD builders (FAQ merge, VideoObject without poster), reading time with Persian/Arabic text.
- **Integration (real Postgres, pgvector test DB):** save → publish → read; per-language independence; revision restore; slug change → history → 308; scheduled visibility predicate; RBAC (anonymous, customer, limited admin without `editorial.blog.publish`, superadmin); unexpected database error → `FAILED`, not `INVALID`.
- **Playwright E2E:** direct URL, login → blog list → new post → `/` inserts heading → type → add image via media picker → add video → add FAQ and reorder by keyboard → save → refresh → content persists → publish → public page shows content, one `h1`, valid FAQPage JSON-LD → switch to `fa` (RTL) and `ar`, check direction → fallback language is `noindex` → old slug redirects → customer gets 403 → server failure shows an error toast and keeps the draft → mobile viewport.
- **Migration:** apply the new migration to a clone of the production snapshot (not an empty DB) and start the app against it; note the numbering conflict check at merge time.
- **Release:** `pnpm test:seo` with the unused-DB `DATABASE_URL` (known Docker-build trap), production build with no database, sitemap/llms.txt probes, post-deploy smoke on B and A. No production writes or logins for testing without asking.

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Own editor takes longer than estimated (slash menu, selection across blocks, IME for Persian/Arabic) | Phase-0 spike with BlockNote as fallback; MVP cuts columns/table; keep block UIs simple forms with Lexical only for text. |
| Content tables not replicated to A | Verify first (read-only); register new tables; document single-site editing during a transition. |
| Two admin sites overwrite each other | Insert-only revisions; last-writer-wins by `updated_at`; recommend editing on B. |
| Existing editor's list and link buttons do nothing (confirmed live) | Phase-0 fix, otherwise the new rich-text block inherits it. |
| Lexical JSON drift on upgrade | Store `schema_version`; pin Lexical; renderer tolerant of unknown nodes. |
| Medical content liability | Reviewer field, "last reviewed" date, medical-disclaimer callout, `MedicalWebPage` only with a reviewer; legal review of copy stays outside the system. |
| SEO regression during the lsevin.com cutover | Redirect map tested against the 37 WordPress URLs before switching DNS. |
| Large documents slow saves | Limits (300 blocks / 1 MB), per-translation rows, partial updates of one language. |

---

## 10. Decisions needed from the product owner

1. **URL shape:** flat `/blog/{slug}` (recommended) or mirror WordPress `/blog/{category}/{slug}`?
2. **Mandatory languages:** is Persian required before a post can publish in other languages? Which languages must the importer cover (WordPress has English/Arabic procedure pages; the 37 posts appear to be English)?
3. **Authors and medical review:** real author profiles with credentials? Is a medical reviewer required for health-advice posts?
4. **Approval workflow:** is one level enough (editors write, managers publish — the `editorial.blog.publish` split), or do you need review/approve states?
5. **Editing a published post:** edit live on Save (MVP), or keep a pending draft beside the live copy (more work)?
6. **Video hosting:** Aparat embeds and library uploads in MVP — agreed? Any restriction on YouTube for lsevin.com?
7. **Comments:** WordPress had them closed; assume none?
8. **Slug language:** Latin-only slugs (recommended) or allow Persian slugs?
9. **Priority:** do the 9 site pages move to the new editor in the first release or after the blog?

---

## 11. Implementation notes (2026-11-18, branch `feat/blog-cms`)

Where the first implementation differs from the proposal above, and why:

| Proposal | Implemented | Why |
|---|---|---|
| Blog tab inside `/admin/editorial`, permission `editorial` | Own admin area **`/admin/blog`** (sidebar row under Content), permission resource **`blog`** | The repo's access-control rules (`src/lib/admin/access/README.md`) make a sidebar row the permission resource. A `/admin/editorial/blog` row would turn `/admin/editorial` into a parent leaf and silently take page/FAQ editing away from limited admins who hold `editorial`. |
| `editorial.blog` + `editorial.blog.publish` split | One resource `blog` (view / manage) | Publish-only roles need per-action levels the RBAC model does not have. Deferred. |
| `@dnd-kit` drag and drop | Native HTML5 drag handle **plus** move-up/move-down buttons | No new dependency or lockfile change; the buttons are the keyboard path. |
| `/` slash inserter | `+` inserter with search between blocks (keyboard operable) | Slash commands inside Lexical need a typeahead plugin; deferred. |
| `ulid` block ids | `b` + 12 hex chars from `crypto.randomUUID()` | No dependency. |
| Preview in the public template | Same public components rendered under `/admin/blog/[id]/preview` (admin chrome around it) | The admin gate protects the URL; preview shows a saved draft or a newer autosave. |
| Migration `0120_blog` | `content.post_categories`, `post_authors`, `posts`, `post_translations`, `post_revisions`, `post_slug_history` | Authors are their own table (the plan had `authors`); `is_medical` lives on `posts`. |

Phase 0 fixes shipped with it: the legacy editor (`components/blocks/editor-00`) now registers list and link nodes and plugins, its link button asks for the address, and the shared `LexicalRenderer` renders links and line breaks (`src/lib/safe-href.ts` is the single URL rule).

Not in this increment: WordPress importer and redirect map, tables/columns/entity cards/related-posts blocks beyond the automatic "more to read", site pages on the block editor, tags, search, SymmetricDS registration of the six new tables (needs the production runbook, see section 5), per-language publish/approval roles.

### Verification evidence (2026-11-18, branch `feat/blog-cms`)

- Unit: 61 blog tests (block schema, sanitiser, links/embeds, readiness, JSON-LD, message keys) + 11 `LexicalRenderer` tests (links/line breaks) + the SEO, site-content, access-control and editor suites (375 tests) — PASS.
- Integration, real Postgres (`lsevin_blog_test`, migrations 0001–0119, the blog migration was still named `0119_blog` when tested and was renumbered to 0120 afterwards because upstream took 0119; the SQL is unchanged): 25/25 — PASS. Same suite plus site-content integration (48 tests) on a clone of the production snapshot after applying the 8 pending migrations (0113–0119) with `scripts/migrate.mjs` — PASS.
- Playwright (`e2e/blog.spec.ts`, 20 tests, real Next dev server + Postgres): 20/20 — PASS. Bugs it found and fixed: inserter did not focus its search field; draft preview crashed (500) on an empty publish date; drop onto a rich-text body was not delivered (blocks are now dropped on another block's header strip).
- Ops step after deploy (not run): register the six new tables with SymmetricDS so site A receives edits — `psql -v schema=content -v only=post_categories,post_authors,posts,post_translations,post_revisions,post_slug_history -f deployments/symmetricds/sql/register-schema-tables.sql` on hub B (dry run first). Whether `content.site_pages` / `content.faq_items` are registered is still unverified.
