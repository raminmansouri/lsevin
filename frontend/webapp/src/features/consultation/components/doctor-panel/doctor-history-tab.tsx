"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import type { VideoSessionListItem } from "../../doctor-panel-types";
import { searchDoctorHistoryAction } from "../../server/doctor-panel";
import { SessionCard } from "./session-card";

/** Past consultations, newest first, searchable by patient, note or summary. */
export function DoctorHistoryTab() {
  const t = useTranslations("Consultation.doctorPanel");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<VideoSessionListItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // A new query restarts from the first page; "more" appends the next one.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(
      () => {
        searchDoctorHistoryAction({ query, page })
          .then((result) => {
            if (cancelled) return;
            if (!result.ok || !result.data) {
              setFailed(true);
              return;
            }
            setFailed(false);
            const pageItems = result.data.items;
            setItems((prev) => (page === 0 ? pageItems : [...prev, ...pageItems]));
            setHasMore(result.data.hasMore);
          })
          .catch(() => !cancelled && setFailed(true))
          .finally(() => !cancelled && setLoading(false));
      },
      page === 0 ? 300 : 0
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, page]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          placeholder={t("historySearch")}
          className="w-full rounded-2xl border border-gray-200 bg-white py-3 ps-9 pe-3 text-sm outline-none focus:border-[#083f30]"
        />
      </div>

      {failed && <p className="py-6 text-center text-sm text-red-600">{t("errors.loadFailed")}</p>}

      {!failed && !loading && items.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-600">
          {query ? t("historyNoResults") : t("historyEmpty")}
        </p>
      )}

      <div className="space-y-2">
        {items.map((session) => (
          <SessionCard key={session.id} session={session} showDate />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-[#083f30]" aria-hidden />
        </div>
      )}

      {!loading && hasMore && (
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          className="w-full rounded-2xl border border-gray-200 bg-white py-3 text-sm font-medium text-[#083f30]"
        >
          {t("loadMore")}
        </button>
      )}
    </div>
  );
}
