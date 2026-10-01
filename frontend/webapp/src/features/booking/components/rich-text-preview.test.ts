import { describe, expect, it } from "vitest";

import { getRichTextPlainText, isSerializedLexicalContent } from "./rich-text-preview";

const emptyLexicalState = JSON.stringify({
  root: {
    children: [
      {
        children: [],
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
        textFormat: 0,
        textStyle: "",
      },
    ],
    direction: "rtl",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
});

describe("rich text preview parsing", () => {
  it("recognizes an empty Lexical state without exposing its JSON", () => {
    expect(isSerializedLexicalContent(emptyLexicalState)).toBe(true);
    expect(getRichTextPlainText(emptyLexicalState)).toBe("");
  });

  it("extracts readable text from a populated Lexical state", () => {
    const content = JSON.stringify({
      root: {
        children: [{ type: "paragraph", children: [{ type: "text", text: "توضیحات خدمت" }] }],
      },
    });

    expect(getRichTextPlainText(content)).toBe("توضیحات خدمت");
  });

  it("preserves plain-text descriptions", () => {
    expect(getRichTextPlainText("متن ساده")).toBe("متن ساده");
  });
});
