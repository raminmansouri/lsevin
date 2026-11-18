"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, ListOrdered, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";

import {
  CategoryOrderNode,
  getCategoryOrderAction,
  reorderCategoriesAction,
} from "../../actions/reorder-categories";
import { CATEGORY_TRANSLATION_KEY } from "../../constants";

const ROOT = "__root__";

/** Children ids per parent (ROOT for main categories), in display order. */
type OrderMap = Record<string, string[]>;

function buildOrderMap(items: CategoryOrderNode[]): OrderMap {
  const ids = new Set(items.map((item) => item.id));
  const map: OrderMap = {};
  for (const item of items) {
    // A parent that no longer exists would hide the row; show it with the main categories.
    const key = item.parentId && ids.has(item.parentId) ? item.parentId : ROOT;
    (map[key] ??= []).push(item.id);
  }
  return map;
}

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * "Arrange order": main categories, and the subcategories within each parent, reordered by
 * drag and drop (or the arrow buttons, for touch screens and keyboards). Each drop saves that
 * one list at once; positions become category.categories.display_order 1, 2, 3...
 */
export function CategoryOrderDialog() {
  const t = useTranslations(CATEGORY_TRANSLATION_KEY);
  const locale = useLocale();
  const router = useRouter();
  const numbers = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState<Record<string, CategoryOrderNode>>({});
  const [order, setOrder] = useState<OrderMap>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [changed, setChanged] = useState(false);
  const dragging = useRef<{ id: string; parentKey: string; before: string[] } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // The latest order, for drag-end (which fires after the last drag-over re-render).
  const orderRef = useRef<OrderMap>(order);
  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getCategoryOrderAction();
    setLoading(false);
    if (!("items" in result)) {
      toast.error(t("ordering.loadFailed"));
      return;
    }
    setNodes(Object.fromEntries(result.items.map((item) => [item.id, item])));
    setOrder(buildOrderMap(result.items));
  }, [t]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    // The list's priority column shows the positions; bring it up to date.
    if (!next && changed) {
      setChanged(false);
      router.refresh();
    }
  };

  const save = useCallback(
    async (parentKey: string, next: string[], previous: string[]) => {
      if (next.join() === previous.join()) return;
      setSaving((state) => new Set(state).add(parentKey));
      const result = await reorderCategoriesAction({
        parentId: parentKey === ROOT ? null : parentKey,
        orderedIds: next,
      });
      setSaving((state) => {
        const copy = new Set(state);
        copy.delete(parentKey);
        return copy;
      });
      if ("code" in result) {
        setOrder((state) => ({ ...state, [parentKey]: previous }));
        if (result.code === "STALE") {
          toast.error(t("ordering.stale"));
          void load();
        } else {
          toast.error(t("ordering.failed"));
        }
        return;
      }
      setChanged(true);
      toast.success(t("ordering.saved"));
    },
    [load, t]
  );

  const moveBy = (parentKey: string, id: string, delta: number) => {
    const list = order[parentKey] ?? [];
    const from = list.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= list.length) return;
    const next = move(list, from, to);
    setOrder((state) => ({ ...state, [parentKey]: next }));
    void save(parentKey, next, list);
  };

  const toggle = (id: string) =>
    setExpanded((state) => {
      const copy = new Set(state);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });

  const renderList = (parentKey: string, depth: number) => {
    const list = order[parentKey] ?? [];
    if (!list.length) return null;
    return (
      <ul
        className={depth === 0 ? "space-y-2" : "mt-2 space-y-1.5 border-s-2 border-dashed border-muted ps-3"}
        data-testid={`category-order-list-${parentKey}`}
      >
        {list.map((id, index) => {
          const node = nodes[id];
          if (!node) return null;
          const children = order[id] ?? [];
          const isOpen = expanded.has(id);
          const busy = saving.has(parentKey);
          return (
            <li key={id}>
              <div
                draggable={!busy}
                onDragStart={(event) => {
                  event.stopPropagation();
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", id);
                  dragging.current = { id, parentKey, before: list };
                  setDraggingId(id);
                }}
                onDragOver={(event) => {
                  const drag = dragging.current;
                  // Only within the same parent: a subcategory cannot be dropped among main categories.
                  if (!drag || drag.parentKey !== parentKey) return;
                  event.preventDefault();
                  event.stopPropagation();
                  if (drag.id === id) return;
                  setOrder((state) => {
                    const current = state[parentKey] ?? [];
                    const from = current.indexOf(drag.id);
                    const to = current.indexOf(id);
                    if (from < 0 || to < 0 || from === to) return state;
                    return { ...state, [parentKey]: move(current, from, to) };
                  });
                }}
                onDrop={(event) => {
                  if (dragging.current?.parentKey === parentKey) event.preventDefault();
                }}
                onDragEnd={(event) => {
                  event.stopPropagation();
                  const drag = dragging.current;
                  dragging.current = null;
                  setDraggingId(null);
                  if (!drag) return;
                  void save(drag.parentKey, orderRef.current[drag.parentKey] ?? [], drag.before);
                }}
                className={`flex items-center gap-2 rounded-lg border bg-background px-2 py-2 transition-colors ${
                  draggingId === id ? "border-primary bg-primary/5 opacity-60" : "hover:bg-muted/50"
                }`}
                data-testid={`category-order-row-${id}`}
              >
                <GripVertical
                  className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
                  aria-hidden
                />
                <span className="w-6 shrink-0 text-center text-xs tabular-nums text-muted-foreground">
                  {numbers.format(index + 1)}
                </span>
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-start"
                  onClick={() => children.length && toggle(id)}
                  disabled={!children.length}
                  aria-expanded={children.length ? isOpen : undefined}
                >
                  <span className={`truncate ${depth === 0 ? "font-medium" : "text-sm"}`}>{node.name}</span>
                  {!node.isActive && (
                    <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                      {t("status.inactive")}
                    </span>
                  )}
                  {children.length > 0 && (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      {t("ordering.subcategories", { count: children.length })}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </span>
                  )}
                </button>
                {busy && index === 0 ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label={t("homepage.saving")} />
                ) : null}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  disabled={busy || index === 0}
                  onClick={() => moveBy(parentKey, id, -1)}
                  aria-label={t("ordering.moveUp", { name: node.name })}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  disabled={busy || index === list.length - 1}
                  onClick={() => moveBy(parentKey, id, 1)}
                  aria-label={t("ordering.moveDown", { name: node.name })}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
              {isOpen ? renderList(id, depth + 1) : null}
            </li>
          );
        })}
      </ul>
    );
  };

  const empty = useMemo(() => !loading && !(order[ROOT]?.length), [loading, order]);

  return (
    <>
      <Button variant="outline" onClick={() => handleOpenChange(true)} data-testid="category-order-open">
        <ListOrdered className="h-4 w-4" />
        {t("ordering.open")}
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("ordering.title")}</DialogTitle>
            <DialogDescription>{t("ordering.description")}</DialogDescription>
          </DialogHeader>
          <div className="-mx-1 min-h-40 flex-1 overflow-y-auto px-1 pb-1" data-testid="category-order-tree">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : empty ? (
              <p className="py-10 text-center text-sm text-muted-foreground">{t("noCategoryFound")}</p>
            ) : (
              renderList(ROOT, 0)
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
