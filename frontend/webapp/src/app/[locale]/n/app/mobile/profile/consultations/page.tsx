import { ChevronLeft, MessageCircle } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { listConsultationRequestsForUser } from "@/features/consultation/server/repository";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function MyConsultationsPage() {
  const [locale, t, session] = await Promise.all([
    getLocale(),
    getTranslations("Consultation"),
    getSession(),
  ]);
  const userId = session?.user?.id;
  const requests = userId ? await listConsultationRequestsForUser(userId) : [];
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-100 bg-white px-5 py-4">
        <Link
          href="/n/app/mobile/profile"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
        >
          <ChevronLeft className="h-6 w-6 rtl:rotate-180" />
        </Link>
        <h1 className="text-xl font-bold text-slate-950">{t("admin.title")}</h1>
      </header>

      <main className="space-y-3 px-5 pt-5">
        {requests.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            {t("admin.empty")}
          </div>
        ) : (
          requests.map((request) => (
            <Link
              key={request.id}
              href={`/n/app/mobile/consultation/${request.id}`}
              className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#083f30]/30"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#083f30]/10 text-[#083f30]">
                <MessageCircle className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-slate-950">
                  {request.categoryName || t("admin.detail.title")}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {dateFormatter.format(new Date(request.createdAt))}
                </span>
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {t(`admin.status.${request.status}`)}
              </span>
            </Link>
          ))
        )}
      </main>
    </div>
  );
}
