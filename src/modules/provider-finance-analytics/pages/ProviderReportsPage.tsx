import { ReportsDashboard } from "../components/ReportsDashboard";
import { getProviderReportsBundle, listReportSnapshots } from "../repository";
import { dateRangeFromSearch, requireParam, type ModulePageProps } from "./_helpers";
import { getProviderTimeZone } from "@core/providers/timezone";
import { getPortalLocale } from "@core/i18n/server";

export async function ProviderReportsPage({ params, searchParams }: ModulePageProps) {
  const providerId = requireParam(params, "providerId");
  const [timeZone, locale] = await Promise.all([getProviderTimeZone(providerId), getPortalLocale()]);
  const range = dateRangeFromSearch(searchParams, timeZone);
  const [reports, snapshots] = await Promise.all([
    getProviderReportsBundle(providerId, range),
    listReportSnapshots(providerId),
  ]);
  return <ReportsDashboard providerId={providerId} reports={reports} snapshots={snapshots} from={range.from} to={range.to} currencyCode={range.currencyCode} locale={locale.header} timeZone={timeZone} />;
}
