"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const SEEN_KEY = "lsevin:assistant-nudge-seen";
const FIRST_DELAY = 4000;
const ROTATE_EVERY = 12000;
const RETURN_AFTER_CLOSE = 1500;
const RETURN_AFTER_DISMISS = 30000;

function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
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
  const reduceMotion = useReducedMotion();
  const rawTips = t.raw("tips");
  const tips = Array.isArray(rawTips) ? (rawTips as string[]) : [];
  const tipCount = tips.length;

  const [visible, setVisible] = useState(false);
  const [welcome, setWelcome] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const returnTimer = useRef<number | undefined>(undefined);

  const nextTip = useCallback(() => {
    setTipIndex((current) => {
      if (tipCount < 2) return 0;
      let next = current;
      while (next === current) next = Math.floor(Math.random() * tipCount);
      return next;
    });
  }, [tipCount]);

  const showLater = useCallback((delay: number) => {
    window.clearTimeout(returnTimer.current);
    returnTimer.current = window.setTimeout(() => setVisible(true), delay);
  }, []);

  useEffect(() => {
    const seen = readSeen();
    setWelcome(!seen);
    if (seen && tipCount) setTipIndex(Math.floor(Math.random() * tipCount));
    showLater(FIRST_DELAY);
    return () => window.clearTimeout(returnTimer.current);
  }, [tipCount, showLater]);

  useEffect(() => {
    const onOpened = () => {
      markSeen();
      setWelcome(false);
      setChatOpen(true);
      setVisible(false);
      window.clearTimeout(returnTimer.current);
    };
    const onClosed = () => {
      setChatOpen(false);
      nextTip();
      showLater(RETURN_AFTER_CLOSE);
    };
    window.addEventListener("lsevin:assistant-opened", onOpened);
    window.addEventListener("lsevin:assistant-open", onOpened);
    window.addEventListener("lsevin:assistant-closed", onClosed);
    return () => {
      window.removeEventListener("lsevin:assistant-opened", onOpened);
      window.removeEventListener("lsevin:assistant-open", onOpened);
      window.removeEventListener("lsevin:assistant-closed", onClosed);
    };
  }, [nextTip, showLater]);

  useEffect(() => {
    if (welcome || !visible || chatOpen || tipCount < 2) return;
    const timer = window.setInterval(nextTip, ROTATE_EVERY);
    return () => window.clearInterval(timer);
  }, [welcome, visible, chatOpen, tipCount, nextTip]);

  if (pathname.includes("/n/app/mobile/assistant")) return null;

  const body = welcome || !tipCount ? t("body") : tips[tipIndex] ?? t("body");

  const dismiss = () => {
    setVisible(false);
    if (welcome) {
      markSeen();
      setWelcome(false);
    }
    nextTip();
    showLater(RETURN_AFTER_DISMISS);
  };

  const openAssistant = () => {
    window.dispatchEvent(new CustomEvent("lsevin:assistant-open"));
  };

  return (
    <AnimatePresence>
      {visible && !chatOpen ? (
        <motion.div
          key="assistant-nudge"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 28 }}
          className="fixed bottom-[6.6rem] right-[5.25rem] z-[60] md:bottom-[2.1rem] md:right-[5.75rem]"
        >
          <div className="relative flex w-[230px] items-center gap-2 rounded-2xl bg-white py-2.5 pe-2 ps-3.5 shadow-xl shadow-[#083f30]/15 ring-1 ring-[#083f30]/10 md:w-[260px]">
            <button type="button" onClick={openAssistant} className="min-w-0 flex-1 text-start">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#0a5a44]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                {t("title")}
              </span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={body}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={{ duration: reduceMotion ? 0 : 0.25 }}
                  className="mt-0.5 block text-[13px] font-semibold leading-5 text-[#0e1a16]"
                >
                  {body}
                </motion.span>
              </AnimatePresence>
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
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}