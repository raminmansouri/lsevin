"use client";

import { useTransition } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import useAction from "@/hooks/use-action";
import { Link } from "@/i18n/navigation";

import { changeProviderPolicyTypeActivationAction } from "../actions/change-provider-policy-type-activation";
import { deleteProviderPolicyTypeAction } from "../actions/delete-provider-policy-type";
import type { ProviderPolicyType } from "../types";

export function ProviderPolicyTypesList({ items }: { items: ProviderPolicyType[] }) {
  const [isPending, startTransition] = useTransition();
  const { execute: toggleStatus } = useAction(changeProviderPolicyTypeActivationAction, {
    startTransition,
    onSuccess: () => toast.success("Policy type status updated."),
    onError: (error) => toast.error(error?.detail || "Status update failed."),
  });
  const { execute: deleteType } = useAction(deleteProviderPolicyTypeAction, {
    startTransition,
    onSuccess: () => toast.success("Policy type deleted."),
    onError: (error) => toast.error(error?.detail || "Delete failed."),
  });

  return (
    <CardContent className="space-y-4 p-6">
      <div className="flex justify-end">
        <Button asChild className="bg-[#083f30] hover:bg-[#083f30]/90"><Link href="/admin/provider-policy-types/add"><Plus className="mr-2 h-4 w-4" />Add policy type</Link></Button>
      </div>
      <div className="overflow-hidden rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Name</th>
              <th className="p-3">Policies</th>
              <th className="p-3">Order</th>
              <th className="p-3">Active</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No provider policy types found.</td></tr>
            ) : items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3 font-mono text-xs">{item.code}</td>
                <td className="p-3"><div className="font-medium">{item.name || item.code}</div><div className="line-clamp-1 text-xs text-muted-foreground">{item.description}</div></td>
                <td className="p-3">{item.policyCount}</td>
                <td className="p-3">{item.displayOrder}</td>
                <td className="p-3"><Switch checked={item.isActive} disabled={isPending} onCheckedChange={(checked) => toggleStatus({ id: item.id, isActive: checked })} /></td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline"><Link href={`/admin/provider-policy-types/${item.id}/update`}><Edit className="mr-2 h-4 w-4" />Edit</Link></Button>
                    <Button size="sm" variant="outline" disabled={isPending || item.policyCount > 0} onClick={() => deleteType({ id: item.id })} title={item.policyCount > 0 ? "This type is used by provider policies." : "Delete"}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  );
}
