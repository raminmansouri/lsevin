"use client";

import { useId, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { safeHref } from "@/lib/safe-href";
import { cn } from "@/lib/utils";

import { embedWatchUrl, parseEmbedInput, EMBED_PROVIDERS } from "../../blocks/links";
import { emptyLexical, type LexicalState } from "../../blocks/lexical";
import {
  ALIGNMENTS,
  CALLOUT_TONES,
  CTA_STYLES,
  IMAGE_SIZES,
  newBlockId,
  type Block,
  type BlockOf,
} from "../../blocks/schema";
import { MediaPicker, MultiMediaButton, useMediaCache } from "./media-field";
import { RichTextEditor, type RichTextLabels } from "./rich-text-editor";

const inputClass = "h-9 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-50 aria-[invalid=true]:border-destructive";

export function Field({ label, children, hint, error }: { label: string; children: (id: string) => ReactNode; hint?: string; error?: string }) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children(id)}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({ id, value, onChange, dir, maxLength, placeholder, invalid, testId, disabled }: { id?: string; value: string; onChange: (value: string) => void; dir?: "ltr" | "rtl"; maxLength?: number; placeholder?: string; invalid?: boolean; testId?: string; disabled?: boolean }) {
  return <input id={id} type="text" value={value} dir={dir} maxLength={maxLength} placeholder={placeholder} aria-invalid={invalid} disabled={disabled} data-testid={testId} onChange={(event) => onChange(event.target.value)} className={inputClass} />;
}

function Select<T extends string | number>({ id, value, onChange, options, testId }: { id?: string; value: T; onChange: (value: T) => void; options: { value: T; label: string }[]; testId?: string }) {
  return (
    <select
      id={id}
      value={String(value)}
      data-testid={testId}
      onChange={(event) => {
        const raw = event.target.value;
        const match = options.find((option) => String(option.value) === raw);
        if (match) onChange(match.value);
      }}
      className={inputClass}
    >
      {options.map((option) => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function useRichTextLabels(): RichTextLabels {
  const t = useTranslations("AdminBlog");
  return {
    bold: t("rich.bold"),
    italic: t("rich.italic"),
    underline: t("rich.underline"),
    strikethrough: t("rich.strikethrough"),
    bulletList: t("rich.bulletList"),
    numberedList: t("rich.numberedList"),
    quote: t("rich.quote"),
    link: t("rich.link"),
    removeLink: t("rich.removeLink"),
    undo: t("rich.undo"),
    redo: t("rich.redo"),
    linkUrl: t("rich.linkUrl"),
    linkApply: t("rich.linkApply"),
    linkCancel: t("rich.linkCancel"),
    linkInvalid: t("rich.linkInvalid"),
    placeholder: t("rich.placeholder"),
    editorLabel: t("rich.editorLabel"),
  };
}

export interface BlockEditorProps<B extends Block = Block> {
  block: B;
  onChange: (next: B) => void;
  direction: "ltr" | "rtl";
  localeKey: string;
  /** Block-level server validation messages (path → message). */
  errors?: Record<string, string>;
}

function HeadingEditor({ block, onChange, direction }: BlockEditorProps<BlockOf<"heading">>) {
  const t = useTranslations("AdminBlog");
  return (
    <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
      <Field label={t("heading.level")}>
        {(id) => (
          <Select id={id} value={block.level} onChange={(level) => onChange({ ...block, level })} options={[2, 3, 4].map((level) => ({ value: level as 2 | 3 | 4, label: `H${level}` }))} testId="heading-level" />
        )}
      </Field>
      <Field label={t("heading.text")}>
        {(id) => <TextInput id={id} value={block.text} dir={direction} maxLength={200} onChange={(text) => onChange({ ...block, text })} testId="heading-text" />}
      </Field>
    </div>
  );
}

function RichTextBlockEditor({ block, onChange, direction }: BlockEditorProps<BlockOf<"richtext">>) {
  const labels = useRichTextLabels();
  return <RichTextEditor key={block.id} value={block.lexical} direction={direction} labels={labels} onChange={(lexical) => onChange({ ...block, lexical })} testId={`rt-${block.id}`} />;
}

function ImageEditor({ block, onChange, direction, localeKey, errors }: BlockEditorProps<BlockOf<"image">>) {
  const t = useTranslations("AdminBlog");
  const cache = useMediaCache();
  return (
    <div className="space-y-3">
      <MediaPicker
        kind="image"
        label={t("image.file")}
        value={block.mediaId}
        testId="image-file"
        onChange={(id, info) => {
          const suggested = info?.alt[localeKey] ?? "";
          onChange({ ...block, mediaId: id ?? "", alt: block.alt || suggested });
        }}
      />
      {block.mediaId && cache.get(block.mediaId)?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cache.get(block.mediaId)?.url} alt="" className="max-h-48 rounded-lg border object-contain" />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("image.alt")} hint={block.decorative ? t("image.decorativeHint") : t("image.altHint")} error={errors?.alt}>
          {(id) => <TextInput id={id} value={block.alt} dir={direction} maxLength={300} disabled={block.decorative} onChange={(alt) => onChange({ ...block, alt })} testId="image-alt" />}
        </Field>
        <Field label={t("image.caption")}>
          {(id) => <TextInput id={id} value={block.caption} dir={direction} maxLength={500} onChange={(caption) => onChange({ ...block, caption })} testId="image-caption" />}
        </Field>
        <Field label={t("image.size")}>
          {(id) => <Select id={id} value={block.size} onChange={(size) => onChange({ ...block, size })} options={IMAGE_SIZES.map((size) => ({ value: size, label: t(`image.sizes.${size}`) }))} testId="image-size" />}
        </Field>
        <Field label={t("image.align")}>
          {(id) => <Select id={id} value={block.align} onChange={(align) => onChange({ ...block, align })} options={ALIGNMENTS.map((align) => ({ value: align, label: t(`image.aligns.${align}`) }))} />}
        </Field>
        <Field label={t("image.link")} hint={t("image.linkHint")} error={block.href && !safeHref(block.href) ? t("errors.link") : undefined}>
          {(id) => <TextInput id={id} value={block.href ?? ""} dir="ltr" maxLength={2048} onChange={(href) => onChange({ ...block, href: href || null })} />}
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" checked={block.decorative} onChange={(event) => onChange({ ...block, decorative: event.target.checked, alt: event.target.checked ? "" : block.alt })} data-testid="image-decorative" />
          {t("image.decorative")}
        </label>
      </div>
    </div>
  );
}

function GalleryEditor({ block, onChange, direction, localeKey }: BlockEditorProps<BlockOf<"gallery">>) {
  const t = useTranslations("AdminBlog");
  const cache = useMediaCache();
  const move = (index: number, delta: number) => {
    const items = [...block.items];
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    onChange({ ...block, items });
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <MultiMediaButton
          label={t("gallery.add")}
          testId="gallery-add"
          onPick={(picked) =>
            onChange({
              ...block,
              items: [...block.items, ...picked.map((info) => ({ id: newBlockId(), mediaId: info.id, alt: info.alt[localeKey] ?? "", caption: "" }))].slice(0, 24),
            })
          }
        />
        <Field label={t("gallery.columns")}>
          {(id) => <Select id={id} value={block.columns} onChange={(columns) => onChange({ ...block, columns })} options={[2, 3, 4].map((n) => ({ value: n as 2 | 3 | 4, label: String(n) }))} />}
        </Field>
      </div>
      <ul className="space-y-2">
        {block.items.map((item, index) => (
          <li key={item.id} className="flex items-start gap-3 rounded-xl border p-2">
            {cache.get(item.mediaId)?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cache.get(item.mediaId)?.url} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="size-16 shrink-0 rounded-lg bg-muted" />
            )}
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <TextInput value={item.alt} dir={direction} maxLength={300} placeholder={t("image.alt")} onChange={(alt) => onChange({ ...block, items: block.items.map((it) => (it.id === item.id ? { ...it, alt } : it)) })} testId="gallery-item-alt" />
              <TextInput value={item.caption} dir={direction} maxLength={300} placeholder={t("image.caption")} onChange={(caption) => onChange({ ...block, items: block.items.map((it) => (it.id === item.id ? { ...it, caption } : it)) })} />
            </div>
            <div className="flex shrink-0 flex-col">
              <IconButton label={t("moveUp")} onClick={() => move(index, -1)} disabled={index === 0}>
                <ArrowUp className="size-4" />
              </IconButton>
              <IconButton label={t("moveDown")} onClick={() => move(index, 1)} disabled={index === block.items.length - 1}>
                <ArrowDown className="size-4" />
              </IconButton>
              <IconButton label={t("remove")} onClick={() => onChange({ ...block, items: block.items.filter((it) => it.id !== item.id) })}>
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function IconButton({ label, onClick, disabled, children, testId, className }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode; testId?: string; className?: string }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} data-testid={testId} className={cn("inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30", className)}>
      {children}
    </button>
  );
}

function VideoEditor({ block, onChange, direction, errors }: BlockEditorProps<BlockOf<"video">>) {
  const t = useTranslations("AdminBlog");
  const [pasted, setPasted] = useState(() => (block.provider && block.videoId ? (embedWatchUrl(block.provider, block.videoId) ?? "") : ""));
  const [pasteError, setPasteError] = useState(false);
  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label={t("video.source")} className="flex gap-4 text-sm">
        {(["embed", "library"] as const).map((source) => (
          <label key={source} className="flex items-center gap-2">
            <input type="radio" name={`video-source-${block.id}`} checked={block.source === source} onChange={() => onChange({ ...block, source })} data-testid={`video-source-${source}`} />
            {t(`video.sources.${source}`)}
          </label>
        ))}
      </div>
      {block.source === "embed" ? (
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
          <Field label={t("video.provider")}>
            {(id) => (
              <Select
                id={id}
                value={block.provider ?? "aparat"}
                onChange={(provider) => onChange({ ...block, provider })}
                options={EMBED_PROVIDERS.map((provider) => ({ value: provider, label: t(`video.providers.${provider}`) }))}
                testId="video-provider"
              />
            )}
          </Field>
          <Field label={t("video.url")} hint={t("video.urlHint")} error={pasteError ? t("video.urlInvalid") : errors?.videoId}>
            {(id) => (
              <TextInput
                id={id}
                value={pasted}
                dir="ltr"
                testId="video-url"
                invalid={pasteError}
                onChange={(value) => {
                  setPasted(value);
                  if (!value.trim()) {
                    setPasteError(false);
                    onChange({ ...block, videoId: null });
                    return;
                  }
                  const parsed = parseEmbedInput(value, block.provider ?? undefined);
                  setPasteError(!parsed);
                  if (parsed) onChange({ ...block, provider: parsed.provider, videoId: parsed.videoId });
                }}
              />
            )}
          </Field>
        </div>
      ) : (
        <MediaPicker kind="video" label={t("video.file")} value={block.mediaId} testId="video-file" onChange={(id) => onChange({ ...block, mediaId: id })} />
      )}
      <MediaPicker kind="image" label={t("video.poster")} value={block.posterMediaId} testId="video-poster" onChange={(id) => onChange({ ...block, posterMediaId: id })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("video.title")}>{(id) => <TextInput id={id} value={block.title} dir={direction} maxLength={200} onChange={(title) => onChange({ ...block, title })} testId="video-title" />}</Field>
        <Field label={t("video.caption")}>{(id) => <TextInput id={id} value={block.caption} dir={direction} maxLength={500} onChange={(caption) => onChange({ ...block, caption })} />}</Field>
      </div>
    </div>
  );
}

function FaqEditor({ block, onChange, direction }: BlockEditorProps<BlockOf<"faq">>) {
  const t = useTranslations("AdminBlog");
  const labels = useRichTextLabels();
  const update = (id: string, patch: Partial<{ question: string; answer: LexicalState }>) => onChange({ ...block, items: block.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  const move = (index: number, delta: number) => {
    const items = [...block.items];
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    onChange({ ...block, items });
  };
  return (
    <div className="space-y-3">
      <Field label={t("faq.title")} hint={t("faq.titleHint")}>
        {(id) => <TextInput id={id} value={block.title} dir={direction} maxLength={200} onChange={(title) => onChange({ ...block, title })} testId="faq-title" />}
      </Field>
      <ol className="space-y-3">
        {block.items.map((item, index) => (
          <li key={item.id} className="space-y-2 rounded-xl border p-3" data-testid="faq-item">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <Field label={`${t("faq.question")} ${index + 1}`}>
                  {(id) => <TextInput id={id} value={item.question} dir={direction} maxLength={400} onChange={(question) => update(item.id, { question })} testId="faq-question" />}
                </Field>
              </div>
              <div className="flex shrink-0 pt-6">
                <IconButton label={t("moveUp")} onClick={() => move(index, -1)} disabled={index === 0} testId="faq-item-up">
                  <ArrowUp className="size-4" />
                </IconButton>
                <IconButton label={t("moveDown")} onClick={() => move(index, 1)} disabled={index === block.items.length - 1} testId="faq-item-down">
                  <ArrowDown className="size-4" />
                </IconButton>
                <IconButton label={t("remove")} onClick={() => onChange({ ...block, items: block.items.filter((it) => it.id !== item.id) })} testId="faq-item-remove">
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            </div>
            <p className="text-sm font-medium">{t("faq.answer")}</p>
            <RichTextEditor key={item.id} value={item.answer} direction={direction} labels={labels} onChange={(answer) => update(item.id, { answer })} testId={`faq-answer-${index}`} />
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => onChange({ ...block, items: [...block.items, { id: newBlockId(), question: "", answer: emptyLexical() }].slice(0, 50) })} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm hover:bg-muted" data-testid="faq-add-item">
        <Plus className="size-4" aria-hidden />
        {t("faq.addItem")}
      </button>
    </div>
  );
}

function CalloutEditor({ block, onChange, direction }: BlockEditorProps<BlockOf<"callout">>) {
  const t = useTranslations("AdminBlog");
  const labels = useRichTextLabels();
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <Field label={t("callout.tone")}>
          {(id) => <Select id={id} value={block.tone} onChange={(tone) => onChange({ ...block, tone })} options={CALLOUT_TONES.map((tone) => ({ value: tone, label: t(`callout.tones.${tone}`) }))} testId="callout-tone" />}
        </Field>
        <Field label={t("callout.title")}>{(id) => <TextInput id={id} value={block.title} dir={direction} maxLength={200} onChange={(title) => onChange({ ...block, title })} testId="callout-title" />}</Field>
      </div>
      <RichTextEditor key={block.id} value={block.body} direction={direction} labels={labels} onChange={(body) => onChange({ ...block, body })} testId={`callout-body-${block.id}`} />
    </div>
  );
}

function CtaEditor({ block, onChange, direction }: BlockEditorProps<BlockOf<"cta">>) {
  const t = useTranslations("AdminBlog");
  const invalid = Boolean(block.link.href) && !safeHref(block.link.href);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={t("cta.label")}>{(id) => <TextInput id={id} value={block.label} dir={direction} maxLength={80} onChange={(label) => onChange({ ...block, label })} testId="cta-label" />}</Field>
      <Field label={t("cta.link")} hint={t("cta.linkHint")} error={invalid ? t("errors.link") : undefined}>
        {(id) => <TextInput id={id} value={block.link.href} dir="ltr" maxLength={2048} invalid={invalid} onChange={(href) => onChange({ ...block, link: { href } })} testId="cta-link" />}
      </Field>
      <Field label={t("cta.style")}>
        {(id) => <Select id={id} value={block.style} onChange={(style) => onChange({ ...block, style })} options={CTA_STYLES.map((style) => ({ value: style, label: t(`cta.styles.${style}`) }))} />}
      </Field>
    </div>
  );
}

function QuoteEditor({ block, onChange, direction }: BlockEditorProps<BlockOf<"quote">>) {
  const t = useTranslations("AdminBlog");
  return (
    <div className="space-y-3">
      <Field label={t("quote.text")}>
        {(id) => <textarea id={id} value={block.text} dir={direction} rows={3} maxLength={1000} onChange={(event) => onChange({ ...block, text: event.target.value })} className={cn(inputClass, "h-auto py-2")} data-testid="quote-text" />}
      </Field>
      <Field label={t("quote.cite")}>{(id) => <TextInput id={id} value={block.cite} dir={direction} maxLength={200} onChange={(cite) => onChange({ ...block, cite })} />}</Field>
    </div>
  );
}

function TocEditor({ block, onChange, direction }: BlockEditorProps<BlockOf<"toc">>) {
  const t = useTranslations("AdminBlog");
  return (
    <Field label={t("toc.title")} hint={t("toc.hint")}>
      {(id) => <TextInput id={id} value={block.title} dir={direction} maxLength={120} onChange={(title) => onChange({ ...block, title })} />}
    </Field>
  );
}

/** The editing UI of one block, chosen by type. */
export function BlockEditor(props: BlockEditorProps) {
  const { block } = props;
  const t = useTranslations("AdminBlog");
  switch (block.type) {
    case "heading":
      return <HeadingEditor {...(props as BlockEditorProps<BlockOf<"heading">>)} />;
    case "richtext":
      return <RichTextBlockEditor {...(props as BlockEditorProps<BlockOf<"richtext">>)} />;
    case "image":
      return <ImageEditor {...(props as BlockEditorProps<BlockOf<"image">>)} />;
    case "gallery":
      return <GalleryEditor {...(props as BlockEditorProps<BlockOf<"gallery">>)} />;
    case "video":
      return <VideoEditor {...(props as BlockEditorProps<BlockOf<"video">>)} />;
    case "faq":
      return <FaqEditor {...(props as BlockEditorProps<BlockOf<"faq">>)} />;
    case "callout":
      return <CalloutEditor {...(props as BlockEditorProps<BlockOf<"callout">>)} />;
    case "cta":
      return <CtaEditor {...(props as BlockEditorProps<BlockOf<"cta">>)} />;
    case "quote":
      return <QuoteEditor {...(props as BlockEditorProps<BlockOf<"quote">>)} />;
    case "toc":
      return <TocEditor {...(props as BlockEditorProps<BlockOf<"toc">>)} />;
    case "divider":
      return <p className="text-sm text-muted-foreground">{t("divider.hint")}</p>;
    default:
      return null;
  }
}
