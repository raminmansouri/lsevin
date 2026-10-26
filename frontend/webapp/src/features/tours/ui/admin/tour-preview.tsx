import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { CALENDAR_IDS, calendarDisplayName, formatInstant, formatIsoDate } from "../../domain/calendar";
import { directionOf } from "../../domain/content";
import type { LocalizedText } from "../../server/platform/catalog";
import type { TourPreview } from "../../server/admin/preview";

import { selectClass } from "./styles";
import { TOURS_PLATFORM_BASE } from "./paths";

function money(amount: number | null, currency: string, locale: string, decimals: number) {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

/**
 * The customer's view of an unpublished tour (M-010, AT-27) rendered in the
 * selected content language and direction, display calendar and currency.
 * Every field that fell back to another language carries a visible label.
 */
export function TourPreviewView({ data, tourId }: { data: TourPreview; tourId: string }) {
  const t = useTranslations("TourAdmin.preview");
  const { detail, locale, calendar } = data;
  const fmtLocale = locale.split("-")[0];
  const dir = directionOf(locale);
  const fallbackNote = (v: LocalizedText) => (v && v.isFallback ? (
    <span className="ms-2 inline-block rounded bg-amber-100 px-1.5 text-xs text-amber-900" data-testid="fallback-badge" lang="en" dir="ltr">
      {t("fallback", { locale: v.locale })}
    </span>
  ) : null);
  const Text = ({ v, as: As = "p", className }: { v: LocalizedText; as?: "p" | "h1" | "div"; className?: string }) =>
    v ? (
      <As className={className}>
        <span lang={v.locale} dir={v.dir} className="whitespace-pre-wrap">{v.value}</span>
        {fallbackNote(v)}
      </As>
    ) : (
      <p className="text-muted-foreground text-sm">{t("missing")}</p>
    );
  const convert = (amount: number | null) => {
    if (amount == null || !data.currency.rate) return null;
    return money(amount * data.currency.rate.value, data.currency.target, fmtLocale, data.currency.targetDecimals);
  };
  const price = (amount: number | null) => (
    <>
      {money(amount, data.currency.base, fmtLocale, data.currency.baseDecimals)}
      {data.currency.target !== data.currency.base ? (
        <span className="text-muted-foreground ms-2 text-xs">
          {convert(amount) ? `≈ ${convert(amount)} (${t("indicative")})` : t("noRate", { currency: data.currency.target })}
        </span>
      ) : null}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`${TOURS_PLATFORM_BASE}/tours/${tourId}`} className="text-muted-foreground text-sm hover:underline">← {t("back")}</Link>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("hint", { status: detail.status })}</p>
        </div>
        <form method="get" className="flex flex-wrap items-end gap-2" aria-label={t("controls")}>
          <label className="space-y-1 text-sm"><span className="block">{t("language")}</span>
            <select name="lang" defaultValue={locale} className={selectClass}>
              {data.enabledLocales.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm"><span className="block">{t("calendar")}</span>
            <select name="calendar" defaultValue={calendar} className={selectClass}>
              {CALENDAR_IDS.map((c) => <option key={c} value={c}>{calendarDisplayName(c, "en")}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm"><span className="block">{t("currency")}</span>
            <select name="currency" defaultValue={data.currency.target} className={selectClass}>
              {data.currencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <Button type="submit" size="sm">{t("apply")}</Button>
        </form>
      </div>

      <article lang={locale} dir={dir} className="bg-background mx-auto max-w-3xl space-y-5 rounded-xl border p-5 shadow-sm" data-testid="customer-preview"
        data-locale={locale} data-dir={dir} data-calendar={calendar}>
        {detail.anyFallback ? <p className="rounded bg-amber-50 p-2 text-xs text-amber-900" lang="en" dir="ltr" data-testid="any-fallback">{t("anyFallback")}</p> : null}
        <Text v={detail.text.title} as="h1" className="text-2xl font-bold" />
        <div className="text-muted-foreground flex flex-wrap gap-2 text-sm">
          {detail.destination?.name ? <span lang={detail.destination.name.locale}>{detail.destination.name.value}</span> : null}
          <span>· {detail.provider.name?.value}</span>
          <span>· {new Intl.NumberFormat(fmtLocale).format(detail.facts.durationDays)}d</span>
        </div>
        {detail.media.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {detail.media.slice(0, 6).map((m) =>
              // eslint-disable-next-line @next/next/no-img-element -- preview shows pending media exactly as uploaded
              m.kind === "image" ? <img key={m.id} src={m.thumbnailUrl ?? m.url} alt={m.alt ?? ""} className="aspect-video w-full rounded object-cover" /> : null)}
          </div>
        ) : <p className="text-destructive text-sm">{t("noMedia")}</p>}
        <Text v={detail.text.summary} className="text-lg" />
        <Text v={detail.text.description} />
        {detail.text.highlights ? <section><h2 className="font-semibold">{t("highlights")}</h2><Text v={detail.text.highlights} /></section> : null}
        <section><h2 className="font-semibold">{t("meeting")}</h2><Text v={detail.text.meeting_instructions} /></section>
        <section><h2 className="font-semibold">{t("safety")}</h2><Text v={detail.text.safety_notes} /></section>

        {detail.itinerary.length > 0 ? (
          <section>
            <h2 className="font-semibold">{t("itinerary")}</h2>
            <ol className="mt-1 space-y-1 text-sm">
              {detail.itinerary.map((s) => (
                <li key={s.id}>
                  <span dir="ltr" className="font-mono text-xs">D{s.day}·{s.position}{s.startTime ? ` ${s.startTime}` : ""}</span>{" "}
                  {s.title ? <span lang={s.title.locale}>{s.title.value}</span> : <span className="text-muted-foreground">—</span>}
                  {fallbackNote(s.title)}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section>
          <h2 className="font-semibold">{t("prices")}</h2>
          <ul className="mt-1 space-y-1 text-sm" data-testid="preview-prices">
            {detail.options.map((o) => (
              <li key={o.id}>
                <strong>{o.label?.value ?? o.code}</strong>{fallbackNote(o.label)}:{" "}
                {o.kind === "private" ? price(o.privateGroupPrice) : o.tiers.map((x) => <span key={x.travelerClass} className="me-3">{x.travelerClass}: {price(x.amount)}</span>)}
              </li>
            ))}
          </ul>
          {data.currency.rate ? <p className="text-muted-foreground mt-1 text-xs" lang="en" dir="ltr">{t("rateNote", { base: data.currency.base, target: data.currency.target, rate: data.currency.rate.value, asOf: data.currency.rate.asOf.slice(0, 10) })}</p> : null}
        </section>

        <section>
          <h2 className="font-semibold">{t("departures")}</h2>
          <p className="text-muted-foreground text-xs">{t("calendarNote", { calendar: calendarDisplayName(calendar, fmtLocale), tz: detail.facts.timezone })}</p>
          <ul className="mt-1 space-y-1 text-sm" data-testid="preview-departures">
            {data.departures.map((d) => (
              <li key={d.id} data-iso={d.localDate}>
                <span>{formatIsoDate(d.localDate, { locale: fmtLocale, calendar, style: "full" })}</span>{" "}
                <span dir="ltr">{d.localTime}</span>{" "}
                <span className="text-muted-foreground text-xs">({formatInstant(d.startsAt, { locale: fmtLocale, calendar, timeZone: d.timezone, withZone: true })})</span>{" "}
                · {d.remaining}/{d.capacity} {d.priceFrom != null ? <>· {price(d.priceFrom)}</> : null}
              </li>
            ))}
            {data.departures.length === 0 ? <li className="text-muted-foreground">{t("noDepartures")}</li> : null}
          </ul>
        </section>

        <section>
          <h2 className="font-semibold">{t("cancellation")}</h2>
          {detail.policy ? (
            <>
              <Text v={detail.policy.text.cancellation} />
              <p dir="ltr" className="text-muted-foreground text-xs">{detail.policy.cancellationRules.map((r) => `≥${r.hoursBefore}h → ${r.refundPercent}%`).join(" · ")} (v{detail.policy.version})</p>
            </>
          ) : <p className="text-destructive text-sm">{t("noPolicy")}</p>}
        </section>
      </article>
    </div>
  );
}
