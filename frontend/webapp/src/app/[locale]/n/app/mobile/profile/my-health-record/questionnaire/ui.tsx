"use client";

import type { ReactNode } from "react";

/** Small shared building blocks for the questionnaire steps. */

export function StepHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-black text-[#0e1a16] xl:text-2xl">{title}</h2>
      {hint ? <p className="mt-1.5 text-sm leading-6 text-[#6b6150]">{hint}</p> : null}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-[#0e1a16]">{label}</span>
      {hint ? <span className="mt-0.5 block text-xs leading-5 text-[#8a806d]">{hint}</span> : null}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-[#e7dcc4] bg-white px-4 py-3 text-sm text-[#0e1a16] outline-none transition placeholder:text-[#b5ab97] focus:border-[#0f5a45] focus:ring-2 focus:ring-[#0f5a45]/15";

/** A row of pill buttons for picking one answer. Clicking the selected pill clears it. */
export function Choice<T extends string>({
  value,
  options,
  onChange,
  columns,
}: {
  value: NoInfer<T> | undefined | null;
  options: { value: T; label: string }[];
  onChange: (value: NoInfer<T> | undefined) => void;
  columns?: 2 | 3 | 4;
}) {
  const grid = columns === 4 ? "grid-cols-2 sm:grid-cols-4" : columns === 3 ? "grid-cols-3" : columns === 2 ? "grid-cols-2" : "";
  return (
    <div className={grid ? `grid gap-2 ${grid}` : "flex flex-wrap gap-2"}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? undefined : option.value)}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              selected
                ? "bg-[#083f30] text-white shadow-sm"
                : "bg-white text-[#3d362a] ring-1 ring-[#e7dcc4] hover:ring-[#c9a55a]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Card({ children, tone }: { children: ReactNode; tone?: "alert" | "muted" }) {
  const toneClass =
    tone === "alert" ? "bg-red-50 ring-red-200" : tone === "muted" ? "bg-[#f6f1e6] ring-[#efe5cf]" : "bg-white ring-[#e7dcc4]";
  return <div className={`rounded-[22px] p-5 ring-1 ${toneClass}`}>{children}</div>;
}
