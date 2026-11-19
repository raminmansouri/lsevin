import type { ReactNode } from "react";

import { LexicalRenderer } from "@/components/editor/lexical-renderer";
import { cn } from "@/lib/utils";

import { buildToc, type TocEntry } from "../../blocks/derive";
import { embedSrc, safeHref } from "../../blocks/links";
import type { Block } from "../../blocks/schema";
import type { ResolvedMedia } from "../../types";

export interface BlockRendererLabels {
  toc: string;
  faq: string;
  /** Aria label for the video element/frame when the block has no title. */
  video: string;
}

const PROSE =
  "space-y-4 leading-8 text-neutral-700 [&_a]:text-[#083f30] [&_blockquote]:my-4 [&_blockquote]:border-s-4 [&_blockquote]:border-s-[#c9a55a] [&_blockquote]:ps-4 [&_ol]:ms-6 [&_ol]:list-decimal [&_ul]:ms-6 [&_ul]:list-disc [&_li]:my-1";

const TONES: Record<string, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-950",
  tip: "border-emerald-200 bg-emerald-50 text-emerald-950",
  warning: "border-amber-300 bg-amber-50 text-amber-950",
  medical: "border-rose-200 bg-rose-50 text-rose-950",
};

const IMAGE_SIZE: Record<string, string> = {
  content: "",
  wide: "md:-mx-8",
  full: "-mx-5 sm:-mx-8",
};

const ALIGN: Record<string, string> = { start: "me-auto", center: "mx-auto", end: "ms-auto" };

const lexicalString = (value: unknown) => JSON.stringify(value);

function Img({ media, alt, className, priority }: { media: ResolvedMedia; alt: string; className?: string; priority?: boolean }) {
  return (
    // Editorial media comes from the files host; a plain <img> like the other CMS blocks.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={media.url}
      alt={alt}
      {...(media.width && media.height ? { width: media.width, height: media.height } : {})}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("h-auto max-w-full rounded-2xl", className)}
    />
  );
}

function Toc({ entries, title }: { entries: TocEntry[]; title: string }) {
  if (entries.length < 2) return null;
  return (
    <nav aria-label={title} className="my-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4" data-blog-block="toc">
      <p className="mb-2 text-sm font-bold text-[#083f30]">{title}</p>
      <ol className="space-y-1 text-sm">
        {entries.map((entry) => (
          <li key={entry.id} className={entry.level === 3 ? "ms-4" : entry.level === 4 ? "ms-8" : undefined}>
            <a href={`#${entry.id}`} className="text-neutral-700 hover:text-[#083f30] hover:underline">
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function renderBlock(block: Block, ctx: { media: Record<string, ResolvedMedia>; toc: TocEntry[]; ids: Map<string, string>; labels: BlockRendererLabels; localeKey: string; first: boolean }): ReactNode {
  const { media, labels, localeKey } = ctx;
  switch (block.type) {
    case "heading": {
      if (!block.text) return null;
      const id = ctx.ids.get(block.id);
      const Tag = (`h${block.level}`) as "h2" | "h3" | "h4";
      const size = block.level === 2 ? "mt-10 text-2xl font-bold text-[#083f30]" : block.level === 3 ? "mt-8 text-xl font-semibold text-neutral-900" : "mt-6 text-lg font-semibold text-neutral-900";
      return (
        <Tag key={block.id} id={id} className={cn("scroll-mt-24", size)} data-blog-block="heading">
          {block.text}
        </Tag>
      );
    }
    case "richtext":
      return <LexicalRenderer key={block.id} content={lexicalString(block.lexical)} className={PROSE} />;
    case "image": {
      const file = media[block.mediaId];
      if (!file) return null; // a deleted file must not break the page
      const alt = block.decorative ? "" : block.alt || (file.alt[localeKey] ?? "");
      const target = block.href ? safeHref(block.href) : null;
      const img = <Img media={file} alt={alt} className={cn("w-full", ALIGN[block.align])} priority={ctx.first} />;
      return (
        <figure key={block.id} className={cn("my-6", IMAGE_SIZE[block.size])} data-blog-block="image">
          {target ? (
            <a href={target.href} {...(target.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {img}
            </a>
          ) : (
            img
          )}
          {block.caption ? <figcaption className="mt-2 text-center text-sm text-neutral-500">{block.caption}</figcaption> : null}
        </figure>
      );
    }
    case "gallery": {
      const items = block.items.filter((item) => media[item.mediaId]);
      if (!items.length) return null;
      const cols = block.columns === 2 ? "sm:grid-cols-2" : block.columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3";
      return (
        <div key={block.id} className={cn("my-6 grid grid-cols-2 gap-3", cols)} data-blog-block="gallery">
          {items.map((item) => (
            <figure key={item.id}>
              <Img media={media[item.mediaId]} alt={item.alt || (media[item.mediaId].alt[localeKey] ?? "")} className="aspect-[4/3] w-full object-cover" />
              {item.caption ? <figcaption className="mt-1 text-xs text-neutral-500">{item.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      );
    }
    case "video": {
      const poster = block.posterMediaId ? media[block.posterMediaId]?.url : undefined;
      const label = block.title || labels.video;
      let player: ReactNode = null;
      if (block.source === "library") {
        const file = block.mediaId ? media[block.mediaId] : undefined;
        if (!file) return null;
        player = (
          <video controls preload="metadata" poster={poster} aria-label={label} className="aspect-video w-full rounded-2xl bg-black">
            <source src={file.url} {...(file.mimeType ? { type: file.mimeType } : {})} />
          </video>
        );
      } else {
        const src = block.provider && block.videoId ? embedSrc(block.provider, block.videoId) : null;
        if (!src) return null;
        player = (
          <iframe
            src={src}
            title={label}
            loading="lazy"
            allow="fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            className="aspect-video w-full rounded-2xl bg-black"
          />
        );
      }
      return (
        <figure key={block.id} className="my-6" data-blog-block="video">
          {player}
          {block.caption ? <figcaption className="mt-2 text-center text-sm text-neutral-500">{block.caption}</figcaption> : null}
        </figure>
      );
    }
    case "faq": {
      const items = block.items.filter((item) => item.question);
      if (!items.length) return null;
      return (
        <section key={block.id} className="my-8" data-blog-block="faq">
          <h2 className="mb-3 text-xl font-bold text-[#083f30]">{block.title || labels.faq}</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <details key={item.id} className="group rounded-2xl border border-neutral-200 bg-white px-4 py-3 open:border-[#c9a55a]/60">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1 font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span aria-hidden className="text-xl leading-none text-[#083f30] transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <LexicalRenderer content={lexicalString(item.answer)} className="mt-2 space-y-2 text-sm leading-7 text-neutral-700" />
              </details>
            ))}
          </div>
        </section>
      );
    }
    case "callout":
      return (
        <aside key={block.id} role="note" className={cn("my-6 rounded-2xl border p-4", TONES[block.tone] ?? TONES.info)} data-blog-block="callout" data-tone={block.tone}>
          {block.title ? <p className="mb-1 font-bold">{block.title}</p> : null}
          <LexicalRenderer content={lexicalString(block.body)} className="space-y-2 text-sm leading-7" />
        </aside>
      );
    case "cta": {
      const target = safeHref(block.link.href);
      if (!block.label || !target) return null;
      return (
        <p key={block.id} className="my-6" data-blog-block="cta">
          <a
            href={target.href}
            {...(target.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-6 py-2 text-sm font-bold",
              block.style === "primary" ? "bg-[#083f30] text-white hover:bg-[#0b5440]" : "bg-white text-[#083f30] ring-1 ring-[#083f30]/40 hover:ring-[#083f30]",
            )}
          >
            {block.label}
          </a>
        </p>
      );
    }
    case "quote":
      if (!block.text.trim()) return null;
      return (
        <blockquote key={block.id} className="my-8 border-s-4 border-[#c9a55a] ps-5 text-xl font-medium leading-9 text-neutral-900" data-blog-block="quote">
          <p>{block.text}</p>
          {block.cite ? (
            <footer className="mt-2 text-sm font-normal text-neutral-500">
              <cite>{block.cite}</cite>
            </footer>
          ) : null}
        </blockquote>
      );
    case "divider":
      return <hr key={block.id} className="my-8 border-neutral-200" data-blog-block="divider" />;
    case "toc":
      return <Toc key={block.id} entries={ctx.toc} title={block.title || labels.toc} />;
    default:
      return null;
  }
}

/** Server component: renders a post's blocks. The same code serves the public page and the admin preview. */
export function BlockRenderer({
  blocks,
  media,
  labels,
  localeKey,
}: {
  blocks: readonly Block[];
  media: Record<string, ResolvedMedia>;
  labels: BlockRendererLabels;
  localeKey: string;
}) {
  const toc = buildToc(blocks);
  const ids = new Map(toc.map((entry) => [entry.blockId, entry.id]));
  let firstImageSeen = false;
  return (
    <div data-blog-body>
      {blocks.map((block) => {
        const first = block.type === "image" && !firstImageSeen;
        if (block.type === "image") firstImageSeen = true;
        return renderBlock(block, { media, toc, ids, labels, localeKey, first });
      })}
    </div>
  );
}
