"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { stringsFor } from "./strings";

type Suggestion = { text: string; type: string };

type Props = {
  locale: string;
  initialQuery?: string;
  type?: string;
  autoFocus?: boolean;
};

/**
 * Search field with autocomplete. Follows the ARIA combobox pattern: arrow keys move through
 * the suggestions, Enter opens the highlighted one (or searches what was typed), Escape closes
 * the list. Without JavaScript it is a plain GET form to /<locale>/search.
 */
export function SearchBox({ locale, initialQuery = "", type = "all", autoFocus = false }: Props) {
  const strings = stringsFor(locale);
  const router = useRouter();
  const listId = useId();
  const [value, setValue] = useState(initialQuery);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    const term = value.trim();
    if (term.length < 2 || !open) {
      setItems([]);
      return;
    }
    const timer = setTimeout(async () => {
      controller.current?.abort();
      controller.current = new AbortController();
      try {
        const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: controller.current.signal });
        if (!response.ok) return setItems([]);
        const json = (await response.json()) as { suggestions?: Suggestion[] };
        setItems(json.suggestions ?? []);
        setActive(-1);
      } catch {
        // aborted or offline: keep typing, the form still works
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [value, open]);

  function go(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    const params = new URLSearchParams({ q: trimmed });
    if (type !== "all") params.set("type", type);
    router.push(`/${locale}/search?${params.toString()}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && items.length) {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp" && items.length) {
      event.preventDefault();
      setActive((index) => (index <= 0 ? items.length - 1 : index - 1));
    } else if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if (event.key === "Enter" && active >= 0 && items[active]) {
      event.preventDefault();
      setValue(items[active].text);
      go(items[active].text);
    }
  }

  const expanded = open && items.length > 0;

  return (
    <form action={`/${locale}/search`} method="get" role="search" className="relative w-full" onSubmit={(event) => {
      event.preventDefault();
      go(value);
    }}>
      <div className="flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white px-4 py-2 shadow-sm focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/30">
        <input
          // Not type="search": Chrome clears a search input on Escape, which would erase what
          // the visitor typed when they only meant to close the suggestions.
          type="text"
          inputMode="search"
          enterKeyHint="search"
          name="q"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder={strings.placeholder}
          aria-label={strings.title}
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          maxLength={160}
          className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none"
        />
        {type !== "all" ? <input type="hidden" name="type" value={type} /> : null}
        <button type="submit" className="rounded-xl bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
          {strings.submit}
        </button>
      </div>
      <ul
        id={listId}
        role="listbox"
        aria-label={strings.suggestions}
        hidden={!expanded}
        className="absolute inset-x-0 top-full z-20 mt-2 max-h-80 overflow-auto rounded-2xl border border-neutral-200 bg-white py-1 shadow-lg"
      >
        {items.map((item, index) => (
          <li
            key={`${item.type}:${item.text}`}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            onMouseDown={(event) => {
              event.preventDefault();
              setValue(item.text);
              go(item.text);
            }}
            className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-sm ${index === active ? "bg-teal-50" : ""}`}
          >
            <span>{item.text}</span>
            <span className="text-xs text-neutral-500">{stringsFor(locale).types[item.type as keyof typeof strings.types] ?? ""}</span>
          </li>
        ))}
      </ul>
    </form>
  );
}
