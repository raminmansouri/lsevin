"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";

import { searchPatientsAction } from "../../server/actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";
import type { PatientSearchResultRow } from "../../types";

/**
 * Lets admin resolve a "no automatic match" link request (link-requests-
 * panel.tsx) to a real patient by name/identifier search, instead of that
 * request being a permanent dead end (Approve was previously always
 * disabled with no match). Only ever picks an EXISTING patient -- if none
 * exists yet, admin still creates it the normal way on /admin/patients
 * first, this just avoids leaving the request stuck with no path forward.
 */
export function PatientSearchPicker({ onSelect }: { onSelect: (patient: PatientSearchResultRow) => void }) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResultRow[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const result = await searchPatientsAction({ q: trimmed, limit: 8 });
        setResults(result.ok && result.data ? result.data : []);
        setOpen(true);
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="relative w-48">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={t("admin.linkRequests.searchPatientPlaceholder")}
        className="h-8 text-xs"
      />
      {open && (
        <div className="bg-popover absolute z-10 mt-1 w-64 rounded-md border shadow-md">
          {results.length === 0 ? (
            <p className="text-muted-foreground px-2 py-1.5 text-xs">{t("admin.linkRequests.noSearchResults")}</p>
          ) : (
            results.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => {
                  onSelect(patient);
                  setQuery("");
                  setResults([]);
                  setOpen(false);
                }}
                className="hover:bg-muted block w-full px-2 py-1.5 text-start text-xs"
              >
                {patient.firstName} {patient.lastName}{" "}
                <span dir="ltr" className="text-muted-foreground">
                  ({patient.publicId})
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
