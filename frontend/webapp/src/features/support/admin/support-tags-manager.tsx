"use client";


import { useTranslations } from "next-intl";
import { Plus, Save, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { deleteSupportTagAction, upsertSupportTagAction } from "../server/actions";
import type { SupportTag } from "../types";

type Props = { tags: SupportTag[] };

type Draft = { id?: string; name: string; color: string; isActive: boolean };

const emptyDraft: Draft = { name: "", color: "#083f30", isActive: true };

export function SupportTagsManager({ tags }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const [items, setItems] = useState(tags);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [isPending, startTransition] = useTransition();

  const edit = (tag: SupportTag) => setDraft({ id: tag.id, name: tag.name, color: tag.color, isActive: tag.isActive });
  const reset = () => setDraft(emptyDraft);

  const save = () => {
    startTransition(async () => {
      const result = await upsertSupportTagAction(draft);
      if (result.data) {
        setItems((current) => draft.id ? current.map((item) => item.id === result.data!.id ? result.data! : item) : [result.data!, ...current]);
        reset();
        toast.success(tAdmin("tagSaved"));
      }
      if (result.fieldErrors) toast.error(Object.values(result.fieldErrors)[0]?.[0] || "Please check tag.");
      if (result.error) toast.error(result.error.detail || result.error.title);
    });
  };

  const remove = (tag: SupportTag) => {
    startTransition(async () => {
      const result = await deleteSupportTagAction({ id: tag.id });
      if (result.data) {
        setItems((current) => current.filter((item) => item.id !== tag.id));
        if (draft.id === tag.id) reset();
        toast.success(tAdmin("tagDeleted"));
      }
      if (result.error) toast.error(result.error.detail || result.error.title);
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
      <Card className="rounded-3xl">
        <CardHeader><CardTitle>{draft.id ? "Edit tag" : "New tag"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder={tAdmin("tagName")} />
          <Input value={draft.color} onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))} placeholder="#083f30" />
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
        <CardHeader><CardTitle>{tAdmin("supportTags")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between gap-3 rounded-2xl border p-3">
              <button type="button" onClick={() => edit(tag)} className="flex min-w-0 items-center gap-3 text-left">
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: tag.color }} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{tag.name}</span>
                  <span className="block text-xs text-muted-foreground">{tag.isActive ? "Active" : "Inactive"}</span>
                </span>
              </button>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(tag)} className="rounded-xl text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
