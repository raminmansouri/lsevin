import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input } from "@core/ui/Field";
import { LocalizedField } from "@core/ui/LocalizedField";
import { MediaPicker } from "@core/ui/MediaPicker";
import { updateStaffAction } from "../actions";
import type { ProviderStaff } from "../types";
import { localizeReactTree } from "@core/i18n/localize-tree";

export function StaffForm({ providerId, staff, locale = "en" }: { providerId: string; staff: ProviderStaff; locale?: string }) {
  return localizeReactTree((
    <form action={updateStaffAction}>
      <input type="hidden" name="providerId" value={providerId} />
      <input type="hidden" name="providerStaffId" value={staff.providerStaffId} />
      <input type="hidden" name="staffId" value={staff.staffId} />
      <Card>
        <CardHeader><CardTitle>Edit staff</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><LocalizedField name="name" label="نام کارمند" value={staff.nameTranslations} requiredLocale="fa-IR" /></div>
          <div className="md:col-span-2"><LocalizedField name="title" label="عنوان حرفه‌ای" value={staff.titleTranslations} /></div>
          <Field label="Specialty"><Input name="specialty" defaultValue={staff.specialty ?? ""} /></Field>
          <div className="md:col-span-2"><MediaPicker name="profileImageUrl" providerId={providerId} value={staff.profileImageUrl ?? ""} mediaType="image" label="تصویر پروفایل" /></div>
          <div className="md:col-span-2"><LocalizedField name="biography" label="زندگینامه" value={staff.biographyTranslations} mode="richtext" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={staff.isActive} /> Active</label>
          <div className="md:col-span-2"><Button type="submit">Save staff</Button></div>
        </CardContent>
      </Card>
    </form>
  ), locale);
}
