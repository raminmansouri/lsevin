import { getCartView } from "@/features/shop/api/cart.repository";
export default async function CartPage() {
  const cart = await getCartView();
  return (
    <div className="min-h-screen bg-gray-50 px-5 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Cart</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,360px]">
        <section className="space-y-4">
          {cart.items.filter((x) => !x.savedForLater).length ? cart.items.filter((x) => !x.savedForLater).map((item) => (
            <article key={item.id} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="h-24 w-24 overflow-hidden rounded-xl bg-gray-50">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : null}</div>
              <div className="min-w-0 flex-1"><h2 className="line-clamp-1 font-semibold text-gray-900">{item.name}</h2><p className="mt-1 text-sm text-gray-500">Qty {item.quantity}</p><p className="mt-2 text-sm font-semibold text-[#083f30]">{item.currency} {(item.unitPrice * item.quantity).toFixed(2)}</p></div>
            </article>
          )) : <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">Your cart is empty.</div>}
        </section>
        <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{cart.totals.currency} {cart.totals.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>- {cart.totals.currency} {cart.totals.discountTotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{cart.totals.currency} {cart.totals.shippingTotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{cart.totals.currency} {cart.totals.taxTotal.toFixed(2)}</span></div>
            <div className="flex justify-between border-t pt-3 text-base font-bold"><span>Total</span><span>{cart.totals.currency} {cart.totals.grandTotal.toFixed(2)}</span></div>
          </div>
          <a href="/n/app/mobile/shop/checkout" className="mt-5 inline-flex w-full justify-center rounded-xl bg-[#083f30] px-4 py-3 font-semibold text-white">Proceed to checkout</a>
        </aside>
      </div>
    </div>
  );
}
