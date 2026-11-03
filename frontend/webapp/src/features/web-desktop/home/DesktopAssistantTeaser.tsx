"use client";

import Image from "next/image";
import { MessageCircle, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Magnetic, Reveal } from "../components/motion";

/** Opens the floating assistant, optionally with a first question. */
function openAssistant(prompt?: string) {
  window.dispatchEvent(new CustomEvent("lsevin:assistant-open", { detail: { prompt } }));
}

/** A thin strip introducing the AI assistant, below the top sponsored slider. */
export function DesktopAssistantTeaser() {
  const t = useTranslations("Assistant");
  const suggestions = [t("chat.suggestions.hair"), t("chat.suggestions.dental"), t("chat.suggestions.nose")];

  return (
    <section className="lsd-container py-8">
      <Reveal>
        <div className="lsd-teaser flex h-[88px] items-center gap-6 pe-3 ps-4 text-white shadow-[0_24px_60px_-30px_rgba(6,42,32,0.7)]">
          <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-[#eacb7f]/40">
            <span className="lsd-pulse absolute inset-0 rounded-full" />
            <Image src="/brand/lsevin-mark-reversed.png" alt="" width={22} height={31} />
          </span>

          <div className="min-w-0 shrink-0">
            <p className="flex items-center gap-2 text-lg font-black">
              {t("chat.title")}
              <Sparkles size={16} className="text-[#eacb7f]" />
            </p>
            <p className="max-w-[300px] truncate text-sm text-white/65">{t("chat.welcome")}</p>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => openAssistant(suggestion)}
                className="truncate rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 transition hover:-translate-y-0.5 hover:border-[#eacb7f]/60 hover:text-[#eacb7f]"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <Magnetic>
            <button type="button" onClick={() => openAssistant()} className="lsd-btn lsd-btn-gold h-14 shrink-0 px-6 text-sm">
              <MessageCircle size={17} />
              {t("launcher.open")}
            </button>
          </Magnetic>
        </div>
      </Reveal>
    </section>
  );
}