"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { saveOperatingHoursAction } from "@/features/provider-portal/actions";
import { saveOperatingHoursSchema } from "@/features/provider-portal/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";

import type { OperatingHourRow, ProviderWorkspace } from "../types";

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type FormValues = z.infer<typeof saveOperatingHoursSchema>;

export function AvailabilityManager({ workspace, hours }: { workspace: ProviderWorkspace; hours: OperatingHourRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canManage = workspace.permissions.manageAvailability;

  const form = useForm<FormValues>({
    resolver: zodResolver(saveOperatingHoursSchema),
    defaultValues: {
      providerId: workspace.provider.id,
      hours: hours.map((hour) => ({
        dayOfWeek: hour.dayOfWeek,
        opensAt: hour.opensAt || "09:00",
        closesAt: hour.closesAt || "18:00",
        isClosed: hour.isClosed,
        slotIntervalMinutes: hour.slotIntervalMinutes || 15,
      })),
    },
  });

  const fields = useFieldArray({ control: form.control, name: "hours" });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const response = await saveOperatingHoursAction(values);
      if (!response.ok) {
        toast.error(response.error || "Availability could not be saved.");
        return;
      }
      toast.success("Operating hours saved.");
      router.refresh();
    });
  };

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Operating hours
        </CardTitle>
        <CardDescription>These hours are provider-level defaults. Staff-specific availability can be layered later.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...form.register("providerId")} />
          {fields.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[140px_1fr_1fr_1fr_120px] md:items-end">
              <input type="hidden" {...form.register(`hours.${index}.dayOfWeek`)} />
              <div>
                <p className="font-medium text-slate-900">{dayNames[index]}</p>
                <p className="text-xs text-slate-500">Day {index + 1}</p>
              </div>

              <label className="space-y-2">
                <span className="text-xs font-medium text-slate-600">Opens</span>
                <Input type="time" {...form.register(`hours.${index}.opensAt`)} disabled={!canManage || isPending || form.watch(`hours.${index}.isClosed`)} />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-medium text-slate-600">Closes</span>
                <Input type="time" {...form.register(`hours.${index}.closesAt`)} disabled={!canManage || isPending || form.watch(`hours.${index}.isClosed`)} />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-medium text-slate-600">Slot interval</span>
                <Input type="number" {...form.register(`hours.${index}.slotIntervalMinutes`)} disabled={!canManage || isPending} />
              </label>

              <label className="flex items-center gap-2 pb-3 text-sm">
                <input type="checkbox" {...form.register(`hours.${index}.isClosed`)} disabled={!canManage || isPending} className="h-4 w-4 rounded border-slate-300" />
                Closed
              </label>
            </div>
          ))}

          <div className="flex justify-end border-t pt-5">
            <Button type="submit" disabled={!canManage || isPending}>
              {isPending ? "Saving..." : "Save hours"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
