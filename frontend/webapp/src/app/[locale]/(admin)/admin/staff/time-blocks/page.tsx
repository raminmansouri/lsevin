import { PageHeader } from "@/components/page/page-header";
import { DoctorTimeBlocksPanel } from "@/features/doctor-time-blocks/components/doctor-time-blocks-panel";
import { todayIso } from "@/features/doctor-time-blocks/lib/ranges";
import { getDoctor } from "@/features/doctor-time-blocks/server/repository";
import { TIME_BLOCKS_RESOURCE } from "@/features/doctor-time-blocks/types";
import { assertAdmin } from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pageText(locale: string) {
  return locale.toLowerCase().startsWith("fa")
    ? {
        title: "مسدود کردن زمان پزشکان",
        description: "زمان‌های یک پزشک را برای یک نوبت یا هر بازهٔ دلخواه غیرقابل رزرو کنید. بیماران این زمان‌ها را در اپلیکیشن نمی‌بینند.",
      }
    : {
        title: "Doctor time blocks",
        description: "Make a doctor's time unbookable, for one slot or any range. Patients won't see these times in the app.",
      };
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return { title: pageText(locale).title };
}

export default async function DoctorTimeBlocksPage({ params, searchParams }: Props) {
  await assertAdmin(TIME_BLOCKS_RESOURCE, "view");
  const { locale } = await params;
  const search = await searchParams;
  const staffParam = Array.isArray(search.staffId) ? search.staffId[0] : search.staffId;
  const dbLocale = locale.toLowerCase().startsWith("fa") ? "fa-IR" : "en-US";
  const initialDoctor = staffParam && UUID_RE.test(staffParam) ? await getDoctor(staffParam, dbLocale) : null;
  const text = pageText(locale);

  return (
    <div className="space-y-5">
      <PageHeader title={text.title} description={text.description} />
      <DoctorTimeBlocksPanel locale={dbLocale} today={todayIso()} initialDoctor={initialDoctor} />
    </div>
  );
}
