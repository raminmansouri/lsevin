"use client";

import { OptionMultiSelect } from "@/features/tours/ui/admin/inputs";
import type { Amenity } from "../../types";

export function AmenityFields({
  amenities,
  values,
  onChange,
  testId,
}: {
  amenities: Amenity[];
  values: string[];
  onChange: (v: string[]) => void;
  testId?: string;
}) {
  const roots = amenities.filter((a) => !a.parentCode);
  const children = amenities.filter((a) => a.parentCode);
  const childCodes = new Set(children.map((a) => a.code));
  const selected = values.filter((v) => !childCodes.has(v));
  return (
    <div className="space-y-3">
      <OptionMultiSelect
        testId={testId}
        values={selected}
        options={roots.map((a) => ({ value: a.code, label: a.label }))}
        onChange={(next) =>
          onChange([
            ...next,
            ...children
              .filter(
                (a) => next.includes(a.parentCode!) && values.includes(a.code),
              )
              .map((a) => a.code),
          ])
        }
      />
      {roots
        .filter((a) => selected.includes(a.code))
        .map((a) => {
          const options = children.filter(
            (child) => child.parentCode === a.code,
          );
          if (!options.length) return null;
          return (
            <label key={a.code} className="block text-sm">
              {a.label}
              <select
                aria-label={a.label}
                className="block rounded-md border p-2"
                value={options.find((o) => values.includes(o.code))?.code ?? ""}
                onChange={(e) =>
                  onChange([
                    ...values.filter((v) => !options.some((o) => o.code === v)),
                    ...(e.target.value ? [e.target.value] : []),
                  ])
                }
              >
                <option value="">—</option>
                {options.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
    </div>
  );
}
