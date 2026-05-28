"use client";


import { useTranslations } from "next-intl";
import { Plus, Save, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { deleteCannedReplyAction, upsertCannedReplyAction } from "../server/actions";
import type { SupportCannedReply } from "../types";

type Props = { replies: SupportCannedReply[] };

type Draft = { id?: string; title: string; shortcut: string; bodyEn: string; bodyFa: string; isActive: boolean; displayOrder: number };

const emptyDraft: Draft = { title: "", shortcut: "", bodyEn: "", bodyFa: "", isActive: true, displayOrder: 0 };

export function SupportCannedRepliesManager({ replies }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const [items, setItems] = useState(replies);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [isPending, startTransition] = useTransition();

  const edit = (reply: SupportCannedReply) => setDraft({
    id: reply.id,
    title: reply.title,
    shortcut: reply.shortcut || "",
    bodyEn: reply.bodyTranslations["en-US"] || "",
    bodyFa: reply.bodyTranslations["fa-IR"] || "",
    isActive: reply.isActive,
    displayOrder: reply.displayOrder,
  });
  const reset = () => setDraft(emptyDraft);

  const save = () => {
    startTransition(async () => {
      const result = await upsertCannedReplyAction({
        id: draft.id,
        title: draft.title,
        shortcut: draft.shortcut,
        bodyTranslations: { "en-US": draft.bodyEn, "fa-IR": draft.bodyFa },
        isActive: draft.isActive,
        displayOrder: draft.displayOrder,
      });
      if (result.data) {
        setItems((current) => draft.id ? current.map((item) => item.id === result.data!.id ? result.data! : item) : [result.data!, ...current]);
        reset();
        toast.success(tAdmin("cannedReplySaved"));
      }
      if (result.fieldErrors) toast.error(Object.values(result.fieldErrors)[0]?.[0] || "Please check canned reply.");
      if (result.error) toast.error(result.error.detail || result.error.title);
    });
  };

  const remove = (reply: SupportCannedReply) => {
    startTransition(async () => {
      const result = await deleteCannedReplyAction({ id: reply.id });
      if (result.data) {
        setItems((current) => current.filter((item) => item.id !== reply.id));
        if (draft.id === reply.id) reset();
        toast.success(tAdmin("cannedReplyDeleted"));
      }
      if (result.error) toast.error(result.error.detail || result.error.title);
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[430px_minmax(0,1fr)]">
      <Card className="rounded-3xl">
        <CardHeader><CardTitle>{draft.id ? "Edit canned reply" : "New canned reply"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder={tAdmin("title")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={draft.shortcut} onChange={(event) => setDraft((current) => ({ ...current, shortcut: event.target.value }))} placeholder="/shortcut" />
            <Input type="number" value={draft.displayOrder} onChange={(event) => setDraft((current) => ({ ...current, displayOrder: Number(event.target.value || 0) }))} placeholder={tAdmin("displayOrder")} />
          </div>
          <Textarea value={draft.bodyEn} onChange={(event) => setDraft((current) => ({ ...current, bodyEn: event.target.value }))} placeholder={tAdmin("englishReply")} className="min-h-[120px]" />
          <Textarea dir="rtl" value={draft.bodyFa} onChange={(event) => setDraft((current) => ({ ...current, bodyFa: event.target.value }))} placeholder="متن فارسی" className="min-h-[120px]" />
          <div className="flex items-center justify-between rounded-2xl border bg-slate-50 p-4">
            <span className="text-sm font-medium">{tAdmin("active")}</span>
            <Switch checked={draft.isActive} onCheckedChange={(checked) => setDraft((current) => ({ ...current, isActive: checked }))} />
          </div>
          <div className="flex gap-2">
            <Button disabled={isPending} onClick={save} className="flex-1 rounded-2xl"><Save className="mr-2 h-4 w-4" />{tAdmin("save")}</Button>
            <Button type="button" variant="outline" onClick={reset} className="rounded-2xl"><Plus className="mr-2 h-4 w-4" />{tAdmin("new")}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader><CardTitle>{tAdmin("cannedReplies")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.map((reply) => (
            <div key={reply.id} className="flex items-start justify-between gap-3 rounded-2xl border p-4">
              <button type="button" onClick={() => edit(reply)} className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{reply.title}</p>
                  {reply.shortcut && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{reply.shortcut}</span>}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{reply.bodyTranslations["en-US"] || Object.values(reply.bodyTranslations)[0] || "No body"}</p>
              </button>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(reply)} className="rounded-xl text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
