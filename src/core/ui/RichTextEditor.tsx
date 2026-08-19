"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, List, ListOrdered, Redo2, Underline, Undo2 } from "lucide-react";
import { htmlToRichText, richTextToHtml, type RichTextDirection } from "@core/rich-text/codec";
import { cn } from "@core/lib/cn";
import { translatePortalText } from "@core/i18n/translate";

export function RichTextEditor({ value, onChange, direction = "rtl", className, locale }: { value?: string; onChange: (value: string) => void; direction?: RichTextDirection; className?: string; locale?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValue = useRef(value || "");

  useEffect(() => {
    if (!editorRef.current || document.activeElement === editorRef.current || lastValue.current === (value || "")) return;
    editorRef.current.innerHTML = richTextToHtml(value);
    lastValue.current = value || "";
  }, [value]);

  const sync = () => {
    if (!editorRef.current) return;
    const next = htmlToRichText(editorRef.current, direction);
    lastValue.current = next;
    onChange(next);
  };

  const command = (name: string) => {
    editorRef.current?.focus();
    document.execCommand(name);
    sync();
  };

  return (
    <div className={cn("overflow-hidden rounded-md border border-border bg-white", className)} dir={direction}>
      <div className="flex flex-wrap gap-1 border-b border-border bg-muted/50 p-2" dir="ltr">
        <Tool label={translatePortalText(locale, "Bold")} onClick={() => command("bold")}><Bold size={15} /></Tool>
        <Tool label={translatePortalText(locale, "Italic")} onClick={() => command("italic")}><Italic size={15} /></Tool>
        <Tool label={translatePortalText(locale, "Underline")} onClick={() => command("underline")}><Underline size={15} /></Tool>
        <Tool label={translatePortalText(locale, "Bulleted list")} onClick={() => command("insertUnorderedList")}><List size={15} /></Tool>
        <Tool label={translatePortalText(locale, "Numbered list")} onClick={() => command("insertOrderedList")}><ListOrdered size={15} /></Tool>
        <Tool label={translatePortalText(locale, "Undo")} onClick={() => command("undo")}><Undo2 size={15} /></Tool>
        <Tool label={translatePortalText(locale, "Redo")} onClick={() => command("redo")}><Redo2 size={15} /></Tool>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="prose prose-sm min-h-36 max-w-none px-3 py-3 text-sm outline-none"
        dangerouslySetInnerHTML={{ __html: richTextToHtml(value) }}
        onInput={sync}
        onBlur={sync}
      />
    </div>
  );
}

function Tool({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={onClick} className="rounded border border-border bg-white p-1.5 text-slate-700 hover:bg-slate-100">{children}</button>;
}
