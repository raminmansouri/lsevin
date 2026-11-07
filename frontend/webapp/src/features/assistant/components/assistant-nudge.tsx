"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const DISMISSED_KEY = "lsevin:assistant-nudge-dismissed";
const today = () => new Date().toISOString().slice(0, 10);

function rememberDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, today());
  } catch {
    // storage unavailable (private mode): the bubble just shows again next visit
  }
}

/**
 * "Online support · How can I help?" bubble beside the round assistant button, so the
 * button isn't a mystery. Appears a few seconds after the page opens; closing it or
 * opening the assistant hides it until tomorrow.
 */
export function AssistantNudge() {
  const t = useTranslations("Assistant.nudge");
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissedToday = false;
    try {
      dismissedToday = localStorage.getItem(DISMISSED_KEY) === today();
    } catch {
      // ignore
    }
    if (dismissedToday) return;

    const timer = window.setTimeout(() => setVisible(true), 4000);
    // Opened from the round button, the desktop teaser, or anywhere else: no need to nudge.
    const onOpened = () => {
      setVisible(false);
      rememberDismissed();
    };
    window.addEventListener("lsevin:assistant-opened", onOpened);
    window.addEventListener("lsevin:assistant-open", onOpened);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("lsevin:assistant-opened", onOpened);
      window.removeEventListener("lsevin:assistant-open", onOpened);
    };
  }, []);

  // Same rule as the launcher: the full chat page has no floating button.
  if (pathname.includes("/n/app/mobile/assistant")) return null;

  const dismiss = () => {
    setVisible(false);
    rememberDismissed();
  };
  const openAssistant = () => {
    dismiss();
    window.dispatchEvent(new CustomEvent("lsevin:assistant-open"));
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="assistant-nudge"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 28 }}
          className="fixed bottom-[6.6rem] right-[5.25rem] z-[60] md:bottom-[2.1rem] md:right-[5.75rem]"
        >
          <div className="relative flex max-w-[230px] items-center gap-2 rounded-2xl bg-white py-2.5 pe-2 ps-3.5 shadow-xl shadow-[#083f30]/15 ring-1 ring-[#083f30]/10 md:max-w-none">
            <button type="button" onClick={openAssistant} className="min-w-0 text-start">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#0a5a44]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                {t("title")}
              </span>
              <span className="mt-0.5 block text-[13px] font-semibold leading-5 text-[#0e1a16]">{t("body")}</span>
            </button>
            <button
              type="button"
              onClick={dismiss}
              aria-label={t("close")}
              className="grid h-6 w-6 shrink-0 place-items-center self-start rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X size={14} />
            </button>
            {/* Little tail pointing at the round button */}
            <span className="absolute -right-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-white" />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}