import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

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
});
