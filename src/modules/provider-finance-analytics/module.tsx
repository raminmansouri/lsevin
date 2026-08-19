import { AdminFinancePage } from "./pages/AdminFinancePage";
import { AdminReportsPage } from "./pages/AdminReportsPage";
import { AdminSettlementsPage } from "./pages/AdminSettlementsPage";
import { ProviderFinancePage } from "./pages/ProviderFinancePage";
import { ProviderReportsPage } from "./pages/ProviderReportsPage";
import { ProviderSettlementsPage } from "./pages/ProviderSettlementsPage";
import { ProviderWalletPage } from "./pages/ProviderWalletPage";
import { StaffFinanceHubPage } from "./pages/StaffFinanceHubPage";
import { StaffFinancePage } from "./pages/StaffFinancePage";
import type { ExtendedModuleDefinition } from "@core/modules/types";

export const providerFinanceAnalyticsModule: ExtendedModuleDefinition = {
  id: "provider-finance-analytics",
  name: "Provider Finance & Analytics",
  version: "1.3.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/provider-finance-analytics",
  migrations: ["migrations/001_provider_finance_analytics.sql", "migrations/001a_prepare_finance_view_reconciliation.sql", "migrations/002_finance_views_reconciliation.sql", "migrations/002_staff_compensation.sql"],
  routes: [
    {
      key: "provider.finance.overview",
      scope: "provider",
      path: "providers/:providerId/finance",
      title: "قسمت مالی",
      description: "Provider wallet, payable amount, withdrawals, settlements, and LSevin compensation summary.",
      icon: "wallet",
      providerPermission: "manageFinance",
      component: ProviderFinancePage,
    },
    {
      key: "provider.finance.wallet",
      scope: "provider",
      path: "providers/:providerId/finance/wallet",
      title: "کیف پول",
      description: "Provider wallet balances and money movement history.",
      icon: "wallet-cards",
      providerPermission: "manageFinance",
      component: ProviderWalletPage,
    },
    {
      key: "provider.finance.settlements",
      scope: "provider",
      path: "providers/:providerId/finance/settlements",
      title: "تسویه مالی",
      description: "Settlement batch history and payout status.",
      icon: "landmark",
      providerPermission: "manageFinance",
      component: ProviderSettlementsPage,
    },
    {
      key: "provider.reports",
      scope: "provider",
      path: "providers/:providerId/reports",
      title: "آمار و گزارش‌ها",
      description: "Revenue, booking, service, staff, and review analytics.",
      icon: "bar-chart-3",
      providerPermission: "viewAnalytics",
      component: ProviderReportsPage,
    },
    { key: "staff.finance.hub", scope: "portal", path: "staff/finance", title: "My earnings", icon: "wallet", component: StaffFinanceHubPage },
    { key: "staff.finance.detail", scope: "portal", path: "staff/:staffId/finance", title: "My earnings", icon: "wallet", component: StaffFinancePage },
    {
      key: "admin.finance.overview",
      scope: "admin",
      path: "admin/finance",
      title: "Finance Control",
      description: "LSevin-level compensation, transfers, wallet adjustments, withdrawals, and operational finance.",
      icon: "circle-dollar-sign",
      adminPermission: "FINANCE_ADMIN",
      component: AdminFinancePage,
    },
    {
      key: "admin.finance.settlements",
      scope: "admin",
      path: "admin/finance/settlements",
      title: "Settlement Control",
      description: "Create, approve, and mark provider settlement batches as paid.",
      icon: "receipt-text",
      adminPermission: "FINANCE_ADMIN",
      component: AdminSettlementsPage,
    },
    {
      key: "admin.reports",
      scope: "admin",
      path: "admin/reports",
      title: "Reports Control",
      description: "Provider-level detailed reports and saved report snapshots.",
      icon: "bar-chart-3",
      adminPermission: "FINANCE_ADMIN",
      component: AdminReportsPage,
    },
  ],
  navigation: [
    { scope: "portal", label: "My earnings", hrefTemplate: "/staff/finance", icon: "wallet", routeKey: "staff.finance.hub", order: 82 },
    { scope: "provider", label: "قسمت مالی", hrefTemplate: "/providers/:providerId/finance", icon: "wallet", routeKey: "provider.finance.overview", providerPermission: "manageFinance" },
    { scope: "provider", label: "کیف پول", hrefTemplate: "/providers/:providerId/finance/wallet", icon: "wallet-cards", routeKey: "provider.finance.wallet", providerPermission: "manageFinance" },
    { scope: "provider", label: "تسویه مالی", hrefTemplate: "/providers/:providerId/finance/settlements", icon: "landmark", routeKey: "provider.finance.settlements", providerPermission: "manageFinance" },
    { scope: "provider", label: "آمار و گزارش‌ها", hrefTemplate: "/providers/:providerId/reports", icon: "bar-chart-3", routeKey: "provider.reports", providerPermission: "viewAnalytics" },
    { scope: "admin", label: "Finance", hrefTemplate: "/admin/finance", icon: "circle-dollar-sign", routeKey: "admin.finance.overview", adminPermission: "FINANCE_ADMIN" },
    { scope: "admin", label: "Settlements", hrefTemplate: "/admin/finance/settlements", icon: "receipt-text", routeKey: "admin.finance.settlements", adminPermission: "FINANCE_ADMIN" },
    { scope: "admin", label: "Reports", hrefTemplate: "/admin/reports", icon: "bar-chart-3", routeKey: "admin.reports", adminPermission: "FINANCE_ADMIN" },
  ],
};

export default providerFinanceAnalyticsModule;
