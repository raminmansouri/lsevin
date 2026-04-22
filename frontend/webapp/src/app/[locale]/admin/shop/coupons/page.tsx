import { listCoupons } from "@/features/shop/api/admin.repository";
import { AdminDataTable } from "@/features/shop/components/AdminDataTable";
export default async function AdminCouponsPage() {
  const rows = await listCoupons();
  return <div className="min-h-screen bg-gray-50 px-6 py-6"><h1 className="mb-6 text-2xl font-bold text-gray-900">Coupons</h1><AdminDataTable rows={rows} columns={[{ key: "code", label: "Code" }, { key: "coupon_type", label: "Type" }, { key: "value", label: "Value" }, { key: "is_active", label: "Active", render: (row) => row.is_active ? "Yes" : "No" }, { key: "stackable", label: "Stackable", render: (row) => row.stackable ? "Yes" : "No" }, { key: "expires_at", label: "Expires" }]} /></div>;
}
