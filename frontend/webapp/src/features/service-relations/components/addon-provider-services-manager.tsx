"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import useAction from "@/hooks/use-action";

import { bulkSetAddonProviderServicesAction } from "../actions/bulk-set-addon-provider-services";
import { AddonLinkedProviderServiceItem, AddonProviderServicePickerItem } from "../types";

const PAGE_SIZE = 20;

function formatMoney(price: number, currency: string) {
  return `${currency} ${price.toLocaleString()}`;
}

export default function AddonProviderServicesManager({
  addonId,
  initialLinked,
}: {
  addonId: string;
  initialLinked: AddonLinkedProviderServiceItem[];
}) {
  const locale = useLocale();
  const tAdmin = useTranslations("AdminGenerated");
  const [isPending, startTransition] = useTransition();

  // originalLinked is the last server-confirmed state; linkedIds is the live,
  // locally-toggled selection. Everything the admin checks/unchecks before
  // hitting Apply only changes linkedIds, so the diff against originalLinked
  // is exactly what gets submitted.
  const [originalLinked, setOriginalLinked] = useState<Map<string, AddonLinkedProviderServiceItem>>(
    () => new Map(initialLinked.map((item) => [item.providerServiceId, item])),
  );
  const [linkedIds, setLinkedIds] = useState<Set<string>>(() => new Set(initialLinked.map((item) => item.providerServiceId)));
  // Picker rows carry their own label/price so a checked-off item's row still
  // renders correctly even after it scrolls out of the current search page.
  const [knownItems, setKnownItems] = useState<Map<string, AddonProviderServicePickerItem>>(
    () => new Map(initialLinked.map((item) => [item.providerServiceId, { ...item, isLinked: true }])),
  );

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<AddonProviderServicePickerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams({
          addonId,
          q: search,
          page: String(page),
          pageSize: String(PAGE_SIZE),
          locale,
        });
        const response = await fetch(`/api/admin/addon-service-picker?${params.toString()}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Request failed with ${response.status}`);
        const payload = (await response.json()) as { items: AddonProviderServicePickerItem[]; total: number };
        if (requestIdRef.current !== requestId) return;
        setResults(payload.items);
        setTotal(payload.total);
        setKnownItems((prev) => {
          const next = new Map(prev);
          for (const item of payload.items) next.set(item.providerServiceId, item);
          return next;
        });
      } catch {
        if (requestIdRef.current === requestId) {
          setResults([]);
          setTotal(0);
        }
      } finally {
        if (requestIdRef.current === requestId) setIsSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [addonId, locale, page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const toggle = (item: AddonProviderServicePickerItem) => {
    setKnownItems((prev) => new Map(prev).set(item.providerServiceId, item));
    setLinkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.providerServiceId)) next.delete(item.providerServiceId);
      else next.add(item.providerServiceId);
      return next;
    });
  };

  const { addIds, removeIds } = useMemo(() => {
    const add: string[] = [];
    const remove: string[] = [];
    for (const id of linkedIds) if (!originalLinked.has(id)) add.push(id);
    for (const id of originalLinked.keys()) if (!linkedIds.has(id)) remove.push(id);
    return { addIds: add, removeIds: remove };
  }, [linkedIds, originalLinked]);

  const hasChanges = addIds.length > 0 || removeIds.length > 0;

  const applyAction = useAction(bulkSetAddonProviderServicesAction, {
    startTransition,
    onSuccess: () => {
      toast.success(tAdmin("changesApplied"));
      const nextLinked = new Map<string, AddonLinkedProviderServiceItem>();
      for (const id of linkedIds) {
        const item = knownItems.get(id);
        if (item) nextLinked.set(id, item);
      }
      setOriginalLinked(nextLinked);
    },
    onError: (e) => toast.error(e.detail || tAdmin("failed")),
  });

  const linkedList = useMemo(
    () => [...linkedIds].map((id) => knownItems.get(id)).filter((item): item is AddonProviderServicePickerItem => Boolean(item)),
    [linkedIds, knownItems],
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {tAdmin("linkedServices")} · {tAdmin("selectedCount", { count: linkedList.length })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {linkedList.map((item) => (
            <div key={item.providerServiceId} className="flex items-center justify-between rounded-lg border p-3">
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {item.providerName} / {item.serviceDefinitionName}
                </div>
                <div className="text-muted-foreground text-sm">{formatMoney(item.price, item.currency)}</div>
              </div>
              <Button type="button" variant="ghost" size="icon" disabled={isPending} onClick={() => toggle(item)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {!linkedList.length && <div className="text-muted-foreground text-sm">{tAdmin("noServicesLinkedYet")}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tAdmin("manageServices")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tAdmin("searchServicesPlaceholder")}
              className="pl-9"
            />
          </div>

          <div className="space-y-2">
            {isSearching && (
              <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!isSearching && !results.length && <div className="text-muted-foreground py-4 text-sm">{tAdmin("noServicesFound")}</div>}
            {!isSearching &&
              results.map((item) => {
                const checked = linkedIds.has(item.providerServiceId);
                return (
                  <label
                    key={item.providerServiceId}
                    className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-3 hover:bg-muted/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Checkbox checked={checked} onCheckedChange={() => toggle(item)} disabled={isPending} />
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {item.providerName} / {item.serviceDefinitionName}
                        </div>
                        <div className="text-muted-foreground text-sm">{formatMoney(item.price, item.currency)}</div>
                      </div>
                    </div>
                    {!item.isActive && <Badge variant="outline">{tAdmin("inactive")}</Badge>}
                  </label>
                );
              })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={page <= 1 || isSearching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-muted-foreground text-sm">{tAdmin("pageIndicator", { page, totalPages })}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={page >= totalPages || isSearching}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {hasChanges && <span className="text-muted-foreground text-sm">{tAdmin("unsavedChanges")}</span>}
        <Button
          type="button"
          disabled={!hasChanges || isPending}
          onClick={() => applyAction.execute({ addonId, addProviderServiceIds: addIds, removeProviderServiceIds: removeIds })}
        >
          {tAdmin("applyChanges")}
        </Button>
      </div>
    </div>
  );
}
