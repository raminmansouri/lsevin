import { describe, expect, it } from "vitest";

import { firstSeoPlainText, toSeoPlainText } from "./plain-text";

describe("toSeoPlainText", () => {
  it("normalizes whitespace in plain localized text", () => {
    expect(toSeoPlainText("  کاشت مو\n  کلینیک لیان  ")).toBe("کاشت مو کلینیک لیان");
  });

  it("extracts text nodes from serialized Lexical content", () => {
    const lexical = JSON.stringify({
      root: {
        type: "root",
        children: [
          { type: "paragraph", children: [{ type: "text", text: "Hair transplant" }] },
          { type: "paragraph", children: [{ type: "text", text: "in Tehran" }] },
        ],
      },
    });
    expect(toSeoPlainText(lexical)).toBe("Hair transplant in Tehran");
  });

  it("rejects unsafe values instead of stringifying them", () => {
    expect(toSeoPlainText({ en: "description" })).toBe("");
    expect(toSeoPlainText("[object Object]")).toBe("");
    expect(toSeoPlainText("<p>description</p>")).toBe("");
    expect(toSeoPlainText('{"root":')).toBe("");
  });

  it("truncates Unicode at a word boundary", () => {
    expect(toSeoPlainText("one two three four", 13)).toBe("one two three");
    expect(toSeoPlainText("😀😀😀😀", 3)).toBe("😀😀😀");
  });
});

describe("firstSeoPlainText", () => {
  it("uses the first valid normalized fallback", () => {
    expect(firstSeoPlainText([{}, "<p>bad</p>", "  valid description "])).toBe(
      "valid description",
    );
  });
});
