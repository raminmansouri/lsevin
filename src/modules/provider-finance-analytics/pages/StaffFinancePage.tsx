import { requireCurrentUser } from "@core/auth/session";
import { requireStaffProfilePermission } from "@core/auth/permissions";
import { StaffEarningsDashboard } from "../components/StaffEarningsDashboard";
import { dateRangeFromSearch, requireParam, type ModulePageProps } from "./_helpers";
import { getBookingEarningsSummary, listProviderBookingEarnings, listStaffFinanceProfilesForUser } from "../repository";
import { getProviderTimeZone } from "@core/providers/timezone";
import { getPortalLocale } from "@core/i18n/server";

export async function StaffFinancePage({ params, searchParams }: ModulePageProps) {
  const user = await requireCurrentUser();
  const staffId = requireParam(params, "staffId");
  const claim = await requireStaffProfilePermission(user.id, staffId, "viewOwnFinance");
  if (!claim.serviceProviderId) throw new Error("Active provider scope is required.");
  const [timeZone, locale] = await Promise.all([getProviderTimeZone(claim.serviceProviderId), getPortalLocale()]);
  const range = dateRangeFromSearch(searchParams, timeZone);
  const [rows, summary, profiles] = await Promise.all([
    listProviderBookingEarnings({ providerId: claim.serviceProviderId, staffId, range, limit: 300 }),
    getBookingEarningsSummary({ providerId: claim.serviceProviderId, staffId, range }),
    listStaffFinanceProfilesForUser(user.id),
  ]);
  const profile = profiles.find(item => item.staffId === staffId && item.providerId === claim.serviceProviderId);
  return <StaffEarningsDashboard staffName={profile?.staffName || "Staff"} providerName={profile?.providerName || "Provider"} from={range.from} to={range.to} currencyCode={range.currencyCode} rows={rows} summary={summary} locale={locale.header} timeZone={timeZone}/>;
}
