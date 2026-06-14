import { getAdminDashboardSummary } from "@/features/shop/api/admin.repository";
export default async function AdminShopDashboardPage() {
  const summary = await getAdminDashboardSummary();
  const cards = [["Orders", summary.ordersCount], ["Revenue", `$${summary.revenue.toFixed(2)}`], ["Avg order", `$${summary.avgOrderValue.toFixed(2)}`], ["Products", summary.productCount], ["Active products", summary.activeProducts], ["Low stock", summary.lowStockCount]];
  return <div className="min-h-screen bg-gray-50 px-6 py-6"><h1 className="text-2xl font-bold text-gray-900">Shop dashboard</h1><div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">{cards.map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="text-sm text-gray-500">{String(label)}</div><div className="mt-2 text-2xl font-bold text-gray-900">{String(value)}</div></div>)}</div></div>;
}
