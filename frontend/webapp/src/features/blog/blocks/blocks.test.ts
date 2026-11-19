import { describe, expect, it } from "vitest";

import { blocksPlainText, buildToc, fallbackExcerpt, mediaIdsOf, readingMinutes, slugifyHeading } from "./derive";
import { blogPostingNode, faqPageFromBlocks, medicalReviewNode, videoObjectsFromBlocks } from "./jsonld";
import { emptyLexical, lexicalFromText, lexicalHasText, lexicalPlainText, sanitizeLexical } from "./lexical";
import { embedSrc, parseEmbedInput, safeHref } from "./links";
import { blockingIssues, checkReadiness, type ReadinessInput } from "./readiness";
import { BLOCK_TYPES, MAX_BLOCKS, createBlock, parseBlocks, readBlocks, type Block } from "./schema";

const GUID = "019d9835-84a9-9bd9-113a-5223b42a5453"; // production-shaped: not an RFC UUID

describe("safeHref", () => {
  it.each([
    ["https://example.com/a?b=1", true],
    ["http://example.com", true],
    ["/consulting", true],
    ["#faq", true],
    ["mailto:info@example.com", true],
    ["tel:+982188888888", true],
  ])("accepts %s", (value, ok) => expect(Boolean(safeHref(value))).toBe(ok));

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    " javascript:alert(1)",
    "java\nscript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD4=",
    "vbscript:msgbox",
    "file:///etc/passwd",
    "//evil.example.com/x",
    "https://user:pass@example.com",
    "/ok\\..\\evil",
    "",
    "   ",
    "ftp://example.com",
    "#a b",
  ])("rejects %j", (value) => expect(safeHref(value)).toBeNull());

  it("marks only absolute http(s)/mailto/tel as external", () => {
    expect(safeHref("/x")?.external).toBe(false);
    expect(safeHref("https://a.example")?.external).toBe(true);
  });
  it("rejects non-strings", () => {
    expect(safeHref(null)).toBeNull();
    expect(safeHref({ href: "/x" })).toBeNull();
  });
});

describe("embeds", () => {
  it("parses watch URLs for each provider", () => {
    expect(parseEmbedInput("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({ provider: "youtube", videoId: "dQw4w9WgXcQ" });
    expect(parseEmbedInput("https://youtu.be/dQw4w9WgXcQ?t=3")).toEqual({ provider: "youtube", videoId: "dQw4w9WgXcQ" });
    expect(parseEmbedInput("https://www.aparat.com/v/AbC12")).toEqual({ provider: "aparat", videoId: "AbC12" });
    expect(parseEmbedInput("https://www.aparat.com/video/video/embed/videohash/AbC12/vt/frame")).toEqual({ provider: "aparat", videoId: "AbC12" });
    expect(parseEmbedInput("https://vimeo.com/123456789")).toEqual({ provider: "vimeo", videoId: "123456789" });
  });
  it("rejects other hosts and malformed ids", () => {
    expect(parseEmbedInput("https://evil.example/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseEmbedInput("https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseEmbedInput("javascript:alert(1)")).toBeNull();
    expect(parseEmbedInput("<iframe src='x'></iframe>")).toBeNull();
    expect(embedSrc("youtube", "bad id\"onload=")).toBeNull();
  });
  it("accepts a bare id only with a provider", () => {
    expect(parseEmbedInput("dQw4w9WgXcQ")).toBeNull();
    expect(parseEmbedInput("dQw4w9WgXcQ", "youtube")).toEqual({ provider: "youtube", videoId: "dQw4w9WgXcQ" });
  });
  it("builds privacy-enhanced embed URLs", () => {
    expect(embedSrc("youtube", "dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(embedSrc("aparat", "AbC12")).toContain("aparat.com/video/video/embed/videohash/AbC12");
  });
});

describe("sanitizeLexical", () => {
  const paragraph = (children: unknown[]) => ({ type: "paragraph", children, format: "", direction: "rtl", indent: 0, version: 1 });
  const text = (value: string, format = 0) => ({ type: "text", text: value, format, mode: "normal", style: "color:red", detail: 0, version: 1 });
  const state = (children: unknown[]) => ({ root: { type: "root", children, direction: "rtl", format: "", indent: 0, version: 1 } });

  it("keeps allowed nodes and strips inline styles", () => {
    const out = sanitizeLexical(state([paragraph([text("سلام", 1)])]));
    const node = out.root.children[0].children![0];
    expect(node).toMatchObject({ type: "text", text: "سلام", format: 1, style: "" });
    expect(out.root.direction).toBe("rtl");
  });

  it("drops unknown node types (script-ish, image, custom)", () => {
    const out = sanitizeLexical(state([{ type: "script", children: [text("alert(1)")] }, { type: "image", src: "x" }, paragraph([text("ok")])]));
    expect(lexicalPlainText(out)).toBe("ok");
    expect(JSON.stringify(out)).not.toContain("alert");
  });

  it("removes links with unsafe URLs but keeps their text; keeps safe links", () => {
    const bad = sanitizeLexical(state([paragraph([{ type: "link", url: "javascript:alert(1)", children: [text("click")] }])]));
    expect(JSON.stringify(bad)).not.toContain("javascript");
    expect(lexicalPlainText(bad)).toBe("click");
    const good = sanitizeLexical(state([paragraph([{ type: "link", url: "https://example.com", children: [text("site")] }])]));
    const link = good.root.children[0].children![0];
    expect(link).toMatchObject({ type: "link", url: "https://example.com/", target: "_blank", rel: "noopener noreferrer" });
  });

  it("converts headings to bold paragraphs", () => {
    const out = sanitizeLexical(state([{ type: "heading", tag: "h1", children: [text("Title")] }]));
    expect(out.root.children[0].type).toBe("paragraph");
    expect((out.root.children[0].children![0] as unknown as { format: number }).format & 1).toBe(1);
  });

  it("keeps lists and drops list items outside a list", () => {
    const list = { type: "list", listType: "bullet", start: 1, children: [{ type: "listitem", value: 1, children: [text("a")] }, { type: "listitem", value: 2, children: [text("b")] }] };
    expect(lexicalPlainText(sanitizeLexical(state([list])))).toBe("a\nb");
    const stray = sanitizeLexical(state([{ type: "listitem", children: [text("x")] }]));
    expect(stray.root.children.every((c) => c.type !== "listitem")).toBe(true);
  });

  it("returns an empty paragraph for garbage and accepts a JSON string", () => {
    expect(sanitizeLexical(null).root.children).toHaveLength(1);
    expect(sanitizeLexical("not json").root.children).toHaveLength(1);
    expect(lexicalPlainText(sanitizeLexical(JSON.stringify(state([paragraph([text("hi")])]))))).toBe("hi");
  });

  it("rejects oversized documents", () => {
    const many = Array.from({ length: 4100 }, () => paragraph([text("x")]));
    expect(() => sanitizeLexical(state(many))).toThrow();
  });

  it("clamps format flags and text length", () => {
    const out = sanitizeLexical(state([paragraph([text("a".repeat(30_000), 99999)])]));
    const node = out.root.children[0].children![0] as unknown as { text: string; format: number };
    expect(node.text.length).toBe(20_000);
    expect(node.format).toBeLessThanOrEqual(127);
  });

  it("round-trips plain text and reports emptiness", () => {
    expect(lexicalHasText(emptyLexical())).toBe(false);
    expect(lexicalPlainText(lexicalFromText("one\n\ntwo"))).toBe("one\ntwo");
  });
});

describe("parseBlocks", () => {
  const valid = (): Block[] => [
    { id: "a1", v: 1, type: "heading", level: 2, text: "  Title  " },
    { id: "a2", v: 1, type: "richtext", lexical: lexicalFromText("Body") },
    { id: "a3", v: 1, type: "image", mediaId: GUID, alt: "An image", caption: "", size: "wide", align: "center", href: null, decorative: false },
  ];

  it("accepts a production-shaped (non-RFC) media GUID and normalises text", () => {
    const result = parseBlocks(valid());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.blocks[0]).toMatchObject({ type: "heading", text: "Title" });
  });

  it("creates a valid empty block of every type (drafts must save)", () => {
    for (const type of BLOCK_TYPES) {
      const result = parseBlocks([createBlock(type)]);
      expect(result.ok, `${type}: ${!result.ok ? result.message : ""}`).toBe(true);
    }
  });

  it("rejects unknown types, bad enums, and non-arrays", () => {
    expect(parseBlocks([{ id: "x", type: "html", html: "<script>" }]).ok).toBe(false);
    expect(parseBlocks([{ id: "x", type: "heading", level: 1, text: "x" }]).ok).toBe(false);
    expect(parseBlocks({}).ok).toBe(false);
    expect(parseBlocks(null).ok).toBe(false);
  });

  it("rejects unsafe media references and unsafe links", () => {
    expect(parseBlocks([{ id: "i", type: "image", mediaId: "javascript:alert(1)", alt: "", caption: "" }]).ok).toBe(false);
    expect(parseBlocks([{ id: "i", type: "image", mediaId: "data:image/png;base64,AAAA", alt: "", caption: "" }]).ok).toBe(false);
    expect(parseBlocks([{ id: "c", type: "cta", label: "Go", link: { href: "javascript:alert(1)" } }]).ok).toBe(false);
    expect(parseBlocks([{ id: "c", type: "cta", label: "Go", link: { href: "/consulting" } }]).ok).toBe(true);
  });

  it("rejects a malformed embed id but allows an unfinished embed draft", () => {
    expect(parseBlocks([{ id: "v", type: "video", source: "embed", provider: "youtube", videoId: "x\" onload=\"1" }]).ok).toBe(false);
    expect(parseBlocks([{ id: "v", type: "video", source: "embed", provider: "youtube", videoId: null }]).ok).toBe(true);
  });

  it("limits the number of blocks and the document size", () => {
    const many = Array.from({ length: MAX_BLOCKS + 1 }, (_, i) => ({ id: `d${i}`, type: "divider" }));
    expect(parseBlocks(many).ok).toBe(false);
    const huge = Array.from({ length: 12 }, (_, i) => ({ id: `q${i}`, type: "quote", text: "x".repeat(1000), cite: "" }));
    expect(parseBlocks(huge).ok).toBe(true);
    const heavy = Array.from({ length: 250 }, (_, i) => ({ id: `r${i}`, type: "richtext", lexical: lexicalFromText("y".repeat(6000)) }));
    expect(parseBlocks(heavy).ok).toBe(false);
  });

  it("makes duplicate block ids unique instead of failing", () => {
    const result = parseBlocks([{ id: "same", type: "divider" }, { id: "same", type: "divider" }]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(new Set(result.blocks.map((b) => b.id)).size).toBe(2);
  });

  it("readBlocks drops what it cannot read and never throws", () => {
    const out = readBlocks([{ id: "x", type: "divider" }, { id: "y", type: "from-the-future" }, 5, null, "str"]);
    expect(out).toHaveLength(1);
    expect(readBlocks(undefined)).toEqual([]);
  });
});

describe("derive", () => {
  const blocks = (): Block[] => {
    const parsed = parseBlocks([
      { id: "h1", type: "heading", level: 2, text: "When can you drive?" },
      { id: "p1", type: "richtext", lexical: lexicalFromText("First paragraph about driving after surgery.") },
      { id: "h2", type: "heading", level: 3, text: "When can you drive?" },
      { id: "h3", type: "heading", level: 2, text: "نیمه‌فاصله و فارسی" },
      { id: "i1", type: "image", mediaId: GUID, alt: "x", caption: "Cap" },
      { id: "v1", type: "video", source: "library", mediaId: "019d9835-84a9-9bd9-113a-5223b42a5454", posterMediaId: GUID, title: "V", caption: "" },
    ]);
    if (!parsed.ok) throw new Error(parsed.message);
    return parsed.blocks;
  };

  it("slugifies Latin and Persian headings", () => {
    expect(slugifyHeading("When can you drive?")).toBe("when-can-you-drive");
    expect(slugifyHeading("نیمه‌فاصله و فارسی")).toBe("نیمهفاصله-و-فارسی");
    expect(slugifyHeading("???")).toBe("section");
  });

  it("builds a TOC with unique ids for repeated headings", () => {
    const toc = buildToc(blocks());
    expect(toc.map((t) => t.id)).toEqual(["when-can-you-drive", "when-can-you-drive-2", "نیمهفاصله-و-فارسی"]);
    expect(toc[1].level).toBe(3);
  });

  it("collects plain text, media ids and an excerpt fallback", () => {
    const b = blocks();
    expect(blocksPlainText(b)).toContain("First paragraph");
    expect(mediaIdsOf(b).sort()).toEqual([GUID, "019d9835-84a9-9bd9-113a-5223b42a5454"].sort());
    expect(fallbackExcerpt(b)).toBe("First paragraph about driving after surgery.");
    expect(fallbackExcerpt([])).toBe("");
  });

  it("estimates reading time (min 1; Persian and CJK counted)", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("word ".repeat(450))).toBe(3);
    expect(readingMinutes("کلمه ".repeat(401))).toBe(3);
    expect(readingMinutes("中".repeat(801))).toBe(3);
  });
});

describe("readiness", () => {
  const base = (blocks: unknown[], over: Partial<ReadinessInput> = {}): ReadinessInput => {
    const parsed = parseBlocks(blocks);
    if (!parsed.ok) throw new Error(parsed.message);
    return { slug: "my-post", title: "T", excerpt: "E", seoDescription: "", blocks: parsed.blocks, featuredMedia: GUID, isMedical: false, hasReviewer: false, ...over };
  };
  const codes = (input: ReadinessInput) => checkReadiness(input).map((i) => `${i.severity}:${i.code}`);

  it("passes a complete post", () => {
    const issues = checkReadiness(base([{ id: "h", type: "heading", level: 2, text: "H" }, { id: "p", type: "richtext", lexical: lexicalFromText("Body") }]));
    expect(blockingIssues(issues)).toEqual([]);
  });
  it("blocks an empty post, an invalid slug and a missing title", () => {
    expect(codes(base([], { slug: "Bad Slug", title: " " }))).toEqual(expect.arrayContaining(["error:slug-invalid", "error:title-missing", "error:body-empty"]));
  });
  it("requires alt text unless the image is decorative", () => {
    const img = (alt: string, decorative: boolean) => base([{ id: "i", type: "image", mediaId: GUID, alt, caption: "c", decorative }]);
    expect(codes(img("", false))).toContain("error:image-missing-alt");
    expect(codes(img("", true))).not.toContain("error:image-missing-alt");
    expect(codes(img("ok", false))).not.toContain("error:image-missing-alt");
  });
  it("requires a poster for library videos and an id for embeds", () => {
    expect(codes(base([{ id: "v", type: "video", source: "library", mediaId: GUID, title: "t" }, { id: "q", type: "quote", text: "x" }]))).toContain("error:video-missing-poster");
    expect(codes(base([{ id: "v", type: "video", source: "embed", provider: "aparat", videoId: null, title: "t" }, { id: "q", type: "quote", text: "x" }]))).toContain("error:video-missing-embed");
  });
  it("flags empty FAQ, CTA without link, and warns about reviewers on medical posts", () => {
    expect(codes(base([{ id: "f", type: "faq", items: [{ id: "a", question: "", answer: emptyLexical() }] }]))).toContain("error:faq-empty");
    expect(codes(base([{ id: "c", type: "cta", label: "Go", link: { href: "" } }, { id: "q", type: "quote", text: "x" }]))).toContain("error:cta-missing-link");
    expect(codes(base([{ id: "q", type: "quote", text: "x" }], { isMedical: true }))).toContain("warning:medical-without-reviewer");
  });
  it("keeps advice as warnings", () => {
    const c = codes(base([{ id: "q", type: "quote", text: "x" }], { featuredMedia: null, excerpt: "", seoDescription: "x".repeat(200) }));
    expect(c).toEqual(expect.arrayContaining(["warning:no-heading", "warning:no-featured-image", "warning:no-excerpt", "warning:seo-description-too-long"]));
    expect(c.filter((x) => x.startsWith("error:"))).toEqual([]);
  });
});

describe("json-ld", () => {
  const parsed = parseBlocks([
    { id: "f1", type: "faq", title: "FAQ", items: [{ id: "a", question: "Q1?", answer: lexicalFromText("A1") }, { id: "b", question: "", answer: lexicalFromText("orphan") }] },
    { id: "f2", type: "faq", title: "More", items: [{ id: "c", question: "Q2?", answer: lexicalFromText("A2\n\nmore") }] },
    { id: "v1", type: "video", source: "embed", provider: "aparat", videoId: "AbC12", posterMediaId: GUID, title: "Demo", caption: "A demo" },
    { id: "v2", type: "video", source: "embed", provider: "aparat", videoId: "AbC12", title: "No poster", caption: "" },
  ]);
  const blocks = parsed.ok ? parsed.blocks : [];

  it("merges every FAQ block into one FAQPage and skips incomplete items", () => {
    const node = faqPageFromBlocks(blocks, "https://x.test/fa/blog/p") as { mainEntity: { name: string; acceptedAnswer: { text: string } }[]; "@id": string };
    expect(node["@id"]).toBe("https://x.test/fa/blog/p#faq");
    expect(node.mainEntity.map((q) => q.name)).toEqual(["Q1?", "Q2?"]);
    expect(node.mainEntity[1].acceptedAnswer.text).toBe("A2 more");
    expect(faqPageFromBlocks([], "u")).toBeNull();
  });

  it("emits VideoObject only with a title and a poster", () => {
    const nodes = videoObjectsFromBlocks(blocks, { url: "https://x.test/p", uploadDate: "2026-11-18T00:00:00Z", mediaUrl: (id) => (id ? `https://x.test/files/${id}.jpg` : undefined) });
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ "@type": "VideoObject", name: "Demo", embedUrl: expect.stringContaining("aparat.com") });
  });

  it("builds BlogPosting and only emits MedicalWebPage with a named reviewer", () => {
    const post = blogPostingNode({ url: "https://x.test/p", title: "T", description: "", locale: "fa", images: [], datePublished: "d", dateModified: "m", wordCount: 5, author: null, publisherId: "pub", websiteId: "web" });
    expect(post).toMatchObject({ "@type": "BlogPosting", author: { "@id": "pub" } });
    expect(post).not.toHaveProperty("description");
    expect(medicalReviewNode({ url: "u", title: "t", reviewer: null, lastReviewedAt: null })).toBeNull();
    expect(medicalReviewNode({ url: "u", title: "t", reviewer: { name: "Dr X" }, lastReviewedAt: "2026-01-01" })).toMatchObject({ reviewedBy: { name: "Dr X" } });
  });
});
