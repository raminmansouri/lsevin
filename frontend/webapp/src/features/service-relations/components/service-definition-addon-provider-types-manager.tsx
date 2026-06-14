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

import { deleteAddonProviderTypeAction } from "../actions/delete-addon-provider-type";
import { upsertAddonProviderTypeAction } from "../actions/upsert-addon-provider-type";
import { addonProviderTypeSchema } from "../schemas";
import { ServiceDefinitionAddonProviderTypeItem } from "../types";

export default function ServiceDefinitionAddonProviderTypesManager({ serviceDefinitionId, items }: { serviceDefinitionId: string; items: ServiceDefinitionAddonProviderTypeItem[] }) {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rows, setRows] = useState(items);
  const form = useForm({ resolver: zodResolver(addonProviderTypeSchema), defaultValues: { serviceDefinitionId, relationId: undefined, providerTypeId: "", icon: "", displayOrder: 0, isRequired: false, metadata: "{}" } });
  const resetForm = () => { setEditingId(null); form.reset({ serviceDefinitionId, relationId: undefined, providerTypeId: "", icon: "", displayOrder: 0, isRequired: false, metadata: "{}" }); };
  const upsertAction = useAction(upsertAddonProviderTypeAction, { startTransition, onSuccess: (data, values) => { const id = values.relationId ?? (data as any)?.id; const next = { id, providerTypeId: values.providerTypeId, providerTypeName: values.providerTypeId, icon: values.icon, displayOrder: values.displayOrder, isRequired: values.isRequired, metadata: (()=>{ try { return JSON.parse(values.metadata || "{}"); } catch { return {}; } })() }; if (values.relationId) setRows(prev => prev.map(x => x.id === values.relationId ? next : x).sort((a,b)=>a.displayOrder-b.displayOrder)); else if (id) setRows(prev => [...prev, next].sort((a,b)=>a.displayOrder-b.displayOrder)); toast.success(values.relationId ? "Updated" : "Created"); resetForm(); }, onError: (e) => toast.error(e.detail || "Failed") });
  const deleteAction = useAction(deleteAddonProviderTypeAction, { startTransition, onSuccess: (_d, values) => { setRows(prev => prev.filter(x => x.id !== values.relationId)); toast.success("Removed"); if (editingId === values.relationId) resetForm(); }, onError: (e) => toast.error(e.detail || "Failed") });
  const startEdit = (item: ServiceDefinitionAddonProviderTypeItem) => { setEditingId(item.id); form.reset({ serviceDefinitionId, relationId: item.id, providerTypeId: item.providerTypeId, icon: item.icon ?? "", displayOrder: item.displayOrder, isRequired: item.isRequired, metadata: JSON.stringify(item.metadata ?? {}, null, 2) }); };
  return <Card><CardHeader><CardTitle>Add-on Provider Type Whitelist</CardTitle></CardHeader><CardContent className="space-y-6"><Form {...form}><form className="space-y-4" onSubmit={form.handleSubmit(async (v)=>upsertAction.execute(v))}><FormField control={form.control} name="providerTypeId" render={({ field }) => <FormItem><FormLabel>Provider Type</FormLabel><FormControl><LazyAdminLookupSelect lookupType="providerTypes" locale={locale} value={field.value} onValueChange={field.onChange} placeholder="Select provider type" initialOptions={[]} disabled={isPending} /></FormControl><FormMessage /></FormItem>} /><RHFSingleMediaPickerField control={form.control as any} name="icon" label="Icon" placeholder="Pick icon" mediaType="image" helperText="Stores one media id in a hidden input." modalTitle="Pick icon" /><div className="grid gap-4 md:grid-cols-2"><FormField control={form.control} name="displayOrder" render={({ field }) => <FormItem><FormLabel>Display Order</FormLabel><FormControl><Input type="number" min={0} {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="isRequired" render={({ field }) => <FormItem className="flex h-full flex-row items-center justify-between rounded-lg border p-4"><div><FormLabel>Required</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl></FormItem>} /></div><FormField control={form.control} name="metadata" render={({ field }) => <FormItem><FormLabel>Metadata JSON</FormLabel><FormControl><Textarea {...field} rows={5} disabled={isPending} /></FormControl><FormMessage /></FormItem>} /><div className="flex gap-2"><Button type="submit" disabled={isPending}><Plus className="mr-2 h-4 w-4" />{editingId ? "Update" : "Add"}</Button>{editingId && <Button type="button" variant="outline" onClick={resetForm}><X className="mr-2 h-4 w-4" />Cancel</Button>}</div></form></Form><div className="space-y-3">{rows.map(item => <div key={item.id} className="rounded-lg border p-4"><div className="flex items-start justify-between gap-4"><div className="space-y-1"><div className="font-medium">{item.providerTypeName}</div><div className="text-muted-foreground text-sm">Display order: {item.displayOrder} • Required: {item.isRequired ? "Yes" : "No"}</div>{item.icon && <div className="text-muted-foreground text-sm break-all">Icon: {item.icon}</div>}</div><div className="flex gap-1"><Button type="button" variant="ghost" size="icon" onClick={() => startEdit(item)}><Pencil className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" onClick={() => deleteAction.execute({ serviceDefinitionId, relationId: item.id })}><Trash2 className="h-4 w-4" /></Button></div></div></div>)}{!rows.length && <div className="text-muted-foreground text-sm">No whitelist entries yet.</div>}</div></CardContent></Card>;
}
