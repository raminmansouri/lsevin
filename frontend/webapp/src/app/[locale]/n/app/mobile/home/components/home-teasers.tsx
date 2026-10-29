"use client";

import Image from "next/image";
import { ChevronLeft, Sparkles, Video } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

/** Opens the floating assistant, optionally with a first question. */
function openAssistant(prompt?: string) {
  window.dispatchEvent(new CustomEvent("lsevin:assistant-open", { detail: { prompt } }));
}

/** Mobile: the AI assistant card, with quick questions to start with. */
export function HomeAssistantTeaser() {
  const t = useTranslations("Assistant");
  const suggestions = [t("chat.suggestions.hair"), t("chat.suggestions.dental"), t("chat.suggestions.nose")];

  return (
    <section className="px-5 pb-3 lg:px-8">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f5a45] via-[#083f30] to-[#062a20] p-4 text-white shadow-[0_18px_40px_-24px_rgba(6,42,32,0.8)]">
        <button type="button" onClick={() => openAssistant()} className="flex w-full items-center gap-3 text-start">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-[#eacb7f]/40">
            <Image src="/brand/lsevin-mark-reversed.png" alt="" width={18} height={26} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 font-black">
              {t("chat.title")}
              <Sparkles size={14} className="text-[#eacb7f]" />
            </span>
            <span className="mt-0.5 block truncate text-xs text-white/65">{t("chat.welcome")}</span>
          </span>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eacb7f] text-[#062a20]">
            <ChevronLeft size={18} className="ltr:rotate-180" />
          </span>
        </button>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => openAssistant(suggestion)}
              className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/85 active:scale-95"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Mobile: the video consultation card, linking to the doctors list. */
export function HomeConsultationTeaser() {
  const t = useTranslations("Consultation.homeTeaser");

  return (
    <section className="px-5 pb-8 lg:px-8">
      <Link
        href="/n/app/mobile/consultation/doctors"
        className="flex items-center gap-3 rounded-3xl border border-[#eacb7f] bg-gradient-to-br from-[#fbf3de] via-[#f6e7c1] to-[#eed8a4] p-4 shadow-[0_18px_40px_-26px_rgba(140,107,44,0.6)] active:scale-[0.99]"
      >
        <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#083f30] text-[#eacb7f]">
          <Video size={20} />
          <span className="absolute -end-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#22a06b]" />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#0f5a45]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22a06b]" />
            {t("live")}
          </span>
          <span className="block font-black text-[#0e1a16]">{t("title")}</span>
          <span className="mt-0.5 block truncate text-xs text-[#6b6150]">{t("subtitle")}</span>
        </span>
        <span className="shrink-0 rounded-full bg-[#083f30] px-3.5 py-2 text-xs font-bold text-[#eacb7f]">{t("cta")}</span>
      </Link>
    </section>
  );
}