"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, ExternalLink, Eye, GripVertical, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { SUPPORTED_LOCALE_HEADERS, HEADER_TO_LOCALE_MAP, LOCALE_DISPLAY_NAMES, RTL_LOCALE_HEADERS } from "@/config/locales";
import { Link, useRouter } from "@/i18n/navigation";
import type { MediaItem } from "@/features/media-picker-addon";
import { cn } from "@/lib/utils";

import {
  autosaveTranslationAction,
  deleteTranslationAction,
  getRevisionAction,
  listRevisionsAction,
  savePostSettingsAction,
  saveTranslationAction,
} from "../../actions";
import type { BlogActionFailure } from "../../actions/result";
import { blockingIssues, checkReadiness, type ReadinessIssue } from "../../blocks/readiness";
import { BLOCK_TYPES, createBlock, duplicateBlock, readBlocks, type Block, type BlockType } from "../../blocks/schema";
import type { AuthorRow, CategoryRow, PostAdmin, PostStatus, RevisionRow } from "../../types";
import { BlockEditor, Field, IconButton, TextInput } from "./block-editors";
import { MediaCacheProvider, MediaPicker, toMediaInfo, type MediaInfo } from "./media-field";

type Doc = {
  exists: boolean;
  status: PostStatus;
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  ogMedia: string | null;
  blocks: Block[];
  publishedAt: string | null;
  updatedAt: string | null;
  dirty: boolean;
};

type Settings = {
  slug: string;
  categoryId: string;
  authorId: string;
  reviewerId: string;
  lastReviewedAt: string;
  featuredMedia: string | null;
  isFeatured: boolean;
  isMedical: boolean;
};

const emptyDoc = (): Doc => ({ exists: false, status: "draft", title: "", excerpt: "", seoTitle: "", seoDescription: "", ogMedia: null, blocks: [], publishedAt: null, updatedAt: null, dirty: false });

const dirOf = (header: string): "ltr" | "rtl" => (RTL_LOCALE_HEADERS.has(header as never) ? "rtl" : "ltr");
const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

type SideTab = "settings" | "seo" | "readiness" | "history";
const selectClass = "h-9 w-full rounded-md border bg-background px-3 text-sm";

export function PostEditor({
  post,
  categories,
  authors,
  media,
  initialLocaleKey,
  adminLocale,
}: {
  post: PostAdmin;
  categories: CategoryRow[];
  authors: AuthorRow[];
  media: Record<string, MediaInfo>;
  initialLocaleKey: string;
  adminLocale: string;
}) {
  const t = useTranslations("AdminBlog");
  const router = useRouter();

  const [docs, setDocs] = useState<Record<string, Doc>>(() => {
    const map: Record<string, Doc> = {};
    for (const [key, tr] of Object.entries(post.translations)) {
      map[key] = { exists: true, status: tr.status, title: tr.title, excerpt: tr.excerpt, seoTitle: tr.seoTitle, seoDescription: tr.seoDescription, ogMedia: tr.ogMedia, blocks: tr.blocks, publishedAt: tr.publishedAt, updatedAt: tr.updatedAt, dirty: false };
    }
    return map;
  });
  const [recovered, setRecovered] = useState<Record<string, { title: string; excerpt: string; blocks: Block[]; savedAt: string }>>(() =>
    Object.fromEntries(Object.entries(post.translations).filter(([, tr]) => tr.autosave).map(([key, tr]) => [key, tr.autosave!])),
  );
  const [settings, setSettings] = useState<Settings>({
    slug: post.slug,
    categoryId: post.categoryId ?? "",
    authorId: post.authorId ?? "",
    reviewerId: post.reviewerId ?? "",
    lastReviewedAt: toDateInput(post.lastReviewedAt),
    featuredMedia: post.featuredMedia,
    isFeatured: post.isFeatured,
    isMedical: post.isMedical,
  });
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [active, setActive] = useState(initialLocaleKey);
  const [sideTab, setSideTab] = useState<SideTab>("settings");
  const [busy, setBusy] = useState<null | "save" | "publish" | "unpublish" | "delete">(null);
  const [blockErrors, setBlockErrors] = useState<Record<string, Record<string, string>>>({});
  const [serverReadiness, setServerReadiness] = useState<ReadinessIssue[] | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [autosavedAt, setAutosavedAt] = useState<string | null>(null);
  const [inserter, setInserter] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // The ref is the source of truth for a drag: a fast drop can arrive before React re-renders the state above.
  const dragRef = useRef<number | null>(null);
  const [revisions, setRevisions] = useState<RevisionRow[] | null>(null);
  const [mediaMap, setMediaMap] = useState<Record<string, MediaInfo>>(media);

  const doc = docs[active] ?? emptyDoc();
  const header = active as never;
  const direction = dirOf(active);
  const latest = useRef({ docs, active, settings });
  latest.current = { docs, active, settings };

  const mediaCache = useMemo(
    () => ({
      get: (id: string | null | undefined) => (id ? mediaMap[id] : undefined),
      remember: (items: MediaItem[]) => {
        const infos = items.map(toMediaInfo);
        setMediaMap((previous) => ({ ...previous, ...Object.fromEntries(infos.map((info) => [info.id, info])) }));
        return infos;
      },
    }),
    [mediaMap],
  );

  const patchDoc = useCallback(
    (patch: Partial<Doc>) => setDocs((previous) => ({ ...previous, [latest.current.active]: { ...(previous[latest.current.active] ?? emptyDoc()), ...patch, dirty: true } })),
    [],
  );
  const patchSettings = (patch: Partial<Settings>) => {
    setSettings((previous) => ({ ...previous, ...patch }));
    setSettingsDirty(true);
  };
  const setBlocks = (blocks: Block[]) => patchDoc({ blocks });

  // ----- readiness (the server re-checks on publish) -----
  const issues = useMemo(
    () =>
      checkReadiness({
        slug: settings.slug,
        title: doc.title,
        excerpt: doc.excerpt,
        seoDescription: doc.seoDescription,
        blocks: doc.blocks,
        featuredMedia: settings.featuredMedia,
        isMedical: settings.isMedical,
        hasReviewer: Boolean(settings.reviewerId),
      }),
    [settings, doc],
  );
  const blocking = blockingIssues(issues);
  const dirtyAny = settingsDirty || Object.values(docs).some((d) => d.dirty);

  // ----- unsaved-changes guard -----
  useEffect(() => {
    if (!dirtyAny) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirtyAny]);

  // ----- autosave: a recovery copy only, never the live post -----
  useEffect(() => {
    if (!doc.dirty) return;
    const timer = window.setTimeout(async () => {
      const { docs: current, active: key } = latest.current;
      const d = current[key];
      if (!d?.dirty) return;
      try {
        const result = await autosaveTranslationAction({ postId: post.id, localeKey: key, title: d.title, excerpt: d.excerpt, blocks: d.blocks });
        if (result.ok) setAutosavedAt(new Date((result as { ok: true; data: { savedAt: string } }).data.savedAt).toLocaleTimeString());
      } catch {
        // Autosave is best effort; the explicit Save reports failures.
      }
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [doc, post.id]);

  // ----- saving -----
  const applyFailure = (failure: BlogActionFailure) => {
    const map: Record<string, Record<string, string>> = {};
    for (const issue of failure.blockIssues ?? []) {
      const block = doc.blocks[issue.index];
      if (block) (map[block.id] ??= {})[issue.path] = issue.message;
    }
    setBlockErrors(map);
    if (failure.code === "NOT_READY") {
      setServerReadiness(failure.readiness ?? null);
      setSideTab("readiness");
    }
    if (failure.fieldErrors?.slug) setSlugError(failure.fieldErrors.slug);
    toast.error(failure.code === "NOT_READY" ? t("toast.notReady") : failure.code === "FAILED" ? t("toast.failed") : failure.message);
  };

  const saveSettings = async (): Promise<boolean> => {
    if (!settingsDirty) return true;
    setSlugError(null);
    const result = await savePostSettingsAction({
      id: post.id,
      slug: settings.slug,
      categoryId: settings.categoryId || null,
      authorId: settings.authorId || null,
      reviewerId: settings.reviewerId || null,
      lastReviewedAt: settings.lastReviewedAt ? new Date(`${settings.lastReviewedAt}T00:00:00Z`).toISOString() : null,
      featuredMedia: settings.featuredMedia,
      isFeatured: settings.isFeatured,
      isMedical: settings.isMedical,
    });
    if (!result.ok) {
      applyFailure(result as BlogActionFailure);
      return false;
    }
    setSettingsDirty(false);
    return true;
  };

  const save = async (intent: "save" | "publish" | "unpublish") => {
    if (busy) return;
    setBusy(intent === "save" ? "save" : intent);
    setBlockErrors({});
    setServerReadiness(null);
    try {
      if (!(await saveSettings())) return;
      const d = latest.current.docs[active] ?? emptyDoc();
      const result = await saveTranslationAction({
        postId: post.id,
        localeKey: active,
        title: d.title,
        excerpt: d.excerpt,
        blocks: d.blocks,
        seoTitle: d.seoTitle,
        seoDescription: d.seoDescription,
        ogMedia: d.ogMedia,
        intent,
        publishedAt: d.publishedAt ? d.publishedAt : null,
      });
      if (!result.ok) {
        applyFailure(result as BlogActionFailure);
        return;
      }
      const saved = (result as { ok: true; data: { status: PostStatus; publishedAt: string | null; updatedAt: string } }).data;
      setDocs((previous) => ({ ...previous, [active]: { ...(previous[active] ?? emptyDoc()), exists: true, status: saved.status, publishedAt: saved.publishedAt, updatedAt: saved.updatedAt, dirty: false } }));
      setRecovered((previous) => {
        const { [active]: _discard, ...rest } = previous;
        return rest;
      });
      setRevisions(null);
      toast.success(intent === "publish" ? t("toast.published") : intent === "unpublish" ? t("toast.unpublished") : t("toast.saved"));
      router.refresh();
    } catch (error) {
      // The request itself failed (network, 5xx): keep the draft as it is and say so.
      console.error("blog save failed", error);
      toast.error(t("toast.failed"));
    } finally {
      setBusy(null);
    }
  };

  // Ctrl/Cmd+S
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save("save");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const deleteLanguage = async () => {
    if (!window.confirm(t("confirmDeleteLanguage", { language: LOCALE_DISPLAY_NAMES[header] }))) return;
    setBusy("delete");
    try {
      if (doc.exists) {
        const result = await deleteTranslationAction({ postId: post.id, localeKey: active });
        if (!result.ok) {
          applyFailure(result as BlogActionFailure);
          return;
        }
      }
      setDocs((previous) => {
        const { [active]: _removed, ...rest } = previous;
        return rest;
      });
      toast.success(t("toast.languageDeleted"));
      router.refresh();
    } catch (error) {
      console.error("blog delete language failed", error);
      toast.error(t("toast.failed"));
    } finally {
      setBusy(null);
    }
  };

  // ----- blocks -----
  const insertBlock = (index: number, type: BlockType) => {
    const next = [...doc.blocks];
    next.splice(index, 0, createBlock(type));
    setBlocks(next);
    setInserter(null);
  };
  const moveBlock = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= doc.blocks.length) return;
    const next = [...doc.blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
  };
  const dropBlock = (to: number) => {
    const from = dragRef.current;
    dragRef.current = null;
    setDragIndex(null);
    if (from === null || from === to) return;
    const next = [...doc.blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setBlocks(next);
  };
  const duplicate = (index: number) => {
    const next = [...doc.blocks];
    next.splice(index + 1, 0, duplicateBlock(doc.blocks[index]));
    setBlocks(next);
  };
  const removeBlock = (index: number) => setBlocks(doc.blocks.filter((_, i) => i !== index));
  const changeBlock = (index: number, block: Block) => setBlocks(doc.blocks.map((b, i) => (i === index ? block : b)));

  const copyStructure = (sourceKey: string) => {
    const source = docs[sourceKey];
    if (!source) return;
    patchDoc({ blocks: source.blocks.map(duplicateBlock), title: doc.title || source.title, excerpt: doc.excerpt || source.excerpt });
  };

  // ----- history -----
  const loadHistory = async () => {
    try {
      const result = await listRevisionsAction({ postId: post.id, localeKey: active });
      if (result.ok) setRevisions((result as { ok: true; data: RevisionRow[] }).data);
      else toast.error(t("toast.failed"));
    } catch (error) {
      console.error("blog history failed", error);
      toast.error(t("toast.failed"));
    }
  };
  useEffect(() => {
    if (sideTab === "history") void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sideTab, active]);

  const restoreRevision = async (id: string) => {
    let result;
    try {
      result = await getRevisionAction({ revisionId: id });
    } catch (error) {
      console.error("blog revision failed", error);
      toast.error(t("toast.failed"));
      return;
    }
    if (!result.ok) {
      toast.error(t("toast.failed"));
      return;
    }
    const data = (result as { ok: true; data: { title: string; excerpt: string; blocks: unknown[] } }).data;
    patchDoc({ title: data.title, excerpt: data.excerpt, blocks: readBlocks(data.blocks) });
    toast.success(t("toast.revisionLoaded"));
  };

  const offer = recovered[active];
  const statusLabel = !doc.exists ? t("status.new") : t(`status.${doc.status}`);
  const scheduled = doc.status === "published" && doc.publishedAt && new Date(doc.publishedAt) > new Date();
  const sourceLanguages = Object.entries(docs).filter(([key, d]) => key !== active && d.blocks.length > 0);
  const readinessList = serverReadiness ?? issues;
  const blockLabel = (type: BlockType) => t(`blocks.${type}`);

  return (
    <MediaCacheProvider value={mediaCache}>
      <div className="space-y-4" data-testid="post-editor">
        {/* top bar */}
        <div className="sticky top-0 z-20 -mx-1 space-y-2 border-b bg-background/95 px-1 py-2 backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
              {t("back")}
            </Link>
            <span className="font-mono text-xs text-muted-foreground" dir="ltr">
              /blog/{settings.slug}
            </span>
            <Badge variant={doc.status === "published" && doc.exists ? "default" : "outline"} data-testid="post-status">
              {scheduled ? t("status.scheduled") : statusLabel}
            </Badge>
            <span className="text-xs text-muted-foreground" aria-live="polite" data-testid="save-state">
              {dirtyAny ? t("unsaved") : t("allSaved")}
              {autosavedAt && doc.dirty ? ` · ${t("autosaved", { time: autosavedAt })}` : ""}
            </span>
            <div className="ms-auto flex flex-wrap items-center gap-2">
              {doc.exists ? (
                <a href={`/admin/blog/${post.id}/preview?locale=${encodeURIComponent(active)}`} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm hover:bg-muted" data-testid="preview-link">
                  <Eye className="size-4" aria-hidden />
                  {t("preview")}
                </a>
              ) : null}
              {doc.status === "published" && doc.exists ? (
                <Link href={`/blog/${settings.slug}`} target="_blank" locale={HEADER_TO_LOCALE_MAP[header] as never} className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm hover:bg-muted" data-testid="view-public">
                  <ExternalLink className="size-4" aria-hidden />
                  {t("viewPublic")}
                </Link>
              ) : null}
              <button type="button" disabled={busy !== null} onClick={() => save("save")} className="h-9 rounded-md border px-4 text-sm hover:bg-muted disabled:opacity-50" data-testid="save-draft">
                {busy === "save" ? t("saving") : t("save")}
              </button>
              {doc.status === "published" && doc.exists ? (
                <button type="button" disabled={busy !== null} onClick={() => save("unpublish")} className="h-9 rounded-md border px-4 text-sm hover:bg-muted disabled:opacity-50" data-testid="unpublish">
                  {t("unpublish")}
                </button>
              ) : null}
              <button type="button" disabled={busy !== null} onClick={() => save("publish")} className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50" data-testid="publish">
                {busy === "publish" ? t("publishing") : doc.status === "published" && doc.exists ? t("update") : t("publish")}
              </button>
            </div>
          </div>
          <div role="tablist" aria-label={t("languages")} className="flex gap-1 overflow-x-auto" data-testid="language-tabs">
            {SUPPORTED_LOCALE_HEADERS.map((key) => {
              const d = docs[key];
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active === key}
                  onClick={() => setActive(key)}
                  data-testid={`lang-tab-${key}`}
                  className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm", active === key ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                >
                  {LOCALE_DISPLAY_NAMES[key]}
                  {d?.exists ? <span aria-hidden className={cn("size-2 rounded-full", d.status === "published" ? "bg-green-500" : d.status === "archived" ? "bg-neutral-400" : "bg-amber-500")} /> : null}
                  {d?.dirty ? <span aria-hidden>*</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        {offer ? (
          <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" data-testid="autosave-offer">
            <span>{t("recoverBanner", { time: new Date(offer.savedAt).toLocaleString() })}</span>
            <button type="button" className="rounded-md bg-amber-900 px-3 py-1 text-white" onClick={() => (patchDoc({ title: offer.title, excerpt: offer.excerpt, blocks: offer.blocks }), setRecovered((p) => { const { [active]: _x, ...rest } = p; return rest; }))} data-testid="autosave-restore">
              {t("recoverRestore")}
            </button>
            <button type="button" className="rounded-md px-3 py-1 hover:bg-amber-100" onClick={() => setRecovered((p) => { const { [active]: _x, ...rest } = p; return rest; })}>
              {t("recoverDiscard")}
            </button>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          {/* main column */}
          <div className="space-y-4" dir={direction} lang={active.split("-")[0]}>
            {!doc.exists && !doc.blocks.length ? (
              <div className="rounded-xl border border-dashed p-3 text-sm" dir="auto">
                <p className="mb-2 text-muted-foreground">{t("newLanguage", { language: LOCALE_DISPLAY_NAMES[header] })}</p>
                {sourceLanguages.length ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{t("copyFrom")}</span>
                    {sourceLanguages.map(([key]) => (
                      <button key={key} type="button" onClick={() => copyStructure(key)} className="rounded-md border px-3 py-1 hover:bg-muted" data-testid={`copy-from-${key}`}>
                        {LOCALE_DISPLAY_NAMES[key as never]}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <Field label={t("postTitle")}>
              {(id) => <TextInput id={id} value={doc.title} dir={direction} maxLength={200} onChange={(title) => patchDoc({ title })} testId="post-title" placeholder={t("postTitlePlaceholder")} />}
            </Field>
            <Field label={t("excerpt")} hint={t("excerptHint")}>
              {(id) => <textarea id={id} value={doc.excerpt} dir={direction} rows={2} maxLength={500} onChange={(event) => patchDoc({ excerpt: event.target.value })} className={cn(selectClass, "h-auto py-2")} data-testid="post-excerpt" />}
            </Field>

            <section aria-label={t("content")} className="space-y-2" data-testid="blocks">
              <Inserter index={0} open={inserter === 0} onOpen={setInserter} onPick={insertBlock} />
              {doc.blocks.map((block, index) => (
                <div key={block.id}>
                  <div
                    id={`block-${block.id}`}
                    className={cn("rounded-2xl border bg-card p-3 shadow-sm", dragIndex === index && "opacity-50")}
                    data-testid={`block-${block.type}`}
                    data-block-id={block.id}
                  >
                    <div
                      className={cn("mb-2 flex items-center gap-1 rounded-lg", dragIndex !== null && dragIndex !== index && "bg-primary/10 ring-2 ring-primary/40")}
                      dir="ltr"
                      data-testid="block-header"
                      // Blocks are dropped on another block's header strip, not on its body: a rich-text editor in the
                      // body handles drag events itself and the browser does not deliver a drop there reliably.
                      onDragOver={(event) => {
                        if (dragRef.current !== null) event.preventDefault();
                      }}
                      onDrop={(event) => {
                        if (dragRef.current === null) return;
                        event.preventDefault();
                        dropBlock(index);
                      }}
                    >
                      <span
                        draggable
                        role="button"
                        tabIndex={-1}
                        aria-label={t("drag")}
                        title={t("drag")}
                        onDragStart={(event) => {
                          dragRef.current = index;
                          setDragIndex(index);
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("application/x-lsevin-blog-block", block.id); // custom type only: a text editor under the pointer must not accept it as text
                        }}
                        onDragEnd={() => {
                          dragRef.current = null;
                          setDragIndex(null);
                        }}
                        className="cursor-grab rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
                        data-testid="block-drag"
                      >
                        <GripVertical className="size-4" aria-hidden />
                      </span>
                      <span className="text-sm font-semibold">{blockLabel(block.type)}</span>
                      <span className="ms-auto flex">
                        <IconButton label={t("moveUp")} onClick={() => moveBlock(index, -1)} disabled={index === 0} testId="block-up">
                          <ArrowUp className="size-4" />
                        </IconButton>
                        <IconButton label={t("moveDown")} onClick={() => moveBlock(index, 1)} disabled={index === doc.blocks.length - 1} testId="block-down">
                          <ArrowDown className="size-4" />
                        </IconButton>
                        <IconButton label={t("duplicate")} onClick={() => duplicate(index)} testId="block-duplicate">
                          <Copy className="size-4" />
                        </IconButton>
                        <IconButton label={t("remove")} onClick={() => removeBlock(index)} testId="block-remove" className="hover:text-destructive">
                          <Trash2 className="size-4" />
                        </IconButton>
                      </span>
                    </div>
                    <BlockEditor block={block} onChange={(next) => changeBlock(index, next)} direction={direction} localeKey={active} errors={blockErrors[block.id]} />
                    {blockErrors[block.id] ? (
                      <p role="alert" className="mt-2 text-xs text-destructive">
                        {Object.values(blockErrors[block.id]).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <Inserter index={index + 1} open={inserter === index + 1} onOpen={setInserter} onPick={insertBlock} />
                </div>
              ))}
              {!doc.blocks.length ? <p className="py-6 text-center text-sm text-muted-foreground">{t("emptyBlocks")}</p> : null}
            </section>
          </div>

          {/* side panel */}
          <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start" aria-label={t("sidePanel")}>
            <div role="tablist" className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
              {(["settings", "seo", "readiness", "history"] as const).map((tab) => (
                <button key={tab} type="button" role="tab" aria-selected={sideTab === tab} onClick={() => setSideTab(tab)} data-testid={`side-tab-${tab}`} className={cn("flex-1 rounded-md px-2 py-1.5", sideTab === tab ? "bg-background shadow-sm" : "text-muted-foreground")}>
                  {t(`side.${tab}`)}
                  {tab === "readiness" && blocking.length ? <span className="ms-1 rounded-full bg-destructive px-1.5 text-xs text-white">{blocking.length}</span> : null}
                </button>
              ))}
            </div>

            <div className="space-y-3 rounded-2xl border bg-card p-4" role="tabpanel">
              {sideTab === "settings" ? (
                <>
                  <Field label={t("settings.slug")} hint={t("settings.slugHint")} error={slugError ?? undefined}>
                    {(id) => <TextInput id={id} value={settings.slug} dir="ltr" maxLength={120} invalid={Boolean(slugError)} onChange={(slug) => (setSlugError(null), patchSettings({ slug: slug.toLowerCase() }))} testId="post-slug" />}
                  </Field>
                  <Field label={t("settings.category")}>
                    {(id) => (
                      <select id={id} value={settings.categoryId} onChange={(event) => patchSettings({ categoryId: event.target.value })} className={selectClass} data-testid="post-category">
                        <option value="">{t("settings.none")}</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name[active] || category.name[`${adminLocale === "fa" ? "fa-IR" : "en-US"}`] || category.slug}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                  <Field label={t("settings.author")}>
                    {(id) => (
                      <select id={id} value={settings.authorId} onChange={(event) => patchSettings({ authorId: event.target.value })} className={selectClass} data-testid="post-author">
                        <option value="">{t("settings.none")}</option>
                        {authors.map((author) => (
                          <option key={author.id} value={author.id}>
                            {author.name[active] || author.name["en-US"] || author.name["fa-IR"] || Object.values(author.name)[0]}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={settings.isMedical} onChange={(event) => patchSettings({ isMedical: event.target.checked })} data-testid="post-medical" />
                    {t("settings.medical")}
                  </label>
                  {settings.isMedical ? (
                    <>
                      <Field label={t("settings.reviewer")}>
                        {(id) => (
                          <select id={id} value={settings.reviewerId} onChange={(event) => patchSettings({ reviewerId: event.target.value })} className={selectClass} data-testid="post-reviewer">
                            <option value="">{t("settings.none")}</option>
                            {authors.filter((author) => author.isMedicalReviewer).map((author) => (
                              <option key={author.id} value={author.id}>
                                {author.name[active] || author.name["en-US"] || author.name["fa-IR"] || Object.values(author.name)[0]}
                              </option>
                            ))}
                          </select>
                        )}
                      </Field>
                      <Field label={t("settings.lastReviewed")}>
                        {(id) => <input id={id} type="date" value={settings.lastReviewedAt} onChange={(event) => patchSettings({ lastReviewedAt: event.target.value })} className={selectClass} />}
                      </Field>
                    </>
                  ) : null}
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={settings.isFeatured} onChange={(event) => patchSettings({ isFeatured: event.target.checked })} data-testid="post-featured" />
                    {t("settings.featured")}
                  </label>
                  <MediaPicker kind="image" label={t("settings.featuredImage")} value={settings.featuredMedia} testId="post-featured-image" onChange={(id) => patchSettings({ featuredMedia: id })} />
                  <Field label={t("settings.publishDate")} hint={t("settings.publishDateHint")}>
                    {(id) => (
                      <input
                        id={id}
                        type="datetime-local"
                        value={toLocalInput(doc.publishedAt)}
                        onChange={(event) => patchDoc({ publishedAt: event.target.value ? new Date(event.target.value).toISOString() : null })}
                        className={selectClass}
                        data-testid="post-publish-date"
                      />
                    )}
                  </Field>
                  {doc.exists ? (
                    <button type="button" onClick={deleteLanguage} disabled={busy !== null} className="text-sm text-destructive hover:underline" data-testid="delete-language">
                      {t("deleteLanguage", { language: LOCALE_DISPLAY_NAMES[header] })}
                    </button>
                  ) : null}
                </>
              ) : null}

              {sideTab === "seo" ? (
                <>
                  <Field label={t("seo.title")} hint={t("seo.titleHint")}>
                    {(id) => <TextInput id={id} value={doc.seoTitle} dir={direction} maxLength={120} onChange={(seoTitle) => patchDoc({ seoTitle })} testId="seo-title" />}
                  </Field>
                  <Field label={t("seo.description")} hint={t("seo.descriptionHint", { count: doc.seoDescription.length })}>
                    {(id) => <textarea id={id} value={doc.seoDescription} dir={direction} rows={3} maxLength={300} onChange={(event) => patchDoc({ seoDescription: event.target.value })} className={cn(selectClass, "h-auto py-2")} data-testid="seo-description" />}
                  </Field>
                  <MediaPicker kind="image" label={t("seo.ogImage")} value={doc.ogMedia} testId="seo-og-image" onChange={(id) => patchDoc({ ogMedia: id })} />
                </>
              ) : null}

              {sideTab === "readiness" ? (
                <div data-testid="readiness">
                  {readinessList.length === 0 ? <p className="text-sm text-green-700">{t("readiness.ok")}</p> : null}
                  <ul className="space-y-2 text-sm">
                    {readinessList.map((issue, i) => (
                      <li key={`${issue.code}-${issue.blockId ?? i}`} className="flex items-start gap-2" data-severity={issue.severity} data-code={issue.code}>
                        <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", issue.severity === "error" ? "bg-destructive" : "bg-amber-500")} />
                        <span>
                          <span className="sr-only">{t(`readiness.severity.${issue.severity}`)}: </span>
                          {t(`readiness.codes.${issue.code}`)}
                          {issue.blockId ? (
                            <>
                              {" "}
                              <a href={`#block-${issue.blockId}`} className="text-primary underline">
                                {t("readiness.goToBlock")}
                              </a>
                            </>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {sideTab === "history" ? (
                <div data-testid="history">
                  {revisions === null ? <p className="text-sm text-muted-foreground">{t("history.loading")}</p> : null}
                  {revisions && revisions.length === 0 ? <p className="text-sm text-muted-foreground">{t("history.empty")}</p> : null}
                  <ul className="space-y-2 text-sm">
                    {revisions?.map((revision) => (
                      <li key={revision.id} className="flex items-center justify-between gap-2">
                        <span>
                          <span className="font-medium">{t(`history.kind.${revision.kind}`)}</span>
                          <span className="block text-xs text-muted-foreground">{new Date(revision.createdAt).toLocaleString()}</span>
                        </span>
                        <button type="button" onClick={() => restoreRevision(revision.id)} className="rounded-md border px-2 py-1 text-xs hover:bg-muted" data-testid="history-load">
                          {t("history.load")}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </MediaCacheProvider>
  );
}

function Inserter({ index, open, onOpen, onPick }: { index: number; open: boolean; onOpen: (index: number | null) => void; onPick: (index: number, type: BlockType) => void }) {
  const t = useTranslations("AdminBlog");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) {
      setQuery("");
      // Focus the search field so the editor can type to filter straight away.
      queueMicrotask(() => searchRef.current?.focus());
    }
  }, [open]);
  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
  const arrow = (event: React.KeyboardEvent, from: number) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const list = items();
    const next = from + (event.key === "ArrowDown" ? 1 : -1);
    if (next < 0) searchRef.current?.focus();
    else list[Math.min(next, list.length - 1)]?.focus();
  };
  const types = BLOCK_TYPES.filter((type) => t(`blocks.${type}`).toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="relative flex justify-center py-1" onKeyDown={(event) => event.key === "Escape" && open && (event.stopPropagation(), onOpen(null))}>
      <button
        type="button"
        aria-label={t("addBlock")}
        aria-expanded={open}
        title={t("addBlock")}
        onClick={() => onOpen(open ? null : index)}
        className="inline-flex size-7 items-center justify-center rounded-full border bg-background text-muted-foreground hover:bg-primary hover:text-primary-foreground"
        data-testid={`add-block-${index}`}
      >
        <Plus className="size-4" aria-hidden />
      </button>
      {open ? (
        <div ref={menuRef} role="menu" aria-label={t("addBlock")} className="absolute top-9 z-30 w-72 rounded-xl border bg-popover p-2 shadow-lg" data-testid="inserter">
          <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (types[0]) onPick(index, types[0]); } else arrow(event, -1); }} placeholder={t("searchBlocks")} aria-label={t("searchBlocks")} className="mb-2 h-8 w-full rounded-md border bg-background px-2 text-sm" data-testid="inserter-search" />
          <ul className="grid grid-cols-2 gap-1">
            {types.map((type, i) => (
              <li key={type}>
                <button type="button" role="menuitem" onKeyDown={(event) => arrow(event, i)} onClick={() => onPick(index, type)} className="w-full rounded-md px-2 py-1.5 text-start text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none" data-testid={`insert-${type}`}>
                  {t(`blocks.${type}`)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
