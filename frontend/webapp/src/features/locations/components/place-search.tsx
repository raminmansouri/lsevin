"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { searchPlacesAction, type PlaceSearchResult } from "../actions/location-search.actions";

const DEBOUNCE_MS = 150;

/**
 * One box to find a city or a country by any of its names (replaces the
 * country -> province -> city dropdowns). Keyboard: arrows move, Enter picks,
 * Escape clears.
 */
export function PlaceSearch({
  locale,
  onSelect,
  disabled = false,
  autoFocus = false,
}: {
  locale: string;
  onSelect: (place: PlaceSearchResult) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const t = useTranslations("Home.location.search");
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const requestRef = useRef(0);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const request = ++requestRef.current;
    setLoading(true);
    const timer = window.setTimeout(() => {
      searchPlacesAction({ query: text, locale })
        .then((rows) => {
          // A slower answer for an older query never replaces a newer one.
          if (request !== requestRef.current) return;
          setResults(rows);
          setActive(0);
        })
        .catch(() => {
          if (request === requestRef.current) setResults([]);
        })
        .finally(() => {
          if (request === requestRef.current) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, locale]);

  const pick = (place: PlaceSearchResult) => {
    onSelect(place);
    setQuery("");
    setResults([]);
  };

  const trimmed = query.trim();
  const showList = trimmed.length >= 2;

  return (
    <div>
      <label htmlFor={`${listId}-input`} className="mb-2 block text-sm font-semibold text-slate-900">
        {t("label")}
      </label>
      <div className="flex h-12 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 focus-within:border-[#083f30] focus-within:ring-2 focus-within:ring-[#083f30]/15">
        <Search size={18} className="shrink-0 text-gray-400" aria-hidden />
        <input
          id={`${listId}-input`}
          type="search"
          role="combobox"
          aria-expanded={showList && results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          disabled={disabled}
          value={query}
          placeholder={t("placeholder")}
          data-testid="place-search-input"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && results[active]) {
              event.preventDefault();
              pick(results[active]);
            } else if (event.key === "Escape") {
              setQuery("");
            }
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />
        {loading ? <Loader2 size={16} className="shrink-0 animate-spin text-gray-400" aria-hidden /> : null}
      </div>

      {trimmed.length === 1 ? <p className="mt-2 text-xs text-gray-500">{t("hint")}</p> : null}

      {showList ? (
        <ul id={listId} role="listbox" className="mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white">
          {results.map((place, index) => (
            <li
              key={place.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              data-testid="place-search-option"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick(place)}
              onMouseEnter={() => setActive(index)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm ${index === active ? "bg-emerald-50" : ""}`}
            >
              <MapPin size={16} className="shrink-0 text-[#083f30]" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-gray-900">{place.label}</span>
                <span className="block truncate text-xs text-gray-500">{place.kind === "country" ? t("country") : place.countryLabel}</span>
              </span>
            </li>
          ))}
          {!loading && results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-gray-500">{t("noResults", { query: trimmed })}</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
