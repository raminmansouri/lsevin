"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { $isLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $isListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode, REMOVE_LIST_COMMAND } from "@lexical/list";
import { LexicalComposer, type InitialConfigType } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $createQuoteNode, $isQuoteNode, HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $findMatchingParent } from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  KEY_MODIFIER_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  type BaseSelection,
  type TextFormatType,
} from "lexical";
import { Bold, Italic, Link2, Link2Off, List, ListOrdered, Quote, Redo2, Strikethrough, Underline, Undo2 } from "lucide-react";

import { editorTheme } from "@/components/editor/themes/editor-theme";
import { safeHref } from "@/lib/safe-href";
import { cn } from "@/lib/utils";

import { emptyLexical, sanitizeLexical, type LexicalState } from "../../blocks/lexical";

export interface RichTextLabels {
  bold: string;
  italic: string;
  underline: string;
  strikethrough: string;
  bulletList: string;
  numberedList: string;
  quote: string;
  link: string;
  removeLink: string;
  undo: string;
  redo: string;
  linkUrl: string;
  linkApply: string;
  linkCancel: string;
  linkInvalid: string;
  placeholder: string;
  editorLabel: string;
}

const NODES: InitialConfigType["nodes"] = [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode];

type Formats = { bold: boolean; italic: boolean; underline: boolean; strikethrough: boolean; list: "bullet" | "number" | null; quote: boolean; link: boolean };
const NO_FORMATS: Formats = { bold: false, italic: false, underline: false, strikethrough: false, list: null, quote: false, link: false };

function ToolbarButton({ label, active, disabled, onClick, children, testId }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode; testId?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active === undefined ? undefined : active}
      disabled={disabled}
      data-testid={testId}
      // Keep the editor selection: a button must not steal focus from the contenteditable.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40",
        active && "bg-primary/10 text-primary",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ labels }: { labels: RichTextLabels }) {
  const [editor] = useLexicalComposerContext();
  const [formats, setFormats] = useState<Formats>(NO_FORMATS);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("https://");
  const [linkError, setLinkError] = useState(false);
  const savedSelection = useRef<BaseSelection | null>(null);
  const linkInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unregisterUpdate = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        const node = selection.anchor.getNode();
        const top = node.getTopLevelElement();
        const list = $findMatchingParent(node, $isListNode);
        setFormats({
          bold: selection.hasFormat("bold"),
          italic: selection.hasFormat("italic"),
          underline: selection.hasFormat("underline"),
          strikethrough: selection.hasFormat("strikethrough"),
          list: list ? (list.getListType() === "number" ? "number" : "bullet") : null,
          quote: Boolean(top && $isQuoteNode(top)),
          link: Boolean($findMatchingParent(node, $isLinkNode)),
        });
      });
    });
    const unregisterUndo = editor.registerCommand(CAN_UNDO_COMMAND, (value) => (setCanUndo(value), false), COMMAND_PRIORITY_LOW);
    const unregisterRedo = editor.registerCommand(CAN_REDO_COMMAND, (value) => (setCanRedo(value), false), COMMAND_PRIORITY_LOW);
    return () => {
      unregisterUpdate();
      unregisterUndo();
      unregisterRedo();
    };
  }, [editor]);

  const format = (type: TextFormatType) => editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);

  const toggleList = (kind: "bullet" | "number") => {
    if (formats.list === kind) editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    else editor.dispatchCommand(kind === "bullet" ? INSERT_UNORDERED_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  const toggleQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) $setBlocksType(selection, () => (formats.quote ? $createParagraphNode() : $createQuoteNode()));
    });
  };

  const openLink = useCallback(() => {
    // Remember the selection: focus moves to the URL field and the editor would otherwise forget it.
    savedSelection.current = editor.getEditorState().read(() => $getSelection()?.clone() ?? null);
    setLinkError(false);
    setLinkValue("https://");
    setLinkOpen(true);
    queueMicrotask(() => linkInput.current?.focus());
  }, [editor]);

  const removeLink = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  };

  const applyLink = () => {
    const target = safeHref(linkValue);
    if (!target) {
      setLinkError(true);
      return;
    }
    const selection = savedSelection.current;
    editor.update(
      () => {
        if (selection) $setSelection(selection.clone());
      },
      { discrete: true },
    );
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, target.external ? { url: target.href, rel: "noopener noreferrer", target: "_blank" } : { url: target.href });
    setLinkOpen(false);
    editor.focus();
  };

  useEffect(
    () =>
      editor.registerCommand(
        KEY_MODIFIER_COMMAND,
        (event: KeyboardEvent) => {
          if ((event.ctrlKey || event.metaKey) && event.code === "KeyK") {
            event.preventDefault();
            openLink();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    [editor, openLink],
  );

  return (
    <div className="border-b" role="toolbar" aria-label={labels.editorLabel}>
      <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1">
        <ToolbarButton label={labels.undo} disabled={!canUndo} onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} testId="rt-undo">
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={labels.redo} disabled={!canRedo} onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} testId="rt-redo">
          <Redo2 className="size-4" />
        </ToolbarButton>
        <span aria-hidden className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton label={labels.bold} active={formats.bold} onClick={() => format("bold")} testId="rt-bold">
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={labels.italic} active={formats.italic} onClick={() => format("italic")} testId="rt-italic">
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={labels.underline} active={formats.underline} onClick={() => format("underline")} testId="rt-underline">
          <Underline className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={labels.strikethrough} active={formats.strikethrough} onClick={() => format("strikethrough")} testId="rt-strike">
          <Strikethrough className="size-4" />
        </ToolbarButton>
        <span aria-hidden className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton label={labels.bulletList} active={formats.list === "bullet"} onClick={() => toggleList("bullet")} testId="rt-bullets">
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={labels.numberedList} active={formats.list === "number"} onClick={() => toggleList("number")} testId="rt-numbered">
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={labels.quote} active={formats.quote} onClick={toggleQuote} testId="rt-quote">
          <Quote className="size-4" />
        </ToolbarButton>
        <span aria-hidden className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton label={labels.link} active={formats.link} onClick={openLink} testId="rt-link">
          <Link2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={labels.removeLink} disabled={!formats.link} onClick={removeLink} testId="rt-unlink">
          <Link2Off className="size-4" />
        </ToolbarButton>
      </div>
      {linkOpen ? (
        <form
          className="flex flex-wrap items-center gap-2 border-t bg-muted/40 px-2 py-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            applyLink();
          }}
          data-testid="rt-link-form"
        >
          <input
            ref={linkInput}
            type="text"
            dir="ltr"
            inputMode="url"
            value={linkValue}
            aria-label={labels.linkUrl}
            aria-invalid={linkError}
            onChange={(event) => {
              setLinkValue(event.target.value);
              setLinkError(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                setLinkOpen(false);
                editor.focus();
              }
            }}
            className="h-8 min-w-48 flex-1 rounded-md border bg-background px-2 text-sm"
            data-testid="rt-link-input"
          />
          <button type="submit" className="h-8 rounded-md bg-primary px-3 text-sm text-primary-foreground" data-testid="rt-link-apply">
            {labels.linkApply}
          </button>
          <button type="button" onClick={() => (setLinkOpen(false), editor.focus())} className="h-8 rounded-md px-3 text-sm hover:bg-muted">
            {labels.linkCancel}
          </button>
          {linkError ? (
            <span role="alert" className="w-full text-xs text-destructive">
              {labels.linkInvalid}
            </span>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  direction,
  labels,
  className,
  testId,
}: {
  value: LexicalState;
  onChange: (state: LexicalState) => void;
  direction: "ltr" | "rtl";
  labels: RichTextLabels;
  className?: string;
  testId?: string;
}) {
  // The initial state is read once; later edits flow out through onChange. Remount with a new `key`
  // to load different content (switching language, restoring a revision).
  const initial = useMemo(() => JSON.stringify(sanitizeLexical(value ?? emptyLexical())), []); // eslint-disable-line react-hooks/exhaustive-deps
  const config = useMemo<InitialConfigType>(
    () => ({
      namespace: "BlogRichText",
      theme: editorTheme,
      nodes: NODES,
      editorState: initial,
      onError: (error: Error) => console.error("Blog rich text error", error),
    }),
    [initial],
  );

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-background", className)} dir={direction} data-testid={testId}>
      <LexicalComposer initialConfig={config}>
        <Toolbar labels={labels} />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                aria-label={labels.editorLabel}
                dir={direction}
                className="min-h-24 px-3 py-2 text-sm leading-7 focus:outline-none [&_a]:text-blue-700 [&_a]:underline [&_ol]:ms-6 [&_ol]:list-decimal [&_ul]:ms-6 [&_ul]:list-disc [&_blockquote]:border-s-4 [&_blockquote]:ps-3 [&_blockquote]:italic"
                data-testid={testId ? `${testId}-editable` : undefined}
              />
            }
            placeholder={<div className="pointer-events-none absolute start-3 top-2 select-none text-sm text-muted-foreground">{labels.placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin validateUrl={(url) => Boolean(safeHref(url))} />
          <OnChangePlugin
            ignoreSelectionChange
            onChange={(editorState) => {
              try {
                onChange(sanitizeLexical(editorState.toJSON()));
              } catch (error) {
                // Oversized text: keep the previous value; the server rejects it too.
                console.error("Blog rich text too large", error);
              }
            }}
          />
        </div>
      </LexicalComposer>
    </div>
  );
}
