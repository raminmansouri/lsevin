import { ArrowLeft, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { listConsultationRequestsForUser } from "@/features/consultation/server/repository";
import { Link } from "@/i18n/navigation";

import { Reveal } from "../components/motion";

type Request = Awaited<ReturnType<typeof listConsultationRequestsForUser>>[number];

// Waiting on the team is gold, acted on is green, rejected is coral; anything new falls back to cream.
const STATUS_TONE: Record<string, string> = {
  new: "bg-[#fbf3de] text-[#8c6b2c]",
  in_progress: "bg-[#fbf3de] text-[#8c6b2c]",
  contacted: "bg-[#e7f4ee] text-[#0f5a45]",
  done: "bg-[#e7f4ee] text-[#0f5a45]",
  rejected: "bg-[#fdf1ef] text-[#b2453a]",
};
const statusTone = (status: string) => STATUS_TONE[status] ?? "bg-[#f6f1e6] text-[#6b6150]";

/** Desktop consultations list (>= 1280px). */
export async function DesktopConsultations({ requests, locale }: { requests: Request[]; locale: string }) {
  const t = await getTranslations({ locale, namespace: "Consultation" });
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="lsd lsd-shop-bg hidden pb-20 xl:block">
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg overflow-hidden rounded-[36px] px-12 py-12 text-white">
          <Reveal className="space-y-3">
            <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">CONSULTATIONS</span>
            <h1 className="lsd-gold-text text-[40px] font-black leading-tight">{t("admin.title")}</h1>
          </Reveal>
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
                    <span className="mt-1 block text-sm text-[#8a8170]">{date.format(new Date(request.createdAt))}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusTone(request.status)}`}>
                    {t(`admin.status.${request.status}` as never)}
                  </span>
                  <ArrowLeft className="h-5 w-5 shrink-0 text-[#c9a55a] opacity-0 transition duration-500 group-hover:-translate-x-1 group-hover:opacity-100 ltr:rotate-180" />
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}