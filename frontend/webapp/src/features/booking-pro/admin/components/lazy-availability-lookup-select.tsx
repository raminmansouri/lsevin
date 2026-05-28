"use client";

import { useMemo } from "react";

import {
  AsyncSearchableSingleSelect,
  type AsyncSelectOption,
  type AsyncSelectResult,
} from "@/components/admin/forms/extensions/async-searchable-single-select";
import type { GenericAvailabilityTargetType, LookupOption } from "@/features/booking-pro/server/generic-availability-admin.repository";

type LookupType =
  | "providers"
  | "providerServices"
  | "serviceDefinitions"
  | "staff"
  | "providerStaff"
  | "resources"
  | "targets";

type Props = {
  label?: string;
  value?: string | null;
  locale: string;
  lookupType: LookupType;
  targetType?: GenericAvailabilityTargetType | null;
  serviceProviderId?: string | null;
  providerServiceId?: string | null;
  resourceId?: string | null;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  requiredParentMessage?: string;
  pageSize?: number;
  onChange: (value: string | null, option: LookupOption | null) => void;
};

function toOption(item: LookupOption): AsyncSelectOption {
  return {
    value: item.value,
    label: item.label,
    description: item.description,
    raw: {
      group: item.group ?? null,
      serviceProviderId: item.serviceProviderId ?? null,
      providerServiceId: item.providerServiceId ?? null,
      serviceDefinitionId: item.serviceDefinitionId ?? null,
      staffId: item.staffId ?? null,
      targetType: item.targetType ?? null,
    },
  };
}

function fromOption(option: AsyncSelectOption | null): LookupOption | null {
  if (!option) return null;
  return {
    value: option.value,
    label: option.label,
    description: option.description,
    group: option.raw?.group ?? null,
    serviceProviderId: option.raw?.serviceProviderId ?? null,
    providerServiceId: option.raw?.providerServiceId ?? null,
    serviceDefinitionId: option.raw?.serviceDefinitionId ?? null,
    staffId: option.raw?.staffId ?? null,
    targetType: option.raw?.targetType as GenericAvailabilityTargetType | undefined,
  };
}

export function LazyAvailabilityLookupSelect({
  label,
  value,
  locale,
  lookupType,
  targetType,
  serviceProviderId,
  providerServiceId,
  resourceId,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  disabled,
  requiredParentMessage,
  pageSize = 20,
  onChange,
}: Props) {
  const parentSignature = useMemo(
    () => JSON.stringify({ lookupType, targetType, serviceProviderId, providerServiceId, resourceId, locale }),
    [lookupType, targetType, serviceProviderId, providerServiceId, resourceId, locale]
  );

  const missingProviderForService = lookupType === "providerServices" && !serviceProviderId;
  const effectiveDisabled = disabled || missingProviderForService;

  async function request(args: { search?: string; page?: number; pageSize?: number; id?: string | null }) {
    const url = new URL("/api/admin/availability/lookups", window.location.origin);
    url.searchParams.set("lookupType", lookupType);
    url.searchParams.set("locale", locale);
    url.searchParams.set("page", String(args.page ?? 1));
    url.searchParams.set("pageSize", String(args.pageSize ?? pageSize));
    if (args.search) url.searchParams.set("search", args.search);
    if (args.id) url.searchParams.set("id", args.id);
    if (targetType) url.searchParams.set("targetType", targetType);
    if (serviceProviderId) url.searchParams.set("serviceProviderId", serviceProviderId);
    if (providerServiceId) url.searchParams.set("providerServiceId", providerServiceId);
    if (resourceId) url.searchParams.set("resourceId", resourceId);

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to load options");
    return response.json();
  }

  async function loadOptions({ search, page, pageSize }: { search: string; page: number; pageSize: number }): Promise<AsyncSelectResult> {
    const json = await request({ search, page, pageSize });
    return {
      items: (json.items ?? []).map(toOption),
      hasMore: Boolean(json.hasMore),
    };
  }

  async function loadByValue(selectedValue: string): Promise<AsyncSelectOption | null> {
    const json = await request({ id: selectedValue });
    return json.item ? toOption(json.item) : null;
  }

  return (
    <AsyncSearchableSingleSelect
      key={parentSignature}
      label={label}
      value={value ?? null}
      disabled={effectiveDisabled}
      placeholder={missingProviderForService ? requiredParentMessage ?? "Select provider first" : placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyText={emptyText}
      pageSize={pageSize}
      onChange={(nextValue, option) => onChange(nextValue, fromOption(option))}
      loadOptions={loadOptions}
      loadByValue={loadByValue}
    />
  );
}
