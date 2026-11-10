import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";

import { ApiTokenCreateForm } from "@/features/shop-api/components/ApiTokenCreateForm";
import { ApiTokenRevokeButton } from "@/features/shop-api/components/ApiTokenRevokeButton";
import { listApiTokens, listTokenSellers } from "@/features/shop-api/server/admin";

export const dynamic = "force-dynamic";

export default async function AdminShopApiTokensPage() {
  const t = await getTranslations("ShopAdmin.apiTokens");
  const tNav = await getTranslations("ShopAdmin.nav");
  const format = await getFormatter();
  const [tokens, sellers] = await Promise.all([listApiTokens(), listTokenSellers()]);
  const date = (value: Date | null) => (value ? format.dateTime(new Date(value), { dateStyle: "medium", timeStyle: "short" }) : "—");
  const status = (token: (typeof tokens)[number]) =>
    token.revokedAt ? "revoked" : token.expiresAt && new Date(token.expiresAt) <= new Date() ? "expired" : "active";

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <div className="flex items-center gap-3 text-sm font-medium">
          <Link href="/developers/shop-api" target="_blank" className="text-[#083f30] underline">{t("helpPage")}</Link>
          <Link href="/admin/shop/api-review" className="text-[#083f30]">{tNav("apiReview")}</Link>
          <Link href="/admin/shop" className="text-[#083f30]">{tNav("backToDashboard")}</Link>
        </div>
      </div>
      <p className="mb-6 max-w-3xl text-sm text-gray-600">{t("intro")}</p>

      <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white" data-testid="api-token-list">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-start text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 text-start">{t("colName")}</th>
                <th className="px-4 py-3 text-start">{t("colSeller")}</th>
                <th className="px-4 py-3 text-start">{t("colScopes")}</th>
                <th className="px-4 py-3 text-start">{t("colLastUsed")}</th>
                <th className="px-4 py-3 text-start">{t("colStatus")}</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tokens.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">{t("empty")}</td></tr>
              ) : null}
              {tokens.map((token) => {
                const state = status(token);
                return (
                  <tr key={token.id} data-testid="api-token-row" className={state === "active" ? "" : "text-gray-400"}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{token.name}</div>
                      <code dir="ltr" className="text-xs text-gray-500">{token.tokenPrefix}…</code>
                      <div className="text-[11px] text-gray-400">{t("created")} {date(token.createDate)}</div>
                    </td>
                    <td className="px-4 py-3">{token.sellerName}</td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {token.scopes.map((scope) => (
                          <code key={scope} dir="ltr" className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700">{scope}</code>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {date(token.lastUsedAt)}
                      {token.lastUsedIp ? <div dir="ltr" className="text-gray-400">{token.lastUsedIp}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${state === "active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                        {t(`status.${state}` as never)}
                      </span>
                      {token.expiresAt && state === "active" ? <div className="mt-1 text-gray-400">{t("expires")} {date(token.expiresAt)}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-end">
                      {state === "active" ? <ApiTokenRevokeButton tokenId={token.id} name={token.name} /> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ApiTokenCreateForm sellers={sellers} />
      </div>
    </div>
  );
}
