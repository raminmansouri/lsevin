import { ArrowLeft, ChevronLeft, MessageCircle } from "lucide-react";
import { Reveal } from "@/features/web-desktop/components/motion";
import { getLocale, getTranslations } from "next-intl/server";

import { listConsultationRequestsForUser } from "@/features/consultation/server/repository";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";


const STATUS_TONE: Record<string, string> = {
  new: "bg-[#fbf3de] text-[#8c6b2c]",
  in_progress: "bg-[#fbf3de] text-[#8c6b2c]",
  contacted: "bg-[#e7f4ee] text-[#0f5a45]",
  done: "bg-[#e7f4ee] text-[#0f5a45]",
  rejected: "bg-[#fdf1ef] text-[#b2453a]",
};
const statusTone = (status: string) => STATUS_TONE[status] ?? "bg-[#f6f1e6] text-[#6b6150]";

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
    <>
    <div className="min-h-screen bg-slate-50 pb-24 xl:hidden">
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

    {/* Desktop (>= 1280px) */}
    <div className="lsd lsd-shop-bg hidden pb-20 xl:block">
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg flex items-end justify-between gap-10 overflow-hidden rounded-[36px] px-12 py-12 text-white">
          <Reveal className="space-y-3">
            <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">CONSULTATIONS</span>
            <h1 className="lsd-gold-text text-[40px] font-black leading-tight">{t("admin.title")}</h1>
          </Reveal>
          {requests.length ? (
            <span className="text-[64px] font-extralight leading-none text-white/30" aria-hidden="true">
              {new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(requests.length)}
            </span>
          ) : null}
        </div>
      </section>

      <section className="lsd-container mt-12">
        {requests.length === 0 ? (
          <p className="rounded-[24px] bg-white p-10 text-center text-[#6b6150] ring-1 ring-[#e7dcc4]">{t("admin.empty")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {requests.map((request, index) => (
              <Reveal key={request.id} delay={(index % 2) * 80}>
                <Link
                  href={`/n/app/mobile/consultation/${request.id}`}
                  className="group flex items-center gap-5 rounded-[24px] bg-white p-6 ring-1 ring-[#e7dcc4] transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_50px_-30px_rgba(6,42,32,0.4)] hover:ring-[#c9a55a]"
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#083f30] text-[#eacb7f]">
                    <MessageCircle className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-black text-[#0e1a16]">{request.categoryName || t("admin.detail.title")}</span>
                    <span className="mt-1 block text-sm text-[#8a8170]">{dateFormatter.format(new Date(request.createdAt))}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusTone(request.status)}`}>
                    {t(`admin.status.${request.status}`)}
                  </span>
                  <ArrowLeft className="h-5 w-5 shrink-0 text-[#c9a55a] opacity-0 transition duration-500 group-hover:-translate-x-1 group-hover:opacity-100 ltr:rotate-180" />
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
    </>
  );
}
