"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { CALENDAR_IDS, isCalendarId } from "../../domain/calendar";
import { directionOf } from "../../domain/content";

import { localeName, useAdminDates } from "./inputs";
import { selectClass } from "./styles";

type Data = {
  locales: string[]; startsAt: string; timeZone: string;
  rows: { kind: string; byLocale: { locale: string; calendar: string; title: string; body: string; localeUsed: string; fellBack: boolean }[] }[];
};

/** Per-language previews of the tour booking notifications (M-024), rendered by the sending function itself. */
export function NotificationPreviews({ data, selected }: { data: Data; selected: string }) {
  const t = useTranslations("TourAdmin.notifications");
  const tc = useTranslations("TourShared.calendar");
  const locale = useLocale();
  const dates = useAdminDates();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <form method="get" className="flex items-end gap-2">
          <label className="space-y-1 text-sm"><span className="block">{tc("label")}</span>
            <select name="calendar" defaultValue={selected} className={selectClass}>
              <option value="">{t("perLocaleDefault")}</option>
              {CALENDAR_IDS.map((c) => <option key={c} value={c}>{tc(c)}</option>)}
            </select>
          </label>
          <Button type="submit" size="sm">{t("apply")}</Button>
        </form>
        <Link href="/admin/notification-templates" className="text-sm underline">{t("templates")}</Link>
      </div>
      <p className="text-muted-foreground text-xs" data-iso={data.startsAt}>{t("sample", { at: dates.instant(data.startsAt, data.timeZone), tz: data.timeZone })}</p>
      {data.rows.map((r) => (
        <section key={r.kind} className="rounded-lg border p-3" data-kind={r.kind}>
          <h2 className="mb-2 font-semibold">{t(`kind.${r.kind}`)} <span className="text-muted-foreground font-mono text-xs" dir="ltr">({r.kind})</span></h2>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {r.byLocale.map((x) => (
              <div key={x.locale} className="rounded border p-2 text-sm" data-locale={x.locale} data-fellback={x.fellBack}>
                <p className="text-muted-foreground text-xs" title={x.locale}>{localeName(x.locale, locale)} · {isCalendarId(x.calendar) ? tc(x.calendar) : x.calendar}{x.fellBack ? ` · ${t("fallback", { locale: localeName(x.localeUsed, locale) })}` : ""}</p>
                <div lang={x.localeUsed} dir={directionOf(x.localeUsed)}>
                  <p className="font-medium">{x.title}</p>
                  <p>{x.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
