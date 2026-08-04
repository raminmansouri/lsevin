"use client";

import { useActionState } from "react";

import type { AttachmentRow } from "@/accounting/server/attachments.service";

import {
  addAttachmentAction,
  deleteAttachmentAction,
  type ActionState,
} from "../dimension-actions";

const KIND_LABEL: Record<string, string> = {
  invoice: "فاکتور",
  receipt: "رسید",
  bank_advice: "اعلامیهٔ بانکی",
  contract: "قرارداد",
  other: "سایر",
};

function humanSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function EntryAttachments({
  entryId,
  attachments,
  editable,
}: {
  entryId: string;
  attachments: AttachmentRow[];
  editable: boolean;
}) {
  const [addState, add, adding] = useActionState<ActionState, FormData>(addAttachmentAction, {});
  const [delState, remove, removing] = useActionState<ActionState, FormData>(
    deleteAttachmentAction,
    {}
  );

  return (
    <div className="space-y-2">
      {attachments.length > 0 && (
        <ul className="space-y-1">
          {attachments.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-2 text-xs">
              <a
                href={`/financial/attachments/${a.id}`}
                className="text-blue-700 underline"
                download
              >
                {a.fileName}
              </a>
              <span className="text-muted-foreground">
                {KIND_LABEL[a.kind] ?? a.kind} · {humanSize(a.sizeBytes)}
              </span>
              {/* The checksum is what later proves the file was not swapped. */}
              {a.sha256 && (
                <span className="text-muted-foreground font-mono" dir="ltr" title={a.sha256}>
                  {a.sha256.slice(0, 8)}
                </span>
              )}
              {editable && (
                <form action={remove} className="inline">
                  <input type="hidden" name="id" value={a.id} />
                  <button
                    type="submit"
                    disabled={removing}
                    className="text-red-600 disabled:opacity-40"
                  >
                    حذف
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <form action={add} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="entry-id" value={entryId} />
        <input
          type="file"
          name="file"
          accept="application/pdf,image/*"
          required
          className="max-w-52 text-xs"
        />
        <select name="kind" defaultValue="invoice" className="rounded border p-1 text-xs">
          {Object.entries(KIND_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={adding}
          className="rounded border px-2 py-1 text-xs disabled:opacity-40"
        >
          {adding ? "…" : "افزودن ضمیمه"}
        </button>
      </form>

      {(addState.error || delState.error) && (
        <p className="text-xs text-red-600">{addState.error ?? delState.error}</p>
      )}
    </div>
  );
}
