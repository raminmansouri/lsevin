import { ChevronLeft, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/** Home page entry point to the assistant chat. */
export async function AssistantEntryCard({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Assistant.entry" });

  return (
    <div className="px-4">
      <Link
        href="/n/app/mobile/assistant"
        className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-4 text-white shadow-md transition active:scale-[0.99]"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15">
          <Sparkles size={20} className="text-[#eacb7f]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">{t("title")}</span>
          <span className="mt-0.5 block text-xs text-white/80">{t("subtitle")}</span>
        </span>
        <ChevronLeft size={20} className="shrink-0 text-[#eacb7f] ltr:rotate-180" />
      </Link>
    </div>
  );
}