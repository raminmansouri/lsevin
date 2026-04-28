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

import { deleteServiceFaqAction } from "../actions/delete-service-faq";
import { upsertServiceFaqAction } from "../actions/upsert-service-faq";
import { serviceFaqSchema } from "../schemas";
import { ServiceFaqItem } from "../types";

export default function Component({ providerServiceId, items }: { providerServiceId: string; items: ServiceFaqItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rows, setRows] = useState(items);
  const form = useForm({ resolver: zodResolver(serviceFaqSchema), defaultValues: { providerServiceId, faqId: undefined, question: "", answer: "" } });
  const resetForm = () => { setEditingId(null); form.reset({ providerServiceId, faqId: undefined, question: "", answer: "" }); };
  const upsertAction = useAction(upsertServiceFaqAction, { startTransition, onSuccess: (data, values) => { const id = values.faqId ?? (data as any)?.id; toast.success(values.faqId ? "Updated" : "Created"); const next = { id, question: values.question, answer: values.answer } as any; if (values.faqId) setRows(prev => prev.map(item => item.id === values.faqId ? next : item)); else if (id) setRows(prev => [...prev, next]); resetForm(); }, onError: (e) => toast.error(e.detail || "Failed") });
  const deleteAction = useAction(deleteServiceFaqAction, { startTransition, onSuccess: (_d, values) => { toast.success("Removed"); setRows(prev => prev.filter(item => item.id !== values.faqId)); if (editingId === values.faqId) resetForm(); }, onError: (e) => toast.error(e.detail || "Failed") });
  const startEdit = (item: any) => { setEditingId(item.id); form.reset({ providerServiceId, faqId: item.id, question: item.question ?? "", answer: item.answer ?? "" }); };
  return <Card><CardHeader><CardTitle>Service FAQs</CardTitle></CardHeader><CardContent className="space-y-6"><Form {...form}><form className="space-y-4" onSubmit={form.handleSubmit(async (v) => upsertAction.execute(v))}><FormField control={form.control} name="question" render={({ field }) => <FormItem><FormLabel>Question</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="answer" render={({ field }) => <FormItem><FormLabel>Answer</FormLabel><FormControl><Textarea {...field} rows={4} disabled={isPending} /></FormControl><FormMessage /></FormItem>} /><div className="flex gap-2"><Button type="submit" disabled={isPending}><Plus className="mr-2 h-4 w-4" />{editingId ? "Update" : "Add"}</Button>{editingId && <Button type="button" variant="outline" onClick={resetForm}><X className="mr-2 h-4 w-4" />Cancel</Button>}</div></form></Form><div className="space-y-3">{rows.map((item: any) => <div key={item.id} className="rounded-lg border p-4"><div className="flex items-start justify-between gap-4"><div className="space-y-1 min-w-0"><div className="font-medium">{item.question}</div><div className="text-muted-foreground text-sm whitespace-pre-wrap">{item.answer}</div></div><div className="flex gap-1"><Button type="button" variant="ghost" size="icon" onClick={() => startEdit(item)}><Pencil className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" onClick={() => deleteAction.execute({ providerServiceId, faqId: item.id })}><Trash2 className="h-4 w-4" /></Button></div></div></div>)}{!rows.length && <div className="text-muted-foreground text-sm">No FAQ yet.</div>}</div></CardContent></Card>;
}
