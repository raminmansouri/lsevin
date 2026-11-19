/**
 * Link rule shared by the blog and the public Lexical renderer: only https/http/mailto/tel URLs and
 * site-relative paths pass; everything else (javascript:, data:, protocol-relative, ...) is null.
 */
/** Characters that make a URL parser disagree with a browser (control chars, whitespace tricks). */
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARS = /[\u0000-\u001f\u007f\s\\]/u;

export type LinkTarget = { href: string; external: boolean } | null;

/**
 * Accepts https/http/mailto/tel URLs and site-relative paths ("/consulting", "#faq").
 * Everything else (javascript:, data:, vbscript:, file:, protocol-relative "//host", empty) is
 * rejected by returning null.
 */
export function safeHref(input: unknown): LinkTarget {
  if (typeof input !== "string") return null;
  const value = input.trim();
  if (!value || value.length > 2048 || UNSAFE_CHARS.test(value)) return null;

  if (value.startsWith("#")) return /^#[\w\-؀-ۿ]+$/u.test(value) ? { href: value, external: false } : null;
  if (value.startsWith("/")) {
    if (value.startsWith("//")) return null;
    return { href: value, external: false };
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol === "https:" || url.protocol === "http:") {
    if (!url.hostname || url.username || url.password) return null;
    return { href: url.toString(), external: true };
  }
  if (url.protocol === "mailto:" || url.protocol === "tel:") {
    return value.length > 7 ? { href: value, external: true } : null;
  }
  return null;
}
