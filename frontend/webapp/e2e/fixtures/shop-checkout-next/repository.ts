// Only persistence and the external gateway are substituted. Next.js, the actual
// checkout page/client/actions, redirects and cache revalidation run unchanged.
const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export function state(): {
  converted: boolean;
  orders: number;
  attempts: number;
  failFirst: boolean;
} {
  const target = globalThis as any;
  return (target.__checkoutRegression ??= {
    converted: false,
    orders: 0,
    attempts: 0,
    failFirst: false,
  });
}
export const quote = {
  cartId: id,
  currency: "IRR",
  totals: {
    subtotal: 1000000,
    grandTotal: 1000000,
    shippingTotal: 0,
    taxTotal: 0,
    discountTotal: 0,
    currency: "IRR",
    hasUnavailablePrice: false,
  },
  deliveryOptions: [{ id, code: "delivery", name: "ارسال", fee: 0 }],
  selectedDeliveryMethodId: id,
  paymentCurrency: "IRR",
  paymentTotal: 1000000,
  blockingIssues: [],
};
export async function getShopContext() {
  return {
    locale: "fa",
    email: "buyer@example.invalid",
    userId: id,
    customerId: id,
  };
}
export function normalizeLocale(locale: string) {
  return locale;
}
export async function getCartView() {
  return {
    id: state().converted ? null : id,
    currency: "IRR",
    itemCount: state().converted ? 0 : 1,
    items: state().converted
      ? []
      : [
          {
            id,
            name: "محصول آزمایشی",
            quantity: 1,
            lineTotal: 1000000,
            currency: "IRR",
            savedForLater: false,
          },
        ],
  };
}
export async function getPaymentMethods() {
  return [
    {
      id,
      code: "zarinpal",
      name: "پرداخت آنلاین",
      description: "",
      currency: "IRR",
    },
  ];
}
export async function quoteCheckout() {
  return quote;
}
export async function listCustomerAddresses() {
  return [
    {
      id,
      isDefault: true,
      fullName: "مشتری آزمایشی",
      country: "IR",
      city: "تهران",
      addressLine1: "خیابان آزمایشی ۱۲۳",
    },
  ];
}
export async function saveCustomerAddress() {
  return id;
}
export async function deleteCustomerAddress() {}
export async function emitCommerceEvent() {}
export async function placeOrder() {
  if (!state().converted) state().orders++;
  state().converted = true;
  return {
    orderId: id,
    orderNumber: "TEST-ORDER",
    currency: "IRR",
    grandTotal: 1000000,
  };
}
export async function startOrderPayment() {
  state().attempts++;
  if (state().failFirst && state().attempts === 1)
    throw new Error("Gateway unavailable");
  return {
    mode: "redirect" as const,
    redirectUrl: "/gateway",
    transactionId: id,
    provider: "zarinpal",
  };
}
