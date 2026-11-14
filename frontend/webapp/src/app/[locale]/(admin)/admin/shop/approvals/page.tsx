import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { approveSellerPartForm, rejectSellerPartForm } from "@/features/shop/actions/fulfilment-admin.actions";
import { assertShopPermission, SHOP_PERMISSIONS } from "@/features/shop/lib/permissions";
import { listPartsAwaitingApproval } from "@/features/shop/server/seller-fulfilment.service";

export const dynamic = "force-dynamic";

/**
 * Seller parts waiting for an admin: the seller (or, for Lsevin's own part, an admin) reported the
 * items delivered to the customer. Approve completes the part (the order completes with its last
 * part); reject sends it back with a reason.
 */
export default async function AdminShopApprovalsPage() {
  await assertShopPermission(SHOP_PERMISSIONS.ordersManage);
  const t = await getTranslations("ShopAdmin");
  const a = (k: string, v?: Record<string, string>) => t(`approvals.${k}` as never, v as never);
  const rows = await listPartsAwaitingApproval(await getLocale());

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{a("title")}</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">{t("nav.backToDashboard")}</Link>
      </div>
      <p className="mb-4 max-w-3xl text-xs text-gray-500">{a("hint")}</p>
      {!rows.length ? <p className="text-sm text-gray-400" data-testid="approvals-empty">{a("empty")}</p> : null}
      <div className="space-y-2" data-testid="approvals-list">
        {rows.map((row) => (
          <div key={`${row.orderId}:${row.sellerId}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="text-sm">
              <Link href={`/admin/shop/orders/${row.orderId}`} className="font-mono font-bold text-[#083f30]">{row.orderNumber}</Link>
              <span className="ms-2">🏪 {row.sellerName}</span>
              <span className="ms-2 text-xs text-gray-500">
                {t(`sellerParts.${row.type === "pickup" ? "typePickup" : "typeShipping"}` as never)}
                {row.trackingCode ? ` · ${row.trackingCode}` : ""}
                {" · "}
                {new Date(row.requestedAt).toLocaleString()}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <form action={approveSellerPartForm}>
                <input type="hidden" name="orderId" value={row.orderId} />
                <input type="hidden" name="sellerId" value={row.sellerId} />
                <button className="rounded bg-green-700 px-3 py-1.5 text-xs font-semibold text-white">{t("sellerParts.approve" as never)}</button>
              </form>
              <form action={rejectSellerPartForm} className="flex items-center gap-1">
                <input type="hidden" name="orderId" value={row.orderId} />
                <input type="hidden" name="sellerId" value={row.sellerId} />
                <input name="reason" required minLength={2} maxLength={500} placeholder={t("sellerParts.rejectReason" as never)} className="h-8 rounded border border-gray-300 px-2 text-xs" />
                <button className="rounded bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">{t("sellerParts.reject" as never)}</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
