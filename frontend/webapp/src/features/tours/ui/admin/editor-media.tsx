"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { addMediaAction, moderateMediaAction, removeMediaAction, reorderMediaAction } from "../../server/admin/actions";
import type { TourBundle } from "../../server/admin/queries";

import { MediaUrlInput, pickLabel } from "./inputs";
import { EmptyState, Field, NativeSelect, ReasonAction, Section, StatusBadge, TranslationsInput, useAdminAction } from "./primitives";

/** Media moderation (M-006): approve, reject with a note the provider sees, reorder, add, remove. */
export function MediaTab({ bundle }: { bundle: TourBundle }) {
  const t = useTranslations("TourAdmin.media");
  const uiLocale = useLocale();
  const { run, pending } = useAdminAction();
  const core = bundle.core;
  const media = bundle.media;
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<"image" | "video" | "panorama">("image");
  const [alt, setAlt] = useState<Record<string, string>>({});
  const [cover, setCover] = useState(false);
  const move = (index: number, delta: number) => {
    const ids = media.map((m) => m.id);
    const j = index + delta;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    run(() => reorderMediaAction(core.id, ids));
  };
  return (
    <div className="space-y-4">
      <Section id="media" title={t("title")} description={t("description")}>
        {media.length === 0 ? <EmptyState>{t("empty")}</EmptyState> : null}
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {media.map((m, i) => (
            <li key={m.id} className="space-y-2 rounded-md border p-3" data-media-id={m.id} data-moderation={m.moderation_status}>
              {/* eslint-disable-next-line @next/next/no-img-element -- moderation must show the exact uploaded file, unoptimized */}
              {m.kind === "image" ? <img src={m.thumbnail_url ?? m.url} alt={pickLabel(m.alt_translations, uiLocale)} className="aspect-video w-full rounded object-cover" loading="lazy" /> : (
                <a href={m.url} className="block truncate text-sm underline" dir="ltr">{m.url}</a>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusBadge status={m.moderation_status} label={t(`status.${m.moderation_status}`)} />
                <span>{t(`kind.${m.kind}`)}</span>
                {m.is_cover ? <span className="font-medium">{t("cover")}</span> : null}
                {m.width && m.height ? <span dir="ltr">{m.width}×{m.height}</span> : null}
              </div>
              {m.moderation_note ? <p className="text-muted-foreground text-xs">{t("note")}: {m.moderation_note}</p> : null}
              {!m.alt_translations?.[core.source_locale] ? <p className="text-xs text-amber-700">{t("altMissing")}</p> : null}
              <div className="flex flex-wrap gap-2">
                {m.moderation_status !== "approved" ? (
                  <Button type="button" size="sm" disabled={pending} onClick={() => run(() => moderateMediaAction(m.id, "approved"))}>{t("approve")}</Button>
                ) : null}
                {m.moderation_status !== "rejected" ? (
                  <ReasonAction label={t("reject")} variant="destructive" reasonLabel={t("rejectReason")}
                    onConfirm={(note) => run(() => moderateMediaAction(m.id, "rejected", note))} />
                ) : null}
                <Button type="button" size="sm" variant="ghost" disabled={pending || i === 0} aria-label={t("moveUp")} onClick={() => move(i, -1)}>↑</Button>
                <Button type="button" size="sm" variant="ghost" disabled={pending || i === media.length - 1} aria-label={t("moveDown")} onClick={() => move(i, 1)}>↓</Button>
                <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => { if (window.confirm(t("removeConfirm"))) run(() => removeMediaAction(core.id, m.id)); }}>{t("remove")}</Button>
              </div>
            </li>
          ))}
        </ul>
      </Section>
      <Section id="media-add" title={t("addTitle")} description={t("addHint")}>
        <form className="grid gap-3 md:grid-cols-3" onSubmit={(e) => {
          e.preventDefault();
          run(() => addMediaAction(core.id, { url: url.trim(), kind, alt, isCover: cover }), { onSuccess: () => { setUrl(""); setAlt({}); setCover(false); } });
        }}>
          <Field label={t("file")} htmlFor="media-url" className="md:col-span-2">
            {/* The media library picker (upload or choose); it resolves the file to the public URL the tour stores. */}
            <MediaUrlInput id="media-url" value={url} onChange={setUrl} mediaType={kind === "video" ? "video" : "image"} placeholder={t("pick")} />
          </Field>
          <Field label={t("kindLabel")} htmlFor="media-kind">
            <NativeSelect id="media-kind" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
              <option value="image">{t("kind.image")}</option><option value="video">{t("kind.video")}</option><option value="panorama">{t("kind.panorama")}</option>
            </NativeSelect>
          </Field>
          <div className="md:col-span-3"><TranslationsInput idPrefix="media-alt" label={t("alt")} locales={bundle.locales} value={alt} onChange={setAlt} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cover} onChange={(e) => setCover(e.target.checked)} /> {t("makeCover")}</label>
          <div><Button type="submit" disabled={pending || !url.trim()}>{t("add")}</Button></div>
        </form>
      </Section>
    </div>
  );
}
