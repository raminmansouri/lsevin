import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { listSellerOffersAdmin, listSellersAdmin } from "@/features/shop/api/admin.repository";
import { upsertOfferForm } from "@/features/shop/actions/admin-catalog.actions";
import { PendingSubmitButton } from "@/features/shop/components/admin/PendingSubmitButton";

export const dynamic = "force-dynamic";

const input = "h-8 w-full rounded border border-gray-300 px-2 text-sm";

/** One seller's products: price, stock and shipping for each, editable in place. */
export default async function AdminSellerOffersPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("ShopAdmin");
  const { id } = await params;
  const [sellers, offers] = await Promise.all([listSellersAdmin(), listSellerOffersAdmin(id)]);
  const seller = sellers.find((s: any) => s.id === id);
  if (!seller) notFound();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("sellerOffers.title", { name: seller.name })}</h1>
        <div className="flex items-center gap-3">
          <Link href={`/admin/shop/sellers?edit=${seller.id}`} className="text-sm font-medium text-[#083f30]">{t("sellerOffers.editSeller")}</Link>
          <Link href="/admin/shop/sellers" className="text-sm font-medium text-[#083f30]">{t("sellerOffers.back")}</Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">{t("sellerOffers.colProduct")}</th>
              <th className="px-4 py-3" colSpan={2}>{t("sellerOffers.colTerms")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {offers.map((o: any) => (
              <tr key={o.id} className={o.low_stock ? "bg-red-50/60" : ""}>
                <td className="px-4 py-3 align-top">
                  <Link href={`/admin/shop/products/${o.product_id}`} className="font-medium text-[#083f30] hover:underline">{o.product_name}</Link>
                  {o.variant_title ? <div className="text-xs text-gray-500">{o.variant_title}</div> : null}
                  {o.low_stock ? <div className="mt-1 text-xs font-semibold text-red-600">{t("sellerOffers.lowStock")}</div> : null}
                </td>
                <td className="px-4 py-3" colSpan={2}>
                  <form action={upsertOfferForm} className="grid grid-cols-2 items-end gap-2 md:grid-cols-6">
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="productId" value={o.product_id} />
                    <input type="hidden" name="currency" value={o.currency} />
                    <label className="text-[11px] text-gray-500 md:col-span-2">{t("offers.price")} ({o.currency})
                      <input name="price" type="number" step="0.01" min="0" required defaultValue={o.price} className={input} />
                    </label>
                    <label className="text-[11px] text-gray-500">{t("offers.compareAt")}
                      <input name="compareAtPrice" type="number" step="0.01" min="0" defaultValue={o.compare_at_price ?? ""} className={input} />
                    </label>
                    <label className="text-[11px] text-gray-500">{t("offers.stock")}
                      <input name="stockQuantity" type="number" min="0" defaultValue={o.stock_quantity ?? ""} placeholder="—" className={input} />
                    </label>
                    <label className="text-[11px] text-gray-500">{t("offers.handlingDays")}
                      <input name="handlingDays" type="number" min="0" defaultValue={o.handling_days ?? ""} className={input} />
                    </label>
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="isActive" defaultChecked={o.is_active} /> {t("common.activeShort")}</label>
                      <PendingSubmitButton className="rounded bg-[#083f30] px-3 py-1.5 text-xs font-semibold text-white">{t("common.save")}</PendingSubmitButton>
                    </div>
                  </form>
                </td>
              </tr>
            ))}
            {!offers.length ? (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-400">{t("sellerOffers.none")}</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}