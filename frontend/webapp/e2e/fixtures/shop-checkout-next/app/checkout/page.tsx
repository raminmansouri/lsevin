import CheckoutPage from "../../../../../src/app/[locale]/n/app/mobile/shop/checkout/page";

export const dynamic = "force-dynamic";
export default function Page() {
  return <CheckoutPage params={Promise.resolve({ locale: "fa" })} />;
}
