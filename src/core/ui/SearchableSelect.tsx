"use client";

import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@core/lib/cn";

export type SearchOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

function textFromNode(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (isValidElement(node)) return textFromNode((node.props as { children?: ReactNode }).children);
  return "";
}

function optionsFromChildren(children: ReactNode): SearchOption[] {
  const items: SearchOption[] = [];
  const visit = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;
      const element = child as ReactElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>;
      if (element.type === "option") {
        items.push({
          value: element.props.value === undefined ? textFromNode(element.props.children) : String(element.props.value),
          label: textFromNode(element.props.children),
          disabled: Boolean(element.props.disabled),
        });
        return;
      }
      if (element.type === Fragment || element.props.children) visit(element.props.children);
    });
  };
  visit(children);
  return items;
}

export type SearchableSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "multiple" | "size" | "onChange"> & {
  searchPlaceholder?: string;
  emptyText?: string;
  onValueChange?: (value: string) => void;
};

export function SearchableSelect({
  name,
  value,
  defaultValue,
  children,
  required,
  disabled,
  className,
  searchPlaceholder = "Search...",
  emptyText = "No matching options.",
  onValueChange,
  ...rest
}: SearchableSelectProps) {
  const options = useMemo(() => optionsFromChildren(children), [children]);
  const initial = String(value ?? defaultValue ?? options[0]?.value ?? "");
  const [current, setCurrent] = useState(initial);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) setCurrent(String(value));
  }, [value]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selected = options.find((item) => item.value === current);
  const placeholderOption = options.find((item) => item.value === "");
  const visible = useMemo(() => {
    if (!open) return [];
    const needle = query.trim().toLocaleLowerCase();
    return options.filter((item) => {
      if (item.value === "" && item.disabled) return false;
      if (!needle) return true;
      return `${item.label} ${item.description ?? ""}`.toLocaleLowerCase().includes(needle);
    });
  }, [open, options, query]);

  const choose = (option: SearchOption) => {
    if (option.disabled) return;
    setCurrent(option.value);
    setOpen(false);
    setQuery("");
    onValueChange?.(option.value);
  };

  return (
    <div ref={root} className={cn("relative", className)} data-searchable-select>
      {name ? <input type="text" name={name} value={current} required={required} disabled={disabled} onChange={() => undefined} tabIndex={-1} aria-hidden="true" className="sr-only" data-searchable-select-value /> : null}
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-required={required || undefined}
        onClick={() => setOpen((item) => !item)}
        className="flex w-full items-center justify-between rounded-md border border-border bg-white px-3 py-2 text-left text-sm outline-none ring-primary/20 transition focus:ring-4 disabled:bg-muted disabled:text-muted-foreground"
        {...(rest["aria-label"] ? { "aria-label": rest["aria-label"] } : {})}
      >
        <span className={cn("truncate", !selected && !current ? "text-muted-foreground" : "")}>{selected?.label || current || placeholderOption?.label || "Select..."}</span>
        <span className="flex shrink-0 items-center gap-1">
          {current && !required ? <span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); setCurrent(""); onValueChange?.(""); }} onKeyDown={() => undefined} className="rounded p-0.5 hover:bg-muted"><X size={13} /></span> : null}
          <ChevronDown size={15} />
        </span>
      </button>
      {open ? (
        <div className="absolute z-50 mt-1 w-full min-w-[260px] rounded-lg border border-border bg-white p-2 shadow-xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 text-muted-foreground" size={15} />
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} className="w-full rounded-md border border-border py-2 pl-8 pr-3 text-sm outline-none" />
          </div>
          <div className="mt-2 max-h-64 overflow-y-auto" role="listbox">
            {!visible.length ? <div className="p-4 text-center text-sm text-muted-foreground">{emptyText}</div> : null}
            {visible.map((option) => (
              <button key={`${option.value}:${option.label}`} type="button" role="option" aria-selected={current === option.value} disabled={option.disabled} onClick={() => choose(option)} className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">
                <Check size={15} className={current === option.value ? "mt-0.5 opacity-100" : "mt-0.5 opacity-0"} />
                <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{option.label}</span>{option.description ? <span className="block truncate text-xs text-muted-foreground">{option.description}</span> : null}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
