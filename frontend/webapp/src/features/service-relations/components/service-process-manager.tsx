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

import { deleteServiceProcessAction } from "../actions/delete-service-process";
import { upsertServiceProcessAction } from "../actions/upsert-service-process";
import { serviceProcessSchema } from "../schemas";
import { ServiceProcessItem } from "../types";

export default function ServiceProcessManager({ providerServiceId, items }: { providerServiceId: string; items: ServiceProcessItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rows, setRows] = useState(items);
  const form = useForm({ resolver: zodResolver(serviceProcessSchema), defaultValues: { providerServiceId, processId: undefined, step: 1, title: "", description: "", duration: "" } });
  const resetForm = () => { setEditingId(null); form.reset({ providerServiceId, processId: undefined, step: 1, title: "", description: "", duration: "" }); };
  const upsertAction = useAction(upsertServiceProcessAction, { startTransition, onSuccess: (data, values) => { const id = values.processId ?? (data as any)?.id; const next = { id, step: values.step, title: values.title, description: values.description ?? null, duration: values.duration ?? null }; if (values.processId) setRows(prev => prev.map(x => x.id === values.processId ? next : x).sort((a,b)=>a.step-b.step)); else if (id) setRows(prev => [...prev, next].sort((a,b)=>a.step-b.step)); toast.success(values.processId ? "Updated" : "Created"); resetForm(); }, onError: (e) => toast.error(e.detail || "Failed") });
  const deleteAction = useAction(deleteServiceProcessAction, { startTransition, onSuccess: (_d, values) => { setRows(prev => prev.filter(x => x.id !== values.processId)); toast.success("Removed"); if (editingId === values.processId) resetForm(); }, onError: (e) => toast.error(e.detail || "Failed") });
  const startEdit = (item: ServiceProcessItem) => { setEditingId(item.id); form.reset({ providerServiceId, processId: item.id, step: item.step, title: item.title ?? "", description: item.description ?? "", duration: item.duration ?? "" }); };
  return <Card><CardHeader><CardTitle>Service Process</CardTitle></CardHeader><CardContent className="space-y-6"><Form {...form}><form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(async (v)=>upsertAction.execute(v))}><FormField control={form.control} name="step" render={({field}) => <FormItem><FormLabel>Step</FormLabel><FormControl><Input type="number" min={1} {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="duration" render={({field}) => <FormItem><FormLabel>Duration</FormLabel><FormControl><Input {...field} value={field.value ?? ""} disabled={isPending} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="title" render={({field}) => <FormItem className="md:col-span-2"><FormLabel>Title</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="description" render={({field}) => <FormItem className="md:col-span-2"><FormLabel>Description</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} rows={4} disabled={isPending} /></FormControl><FormMessage /></FormItem>} /><div className="md:col-span-2 flex gap-2"><Button type="submit" disabled={isPending}><Plus className="mr-2 h-4 w-4" />{editingId ? "Update" : "Add"}</Button>{editingId && <Button type="button" variant="outline" onClick={resetForm}><X className="mr-2 h-4 w-4" />Cancel</Button>}</div></form></Form><div className="space-y-3">{rows.map(item => <div key={item.id} className="rounded-lg border p-4"><div className="flex items-start justify-between gap-4"><div className="space-y-1"><div className="font-medium">Step {item.step}: {item.title}</div>{item.duration && <div className="text-muted-foreground text-sm">Duration: {item.duration}</div>}{item.description && <div className="text-muted-foreground text-sm whitespace-pre-wrap">{item.description}</div>}</div><div className="flex gap-1"><Button type="button" variant="ghost" size="icon" onClick={() => startEdit(item)}><Pencil className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" onClick={() => deleteAction.execute({ providerServiceId, processId: item.id })}><Trash2 className="h-4 w-4" /></Button></div></div></div>)}{!rows.length && <div className="text-muted-foreground text-sm">No process steps yet.</div>}</div></CardContent></Card>;
}
