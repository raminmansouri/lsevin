"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { isAssistantHome, useScrollTucked } from "../lib/launcher-visibility";

const SEEN_KEY = "lsevin:assistant-nudge-seen";
const FIRST_DELAY = 4000;

function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {}
}

export function AssistantNudge() {
  const t = useTranslations("Assistant.nudge");
  const pathname = usePathname();
  const tucked = useScrollTucked();
  const home = isAssistantHome(pathname);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!home || readSeen()) return;
    const timer = window.setTimeout(() => setVisible(true), FIRST_DELAY);
    return () => window.clearTimeout(timer);
  }, [home]);

  useEffect(() => {
    const onOpened = () => {
      markSeen();
      setVisible(false);
    };
    window.addEventListener("lsevin:assistant-opened", onOpened);
    window.addEventListener("lsevin:assistant-open", onOpened);
    return () => {
      window.removeEventListener("lsevin:assistant-opened", onOpened);
      window.removeEventListener("lsevin:assistant-open", onOpened);
    };
  }, []);

  const dismiss = () => {
    markSeen();
    setVisible(false);
  };

  const openAssistant = () => {
    window.dispatchEvent(new CustomEvent("lsevin:assistant-open"));
  };

  return (
    // CSS entrance instead of framer-motion: this bubble is in every page's shell.
    <>
      {visible && home && !tucked ? (
        <div className="fixed bottom-[6.6rem] right-[5.25rem] z-[60] duration-300 animate-in fade-in slide-in-from-bottom-2 zoom-in-95 motion-reduce:animate-none md:bottom-[2.1rem] md:right-[5.75rem]">
          <div className="relative flex w-[230px] items-center gap-2 rounded-2xl bg-white py-2.5 pe-2 ps-3.5 shadow-xl shadow-[#083f30]/15 ring-1 ring-[#083f30]/10 md:w-[260px]">
            <button type="button" onClick={openAssistant} className="min-w-0 flex-1 text-start">
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
            <span className="absolute -right-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-white" />
          </div>
        </div>
      ) : null}
    </>
  );
}