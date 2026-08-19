export type RichTextDirection = "rtl" | "ltr";

type LexicalNode = Record<string, unknown> & { type?: string; children?: LexicalNode[]; text?: string; format?: number | string; tag?: string; listType?: string };

const ESCAPE: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
export function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (char) => ESCAPE[char]); }

function formatText(text: string, format = 0) {
  let html = escapeHtml(text);
  if (format & 1) html = `<strong>${html}</strong>`;
  if (format & 2) html = `<em>${html}</em>`;
  if (format & 4) html = `<s>${html}</s>`;
  if (format & 8) html = `<u>${html}</u>`;
  if (format & 16) html = `<code>${html}</code>`;
  if (format & 32) html = `<sub>${html}</sub>`;
  if (format & 64) html = `<sup>${html}</sup>`;
  return html;
}

function renderNode(node: LexicalNode): string {
  if (node.type === "text") return formatText(String(node.text || ""), Number(node.format || 0));
  const children = Array.isArray(node.children) ? node.children.map(renderNode).join("") : "";
  if (node.type === "heading") {
    const tag = /^h[1-6]$/.test(String(node.tag || "")) ? String(node.tag) : "h2";
    return `<${tag}>${children}</${tag}>`;
  }
  if (node.type === "quote") return `<blockquote>${children}</blockquote>`;
  if (node.type === "list") return node.listType === "number" ? `<ol>${children}</ol>` : `<ul>${children}</ul>`;
  if (node.type === "listitem") return `<li>${children}</li>`;
  if (node.type === "linebreak") return "<br>";
  if (node.type === "root") return children;
  return `<p>${children}</p>`;
}


function plainTextNode(node: LexicalNode): string {
  if (node.type === "text") return String(node.text || "");
  if (node.type === "linebreak") return "\n";
  const children = Array.isArray(node.children) ? node.children.map(plainTextNode).join("") : "";
  if (node.type === "listitem") return children ? `• ${children}` : "";
  if (node.type === "paragraph" || node.type === "heading" || node.type === "quote" || node.type === "list") {
    return children ? `${children}\n` : "";
  }
  return children;
}

export function richTextToPlainText(value?: string | null) {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    const parsed = JSON.parse(text) as { root?: LexicalNode };
    if (parsed?.root) {
      return plainTextNode(parsed.root)
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }
  } catch {
    // Legacy plain text remains supported.
  }
  return text;
}

export function richTextToHtml(value?: string | null) {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    const parsed = JSON.parse(text) as { root?: LexicalNode };
    if (parsed?.root) return renderNode(parsed.root);
  } catch {
    // Legacy plain text remains supported.
  }
  return text.split(/\n{2,}/).map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br>")}</p>`).join("");
}

function textNode(text: string, format = 0): LexicalNode {
  return { detail: 0, format, mode: "normal", style: "", text, type: "text", version: 1 };
}

function formatBits(element: Element, inherited = 0) {
  const tag = element.tagName.toLowerCase();
  let format = inherited;
  if (tag === "strong" || tag === "b") format |= 1;
  if (tag === "em" || tag === "i") format |= 2;
  if (tag === "s" || tag === "strike") format |= 4;
  if (tag === "u") format |= 8;
  if (tag === "code") format |= 16;
  if (tag === "sub") format |= 32;
  if (tag === "sup") format |= 64;
  return format;
}

function inlineChildren(parent: Node, inherited = 0): LexicalNode[] {
  const result: LexicalNode[] = [];
  parent.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (text) result.push(textNode(text, inherited));
      return;
    }
    if (!(node instanceof Element)) return;
    if (node.tagName.toLowerCase() === "br") { result.push({ type: "linebreak", version: 1 }); return; }
    result.push(...inlineChildren(node, formatBits(node, inherited)));
  });
  return result;
}

function blockNode(element: Element, direction: RichTextDirection): LexicalNode {
  const tag = element.tagName.toLowerCase();
  if (tag === "ul" || tag === "ol") {
    return {
      children: Array.from(element.children).filter((child) => child.tagName.toLowerCase() === "li").map((child) => ({ children: inlineChildren(child), direction, format: "", indent: 0, type: "listitem", value: 1, version: 1 })),
      direction,
      format: "",
      indent: 0,
      listType: tag === "ol" ? "number" : "bullet",
      start: 1,
      tag,
      type: "list",
      version: 1,
    };
  }
  if (/^h[1-6]$/.test(tag)) return { children: inlineChildren(element), direction, format: "", indent: 0, tag, type: "heading", version: 1 };
  if (tag === "blockquote") return { children: inlineChildren(element), direction, format: "", indent: 0, type: "quote", version: 1 };
  return { children: inlineChildren(element), direction, format: "", indent: 0, type: "paragraph", version: 1 };
}

export function htmlToRichText(root: HTMLElement, direction: RichTextDirection) {
  const blocks = Array.from(root.children).map((element) => blockNode(element, direction));
  if (!blocks.length && root.textContent) {
    blocks.push({ children: [textNode(root.textContent)], direction, format: "", indent: 0, type: "paragraph", version: 1 });
  }
  return JSON.stringify({ root: { children: blocks, direction, format: "", indent: 0, type: "root", version: 1 } });
}
