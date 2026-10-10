"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Maximize2, Minimize2, X } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { AssistantAvatar } from "./assistant-avatar";
import { AssistantChat } from "./assistant-chat";

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
  const tChat = useTranslations("Assistant.chat");
  const locale = useLocale();
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const reduceMotion = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // One chat for the whole visit: closing the panel keeps the conversation.
  const chat = useMemo(
    () =>
      new Chat<UIMessage>({
        transport: new DefaultChatTransport({ api: "/api/assistant", body: { locale } }),
      }),
    [locale]
  );

  const close = () => {
    setOpen(false);
    setExpanded(false);
    x.set(0);
    y.set(0);
  };

  const toggleExpanded = () => {
    x.set(0);
    y.set(0);
    setExpanded((value) => !value);
  };

  // Desktop: click outside the panel or press Escape to close it.
  useEffect(() => {
    if (!open || !isDesktop) return;
    const onPointerDown = (event: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isDesktop]);

  // Mobile: lock page scroll while the full-screen chat is open.
  useEffect(() => {
    if (!open || isDesktop) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, isDesktop]);

  // The chat page has its own full layout; no launcher there.
  if (pathname.includes("/n/app/mobile/assistant")) return null;

  const morph = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 340, damping: 34 };

  const header = (
    <div
      className={`flex shrink-0 items-center gap-2.5 border-b border-white/10 bg-gradient-to-br from-[#083f30] to-[#0a5a44] px-3 py-2.5 text-white ${
        isDesktop && !expanded ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      onPointerDown={(event) => {
        if (isDesktop && !expanded) dragControls.start(event);
      }}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15">
        <AssistantAvatar className="h-7 w-7" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-bold">{tChat("title")}</span>
      {isDesktop ? (
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={toggleExpanded}
          aria-label={expanded ? t("collapse") : t("expand")}
          className="grid h-8 w-8 place-items-center rounded-full text-white/85 transition hover:bg-white/15"
        >
          {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      ) : null}
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={close}
        aria-label={t("close")}
        className="grid h-8 w-8 place-items-center rounded-full text-white/85 transition hover:bg-white/15"
      >
        <X size={18} />
      </button>
    </div>
  );

  return (
    <>
      {/* The launcher circle. On desktop it shares a layoutId with the panel, so it morphs into it. */}
      {!open ? (
        <motion.button
          layoutId={isDesktop ? "lsevin-assistant-shell" : undefined}
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("open")}
          initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={morph}
          style={{ borderRadius: 28 }}
          className="fixed bottom-24 right-4 z-[60] grid h-14 w-14 place-items-center bg-gradient-to-br from-[#083f30] to-[#0a5a44] shadow-xl shadow-[#083f30]/30 ring-2 ring-[#eacb7f]/60 md:bottom-6 md:right-6"
        >
          <AssistantAvatar className="h-9 w-9" />
        </motion.button>
      ) : null}

      {/* Desktop: floating, draggable panel that grows out of the circle. */}
      {open && isDesktop ? (
        <>
          <div ref={constraintsRef} className="pointer-events-none fixed inset-4 z-[59]" />
          <motion.div
            ref={panelRef}
            layoutId="lsevin-assistant-shell"
            layout
            transition={morph}
            drag={!expanded}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragConstraints={constraintsRef}
            dragElastic={0}
            style={{ borderRadius: 24, x, y }}
            className={`fixed z-[60] flex flex-col overflow-hidden bg-white shadow-2xl shadow-black/20 ring-1 ring-black/5 ${
              expanded
                ? "inset-6"
                : "bottom-6 right-6 h-[600px] max-h-[calc(100vh-3rem)] w-[400px]"
            }`}
          >
            <motion.div
              className="flex min-h-0 flex-1 flex-col"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18, delay: reduceMotion ? 0 : 0.12 }}
            >
              {header}
              <div className="min-h-0 flex-1">
                <AssistantChat chat={chat} />
              </div>
            </motion.div>
          </motion.div>
        </>
      ) : null}

      {/* Mobile: full-screen page that slides in from the right. */}
      <AnimatePresence>
        {open && !isDesktop ? (
          <motion.div
            key="lsevin-assistant-mobile"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={reduceMotion ? { duration: 0 } : { type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.36 }}
            className="fixed inset-0 z-[70] flex flex-col bg-white"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {header}
            <div className="min-h-0 flex-1">
              <AssistantChat chat={chat} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}