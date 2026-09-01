"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

/**
 * PersianDigits
 * -------------------------------------------------------------------------
 * Globally renders every ASCII digit (0-9) as a Persian digit (۰-۹) while the
 * active locale is Persian (`fa`). The app formats *some* numbers through
 * `Intl.NumberFormat("fa-IR")` already, but plenty of values are printed as
 * raw `{number}` JSX and would otherwise stay Latin. Refactoring hundreds of
 * call sites is impractical, so we transform the rendered text instead.
 *
 * It walks text nodes and rewrites their digits, then keeps watching the DOM
 * with a MutationObserver so dynamically rendered content is converted too.
 *
 * It deliberately does NOT touch:
 *   - form controls (<input>, <textarea>, <select>) — those hold real values
 *   - code-ish elements (<code>, <pre>, <kbd>, <samp>)
 *   - <script>/<style>/<noscript>
 *   - anything inside `[contenteditable]`
 *   - anything explicitly marked LTR (`dir="ltr"`) or opted out
 *     (`.ltr-nums`, `[data-latin-digits]`)
 *
 * Converting an already-Persian text node is a no-op, so the observer never
 * loops on its own writes.
 */

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const ASCII_DIGIT = /[0-9]/;

const SKIP_TAGS = new Set([
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "OPTION",
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "KBD",
  "SAMP",
]);

function toPersian(text: string): string {
  return text.replace(/[0-9]/g, (d) => PERSIAN_DIGITS[d.charCodeAt(0) - 48]);
}

/**
 * Identifiers keep Latin digits. A UUID or a URL rewritten to Persian digits is
 * no longer the value it names: copying a provider id out of the admin panel
 * produced links like /admin/service-providers/۷۸۹۵۰۹۶۹-۰۵۴۳-۴۹a۲-... which
 * resolve to nothing. Ordinary numbers in the same document still convert.
 */
const IDENTIFIER_LIKE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|https?:\/\//i;

/** Should we skip this element (and its subtree) entirely? */
function isSkippedElement(el: Element): boolean {
  if (SKIP_TAGS.has(el.tagName)) return true;
  if (el.getAttribute("dir") === "ltr") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  if (
    el.classList.contains("ltr-nums") ||
    el.classList.contains("latin-digits") ||
    el.hasAttribute("data-latin-digits")
  ) {
    return true;
  }
  return false;
}

/** Walk up from a node to decide whether it lives inside a skipped subtree. */
function isInsideSkipped(node: Node): boolean {
  let el: Element | null =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;
  while (el) {
    if (isSkippedElement(el)) return true;
    el = el.parentElement;
  }
  return false;
}

function convertTextNode(node: Text): void {
  const value = node.nodeValue;
  if (!value || !ASCII_DIGIT.test(value)) return;
  if (IDENTIFIER_LIKE.test(value)) return;
  if (isInsideSkipped(node)) return;
  const next = toPersian(value);
  if (next !== value) node.nodeValue = next;
}

/** Convert every eligible text node within `root` (inclusive). */
function convertSubtree(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) {
    convertTextNode(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  if (isInsideSkipped(root as Element)) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const v = node.nodeValue;
      if (!v || !ASCII_DIGIT.test(v)) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (parent && SKIP_TAGS.has(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const batch: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    batch.push(current as Text);
    current = walker.nextNode();
  }
  batch.forEach(convertTextNode);
}

export default function PersianDigits() {
  const locale = useLocale();

  useEffect(() => {
    if (locale !== "fa" || typeof document === "undefined") return;

    // Initial pass over whatever is already rendered.
    convertSubtree(document.body);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData" && record.target) {
          convertTextNode(record.target as Text);
        } else if (record.type === "childList") {
          record.addedNodes.forEach((n) => convertSubtree(n));
        }
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [locale]);

  return null;
}
