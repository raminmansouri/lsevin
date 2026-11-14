"use client";

import { Check, ChevronDown, ChevronLeft, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type TreePickerAccount = {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  isActive: boolean;
  isPostable: boolean;
};

type Node = TreePickerAccount & { children: Node[]; depth: number; parent: Node | null };

function buildTree(accounts: TreePickerAccount[]) {
  const byId = new Map<string, Node>();
  for (const account of accounts) byId.set(account.id, { ...account, children: [], depth: 0, parent: null });
  const roots: Node[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) {
      node.parent = parent;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const byCode = new Map<string, Node>();
  const walk = (list: Node[], depth: number) => {
    list.sort((a, b) => a.code.localeCompare(b.code, "en", { numeric: true }));
    for (const node of list) {
      node.depth = depth;
      byCode.set(node.code, node);
      walk(node.children, depth + 1);
    }
  };
  walk(roots, 0);
  return { roots, byCode };
}

function pathOf(node: Node | undefined): Node[] {
  const path: Node[] = [];
  for (let current = node ?? null; current; current = current.parent) path.unshift(current);
  return path;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const index = text.toLowerCase().indexOf(query);
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-amber-200/70 px-0.5 text-inherit">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}

export function AccountTreePicker({
  accounts,
  name,
  defaultValue = "",
  allLabel,
  placeholder = "انتخاب حساب",
  postableOnly = false,
  autoSubmit = false,
  className = "",
}: {
  accounts: TreePickerAccount[];
  name: string;
  defaultValue?: string;
  allLabel?: string;
  placeholder?: string;
  postableOnly?: boolean;
  autoSubmit?: boolean;
  className?: string;
}) {
  const { roots, byCode } = useMemo(() => buildTree(accounts), [accounts]);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(pathOf(byCode.get(defaultValue)).slice(0, -1).map((node) => node.id))
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const q = query.trim().toLowerCase();

  const selected = byCode.get(value);
  const selectedPath = pathOf(selected);

  const matching = useMemo(() => {
    const result = new Set<string>();
    if (!q) return result;
    const visit = (node: Node): boolean => {
      const childMatch = node.children.map(visit).some(Boolean);
      const self = node.code.includes(q) || node.name.toLowerCase().includes(q);
      if (self || childMatch) result.add(node.id);
      return self || childMatch;
    };
    roots.forEach(visit);
    return result;
  }, [roots, q]);

  const rows = useMemo(() => {
    const out: Node[] = [];
    const walk = (list: Node[]) => {
      for (const node of list) {
        if (q && !matching.has(node.id)) continue;
        out.push(node);
        if (node.children.length && (q || expanded.has(node.id))) walk(node.children);
      }
    };
    walk(roots);
    return out;
  }, [roots, q, matching, expanded]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as globalThis.Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    searchRef.current?.focus();
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  const toggle = (id: string) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const commit = (code: string) => {
    setValue(code);
    setOpen(false);
    setQuery("");
    if (autoSubmit) setTimeout(() => hiddenRef.current?.form?.requestSubmit(), 0);
  };

  const choose = (node: Node) => {
    if (postableOnly && !node.isPostable) {
      toggle(node.id);
      return;
    }
    commit(node.code);
  };

  const openPicker = () => {
    setOpen(true);
    const index = rows.findIndex((row) => row.code === value);
    setActive(index < 0 ? 0 : index);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const node = rows[active];
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(rows.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "ArrowLeft" && node?.children.length && !expanded.has(node.id)) {
      event.preventDefault();
      toggle(node.id);
    } else if (event.key === "ArrowRight" && node) {
      event.preventDefault();
      if (expanded.has(node.id)) toggle(node.id);
      else if (node.parent) setActive(Math.max(0, rows.indexOf(node.parent)));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (node) choose(node);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input ref={hiddenRef} type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="flex h-9 w-full items-center gap-2 rounded-md border bg-background px-2 text-start text-sm transition hover:border-gray-400"
      >
        {selected ? (
          <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
            {selectedPath.map((node, index) => {
              const last = index === selectedPath.length - 1;
              return (
                <span key={node.id} className="flex shrink-0 items-center gap-1" title={node.name}>
                  {index > 0 ? <ChevronLeft className="h-3 w-3 text-muted-foreground" /> : null}
                  <span dir="ltr" className="font-mono text-xs text-muted-foreground">{node.code}</span>
                  {last ? <span className="truncate font-semibold">{node.name}</span> : null}
                </span>
              );
            })}
          </span>
        ) : (
          <span className="flex-1 truncate text-muted-foreground">{allLabel ?? placeholder}</span>
        )}
        {selected && allLabel !== undefined ? (
          <span
            role="button"
            tabIndex={-1}
            aria-label="پاک کردن"
            onClick={(event) => {
              event.stopPropagation();
              commit("");
            }}
            className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open ? (
        <div className="absolute start-0 top-full z-50 mt-1 w-[min(30rem,92vw)] overflow-hidden rounded-xl border bg-background shadow-xl">
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="جستجو در کد یا نام حساب…"
              className="h-10 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <div ref={listRef} className="max-h-80 overflow-y-auto p-1">
            {allLabel !== undefined && !q ? (
              <button
                type="button"
                onClick={() => commit("")}
                className="flex w-full items-center rounded-md px-3 py-1.5 text-sm hover:bg-muted"
              >
                <span className="flex-1 text-start">{allLabel}</span>
                {!value ? <Check className="h-4 w-4 text-emerald-600" /> : null}
              </button>
            ) : null}
            {rows.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">حسابی پیدا نشد.</p>
            ) : null}
            {rows.map((node, index) => {
              const isOpen = Boolean(q) || expanded.has(node.id);
              const disabled = postableOnly && !node.isPostable;
              return (
                <div
                  key={node.id}
                  data-index={index}
                  onMouseEnter={() => setActive(index)}
                  className={`flex items-center gap-1 rounded-md py-1 pe-2 text-sm ${index === active ? "bg-muted" : ""} ${node.isActive ? "" : "opacity-50"}`}
                  style={{ paddingInlineStart: `${node.depth * 1.15 + 0.25}rem` }}
                >
                  {node.children.length ? (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => toggle(node.id)}
                      aria-label={isOpen ? "بستن" : "باز کردن"}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-gray-200/60"
                    >
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </button>
                  ) : (
                    <span className="w-6 shrink-0" />
                  )}
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => choose(node)}
                    className={`flex min-w-0 flex-1 items-center gap-2 py-0.5 text-start ${disabled ? "cursor-default" : ""}`}
                  >
                    <span dir="ltr" className="font-mono text-xs text-muted-foreground">
                      <Highlight text={node.code} query={q} />
                    </span>
                    <span className={`truncate ${node.depth === 0 ? "font-semibold" : ""} ${disabled ? "text-muted-foreground" : ""}`}>
                      <Highlight text={node.name} query={q} />
                    </span>
                    <span className="ms-auto flex shrink-0 items-center gap-1">
                      {node.children.length ? (
                        <span className="rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">{node.children.length}</span>
                      ) : null}
                      {node.code === value ? <Check className="h-4 w-4 text-emerald-600" /> : null}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
          <div className="border-t px-3 py-1.5 text-[11px] text-muted-foreground">
            ↑↓ حرکت · ← باز کردن · → بستن · Enter انتخاب · Esc بستن
          </div>
        </div>
      ) : null}
    </div>
  );
}