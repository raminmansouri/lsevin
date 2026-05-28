import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import {
  getProviderWorkspace,
  listProviderStaff,
  listProviderStaffRelatedRecords,
} from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import {
  providerPortalBack,
  serviceDefinitionOptions,
  staffOptions,
  toDateInput,
  toTimeInput,
  tr,
} from "@/features/provider-portal/lib/form-page-utils";

export default async function EditStaffAvailabilityPage({
  params,
}: {
  params: Promise<{
    locale: string;
    providerId: string;
    staffId: string;
    availabilityId: string;
  }>;
}) {
  const { locale, providerId, staffId, availabilityId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const [staff, related] = await Promise.all([
    listProviderStaff(userId, providerId, locale),
    listProviderStaffRelatedRecords(userId, providerId, locale),
  ]);
  const item = related.availability.find(
    (row) => row.id === availabilityId && row.staffId === staffId,
  );
  if (!item) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "availabilityId", type: "hidden" as const },
    {
      name: "staffId",
      label: "کارشناس / پزشک",
      type: "select" as const,
      required: true,
      options: staffOptions(staff),
      fullWidth: true,
      helpText: "شخصی را انتخاب کنید که این زمان کاری برای او قابل رزرو شود.",
    },
    {
      name: "dayOfWeek",
      label: "روز هفته",
      type: "select" as const,
      required: true,
      helpText: "برای برنامه ثابت هفتگی، روز تکرارشونده را انتخاب کنید.",
      options: [
        { value: 1, label: "دوشنبه" },
        { value: 2, label: "سه‌شنبه" },
        { value: 3, label: "چهارشنبه" },
        { value: 4, label: "پنجشنبه" },
        { value: 5, label: "جمعه" },
        { value: 6, label: "شنبه" },
        { value: 7, label: "یکشنبه" },
      ],
    },
    {
      name: "startTime",
      label: "ساعت شروع",
      type: "time" as const,
      required: true,
      helpText: "از این ساعت، نوبت‌دهی برای مشتری شروع می‌شود.",
    },
    {
      name: "endTime",
      label: "ساعت پایان",
      type: "time" as const,
      required: true,
      helpText: "بعد از این ساعت نوبتی ساخته نمی‌شود؛ پایان باید بعد از شروع باشد.",
    },
    {
      name: "availabilityStatusId",
      label: "وضعیت",
      type: "number" as const,
      min: 1,
      helpText: "عدد 1 یعنی قابل رزرو. برای وضعیت‌های دیگر فقط در صورتی تغییر دهید که سیستم شما آن‌ها را تعریف کرده باشد.",
    },
    {
      name: "specificDate",
      label: "تاریخ خاص",
      type: "date" as const,
      helpText: "اختیاری است. اگر تکرار هفتگی روشن است، این قسمت را خالی بگذارید. برای تعطیلی یا برنامه یک‌روزه، تاریخ خاص را وارد کنید.",
    },
    {
      name: "isRecurring",
      label: "تکرار هفتگی",
      type: "checkbox" as const,
      helpText: "روشن باشد یعنی این بازه هر هفته تکرار می‌شود؛ خاموش باشد یعنی فقط تاریخ خاص اعمال می‌شود.",
    },
  ];

  return (
    <ProviderRecordForm
      operation="saveStaffAvailability"
      title="ویرایش زمان کاری کارشناس"
      description="بازه کاری این کارشناس را اصلاح کنید. ساعت پایان باید بعد از ساعت شروع باشد."
      fields={fields}
      initialValues={{
        providerId,
        availabilityId: item.id,
        staffId: item.staffId,
        dayOfWeek: item.dayOfWeek,
        startTime: toTimeInput(item.startTime),
        endTime: toTimeInput(item.endTime),
        isRecurring: item.isRecurring,
        availabilityStatusId: item.availabilityStatusId,
        specificDate: toDateInput(item.specificDate),
      }}
      backHref={providerPortalBack(
        providerId,
        `/staff/${staffId}/availability`,
      )}
      submitLabel="ذخیره زمان کاری"
      successMessage="زمان کاری به‌روزرسانی شد."
    />
  );
}
