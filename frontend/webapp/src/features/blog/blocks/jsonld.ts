/**
 * schema.org nodes derived from a post's blocks. Pure functions: the caller supplies URLs and
 * resolved media, so these are unit-testable without a request. Only facts the page shows are
 * emitted (no ratings, no prices), and a node is omitted rather than emitted incomplete.
 */
import { lexicalPlainText } from "./lexical";
import { embedSrc, embedWatchUrl } from "./links";
import type { Block } from "./schema";

type Node = Record<string, unknown>;

const clip = (value: string, max: number) => {
  const text = value.replace(/\s+/gu, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
};

/** One FAQPage for the whole document: every FAQ block's complete items merged. */
export function faqPageFromBlocks(blocks: readonly Block[], pageUrl: string): Node | null {
  const mainEntity: Node[] = [];
  for (const block of blocks) {
    if (block.type !== "faq") continue;
    for (const item of block.items) {
      const answer = clip(lexicalPlainText(item.answer).replace(/\n+/gu, " "), 2000);
      if (!item.question || !answer) continue;
      mainEntity.push({ "@type": "Question", name: clip(item.question, 300), acceptedAnswer: { "@type": "Answer", text: answer } });
    }
  }
  if (!mainEntity.length) return null;
  return { "@type": "FAQPage", "@id": `${pageUrl}#faq`, mainEntity };
}

export interface VideoFacts {
  url: string;
  uploadDate: string;
  /** media id -> absolute URL, for posters and library videos */
  mediaUrl: (mediaId: string | null | undefined) => string | undefined;
}

/** VideoObject per video that has a title and a poster (Google requires name, thumbnail and date). */
export function videoObjectsFromBlocks(blocks: readonly Block[], facts: VideoFacts): Node[] {
  const nodes: Node[] = [];
  for (const block of blocks) {
    if (block.type !== "video") continue;
    const thumbnail = facts.mediaUrl(block.posterMediaId);
    if (!block.title || !thumbnail) continue;
    const content = block.source === "library" ? facts.mediaUrl(block.mediaId) : undefined;
    const embed = block.source === "embed" && block.provider && block.videoId ? embedSrc(block.provider, block.videoId) : null;
    if (!content && !embed) continue;
    nodes.push({
      "@type": "VideoObject",
      "@id": `${facts.url}#video-${block.id}`,
      name: clip(block.title, 200),
      description: clip(block.caption || block.title, 500),
      thumbnailUrl: [thumbnail],
      uploadDate: facts.uploadDate,
      ...(content ? { contentUrl: content } : {}),
      ...(embed ? { embedUrl: embed } : {}),
      ...(block.source === "embed" && block.provider && block.videoId ? { url: embedWatchUrl(block.provider, block.videoId) } : {}),
    });
  }
  return nodes;
}

export interface BlogPostingFacts {
  url: string;
  title: string;
  description: string;
  locale: string;
  images: string[];
  datePublished: string;
  dateModified: string;
  wordCount: number;
  section?: string | null;
  author?: { name: string } | null;
  publisherId: string;
  websiteId: string;
}

export function blogPostingNode(facts: BlogPostingFacts): Node {
  return {
    "@type": "BlogPosting",
    "@id": `${facts.url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": facts.url },
    headline: clip(facts.title, 110),
    ...(facts.description ? { description: clip(facts.description, 300) } : {}),
    inLanguage: facts.locale,
    url: facts.url,
    datePublished: facts.datePublished,
    dateModified: facts.dateModified,
    wordCount: facts.wordCount,
    ...(facts.images.length ? { image: facts.images } : {}),
    ...(facts.section ? { articleSection: facts.section } : {}),
    ...(facts.author ? { author: { "@type": "Person", name: facts.author.name } } : { author: { "@id": facts.publisherId } }),
    publisher: { "@id": facts.publisherId },
    isPartOf: { "@id": facts.websiteId },
  };
}

/** MedicalWebPage is emitted only when a named reviewer exists (never implied). */
export function medicalReviewNode(facts: { url: string; title: string; reviewer: { name: string } | null; lastReviewedAt: string | null }): Node | null {
  if (!facts.reviewer?.name) return null;
  return {
    "@type": "MedicalWebPage",
    "@id": `${facts.url}#medical`,
    url: facts.url,
    name: clip(facts.title, 110),
    reviewedBy: { "@type": "Person", name: facts.reviewer.name },
    ...(facts.lastReviewedAt ? { lastReviewed: facts.lastReviewedAt } : {}),
  };
}
