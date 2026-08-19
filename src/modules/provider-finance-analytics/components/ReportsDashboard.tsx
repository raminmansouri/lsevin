import { BarChart3, CalendarDays, Download, Star, Stethoscope, Users } from "lucide-react";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field } from "@core/ui/Field";
import { LocalizedDateInput } from "@core/ui/LocalizedDateInput";
import { StatCard } from "@core/ui/StatCard";
import { CurrencySelect } from "@core/ui/CurrencySelect";
import { formatDate, formatMoney, formatNumber } from "@core/lib/format";
import { createProviderReportSnapshotAction } from "../actions";
import type { ProviderReportsBundle, ReportSnapshot, ServicePerformanceRow, StaffPerformanceRow, TimeSeriesPoint } from "../types";
import { localizeReactTree } from "@core/i18n/localize-tree";

function maxNumber(items: TimeSeriesPoint[], key: keyof Pick<TimeSeriesPoint, "grossRevenue" | "bookingsCount">) {
  return Math.max(1, ...items.map((item) => Number(item[key] || 0)));
}

function MiniBars({ points, locale, timeZone }: { points: TimeSeriesPoint[]; locale: string; timeZone: string }) {
  const max = maxNumber(points, "grossRevenue");
  return (
    <div className="flex h-44 items-end gap-1 rounded-lg border border-border bg-muted/40 p-3">
      {points.map((point) => {
        const height = Math.max(4, (Number(point.grossRevenue) / max) * 100);
        return <div key={point.bucket} title={`${formatDate(point.bucket, locale, timeZone)}: ${point.grossRevenue}`} className="min-w-2 flex-1 rounded-t bg-primary/70" style={{ height: `${height}%` }} />;
      })}
    </div>
  );
}

function ServiceRows({ rows, currencyCode, locale }: { rows: ServicePerformanceRow[]; currencyCode: string; locale: string }) {
  return localizeReactTree((
    <div className="divide-y divide-border">
      {rows.length ? rows.map((row) => (
        <div key={row.serviceId} className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto_auto]">
          <div><div className="font-semibold" data-user-content>{row.serviceName}</div><div className="text-xs text-muted-foreground">{formatNumber(row.reviewCount, locale)} reviews · rating {row.rating ?? "—"}</div></div>
          <div className="text-sm text-muted-foreground">{formatNumber(row.bookingsCount, locale)} bookings</div>
          <div className="font-semibold">{formatMoney(row.grossRevenue, currencyCode, locale)}</div>
          <div className="font-semibold text-emerald-700">{formatMoney(row.providerPayableAmount, currencyCode, locale)}</div>
        </div>
      )) : <div className="p-5 text-sm text-muted-foreground">No service data for this period.</div>}
    </div>
  ), locale);
}

function StaffRows({ rows, currencyCode, locale }: { rows: StaffPerformanceRow[]; currencyCode: string; locale: string }) {
  return localizeReactTree((
    <div className="divide-y divide-border">
      {rows.length ? rows.map((row) => (
        <div key={row.staffId} className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto]">
          <div><div className="font-semibold" data-user-content>{row.staffName}</div><div className="text-xs text-muted-foreground">{formatNumber(row.reviewCount, locale)} reviews · rating {row.rating ?? "—"}</div></div>
          <div className="text-sm text-muted-foreground">{formatNumber(row.bookingsCount, locale)} bookings</div>
          <div className="font-semibold">{formatMoney(row.grossRevenue, currencyCode, locale)}</div>
        </div>
      )) : <div className="p-5 text-sm text-muted-foreground">No staff data for this period.</div>}
    </div>
  ), locale);
}

export function ReportsDashboard({ providerId, reports, snapshots, from, to, currencyCode, locale = "fa-IR", timeZone = "Asia/Tehran" }: { providerId: string; reports: ProviderReportsBundle; snapshots: ReportSnapshot[]; from: string; to: string; currencyCode: string; locale?: string; timeZone?: string }) {
  const { kpis, timeSeries, servicePerformance, staffPerformance } = reports;
  return localizeReactTree((
    <div className="space-y-5">
      <form className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
        <Field label="From"><LocalizedDateInput name="from" value={from} locale={locale} timeZone={timeZone} /></Field>
        <Field label="To"><LocalizedDateInput name="to" value={to} locale={locale} timeZone={timeZone} /></Field>
        <Field label="Currency"><CurrencySelect name="currencyCode" value={currencyCode} /></Field>
        <div className="flex items-end"><Button type="submit" variant="secondary"><CalendarDays size={16} /> Apply</Button></div>
      </form>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={BarChart3} label="Gross revenue" value={formatMoney(kpis.grossRevenue, kpis.currencyCode, locale)} />
        <StatCard icon={Stethoscope} label="Bookings" value={formatNumber(kpis.bookingsCount, locale)} />
        <StatCard icon={Users} label="Active services" value={formatNumber(kpis.activeServicesCount, locale)} />
        <StatCard icon={Star} label="Average rating" value={Number(kpis.averageRating || 0).toFixed(2)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_420px]">
        <Card>
          <CardHeader><CardTitle>Revenue trend</CardTitle></CardHeader>
          <CardContent><MiniBars points={timeSeries} locale={locale} timeZone={timeZone} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Report snapshot</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <form action={createProviderReportSnapshotAction}>
              <input type="hidden" name="providerId" value={providerId} />
              <input type="hidden" name="from" value={from} />
              <input type="hidden" name="to" value={to} />
              <input type="hidden" name="currencyCode" value={currencyCode} />
              <input type="hidden" name="timeZone" value={timeZone} />
              <Button type="submit"><Download size={16} /> Save current report</Button>
            </form>
            <div className="space-y-2">
              {snapshots.length ? snapshots.map((snapshot) => (
                <div key={snapshot.id} className="rounded-lg border border-border p-3">
                  <div className="font-semibold">{snapshot.title}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(snapshot.periodStart, locale, timeZone)} → {formatDate(snapshot.periodEnd, locale, timeZone)}</div>
                </div>
              )) : <p className="text-sm text-muted-foreground">No saved snapshots.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden"><CardHeader><CardTitle>Service performance</CardTitle></CardHeader><ServiceRows rows={servicePerformance} currencyCode={currencyCode} locale={locale} /></Card>
        <Card className="overflow-hidden"><CardHeader><CardTitle>Staff performance</CardTitle></CardHeader><StaffRows rows={staffPerformance} currencyCode={currencyCode} locale={locale} /></Card>
      </div>
    </div>
  ), locale);
}
