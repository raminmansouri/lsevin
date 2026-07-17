'use client';

import { Check, Info } from 'lucide-react';
import React from 'react';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';

type Props = {
  title: string;
  subtitle?: string | null;
  trailing?: React.ReactNode;
  imageUrl?: string | null;
  selected: boolean;
  badge?: string | null;
  hasDetails?: boolean;
  onSelect: () => void;
  onDetails?: () => void;
};

/**
 * One option, ~72px. A 48px thumbnail carries enough identity to choose by; the cover
 * image, description and meta grid live in EntityDetailsSheet for anyone who wants them.
 * Decide with rows, learn with sheets.
 */
export function OptionRow({ title, subtitle, trailing, imageUrl, selected, badge, hasDetails, onSelect, onDetails }: Props) {
  const mediaSrc = resolveHomeMediaUrl(imageUrl);

  return (
    <div
      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 transition ${
        selected ? 'border-[#083f30] bg-[#083f30]/5 ring-1 ring-[#083f30]/20' : 'border-slate-200 bg-white'
      }`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-3 text-start"
      >
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          {mediaSrc ? (
            <ImageWithFallback fill src={mediaSrc} alt="" sizes="48px" className="object-cover" fallbackClassName="rounded-none" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[15px] font-bold text-slate-900">{title}</span>
            {badge ? (
              <span className="shrink-0 rounded-full bg-[#eacb7f] px-2 py-0.5 text-[10px] font-bold text-[#083f30]">{badge}</span>
            ) : null}
          </div>
          {subtitle ? <div className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</div> : null}
        </div>

        {trailing ? <div className="shrink-0 text-xs font-semibold text-[#155e75]">{trailing}</div> : null}

        <span
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
            selected ? 'border-[#083f30] bg-[#083f30]' : 'border-slate-300'
          }`}
        >
          {selected ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : null}
        </span>
      </button>

      {hasDetails ? (
        <button
          type="button"
          onClick={onDetails}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition-colors active:bg-slate-100"
        >
          <Info className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
