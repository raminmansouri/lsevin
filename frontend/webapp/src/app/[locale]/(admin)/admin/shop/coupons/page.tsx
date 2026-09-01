import Link from "next/link";

import { listCouponsAdmin } from "@/features/shop/api/admin.repository";
import { deleteCouponForm, upsertCouponForm } from "@/features/shop/actions/admin-catalog.actions";

export const dynamic = "force-dynamic";

const input = "h-9 w-full rounded border border-gray-300 px-2 text-sm";

export default async function AdminCouponsPage() {
  const coupons = await listCouponsAdmin();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <Link href="/admin/shop" className="text-sm font-medium text-[#083f30]">← Dashboard</Link>
      </div>
      <p className="mb-4 text-xs text-gray-500">
        Server-side eligibility (window, min subtotal, usage limits, currency conversion) is enforced at
        cart + checkout re-quote (SHP-CHK-002, SHP-V02-004). `cart` and `free_shipping` scopes are fully
        applied today; product/category/brand scopes fall back to cart level.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Code</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Value</th>
                <th className="px-3 py-2">Min</th><th className="px-3 py-2">Used</th><th className="px-3 py-2">Status</th><th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((c: any) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 font-mono font-semibold">{c.code}</td>
                  <td className="px-3 py-2 text-xs">{c.coupon_type}</td>
                  <td className="px-3 py-2">
                    {c.coupon_type === "percentage" ? `${c.value}%` : c.coupon_type === "fixed" ? `${c.currency ?? ""} ${Number(c.value).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">{c.currency ?? ""} {Number(c.min_subtotal).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs">{c.redemptions}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {c.is_active ? "active" : "off"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <form action={deleteCouponForm}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-xs text-red-600">disable</button>
                    </form>
                  </td>
                </tr>
              ))}
              {!coupons.length ? <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">No coupons yet.</td></tr> : null}
            </tbody>
          </table>
        </div>

        <form action={upsertCouponForm} className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900">New coupon</h2>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">Code<input name="code" required className={input} /></label>
            <label className="text-sm">Type
              <select name="couponType" className={input}>
                <option value="percentage">percentage</option>
                <option value="fixed">fixed</option>
                <option value="free_shipping">free_shipping</option>
              </select>
            </label>
            <label className="text-sm">Value<input name="value" type="number" step="0.01" defaultValue={0} className={input} /></label>
            <label className="text-sm">Currency (fixed only)<input name="currency" placeholder="USD" className={input} /></label>
            <label className="text-sm">Min subtotal<input name="minSubtotal" type="number" step="0.01" defaultValue={0} className={input} /></label>
            <label className="text-sm">Max discount<input name="maxDiscountAmount" type="number" step="0.01" className={input} /></label>
            <label className="text-sm">Usage limit<input name="usageLimit" type="number" className={input} /></label>
            <label className="text-sm">Per customer<input name="usagePerCustomer" type="number" className={input} /></label>
            <label className="text-sm">Scope
              <select name="scope" className={input}>
                <option value="cart">cart</option>
                <option value="shipping">shipping</option>
                <option value="product">product</option>
                <option value="category">category</option>
                <option value="brand">brand</option>
              </select>
            </label>
            <label className="text-sm">Starts at<input name="startsAt" type="datetime-local" className={input} /></label>
            <label className="text-sm">Expires at<input name="expiresAt" type="datetime-local" className={input} /></label>
            <label className="mt-5 flex items-center gap-1 text-sm"><input type="checkbox" name="isActive" defaultChecked /> active</label>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <input name="title_en" placeholder="Title EN" className={input} />
            <input name="title_fa" placeholder="عنوان" className={input} dir="rtl" />
            <input name="title_ar" placeholder="عنوان" className={input} dir="rtl" />
          </div>
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="stackable" /> stackable</label>
          <button className="rounded-lg bg-[#083f30] px-4 py-2 text-sm font-semibold text-white">Save coupon</button>
        </form>
      </div>
    </div>
  );
}
