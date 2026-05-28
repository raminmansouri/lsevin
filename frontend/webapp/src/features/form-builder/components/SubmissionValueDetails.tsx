"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { RuntimeServiceForm } from "../types";
import {
  buildDisplayValuesFromPayload,
  getRuntimeFormFields,
  type SubmissionDisplayValue,
} from "../lib/submission-display";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getFileUrl(value: unknown): string | null {
  if (typeof value === "string" && /^https?:\/\//i.test(value)) return value;
  if (isRecord(value) && typeof value.fileUrl === "string" && value.fileUrl.trim()) return value.fileUrl;
  if (isRecord(value) && typeof value.url === "string" && value.url.trim()) return value.url;
  return null;
}

function getFileLabel(value: unknown, fallback: string) {
  if (!isRecord(value)) return fallback;
  return String(value.originalName ?? value.storedName ?? value.fileName ?? value.fileUrl ?? fallback);
}

function formatPrimitive(value: unknown, emptyLabel: string, booleanLabels: { yes: string; no: string }) {
  if (value === undefined || value === null || value === "") return emptyLabel;
  if (typeof value === "boolean") return value ? booleanLabels.yes : booleanLabels.no;
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return null;
}

function ValueRenderer({ value, emptyLabel, booleanLabels }: { value: unknown; emptyLabel: string; booleanLabels: { yes: string; no: string } }) {
  const primitive = formatPrimitive(value, emptyLabel, booleanLabels);
  if (primitive !== null) return <span className="break-words">{primitive}</span>;

  const directFileUrl = getFileUrl(value);
  if (directFileUrl) {
    return (
      <a href={directFileUrl} target="_blank" rel="noreferrer" className="break-all font-semibold text-[#155e75] underline-offset-4 hover:underline">
        {getFileLabel(value, directFileUrl)}
      </a>
    );
  }

  if (Array.isArray(value)) {
    if (!value.length) return <span className="text-slate-400">{emptyLabel}</span>;

    return (
      <div className="space-y-2">
        {value.map((item, index) => {
          const fileUrl = getFileUrl(item);
          if (fileUrl) {
            return (
              <a key={index} href={fileUrl} target="_blank" rel="noreferrer" className="block break-all font-semibold text-[#155e75] underline-offset-4 hover:underline">
                {getFileLabel(item, `${index + 1}. ${fileUrl}`)}
              </a>
            );
          }

          const nestedPrimitive = formatPrimitive(item, emptyLabel, booleanLabels);
          return <div key={index}>{nestedPrimitive ?? JSON.stringify(item)}</div>;
        })}
      </div>
    );
  }

  if (isRecord(value)) {
    return <pre className="max-h-48 overflow-auto rounded-xl bg-slate-100 p-3 text-xs text-slate-700">{JSON.stringify(value, null, 2)}</pre>;
  }

  return <span className="text-slate-400">{emptyLabel}</span>;
}

export function SubmissionValueDetails({
  payload,
  displayValues,
  form,
  className,
}: {
  payload?: Record<string, unknown> | null;
  displayValues?: SubmissionDisplayValue[] | null;
  form?: RuntimeServiceForm;
  className?: string;
}) {
  const t = useTranslations("FormBuilder.pages");
  const commonT = useTranslations("FormBuilder.common");
  const values = displayValues ?? buildDisplayValuesFromPayload(payload, form ? getRuntimeFormFields(form) : []);
  const booleanLabels = { yes: commonT("yes"), no: commonT("no") };

  if (!values.length) {
    return (
      <div className={className ?? "rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500"}>
        {t("noSubmittedDetails")}
      </div>
    );
  }

  return (
    <div className={className ?? "overflow-hidden rounded-2xl border border-slate-200 bg-white"}>
      <div className="divide-y divide-slate-100">
        {values.map((item) => (
          <div key={item.key} className="grid gap-2 px-4 py-3 md:grid-cols-[240px_minmax(0,1fr)]">
            <div>
              <div className="text-sm font-bold text-slate-900">{item.label}</div>
              <div className="text-xs text-slate-400">{item.key}</div>
            </div>
            <div className="min-w-0 text-sm text-slate-700">
              <ValueRenderer value={item.value} emptyLabel={t("emptyValue")} booleanLabels={booleanLabels} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
