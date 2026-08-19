import { Trash2 } from "lucide-react";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select } from "@core/ui/Field";
import { LocalizedField } from "@core/ui/LocalizedField";
import { MediaPicker } from "@core/ui/MediaPicker";
import { addGalleryItemAction, deleteGalleryItemAction } from "../actions";
import type { GalleryItem } from "../types";
import { localizeReactTree } from "@core/i18n/localize-tree";

const t = (obj: Record<string, string>) => obj?.["fa-IR"] || obj?.["en-US"] || "بدون عنوان";

export function MediaManager({ providerId, items, locale = "en" }: { providerId: string; items: GalleryItem[]; locale?: string }) {
  return localizeReactTree((
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => <Card key={item.id} className="overflow-hidden"><div className="aspect-video bg-muted">{item.mediaType === "image" ? <img src={item.url} alt={t(item.titleTranslations)} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{item.mediaType}</div>}</div><CardContent className="flex items-center justify-between gap-3"><div><div className="font-bold">{t(item.titleTranslations)}</div><div className="text-xs text-muted-foreground">ترتیب {item.displayOrder}</div></div><form action={deleteGalleryItemAction}><input type="hidden" name="providerId" value={providerId} /><input type="hidden" name="galleryItemId" value={item.id} /><Button variant="ghost" className="text-red-600"><Trash2 size={15} /></Button></form></CardContent></Card>)}
      </div>
      <form action={addGalleryItemAction}>
        <input type="hidden" name="providerId" value={providerId} />
        <Card><CardHeader><CardTitle>افزودن رسانه</CardTitle></CardHeader><CardContent className="space-y-4">
          <LocalizedField name="title" label="عنوان رسانه" requiredLocale="fa-IR" />
          <MediaPicker name="url" providerId={providerId} mediaType="all" label="انتخاب یا بارگذاری رسانه" required />
          <Field label="نوع رسانه"><Select name="mediaType" defaultValue="image"><option value="image">تصویر</option><option value="video">ویدئو</option><option value="file">فایل</option></Select></Field>
          <Field label="ترتیب نمایش"><Input name="displayOrder" type="number" defaultValue="0" /></Field>
          <LocalizedField name="description" label="توضیحات" mode="richtext" />
          <Button type="submit">افزودن رسانه</Button>
        </CardContent></Card>
      </form>
    </div>
  ), locale);
}
