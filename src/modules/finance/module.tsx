import { NextResponse } from "next/server";
import type { ExtendedModuleDefinition } from "@core/modules/types";
import { LegacyFinancePage } from "./pages/LegacyFinancePage";
import { getFinanceSummary, listLedger, listPayoutAccounts } from "./repository";

const legacyFinanceModule: ExtendedModuleDefinition = {
  id: "provider-finance-legacy",
  name: "Provider Finance Legacy",
  version: "2.1.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/finance",
  routes: [{ key: "provider.finance.legacy", scope: "provider", path: "providers/:providerId/finance-legacy", title: "Finance legacy", icon: "creditcard", providerPermission: "manageFinance", component: LegacyFinancePage }],
  apiRoutes: [{ key: "api.provider.finance.legacy", method: "GET", path: "providers/:providerId/finance-legacy", providerPermission: "manageFinance", handler: async ({ params }) => { const [summary, ledger, accounts] = await Promise.all([getFinanceSummary(params.providerId), listLedger(params.providerId), listPayoutAccounts(params.providerId)]); return NextResponse.json({ summary, ledger, accounts }); } }],
  navigation: [],
};
export default legacyFinanceModule;
