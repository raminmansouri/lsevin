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

import { addProviderServiceAddonAction } from "../actions/add-provider-service-addon";
import { removeProviderServiceAddonAction } from "../actions/remove-provider-service-addon";
import { providerServiceAddonSchema } from "../schemas";
import { ProviderServiceAddonItem } from "../types";

export default function ProviderServiceAddonsManager({ providerServiceId, items }: { providerServiceId: string; items: ProviderServiceAddonItem[] }) {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState(items);
  const form = useForm({ resolver: zodResolver(providerServiceAddonSchema), defaultValues: { providerServiceId, addonId: "" } });
  const addAction = useAction(addProviderServiceAddonAction, { startTransition, onSuccess: (_d, v) => { toast.success("Add-on linked"); form.reset({ providerServiceId, addonId: "" }); if (!rows.some(x => x.addonId === v.addonId)) setRows(prev => [...prev, { addonId: v.addonId, addonName: v.addonId, addonKind: "simple", sourceType: "lsevin", price: 0 }]); }, onError: (e) => toast.error(e.detail || "Failed to link") });
  const removeAction = useAction(removeProviderServiceAddonAction, { startTransition, onSuccess: (_d, v) => { toast.success("Add-on removed"); setRows(prev => prev.filter(x => x.addonId !== v.addonId)); }, onError: (e) => toast.error(e.detail || "Failed to remove") });
  return <Card><CardHeader><CardTitle>Service Add-ons</CardTitle></CardHeader><CardContent className="space-y-6"><Form {...form}><form className="grid gap-4 md:grid-cols-[1fr_auto]" onSubmit={form.handleSubmit(async (v) => addAction.execute(v))}><FormField control={form.control} name="addonId" render={({ field }) => <FormItem><FormLabel>Add-on</FormLabel><FormControl><LazyAdminLookupSelect lookupType="addons" locale={locale} value={field.value} onValueChange={field.onChange} placeholder="Select add-on" initialOptions={[]} excludeIds={rows.map(r => r.addonId)} disabled={isPending} contentClassName="w-[460px]" /></FormControl><FormMessage /></FormItem>} /><div className="flex items-end"><Button type="submit" disabled={isPending}><Plus className="mr-2 h-4 w-4" />Add</Button></div></form></Form><div className="space-y-3">{rows.map(item => <div key={item.addonId} className="flex items-center justify-between rounded-lg border p-3"><div><div className="font-medium">{item.addonName}</div><div className="text-muted-foreground text-sm">{item.addonKind} • {item.sourceType} • {item.price}</div></div><Button type="button" variant="ghost" size="icon" onClick={() => removeAction.execute({ providerServiceId, addonId: item.addonId })}><Trash2 className="h-4 w-4" /></Button></div>)}{!rows.length && <div className="text-muted-foreground text-sm">No add-ons linked yet.</div>}</div></CardContent></Card>;
}
