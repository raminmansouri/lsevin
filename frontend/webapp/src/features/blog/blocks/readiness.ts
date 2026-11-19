/**
 * Publish readiness. "error" blocks publishing (the server re-checks on every publish); "warning"
 * is advice shown in the editor. Pure, so the editor panel and the server action share one rule set.
 */
import { SLUG_PATTERN } from "../types";
import { blocksPlainText } from "./derive";
import { lexicalHasText } from "./lexical";
import { isEmbedId, safeHref } from "./links";
import type { Block } from "./schema";

export type ReadinessIssue = {
  severity: "error" | "warning";
  code: string;
  /** Block id the issue belongs to, when it has one. */
  blockId?: string;
};

export interface ReadinessInput {
  slug: string;
  title: string;
  excerpt: string;
  seoDescription: string;
  blocks: readonly Block[];
  featuredMedia: string | null;
  isMedical: boolean;
  hasReviewer: boolean;
}

const META_MAX = 170;

export function checkReadiness(input: ReadinessInput): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];
  const error = (code: string, blockId?: string) => issues.push({ severity: "error", code, blockId });
  const warn = (code: string, blockId?: string) => issues.push({ severity: "warning", code, blockId });

  if (!SLUG_PATTERN.test(input.slug)) error("slug-invalid");
  if (!input.title.trim()) error("title-missing");

  const text = blocksPlainText(input.blocks);
  if (!text) error("body-empty");

  for (const block of input.blocks) {
    switch (block.type) {
      case "heading":
        if (!block.text) error("heading-empty", block.id);
        break;
      case "richtext":
        if (!lexicalHasText(block.lexical)) warn("richtext-empty", block.id);
        break;
      case "image":
        if (!block.mediaId) error("image-missing-file", block.id);
        else if (!block.decorative && !block.alt) error("image-missing-alt", block.id);
        if (block.href && !safeHref(block.href)) error("link-invalid", block.id);
        break;
      case "gallery":
        if (!block.items.length) error("gallery-empty", block.id);
        for (const item of block.items) {
          if (!item.mediaId) error("image-missing-file", block.id);
          else if (!item.alt) error("image-missing-alt", block.id);
        }
        break;
      case "video":
        if (block.source === "library") {
          if (!block.mediaId) error("video-missing-file", block.id);
          if (!block.posterMediaId) error("video-missing-poster", block.id);
        } else if (!block.provider || !block.videoId || !isEmbedId(block.provider, block.videoId)) {
          error("video-missing-embed", block.id);
        }
        if (!block.title) warn("video-missing-title", block.id);
        break;
      case "faq": {
        const filled = block.items.filter((item) => item.question && lexicalHasText(item.answer));
        if (!filled.length) error("faq-empty", block.id);
        if (filled.length !== block.items.length) warn("faq-incomplete-item", block.id);
        break;
      }
      case "callout":
        if (!lexicalHasText(block.body)) error("callout-empty", block.id);
        break;
      case "cta":
        if (!block.label) error("cta-missing-label", block.id);
        if (!block.link.href) error("cta-missing-link", block.id);
        break;
      case "quote":
        if (!block.text.trim()) error("quote-empty", block.id);
        break;
      default:
        break;
    }
  }

  if (!input.blocks.some((block) => block.type === "heading")) warn("no-heading");
  if (!input.featuredMedia) warn("no-featured-image");
  if (!input.excerpt.trim()) warn("no-excerpt");
  if (input.seoDescription.length > META_MAX) warn("seo-description-too-long");
  if (!input.seoDescription.trim() && !input.excerpt.trim()) warn("no-seo-description");
  if (input.isMedical && !input.hasReviewer) warn("medical-without-reviewer");
  return issues;
}

export const blockingIssues = (issues: readonly ReadinessIssue[]) => issues.filter((issue) => issue.severity === "error");
