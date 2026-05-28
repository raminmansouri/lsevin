import { listCustomerOrders } from "@/features/shop/api/order.repository";
export default async function OrdersPage() {
  const orders = await listCustomerOrders();
  return (
    <div className="min-h-screen bg-gray-50 px-5 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
      <div className="mt-6 space-y-4">{orders.length ? orders.map((order) => <a key={order.id} href={`/n/app/mobile/shop/orders/${order.orderNumber}`} className="block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><div className="font-semibold text-gray-900">{order.orderNumber}</div><div className="text-sm text-gray-500">{new Date(order.placedAt).toLocaleString()}</div></div><div className="text-right"><div className="font-semibold text-gray-900">{order.currency} {order.grandTotal.toFixed(2)}</div><div className="text-sm text-gray-500 capitalize">{order.status.replaceAll("_", " ")}</div></div></div></a>) : <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">No orders yet.</div>}</div>
    </div>
  );
}
