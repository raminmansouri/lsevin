"use client";

import { SendHorizonal } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  placeholder: string;
  sendLabel: string;
  disabled?: boolean;
  minRows?: number;
  onSend: (body: string) => Promise<void> | void;
};

export function SupportMessageComposer({ placeholder, sendLabel, disabled, minRows = 2, onSend }: Props) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    const trimmed = body.trim();
    if (!trimmed || disabled || isPending) return;
    startTransition(async () => {
      await onSend(trimmed);
      setBody("");
    });
  };

  return (
    <div className="rounded-3xl border bg-white p-2 shadow-sm">
      <Textarea
        value={body}
        disabled={disabled || isPending}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") handleSend();
        }}
        rows={minRows}
        placeholder={placeholder}
        className="min-h-[72px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
      />
      <div className="flex justify-end">
        <Button type="button" disabled={!body.trim() || disabled || isPending} onClick={handleSend} className="rounded-2xl">
          <SendHorizonal className="mr-2 h-4 w-4" />
          {sendLabel}
        </Button>
      </div>
    </div>
  );
}
