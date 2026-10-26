import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import type { DashboardData } from "../../server/admin/queries";

import { TOURS_PLATFORM_BASE } from "./paths";

function Stat({ label, value, href, tone }: { label: string; value: number | string; href?: string; tone?: "warn" | "danger" }) {
  const body = (
    <div className={`rounded-lg border p-4 ${tone === "danger" ? "border-rose-300" : tone === "warn" ? "border-amber-300" : ""}`}>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
  return href ? <Link href={href} className="block hover:opacity-90">{body}</Link> : body;
}

export function DashboardView({ data }: { data: DashboardData }) {
  const t = useTranslations("TourAdmin.dashboard");
  const ts = useTranslations("TourShared");
  const b = TOURS_PLATFORM_BASE;
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("reviewQueue")} value={data.reviewQueue} href={`${b}/tours?queue=1`} tone={data.reviewQueue > 0 ? "warn" : undefined} />
        <Stat label={t("departuresNext7")} value={data.departuresNext7Days} href={`${b}/departures`} />
        <Stat label={t("openIncidents")} value={`${data.openIncidents}${data.criticalIncidents ? ` (${data.criticalIncidents} ${t("critical")})` : ""}`} href={`${b}/incidents`} tone={data.criticalIncidents > 0 ? "danger" : undefined} />
        <Stat label={t("openDisputes")} value={data.openDisputes} href={`${b}/disputes`} />
        <Stat label={t("pendingMedia")} value={data.pendingMedia} href={`${b}/tours?queue=1`} />
        <Stat label={t("pendingReviews")} value={data.pendingReviews} href={`${b}/reviews`} />
        <Stat label={t("expiringQualifications")} value={data.expiringQualifications} href={`${b}/compliance`} tone={data.expiringQualifications > 0 ? "warn" : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border p-4" aria-labelledby="tours-by-status">
          <h2 id="tours-by-status" className="mb-3 font-semibold">{t("toursByStatus")}</h2>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {["draft", "submitted", "approved", "published", "paused", "rejected", "retired"].map((s) => (
              <li key={s} className="flex justify-between rounded-md border px-3 py-2">
                <Link href={`${b}/tours?status=${s}`} className="hover:underline">{ts(`tourStatus.${s}`)}</Link>
                <span className="tabular-nums">{data.toursByStatus[s] ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border p-4" aria-labelledby="bookings-by-status">
          <h2 id="bookings-by-status" className="mb-3 font-semibold">{t("bookingsByStatus")}</h2>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {["pending_payment", "requested", "confirmed", "completed", "cancelled", "declined", "expired", "no_show"].map((s) => (
              <li key={s} className="flex justify-between rounded-md border px-3 py-2">
                <Link href={`${b}/bookings?status=${s}`} className="hover:underline">{ts(`bookingStatus.${s}`)}</Link>
                <span className="tabular-nums">{data.bookingsByStatus[s] ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-lg border p-4" aria-labelledby="coverage">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="coverage" className="font-semibold">{t("coverage")}</h2>
          <Link href={`${b}/translations`} className="text-sm hover:underline">{t("coverageReport")}</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-muted-foreground text-start"><th className="p-2 text-start">{t("locale")}</th><th className="p-2 text-start">{t("complete")}</th><th className="p-2 text-start">{t("outdated")}</th></tr></thead>
            <tbody>
              {data.coverage.map((c) => (
                <tr key={c.locale} className="border-t">
                  <td className="p-2 font-mono" dir="ltr">{c.locale}</td>
                  <td className="p-2 tabular-nums">{c.complete} / {c.total}</td>
                  <td className="p-2 tabular-nums">{c.outdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 font-semibold">{t("legacy")}</h2>
        <p className="text-muted-foreground mb-2 text-sm">{t("legacyHint")}</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/tours" className="underline">{t("legacyDepartures")}</Link>
          <Link href="/admin/tour-gatherings" className="underline">{t("legacyGatherings")}</Link>
          <Link href="/admin/notification-templates" className="underline">{t("notificationTemplates")}</Link>
        </div>
      </section>
    </div>
  );
}
