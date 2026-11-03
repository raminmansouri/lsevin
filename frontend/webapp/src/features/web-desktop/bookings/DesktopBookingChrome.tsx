"use client";

import { ArrowLeft, Check, ChevronLeft, CreditCard, ImageOff } from "lucide-react";

/** Desktop booking header (>= 1280px): green band with the title and a horizontal step path. */
export function DesktopBookingHeader({
  title,
  subtitle,
  steps,
  currentIndex,
  onBack,
}: {
  title: string;
  subtitle: string;
  steps: { key: number | string; label: string }[];
  currentIndex: number;
  onBack: () => void;
}) {
  return (
    <section className="lsd hidden xl:block">
      <div className="mx-auto max-w-[1280px] px-5 pt-6">
        <div className="lsd-hero-bg overflow-hidden rounded-[32px] px-10 py-9 text-white">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <ArrowLeft size={19} className="rotate-180 ltr:rotate-0" />
            </button>
            <div>
              <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">RESERVATION</span>
              <h1 className="lsd-gold-text text-[30px] font-black leading-tight">{title}</h1>
              <p className="text-sm text-white/60">{subtitle}</p>
            </div>
          </div>

          {/* Step path */}
          <ol className="mt-8 flex items-center">
            {steps.map((step, index) => {
              const done = index < currentIndex;
              const current = index === currentIndex;
              return (
                <li key={step.key} className="flex flex-1 items-center last:flex-none">
                  <span className="flex items-center gap-3">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black transition ${
                        current
                          ? "bg-[#eacb7f] text-[#062a20] shadow-[0_0_0_6px_rgba(234,203,127,0.18)]"
                          : done
                            ? "bg-[#0f5a45] text-[#eacb7f] ring-1 ring-[#eacb7f]/40"
                            : "bg-white/10 text-white/50"
                      }`}
                    >
                      {done ? <Check size={17} /> : index + 1}
                    </span>
                    <span className={`whitespace-nowrap text-sm font-bold ${current ? "text-white" : done ? "text-white/75" : "text-white/40"}`}>
                      {step.label}
                    </span>
                  </span>
                  {index < steps.length - 1 ? (
                    <span className={`mx-4 h-px flex-1 ${done ? "bg-[#eacb7f]/60" : "bg-white/15"}`} aria-hidden="true" />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** Desktop booking summary (>= 1280px): sticky card with the selection, the price and the primary action. */
export function DesktopBookingSummary({
  imageUrl,
  serviceName,
  providerName,
  specialistName,
  whenLabel,
  lines,
  totalLabel,
  totalText,
  ctaLabel,
  ctaDisabled,
  isPayStep,
  onPrimary,
  note,
}: {
  imageUrl?: string | null;
  serviceName?: string | null;
  providerName?: string | null;
  specialistName?: string | null;
  whenLabel?: string | null;
  lines: { label: string; value: string; tone?: "discount" }[];
  totalLabel: string;
  totalText: string;
  ctaLabel: string;
  ctaDisabled: boolean;
  isPayStep: boolean;
  onPrimary: () => void;
  note?: string | null;
}) {
  return (
    <div className="sticky top-28 hidden overflow-hidden rounded-[28px] bg-white ring-1 ring-[#e7dcc4] xl:block">
      {/* The chosen service */}
      <div className="relative h-40 bg-[#062a20]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-[#eacb7f]/40">
            <ImageOff size={30} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#062a20] via-[#062a20]/40 to-transparent" />
        <div className="absolute inset-x-5 bottom-4 text-white">
          <p className="truncate text-lg font-black">{serviceName ?? "—"}</p>
          <p className="truncate text-sm text-white/70">{[providerName, specialistName].filter(Boolean).join(" · ") || "—"}</p>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {whenLabel ? (
          <p className="rounded-[16px] bg-[#fbf3de] px-4 py-3 text-sm font-bold text-[#8c6b2c]">{whenLabel}</p>
        ) : null}

        <div className="space-y-2.5 text-sm">
          {lines.map((line) => (
            <div key={line.label} className={`flex justify-between gap-4 ${line.tone === "discount" ? "text-[#0f5a45]" : "text-[#56675f]"}`}>
              <span>{line.label}</span>
              <span className="font-bold">{line.value}</span>
            </div>
          ))}
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-dashed border-[#e7dcc4] pt-4">
          <span className="text-sm text-[#6b6150]">{totalLabel}</span>
          <span className="text-[24px] font-black text-[#083f30] [overflow-wrap:anywhere]">{totalText}</span>
        </div>

        <button
          type="button"
          disabled={ctaDisabled}
          onClick={onPrimary}
          className={`flex h-14 w-full items-center justify-center gap-2 rounded-full text-sm font-black transition ${
            ctaDisabled
              ? "cursor-not-allowed bg-[#efe7d5] text-[#a8a08e]"
              : "lsd-champagne-bg border border-[#eacb7f] text-[#062a20] shadow-[0_18px_36px_-18px_rgba(234,203,127,0.7)] hover:-translate-y-0.5"
          }`}
        >
          {isPayStep ? <CreditCard size={17} /> : null}
          {ctaLabel}
          {!isPayStep ? <ChevronLeft size={17} className="ltr:rotate-180" /> : null}
        </button>
        {note ? <p className="text-xs leading-5 text-[#8a8170]">{note}</p> : null}
      </div>
    </div>
  );
}