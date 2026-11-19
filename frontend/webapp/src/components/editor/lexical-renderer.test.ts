import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { LexicalRenderer } from "./lexical-renderer";

const text = (value: string) => ({ type: "text", text: value, format: 0, version: 1 });

const editorState = (...children: unknown[]) =>
  JSON.stringify({ root: { type: "root", children, direction: "ltr", version: 1 } });

const render = (content: string) =>
  renderToStaticMarkup(createElement(LexicalRenderer, { content }));

describe("LexicalRenderer", () => {
  // Provider descriptions on the mobile home carried empty heading nodes, which
  // rendered as bare <h3></h3> (front-end checklist: empty-heading).
  it("drops headings that have no text", () => {
    const html = render(
      editorState(
        { type: "paragraph", children: [text("A calm salon in Mashhad.")] },
        { type: "heading", tag: "h3", children: [] },
        { type: "heading", tag: "h2", children: [text("")] }
      )
    );

    expect(html).toMatch(/<p[^>]*>A calm salon in Mashhad\.<\/p>/);
    expect(html).not.toMatch(/<h[1-6]/);
  });

  it("still renders headings that have text", () => {
    const html = render(
      editorState({ type: "heading", tag: "h3", children: [text("Services")] })
    );

    expect(html).toContain("<h3>Services</h3>");
  });

  // The Turkish home page's package description nested a paragraph in a
  // paragraph; <p><p> broke hydration for the whole page (2026-11-14).
  it("never nests a <p> inside a <p>", () => {
    const html = render(
      editorState({ type: "paragraph", children: [{ type: "paragraph", children: [text("Paket açıklaması")] }] })
    );

    expect(html).toContain("Paket açıklaması");
    expect(html).not.toMatch(/<p[^>]*>(?:(?!<\/p>).)*<p/);
  });

  // 2026-11-15: seeded stays FAQ answers are plain text; each render logged
  // "Failed to parse Lexical content" (and failed the stays E2E console guard).
  it("shows plain text as is without logging an error; malformed editor JSON still logs", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(render("وقتی تاریخ را انتخاب کنید")).toContain("وقتی تاریخ را انتخاب کنید");
      expect(error).not.toHaveBeenCalled();
      render('{"root": broken');
      expect(error).toHaveBeenCalledTimes(1);
    } finally {
      error.mockRestore();
    }
  });

  // Regression (2026-11-18): the admin editor's link button did nothing and the public renderer
  // dropped link nodes, so authored links never reached a page.
  describe("links", () => {
    const link = (url: string, label: string) => ({ type: "link", url, children: [text(label)] });

    it("renders a safe external link with noopener", () => {
      const html = render(editorState({ type: "paragraph", children: [link("https://example.com/a", "site")] }));
      expect(html).toMatch(/<a [^>]*href="https:\/\/example\.com\/a"[^>]*>site<\/a>/);
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).toContain('target="_blank"');
    });

    it("renders a site-relative link without target", () => {
      const html = render(editorState({ type: "paragraph", children: [link("/consulting", "book")] }));
      expect(html).toMatch(/<a [^>]*href="\/consulting"[^>]*>book<\/a>/);
      expect(html).not.toContain("target=");
    });

    it.each(["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,x", "//evil.example"])(
      "keeps the text but drops an unsafe link: %s",
      (url) => {
        const html = render(editorState({ type: "paragraph", children: [link(url, "click me")] }));
        expect(html).toContain("click me");
        expect(html).not.toContain("<a ");
        expect(html).not.toContain("href");
      },
    );

    it("renders line breaks", () => {
      const html = render(editorState({ type: "paragraph", children: [text("a"), { type: "linebreak" }, text("b")] }));
      expect(html).toContain("a<br/>b");
    });
  });
});
