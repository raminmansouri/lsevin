"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RHFSingleMediaPickerField } from "@/features/media-picker-addon";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import { createEmptyLocalizedContent } from "@/features/shared/utils/localization";
import { LazyAdminLookupSelect } from "@/features/service-providers/components/admin/lazy-admin-lookup-select";
import useAction from "@/hooks/use-action";

import { deleteServiceIncludedAction } from "../actions/delete-service-included";
import { upsertServiceIncludedAction } from "../actions/upsert-service-included";
import { serviceIncludedSchema } from "../schemas";
import { ServiceIncludedItem } from "../types";

export default function Component({ providerServiceId, items }: { providerServiceId: string; items: ServiceIncludedItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rows, setRows] = useState(items);
  const form = useForm({ resolver: zodResolver(serviceIncludedSchema), defaultValues: { providerServiceId, includedId: undefined, item: "" } });
  const resetForm = () => { setEditingId(null); form.reset({ providerServiceId, includedId: undefined, item: "" }); };
  const upsertAction = useAction(upsertServiceIncludedAction, { startTransition, onSuccess: (data, values) => { const id = values.includedId ?? (data as any)?.id; toast.success(values.includedId ? "Updated" : "Created"); const next = { id, item: values.item } as any; if (values.includedId) setRows(prev => prev.map(item => item.id === values.includedId ? next : item)); else if (id) setRows(prev => [...prev, next]); resetForm(); }, onError: (e) => toast.error(e.detail || "Failed") });
  const deleteAction = useAction(deleteServiceIncludedAction, { startTransition, onSuccess: (_d, values) => { toast.success("Removed"); setRows(prev => prev.filter(item => item.id !== values.includedId)); if (editingId === values.includedId) resetForm(); }, onError: (e) => toast.error(e.detail || "Failed") });
  const startEdit = (item: any) => { setEditingId(item.id); form.reset({ providerServiceId, includedId: item.id, item: item.item ?? "" }); };
  return <Card><CardHeader><CardTitle>Included Items</CardTitle></CardHeader><CardContent className="space-y-6"><Form {...form}><form className="space-y-4" onSubmit={form.handleSubmit(async (v) => upsertAction.execute(v))}><FormField control={form.control} name="item" render={({ field }) => <FormItem><FormLabel>Item</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} /><div className="flex gap-2"><Button type="submit" disabled={isPending}><Plus className="mr-2 h-4 w-4" />{editingId ? "Update" : "Add"}</Button>{editingId && <Button type="button" variant="outline" onClick={resetForm}><X className="mr-2 h-4 w-4" />Cancel</Button>}</div></form></Form><div className="space-y-3">{rows.map((item: any) => <div key={item.id} className="rounded-lg border p-4"><div className="flex items-start justify-between gap-4"><div className="space-y-1 min-w-0"><div className="font-medium">{item.item}</div></div><div className="flex gap-1"><Button type="button" variant="ghost" size="icon" onClick={() => startEdit(item)}><Pencil className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" onClick={() => deleteAction.execute({ providerServiceId, includedId: item.id })}><Trash2 className="h-4 w-4" /></Button></div></div></div>)}{!rows.length && <div className="text-muted-foreground text-sm">No item yet.</div>}</div></CardContent></Card>;
}
