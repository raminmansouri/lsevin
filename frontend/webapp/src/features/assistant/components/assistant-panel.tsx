"use client";

import { useEffect, useRef } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import { AnimatePresence, motion, useDragControls, useMotionValue, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";

import { useAssistantChat } from "../hooks/use-assistant-chat";
import { AssistantAvatar } from "./assistant-avatar";
import { AssistantChat } from "./assistant-chat";

/**
 * The assistant's chat panel: loaded by AssistantLauncher the first time the
 * visitor opens the assistant, then kept mounted so a conversation survives
 * closing and reopening. Until then no page loads the chat SDK or asks the
 * server for chat history (2026-11-26: every page view fetched both).
 */
export default function AssistantPanel({
  open,
  isDesktop,
  expanded,
  pendingPrompt,
  onPromptSent,
  onClose,
  onToggleExpanded,
}: {
  open: boolean;
  isDesktop: boolean;
  expanded: boolean;
  pendingPrompt: string | null;
  onPromptSent: () => void;
  onClose: () => void;
  onToggleExpanded: () => void;
}) {
  const t = useTranslations("Assistant.launcher");
  const tChat = useTranslations("Assistant.chat");
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const { chat, startNewChat, conversations, refreshConversations, openConversation } = useAssistantChat(locale);
  const history = { conversations, onOpen: openConversation, onShow: refreshConversations };

  // A prompt sent by another page ("ask the assistant about this").
  useEffect(() => {
    if (!pendingPrompt) return;
    void chat.sendMessage({ text: pendingPrompt });
    onPromptSent();
  }, [pendingPrompt, chat, onPromptSent]);

  // A closed or collapsed panel reopens where it started.
  useEffect(() => {
    if (open && !expanded) return;
    x.set(0);
    y.set(0);
  }, [open, expanded, x, y]);

  // Desktop: click outside the panel or press Escape to close it.
  useEffect(() => {
    if (!open || !isDesktop) return;
    const onPointerDown = (event: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, isDesktop, onClose]);

  // Mobile: lock page scroll while the full-screen chat is open.
  useEffect(() => {
    if (!open || isDesktop) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, isDesktop]);

  const morph = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 340, damping: 34 };

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
          onClick={onToggleExpanded}
          aria-label={expanded ? t("collapse") : t("expand")}
          className="grid h-8 w-8 place-items-center rounded-full text-white/85 transition hover:bg-white/15"
        >
          {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      ) : null}
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onClose}
        aria-label={t("close")}
        className="grid h-8 w-8 place-items-center rounded-full text-white/85 transition hover:bg-white/15"
      >
        <X size={18} />
      </button>
    </div>
  );

  return (
    <>
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
              expanded ? "inset-6" : "bottom-6 right-6 h-[600px] max-h-[calc(100vh-3rem)] w-[400px]"
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
                <AssistantChat key={chat.id} chat={chat} onNewChat={startNewChat} history={history} />
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
              <AssistantChat key={chat.id} chat={chat} onNewChat={startNewChat} history={history} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
