import { listInventoryRows } from "@/features/shop/api/admin.repository";
import { AdminDataTable } from "@/features/shop/components/AdminDataTable";
export default async function AdminInventoryPage() {
  const rows = await listInventoryRows();
  return <div className="min-h-screen bg-gray-50 px-6 py-6"><h1 className="mb-6 text-2xl font-bold text-gray-900">Inventory</h1><AdminDataTable rows={rows} columns={[{ key: "product_name", label: "Product" }, { key: "sku", label: "SKU" }, { key: "warehouse_name", label: "Warehouse" }, { key: "on_hand", label: "On hand" }, { key: "reserved", label: "Reserved" }, { key: "available", label: "Available" }, { key: "reorder_threshold", label: "Reorder threshold" }]} /></div>;
}
