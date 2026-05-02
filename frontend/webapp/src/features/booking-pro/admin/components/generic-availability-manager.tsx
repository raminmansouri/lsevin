"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarClock, Database, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import useAction from "@/hooks/use-action";
import { saveBookableResourceAction, saveGenericAvailabilityRuleAction } from "@/features/booking-pro/admin/actions";
import type { BookableResource, GenericAvailabilityRule } from "@/features/booking-pro/server/generic-availability-admin.repository";

type Props = {
  rules: GenericAvailabilityRule[];
  resources: BookableResource[];
};

const TARGET_TYPES = [
  { value: "provider", label: "Provider" },
  { value: "provider_service", label: "Provider service / room type" },
  { value: "service_definition", label: "Service definition" },
  { value: "staff", label: "Staff" },
  { value: "provider_staff", label: "Provider staff relation" },
  { value: "bookable_resource", label: "Bookable resource" },
] as const;

const RESOURCE_TYPES = ["generic", "room", "bed", "seat", "table", "vehicle", "equipment", "unit"] as const;
const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

function emptyRule(): GenericAvailabilityRule {
  return {
    targetType: "provider_service",
    targetId: "",
    serviceProviderId: null,
    providerServiceId: null,
    resourceId: null,
    dayOfWeek: 1,
    specificDate: null,
    startsAt: "09:00",
    endsAt: "17:00",
    isAvailable: true,
    capacity: null,
    slotIntervalMinutes: 15,
    minBookingMinutes: null,
    maxBookingMinutes: null,
    priority: 100,
    timezoneId: "UTC",
    metadata: {},
  };
}

function emptyResource(): BookableResource {
  return {
    serviceProviderId: "",
    providerServiceId: null,
    resourceType: "room",
    code: "",
    nameTranslations: { "en-US": "" },
    descriptionTranslations: {},
    totalCapacity: 1,
    isActive: true,
    metadata: {},
  };
}

export function GenericAvailabilityManager({ rules, resources }: Props) {
  const [rule, setRule] = useState<GenericAvailabilityRule>(emptyRule());
  const [resource, setResource] = useState<BookableResource>(emptyResource());
  const [rulePending, startRuleTransition] = useTransition();
  const [resourcePending, startResourceTransition] = useTransition();

  const { execute: saveRule } = useAction(saveGenericAvailabilityRuleAction, {
    startTransition: startRuleTransition,
    onSuccess: () => toast.success("Availability rule saved."),
    onError: (error) => toast.error(error?.detail || error?.title || "Rule could not be saved."),
  });

  const { execute: saveResource } = useAction(saveBookableResourceAction, {
    startTransition: startResourceTransition,
    onSuccess: () => toast.success("Bookable resource saved."),
    onError: (error) => toast.error(error?.detail || error?.title || "Resource could not be saved."),
  });

  const ruleKey = useMemo(() => `${rule.targetType}:${rule.targetId || "new"}:${rule.id || ""}`, [rule]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              <CalendarClock size={16} /> Generic availability
            </div>
            <h1 className="text-2xl font-bold text-slate-950">Availability for providers, services, staff, and resources</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Use provider-service rules for service-level schedules, and bookable resources for capacity-based inventory like hotel rooms, beds, cars, seats, or equipment. Existing staff availability still works as a fallback.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Availability rule</h2>
              <p className="text-sm text-slate-500">Recurring weekly rule or specific-date exception.</p>
            </div>
            <button type="button" onClick={() => setRule(emptyRule())} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">New</button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">Existing rule
              <select value={rule.id || ""} onChange={(event) => {
                const found = rules.find((item) => item.id === event.target.value);
                if (found) setRule({ ...found });
              }} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-900">
                <option value="">Create new rule</option>
                {rules.map((item) => <option key={item.id} value={item.id}>{item.targetType} • {item.dayOfWeek ? DAYS.find((d) => d.value === item.dayOfWeek)?.label : item.specificDate} • {item.startsAt || 'all day'}</option>)}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">Target type
              <select value={rule.targetType} onChange={(event) => setRule((current) => ({ ...current, targetType: event.target.value as GenericAvailabilityRule["targetType"] }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-900">
                {TARGET_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">Target ID
              <input value={rule.targetId || ""} onChange={(event) => setRule((current) => ({ ...current, targetId: event.target.value }))} placeholder="UUID of provider service, provider, staff, or resource" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">Provider ID
              <input value={rule.serviceProviderId || ""} onChange={(event) => setRule((current) => ({ ...current, serviceProviderId: event.target.value || null }))} placeholder="Optional but recommended" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">Provider service ID
              <input value={rule.providerServiceId || ""} onChange={(event) => setRule((current) => ({ ...current, providerServiceId: event.target.value || null }))} placeholder="Service/room type UUID" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">Resource ID
              <select value={rule.resourceId || ""} onChange={(event) => setRule((current) => ({ ...current, resourceId: event.target.value || null, targetId: current.targetType === 'bookable_resource' && event.target.value ? event.target.value : current.targetId }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-900">
                <option value="">No specific resource</option>
                {resources.map((item) => <option key={item.id} value={item.id}>{item.resourceType} • {item.code || item.id}</option>)}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">Recurring day
              <select value={rule.dayOfWeek || ""} onChange={(event) => setRule((current) => ({ ...current, dayOfWeek: event.target.value ? Number(event.target.value) : null, specificDate: event.target.value ? null : current.specificDate }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-900">
                <option value="">Specific date only</option>
                {DAYS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">Specific date
              <input type="date" value={rule.specificDate || ""} onChange={(event) => setRule((current) => ({ ...current, specificDate: event.target.value || null, dayOfWeek: event.target.value ? null : current.dayOfWeek }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">Starts at
              <input type="time" value={rule.startsAt || ""} onChange={(event) => setRule((current) => ({ ...current, startsAt: event.target.value || null }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">Ends at
              <input type="time" value={rule.endsAt || ""} onChange={(event) => setRule((current) => ({ ...current, endsAt: event.target.value || null }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">Capacity
              <input type="number" min={1} value={rule.capacity ?? ""} onChange={(event) => setRule((current) => ({ ...current, capacity: event.target.value ? Number(event.target.value) : null }))} placeholder="Blank = resource total or 1" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">Slot interval
              <input type="number" min={1} value={rule.slotIntervalMinutes ?? ""} onChange={(event) => setRule((current) => ({ ...current, slotIntervalMinutes: event.target.value ? Number(event.target.value) : null }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">Timezone
              <input value={rule.timezoneId || "UTC"} onChange={(event) => setRule((current) => ({ ...current, timezoneId: event.target.value || "UTC" }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">Priority
              <input type="number" value={rule.priority ?? 100} onChange={(event) => setRule((current) => ({ ...current, priority: Number(event.target.value || 100) }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900" />
            </label>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={rule.isAvailable} onChange={(event) => setRule((current) => ({ ...current, isAvailable: event.target.checked }))} className="h-4 w-4 rounded border-slate-300" />
              Available rule. Uncheck to create a block/exception.
            </label>
            <button type="button" disabled={rulePending} onClick={() => saveRule({ ...rule, id: rule.id || undefined } as any)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
              {rulePending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save rule
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Bookable resources</h2>
              <p className="text-sm text-slate-500">For hotels: define room inventory per provider service. For other services: seats, cars, equipment, etc.</p>
            </div>
            <button type="button" onClick={() => setResource(emptyResource())} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">New</button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">Existing resource
              <select value={resource.id || ""} onChange={(event) => {
                const found = resources.find((item) => item.id === event.target.value);
                if (found) setResource({ ...found });
              }} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-900">
                <option value="">Create new resource</option>
                {resources.map((item) => <option key={item.id} value={item.id}>{item.resourceType} • {item.code || item.id} • capacity {item.totalCapacity}</option>)}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">Resource type
              <select value={resource.resourceType} onChange={(event) => setResource((current) => ({ ...current, resourceType: event.target.value as BookableResource["resourceType"] }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-900">
                {RESOURCE_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">Provider ID
              <input value={resource.serviceProviderId || ""} onChange={(event) => setResource((current) => ({ ...current, serviceProviderId: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">Provider service ID
              <input value={resource.providerServiceId || ""} onChange={(event) => setResource((current) => ({ ...current, providerServiceId: event.target.value || null }))} placeholder="Room-type / service UUID" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">Code
              <input value={resource.code || ""} onChange={(event) => setResource((current) => ({ ...current, code: event.target.value }))} placeholder="DBL-STD, ROOM-101, CAR-01" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">Total capacity
              <input type="number" min={1} value={resource.totalCapacity} onChange={(event) => setResource((current) => ({ ...current, totalCapacity: Number(event.target.value || 1) }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900" />
            </label>

            <label className="md:col-span-2 block text-sm font-semibold text-slate-700">English name
              <input value={resource.nameTranslations?.["en-US"] || ""} onChange={(event) => setResource((current) => ({ ...current, nameTranslations: { ...(current.nameTranslations || {}), "en-US": event.target.value } }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-900" />
            </label>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={resource.isActive} onChange={(event) => setResource((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 rounded border-slate-300" /> Active
            </label>
            <button type="button" disabled={resourcePending} onClick={() => saveResource({ ...resource, id: resource.id || undefined } as any)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
              {resourcePending ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />} Save resource
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
