"use client";

import { useId, useState, useTransition } from "react";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link, usePathname } from "@/i18n/navigation";

import { createInquiryAction } from "../../../server/actions/customer";
import { CalendarPicker } from "../../shared/calendar-picker";
import { ToursErrorAlert, type ToursActionError } from "../../shared/error-alert";
import { useTourDateFormat } from "../common";
import { useToursPrefs } from "../prefs-context";

/** Private-tour quote / group reservation request needing operator approval (C-101). */
export function InquiryDialog({ tourId, triggerClassName }: { tourId: string; triggerClassName?: string }) {
  const t = useTranslations("TourApp.detail.inquiry");
  const tb = useTranslations("TourApp.booking");
  const locale = useLocale();
  const prefs = useToursPrefs();
  const fmt = useTourDateFormat();
  const pathname = usePathname();
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"private_quote" | "group">("private_quote");
  const [party, setParty] = useState(2);
  const [dates, setDates] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<ToursActionError | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={triggerClassName} data-testid="open-inquiry">
          {t("title")}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto">
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{t("body")}</DialogDescription>
        {!prefs.signedIn ? (
          <Link href={`/sign-in?redirectTo=${encodeURIComponent(pathname)}`} className="flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white">
            {t("signIn")}
          </Link>
        ) : sent ? (
          <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900" data-testid="inquiry-sent">
            {t("sent")}
          </p>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              start(async () => {
                const res = await createInquiryAction({ tourId, kind, partySize: party, preferredDates: dates, message }).catch(() => null);
                if (!res?.ok) {
                  setError(res && !res.ok ? res.error : { kind: "infrastructure", code: "service_unavailable" });
                  return;
                }
                setSent(true);
              });
            }}
          >
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">{t("kind")}</legend>
              {(["private_quote", "group"] as const).map((k) => (
                <label key={k} className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="radio" name={`${ids}-kind`} checked={kind === k} onChange={() => setKind(k)} className="size-5 accent-emerald-700" />
                  {t(k)}
                </label>
              ))}
            </fieldset>
            <div className="space-y-1">
              <label htmlFor={`${ids}-party`} className="text-sm font-semibold">
                {t("partySize")}
              </label>
              <input id={`${ids}-party`} type="number" min={1} max={500} value={party} onChange={(e) => setParty(Math.max(1, Number(e.target.value) || 1))} className="min-h-11 w-full rounded-xl border border-slate-300 px-3" />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-semibold">{t("dates")}</span>
              <CalendarPicker
                calendar={prefs.calendar}
                locale={locale}
                value={null}
                minIso={new Date().toISOString().slice(0, 10)}
                onChange={(iso) => setDates((d) => (d.includes(iso) || d.length >= 5 ? d : [...d, iso].sort()))}
                labels={{ previousMonth: tb("previousMonth"), nextMonth: tb("nextMonth"), grid: t("dates") }}
              />
              {dates.length ? (
                <ul className="flex flex-wrap gap-2">
                  {dates.map((d) => (
                    <li key={d}>
                      <button type="button" onClick={() => setDates((x) => x.filter((y) => y !== d))} className="inline-flex min-h-11 items-center gap-1 rounded-full bg-emerald-50 px-3 text-sm text-emerald-900" aria-label={`${fmt.date(d)} ×`}>
                        {fmt.date(d)}
                        <X className="size-3" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="space-y-1">
              <label htmlFor={`${ids}-msg`} className="text-sm font-semibold">
                {t("message")}
              </label>
              <textarea id={`${ids}-msg`} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} rows={4} className="w-full rounded-xl border border-slate-300 p-3 text-sm" />
            </div>
            <ToursErrorAlert error={error} />
            <button type="submit" disabled={pending} className="min-h-12 w-full rounded-xl bg-emerald-700 text-sm font-semibold text-white disabled:opacity-60">
              {t("send")}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
