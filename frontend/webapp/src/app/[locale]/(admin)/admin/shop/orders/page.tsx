import { listAdminOrders } from "@/features/shop/api/admin.repository";
import { AdminDataTable } from "@/features/shop/components/AdminDataTable";
export default async function AdminOrdersPage() {
  const rows = await listAdminOrders();
  return <div className="min-h-screen bg-gray-50 px-6 py-6"><h1 className="mb-6 text-2xl font-bold text-gray-900">Orders</h1><AdminDataTable rows={rows} columns={[{ key: "order_number", label: "Order" }, { key: "email", label: "Email" }, { key: "status", label: "Order status" }, { key: "payment_status", label: "Payment" }, { key: "fulfillment_status", label: "Fulfillment" }, { key: "grand_total", label: "Total", render: (row) => `${row.currency} ${Number(row.grand_total).toFixed(2)}` }, { key: "placed_at", label: "Placed" }]} /></div>;
}
