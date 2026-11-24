"use client";

import SingleMediaPickerInput from "@/features/media-picker-addon/components/SingleMediaPickerInput";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LocalizedTextInput, pickLabel } from "@/features/tours/ui/admin/inputs";
import { STAY_CONTENT_LOCALES } from "../../domain/locales";
import { saveAmenityAction } from "../../server/actions/admin";
import { AmenityIcon, amenityIcons } from "../detail/amenity-icon";
import { useStayAdminAction } from "./shared";

type Entry = { code: string; label: Record<string,string>; icon: string | null; revision: number; imageId: string | null };

export function AmenityCatalog({ entries }: { entries: Entry[] }) {
  const locale = useLocale();
  const t = useTranslations("StayAdmin");
  const [code,setCode] = useState(entries[0]?.code);
  const entry = entries.find(e => e.code === code);
  return <section className="space-y-4"><h1>{t("editor.amenities")}</h1>
    <select aria-label={t("editor.amenities")} value={code} onChange={e => setCode(e.target.value)}>
      {entries.map(e => <option key={e.code} value={e.code}>{pickLabel(e.label,locale,e.code)}</option>)}
    </select>
    {entry && <Editor key={entry.code + ":" + entry.revision} entry={entry} />}
  </section>;
}

function Editor({ entry }: { entry: Entry }) {
  const t = useTranslations("StayAdmin");
  const [label,setLabel] = useState(entry.label);
  const [imageId,setImageId] = useState(entry.imageId ?? "");
  const [icon,setIcon] = useState(entry.icon ?? "check");
  const { run,pending } = useStayAdminAction();
  return <form className="space-y-4" onSubmit={e => {
    e.preventDefault();
    void run(() => saveAmenityAction({code:entry.code, revision:entry.revision, label, icon, imageId: imageId || null}));
  }}>
    <LocalizedTextInput label={t("editor.name")} locales={STAY_CONTENT_LOCALES} value={label} onChange={setLabel} />
    <label className="flex items-center gap-2"><AmenityIcon name={icon} className="size-6" />
      <select aria-label={t("editor.amenities")} value={icon} onChange={e => setIcon(e.target.value)}>
        {amenityIcons.map(name => <option key={name}>{name}</option>)}
      </select>
    </label>
    <SingleMediaPickerInput name="amenity-image" label={t("editor.tabs.photos")} mediaType="image" valueField="id" value={imageId} onValueChange={setImageId} />
    <button disabled={pending} type="submit" className="rounded-md border px-4 py-2">{t("common.save")}</button>
  </form>;
}
