"use client";

import { useEffect } from "react";
import { translatePortalText } from "@core/i18n/translate";
import { usePortalLocale } from "@core/i18n/PortalLocaleProvider";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA"]);
const ATTRIBUTES = ["placeholder", "title", "aria-label"] as const;

function shouldSkip(element: Element | null) {
  if (!element) return true;
  if (SKIP_TAGS.has(element.tagName)) return true;
  if (element.closest("[contenteditable='true'],[data-no-auto-translate],[data-user-content]")) return true;
  return false;
}

function translateElement(root: ParentNode, locale: string) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
  for (const node of textNodes) {
    const parent = node.parentElement;
    if (shouldSkip(parent)) continue;
    const source = node.nodeValue || "";
    if (!source.trim()) continue;
    const next = translatePortalText(locale, source);
    if (next !== source) node.nodeValue = next;
  }

  const elements = root instanceof Element ? [root, ...root.querySelectorAll("*")] : [...root.querySelectorAll("*")];
  for (const element of elements) {
    if (shouldSkip(element)) continue;
    for (const attribute of ATTRIBUTES) {
      const source = element.getAttribute(attribute);
      if (!source?.trim()) continue;
      const next = translatePortalText(locale, source);
      if (next !== source) element.setAttribute(attribute, next);
    }
  }
}

export function PortalTranslationObserver() {
  const locale = usePortalLocale();
  useEffect(() => {
    translateElement(document.body, locale.header);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData" && mutation.target instanceof Text) {
          const node = mutation.target;
          if (node.parentElement && !shouldSkip(node.parentElement)) {
            const source = node.nodeValue || "";
            const next = translatePortalText(locale.header, source);
            if (next !== source) node.nodeValue = next;
          }
          continue;
        }
        for (const node of mutation.addedNodes) {
          if (node instanceof Element || node instanceof DocumentFragment) translateElement(node, locale.header);
          else if (node instanceof Text && node.parentElement && !shouldSkip(node.parentElement)) {
            const source = node.nodeValue || "";
            const next = translatePortalText(locale.header, source);
            if (next !== source) node.nodeValue = next;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [locale.header, locale.locale]);
  return null;
}
