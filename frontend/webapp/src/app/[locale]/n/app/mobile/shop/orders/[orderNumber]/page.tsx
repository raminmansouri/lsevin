import { getCustomerOrder } from "@/features/shop/api/order.repository";
export default async function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await getCustomerOrder(orderNumber);
  if (!order) return <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-600">Order not found.</div>;
  return (
    <div className="min-h-screen bg-gray-50 px-5 py-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1><p className="mt-1 text-sm text-gray-500">{new Date(order.placedAt).toLocaleString()}</p></div><div className="text-right"><div className="font-semibold text-gray-900">{order.currency} {order.grandTotal.toFixed(2)}</div><div className="text-sm capitalize text-gray-500">{order.status.replaceAll("_", " ")}</div></div></div></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,360px]">
        <section className="space-y-4">{order.items.map((item) => <div key={item.id} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className="h-20 w-20 overflow-hidden rounded-xl bg-gray-50">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : null}</div><div className="min-w-0 flex-1"><div className="font-semibold text-gray-900">{item.name}</div><div className="mt-1 text-sm text-gray-500">Qty {item.quantity}</div><div className="mt-2 text-sm font-medium">{order.currency} {item.lineTotal.toFixed(2)}</div></div></div>)}</section>
        <aside className="space-y-4"><div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-gray-900">Shipping</h2><div className="mt-3 space-y-2 text-sm text-gray-600"><div>{order.shippingAddress.full_name}</div><div>{order.shippingAddress.address_line_1}</div><div>{order.shippingAddress.city}, {order.shippingAddress.country}</div></div></div><div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-gray-900">Tracking</h2><div className="mt-3 space-y-2">{order.shipments.length ? order.shipments.map((shipment) => <div key={shipment.id} className="rounded-xl bg-gray-50 p-3 text-sm"><div className="font-medium text-gray-900">{shipment.shipmentNumber}</div><div className="text-gray-500">{shipment.carrier ?? "Carrier pending"}</div><div className="text-gray-500">{shipment.trackingNumber ?? "Tracking pending"}</div></div>) : <p className="text-sm text-gray-500">Shipment not created yet.</p>}</div></div></aside>
      </div>
    </div>
  );
}
