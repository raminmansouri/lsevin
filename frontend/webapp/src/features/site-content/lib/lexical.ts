/**
 * Builds serialized Lexical editor state from simple blocks. Seed content is
 * authored as blocks and stored in the same format the admin editor writes, so
 * editors can open and change it like anything they typed themselves.
 */

// Only node types the admin editor registers (components/blocks/editor-00/nodes.ts):
// a list node would make the editor fail to load the page.
export type ContentBlock = { type: "h2" | "h3" | "p" | "quote"; text: string };

const textNode = (text: string) => ({
  detail: 0,
  format: 0,
  mode: "normal",
  style: "",
  text,
  type: "text",
  version: 1,
});

const element = (type: string, children: unknown[], extra: Record<string, unknown> = {}) => ({
  children,
  direction: null,
  format: "",
  indent: 0,
  type,
  version: 1,
  ...extra,
});

function blockNode(block: ContentBlock) {
  switch (block.type) {
    case "h2":
    case "h3":
      return element("heading", [textNode(block.text)], { tag: block.type });
    case "quote":
      return element("quote", [textNode(block.text)]);
    default:
      return element("paragraph", [textNode(block.text)], { textFormat: 0, textStyle: "" });
  }
}

export function blocksToLexical(blocks: readonly ContentBlock[], direction: "ltr" | "rtl" = "ltr"): string {
  return JSON.stringify({ root: element("root", blocks.map(blockNode), { direction }) });
}

/** Plain text answer → one-paragraph Lexical state (FAQ answers). */
export const textToLexical = (text: string, direction: "ltr" | "rtl" = "ltr") =>
  blocksToLexical(
    text
      .split(/\n{2,}/u)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => ({ type: "p" as const, text: part })),
    direction,
  );

export const RTL_LOCALE_KEYS = new Set(["fa-IR", "ar-SA", "ku-KU"]);
export const directionForLocaleKey = (key: string) => (RTL_LOCALE_KEYS.has(key) ? "rtl" : "ltr");
