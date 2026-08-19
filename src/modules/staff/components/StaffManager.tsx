import { Trash2 } from "lucide-react";
import { Button, LinkButton } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input } from "@core/ui/Field";
import { LocalizedField } from "@core/ui/LocalizedField";
import { MediaPicker } from "@core/ui/MediaPicker";
import { translatedPortalValue } from "@core/i18n/config";
import { createStaffAction, unlinkProviderStaffAction } from "../actions";
import type { ProviderStaff } from "../types";
import { localizeReactTree } from "@core/i18n/localize-tree";

export function StaffManager({ providerId, staff, locale = "fa-IR" }: { providerId: string; staff: ProviderStaff[]; locale?: string }) {
  return localizeReactTree((
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <Card className="overflow-hidden">
        <div className="divide-y divide-border">
          {staff.length ? staff.map((item) => (
            <div key={item.providerStaffId} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="font-bold text-slate-950">{translatedPortalValue(item.nameTranslations, locale, "Untitled")}</div>
                <div className="text-sm text-muted-foreground">{translatedPortalValue(item.titleTranslations, locale, "—")} · {item.specialty || "—"}</div>
              </div>
              <div className="flex justify-end gap-2">
                <LinkButton href={`/providers/${providerId}/staff/${item.providerStaffId}/edit`} variant="secondary">Edit</LinkButton>
                <form action={unlinkProviderStaffAction}>
                  <input type="hidden" name="providerId" value={providerId} />
                  <input type="hidden" name="providerStaffId" value={item.providerStaffId} />
                  <Button type="submit" variant="ghost" className="text-red-600"><Trash2 size={15} /></Button>
                </form>
              </div>
            </div>
          )) : <div className="p-5 text-sm text-muted-foreground">No staff linked yet.</div>}
        </div>
      </Card>
      <form action={createStaffAction}>
        <input type="hidden" name="providerId" value={providerId} />
        <Card>
          <CardHeader><CardTitle>Add staff</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <LocalizedField name="name" label="نام کارمند" requiredLocale="fa-IR" />
            <LocalizedField name="title" label="عنوان حرفه‌ای" />
            <Field label="Specialty"><Input name="specialty" /></Field>
            <MediaPicker name="profileImageUrl" providerId={providerId} mediaType="image" label="تصویر پروفایل" />
            <LocalizedField name="biography" label="زندگینامه" mode="richtext" />
            <Button type="submit">Create staff</Button>
          </CardContent>
        </Card>
      </form>
    </div>
  ), locale);
}
