/**
 * The Lexical state kept inside blocks. Editors never produce HTML, but the stored JSON still
 * crosses a trust boundary (server actions, the WordPress importer), so it is rebuilt here from
 * an allow-list: unknown node types are dropped, links are checked, styles are removed.
 *
 * Allowed: paragraph, text (bold/italic/underline/strikethrough/code/sub/sup), linebreak, quote,
 * list (bullet/number), listitem, link. Headings are not allowed inside rich text — a heading is
 * its own block — and are converted to a bold paragraph.
 */
import { safeHref } from "./links";

export type LexicalNode = Record<string, unknown> & { type: string; children?: LexicalNode[] };
export interface LexicalState {
  root: LexicalNode & { type: "root"; children: LexicalNode[] };
}

const MAX_DEPTH = 6;
const MAX_NODES = 4000;
const MAX_TEXT = 20_000;
const BOLD = 1;
const TEXT_FORMAT_MASK = 0b1111111;
const ALIGNMENTS = new Set(["", "left", "center", "right", "justify", "start", "end"]);

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

class Budget {
  nodes = 0;
  take() {
    this.nodes += 1;
    if (this.nodes > MAX_NODES) throw new Error("Rich text is too large.");
  }
}

const direction = (value: unknown) => (value === "rtl" || value === "ltr" ? value : null);

function textNode(text: string, format = 0): LexicalNode {
  return { type: "text", text: text.slice(0, MAX_TEXT), format: format & TEXT_FORMAT_MASK, style: "", mode: "normal", detail: 0, version: 1 };
}

function element(type: string, children: LexicalNode[], extra: Record<string, unknown> = {}): LexicalNode {
  return { type, children, direction: null, format: "", indent: 0, version: 1, ...extra };
}

function cleanChildren(value: unknown, depth: number, budget: Budget, inList: boolean): LexicalNode[] {
  if (!Array.isArray(value)) return [];
  const out: LexicalNode[] = [];
  for (const child of value) {
    const cleaned = cleanNode(child, depth + 1, budget, inList);
    if (cleaned) out.push(...cleaned);
  }
  return out;
}

function cleanNode(raw: unknown, depth: number, budget: Budget, inList: boolean): LexicalNode[] | null {
  if (!isObject(raw) || typeof raw.type !== "string") return null;
  if (depth > MAX_DEPTH) return null;
  budget.take();
  const kids = () => cleanChildren(raw.children, depth, budget, inList);

  switch (raw.type) {
    case "text": {
      const text = typeof raw.text === "string" ? raw.text : "";
      const format = typeof raw.format === "number" && Number.isInteger(raw.format) ? raw.format : 0;
      return text ? [textNode(text, format)] : [];
    }
    case "linebreak":
      return [{ type: "linebreak", version: 1 }];
    case "paragraph": {
      const align = typeof raw.format === "string" && ALIGNMENTS.has(raw.format) ? raw.format : "";
      return [element("paragraph", kids(), { format: align, direction: direction(raw.direction), textFormat: 0, textStyle: "" })];
    }
    case "heading": {
      // Headings are blocks of their own: keep the words, make them bold.
      const children = kids().map((child) => (child.type === "text" ? { ...child, format: (Number(child.format) | BOLD) & TEXT_FORMAT_MASK } : child));
      return [element("paragraph", children, { textFormat: 0, textStyle: "" })];
    }
    case "quote":
      return [element("quote", kids(), { direction: direction(raw.direction) })];
    case "list": {
      const listType = raw.listType === "number" ? "number" : "bullet";
      const children = cleanChildren(raw.children, depth, budget, true).filter((child) => child.type === "listitem");
      if (!children.length) return [];
      const start = typeof raw.start === "number" && Number.isInteger(raw.start) && raw.start > 0 && raw.start < 10_000 ? raw.start : 1;
      return [element("list", children, { listType, start, tag: listType === "number" ? "ol" : "ul", direction: direction(raw.direction) })];
    }
    case "listitem": {
      if (!inList) return kids();
      const value = typeof raw.value === "number" && Number.isInteger(raw.value) && raw.value > 0 ? raw.value : 1;
      return [element("listitem", cleanChildren(raw.children, depth, budget, true), { value, direction: direction(raw.direction) })];
    }
    case "link":
    case "autolink": {
      const target = safeHref(raw.url);
      const children = kids();
      if (!target) return children; // keep the text, drop the link
      const rel = target.external ? "noopener noreferrer" : null;
      const title = typeof raw.title === "string" && raw.title.length <= 200 ? raw.title : null;
      return [element("link", children, { url: target.href, rel, target: target.external ? "_blank" : null, title })];
    }
    default:
      return null;
  }
}

/** Rebuilds untrusted Lexical JSON from the allow-list. Throws only on oversized input. */
export function sanitizeLexical(input: unknown): LexicalState {
  const raw = typeof input === "string" ? safeParse(input) : input;
  const rootRaw = isObject(raw) && isObject(raw.root) ? raw.root : null;
  const budget = new Budget();
  const children = rootRaw ? cleanChildren(rootRaw.children, 0, budget, false) : [];
  // A root child must be a block (paragraph/quote/list), never bare text or a link.
  const blocks = wrapInline(children);
  const root = { ...element("root", blocks.length ? blocks : [emptyParagraph()]), direction: direction(rootRaw?.direction) } as LexicalState["root"];
  return { root };
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const BLOCK_TYPES = new Set(["paragraph", "quote", "list"]);

function wrapInline(nodes: LexicalNode[]): LexicalNode[] {
  const out: LexicalNode[] = [];
  let run: LexicalNode[] = [];
  const flush = () => {
    if (run.length) out.push(element("paragraph", run, { textFormat: 0, textStyle: "" }));
    run = [];
  };
  for (const node of nodes) {
    if (BLOCK_TYPES.has(node.type)) {
      flush();
      out.push(node);
    } else run.push(node);
  }
  flush();
  return out;
}

export const emptyParagraph = () => element("paragraph", [], { textFormat: 0, textStyle: "" });

/** An empty editor state (one empty paragraph). */
export const emptyLexical = (dir: "ltr" | "rtl" | null = null): LexicalState => ({
  root: { ...element("root", [emptyParagraph()]), direction: dir } as LexicalState["root"],
});

/** Plain paragraphs → Lexical state; blank lines separate paragraphs. */
export function lexicalFromText(text: string, dir: "ltr" | "rtl" | null = null): LexicalState {
  const paragraphs = text
    .split(/\n{2,}/u)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => element("paragraph", [textNode(part)], { textFormat: 0, textStyle: "" }));
  return { root: { ...element("root", paragraphs.length ? paragraphs : [emptyParagraph()]), direction: dir } as LexicalState["root"] };
}

/** All text in reading order, blocks separated by a newline. */
export function lexicalPlainText(state: unknown): string {
  const root = isObject(state) && isObject((state as Record<string, unknown>).root) ? ((state as Record<string, unknown>).root as Record<string, unknown>) : null;
  if (!root) return "";
  const lines: string[] = [];
  const walk = (node: unknown): string => {
    if (!isObject(node)) return "";
    if (node.type === "text") return typeof node.text === "string" ? node.text : "";
    if (node.type === "linebreak") return "\n";
    const inner = Array.isArray(node.children) ? node.children.map(walk).join("") : "";
    return inner;
  };
  const top = Array.isArray(root.children) ? root.children : [];
  for (const child of top) {
    if (isObject(child) && child.type === "list" && Array.isArray(child.children)) {
      for (const item of child.children) lines.push(walk(item));
    } else lines.push(walk(child));
  }
  return lines.map((line) => line.trim()).filter(Boolean).join("\n");
}

export const lexicalHasText = (state: unknown) => lexicalPlainText(state).length > 0;
