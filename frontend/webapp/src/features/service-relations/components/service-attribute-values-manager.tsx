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

import { deleteServiceAttributeValueAction } from "../actions/delete-service-attribute-value";
import { upsertServiceAttributeValueAction } from "../actions/upsert-service-attribute-value";
import { serviceAttributeValueSchema } from "../schemas";
import { ServiceAttributeValueItem } from "../types";

export default function ServiceAttributeValuesManager({ providerServiceId, items, availableDefinitions }: { providerServiceId: string; items: ServiceAttributeValueItem[]; availableDefinitions: Array<{ id: string; name: string }> }) {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rows, setRows] = useState(items);
  const form = useForm({ resolver: zodResolver(serviceAttributeValueSchema), defaultValues: { providerServiceId, valueId: undefined, attributeDefinitionId: "", valueTranslations: createEmptyLocalizedContent() } });
  const resetForm = () => { setEditingId(null); form.reset({ providerServiceId, valueId: undefined, attributeDefinitionId: "", valueTranslations: createEmptyLocalizedContent() }); };
  const upsertAction = useAction(upsertServiceAttributeValueAction, { startTransition, onSuccess: (data, values) => { const id = values.valueId ?? (data as any)?.id; const name = availableDefinitions.find(x => x.id === values.attributeDefinitionId)?.name ?? values.attributeDefinitionId; const next = { id, attributeDefinitionId: values.attributeDefinitionId, attributeDefinitionName: name, valueTranslations: values.valueTranslations }; if (values.valueId) setRows(prev => prev.map(x => x.id === values.valueId ? next : x)); else if (id) setRows(prev => [...prev, next]); toast.success(values.valueId ? "Updated" : "Created"); resetForm(); }, onError: (e) => toast.error(e.detail || "Failed") });
  const deleteAction = useAction(deleteServiceAttributeValueAction, { startTransition, onSuccess: (_d, values) => { setRows(prev => prev.filter(x => x.id !== values.valueId)); toast.success("Removed"); if (editingId === values.valueId) resetForm(); }, onError: (e) => toast.error(e.detail || "Failed") });
  const startEdit = (item: ServiceAttributeValueItem) => { setEditingId(item.id); form.reset({ providerServiceId, valueId: item.id, attributeDefinitionId: item.attributeDefinitionId, valueTranslations: item.valueTranslations ?? createEmptyLocalizedContent() }); };
  return <Card><CardHeader><CardTitle>Service Attribute Values</CardTitle></CardHeader><CardContent className="space-y-6"><Form {...form}><form className="space-y-4" onSubmit={form.handleSubmit(async (v) => upsertAction.execute(v))}><FormField control={form.control} name="attributeDefinitionId" render={({ field }) => <FormItem><FormLabel>Attribute Definition</FormLabel><FormControl><LazyAdminLookupSelect lookupType="serviceAttributeDefinitions" locale={locale} value={field.value} onValueChange={field.onChange} placeholder="Select attribute definition" initialOptions={availableDefinitions.map(item => ({ value: item.id, label: item.name })) as any} disabled={isPending} contentClassName="w-[460px]" /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="valueTranslations" render={({ field }) => <FormItem><LocalizedInput label="Value" value={field.value} onChange={field.onChange} error={form.formState.errors.valueTranslations?.message as string | undefined} required /></FormItem>} /><div className="flex gap-2"><Button type="submit" disabled={isPending}><Plus className="mr-2 h-4 w-4" />{editingId ? "Update" : "Add"}</Button>{editingId && <Button type="button" variant="outline" onClick={resetForm}><X className="mr-2 h-4 w-4" />Cancel</Button>}</div></form></Form><div className="space-y-3">{rows.map(item => <div key={item.id} className="rounded-lg border p-4"><div className="flex items-start justify-between gap-4"><div><div className="font-medium">{item.attributeDefinitionName}</div><div className="text-muted-foreground text-sm break-all">{JSON.stringify(item.valueTranslations ?? {})}</div></div><div className="flex gap-1"><Button type="button" variant="ghost" size="icon" onClick={() => startEdit(item)}><Pencil className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" onClick={() => deleteAction.execute({ providerServiceId, valueId: item.id })}><Trash2 className="h-4 w-4" /></Button></div></div></div>)}{!rows.length && <div className="text-muted-foreground text-sm">No attribute values yet.</div>}</div></CardContent></Card>;
}
