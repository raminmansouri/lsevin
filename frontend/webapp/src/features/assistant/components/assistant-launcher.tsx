"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { AssistantAvatar } from "./assistant-avatar";
import { isAssistantHidden, isAssistantHome, isAssistantRaised, useScrollTucked } from "../lib/launcher-visibility";

// The chat (AI SDK, history, conversations) loads on first open, not with every page.
const loadPanel = () => import("./assistant-panel");
const AssistantPanel = dynamic(loadPanel, { ssr: false });

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

export function AssistantLauncher() {
  const t = useTranslations("Assistant.launcher");
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const reduceMotion = useReducedMotion();
  const tucked = useScrollTucked();

  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const show = useCallback(() => {
    setEverOpened(true);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt?.trim();
      show();
      if (prompt) setPendingPrompt(prompt);
    };
    window.addEventListener("lsevin:assistant-open", onOpen);
    return () => window.removeEventListener("lsevin:assistant-open", onOpen);
  }, [show]);

  const close = useCallback(() => {
    setOpen(false);
    window.dispatchEvent(new Event("lsevin:assistant-closed"));
    setExpanded(false);
  }, []);
  const toggleExpanded = useCallback(() => setExpanded((value) => !value), []);
  const promptSent = useCallback(() => setPendingPrompt(null), []);

  if (pathname.includes("/n/app/mobile/assistant") || (!open && isAssistantHidden(pathname))) return null;

  const sideTucked = !isDesktop && (!isAssistantHome(pathname) || tucked);

  const morph = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 340, damping: 34 };

  return (
    <>
      {/* The launcher circle. On desktop it shares a layoutId with the panel, so it morphs into it. */}
      {!open ? (
        <motion.button
          layoutId={isDesktop ? "lsevin-assistant-shell" : undefined}
          type="button"
          // Start fetching the chat as soon as the visitor reaches for the button.
          onPointerEnter={() => void loadPanel()}
          onTouchStart={() => void loadPanel()}
          onFocus={() => void loadPanel()}
          onClick={() => {
            show();
            window.dispatchEvent(new Event("lsevin:assistant-opened"));
          }}
          aria-label={t("open")}
          initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
          animate={{ scale: sideTucked ? 0.85 : 1, opacity: sideTucked ? 0.75 : 1, x: sideTucked ? 44 : 0 }}
          transition={morph}
          style={{ borderRadius: 28 }}
          className={`fixed right-4 z-[60] grid h-14 w-14 place-items-center bg-gradient-to-br from-[#083f30] to-[#0a5a44] shadow-xl shadow-[#083f30]/30 ring-2 ring-[#eacb7f]/60 md:bottom-6 md:right-6 ${
            isAssistantRaised(pathname) ? "bottom-[11.5rem]" : "bottom-24"
          }`}
        >
          <AssistantAvatar className="h-9 w-9" />
        </motion.button>
      ) : null}

      {everOpened ? (
        <AssistantPanel
          open={open}
          isDesktop={isDesktop}
          expanded={expanded}
          pendingPrompt={pendingPrompt}
          onPromptSent={promptSent}
          onClose={close}
          onToggleExpanded={toggleExpanded}
        />
      ) : null}
    </>
  );
}
