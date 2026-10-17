import React, { useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import { createRoot } from "react-dom/client";

import messages from "../../../messages/fa.json";
import { PaymentMethodsPanel } from "../../../src/features/booking-pro/components/PaymentMethodsPanel";
import { CascadeConfirmSheet } from "../../../src/features/booking-pro/components/step-service/CascadeConfirmSheet";
import { ConfirmedRow } from "../../../src/features/booking-pro/components/step-service/ConfirmedRow";
import { EntityDetailsSheet } from "../../../src/features/booking-pro/components/step-service/EntityDetailsSheet";
import { CheckoutClient } from "../../../src/features/shop/components/CheckoutClient";
import { useSectionScroll } from "../../../src/hooks/use-section-scroll";

import "./style.css";

const longTitle =
  "خدمت تخصصی با عنوان طولانی برای بررسی نمایش کامل اطلاعات انتخاب‌شده در تلفن همراه";
const quote = {
  cartId: "test-cart",
  currency: "IRR",
  totals: {
    subtotal: 999999999999,
    grandTotal: 999999999999,
    shippingTotal: 0,
    taxTotal: 0,
    discountTotal: 0,
    currency: "IRR",
    hasUnavailablePrice: false,
  },
  deliveryOptions: [{ id: "delivery", name: "ارسال", fee: 0 }],
  selectedDeliveryMethodId: "delivery",
  paymentCurrency: "IRR",
  paymentTotal: 999999999999,
  blockingIssues: [],
};
(window as any).__quote = quote;

function Fixture() {
  const [open, setOpen] = useState(false);
  const [change, setChange] = useState(false);
  const [method, setMethod] = useState("gateway_card");
  const [ready, setReady] = useState(false);
  const [services, setServices] = useState(false);
  const { sectionRef, requestScroll } = useSectionScroll(services);
  const scenario = new URLSearchParams(location.search).get("case");
  if (scenario === "services")
    return (
      <>
        <div style={{ height: 1600 }}>معرفی</div>
        {services ? (
          <div ref={sectionRef} style={{ minHeight: 1000 }}>
            خدمات مرکز
          </div>
        ) : null}
        <button
          style={{ position: "fixed", bottom: 80 }}
          onClick={() => {
            setServices(true);
            requestScroll();
          }}
        >
          مشاهده خدمات
        </button>
      </>
    );
  if (scenario === "checkout")
    return (
      <CheckoutClient
        locale="fa"
        cartId="test-cart"
        items={[]}
        initialQuote={quote as any}
        paymentMethods={[
          {
            id: "method",
            code: "zarinpal",
            name: "پرداخت آنلاین",
            description: "",
            currency: "IRR",
          },
        ]}
        savedAddresses={[]}
        isAuthenticated={
          new URLSearchParams(location.search).get("signedIn") === "1"
        }
      />
    );
  if (scenario === "payment")
    return (
      <div className="p-4">
        <PaymentMethodsPanel
          selected={method}
          onChange={setMethod}
          onReadyChange={setReady}
        />
        <button disabled={!ready}>پرداخت</button>
      </div>
    );
  return (
    <div className="p-4" style={{ transform: "translateZ(0)" }}>
      <ConfirmedRow
        label="خدمت"
        title={longTitle}
        subtitle="۹۹۹٬۹۹۹٬۹۹۹٬۹۹۹ ریال"
        hasDetails
        onDetails={() => setOpen(true)}
        onChange={() => setChange(true)}
      />
      <EntityDetailsSheet
        open={open}
        title={longTitle}
        description={Array(35).fill(longTitle).join(" ")}
        meta={[{ icon: null, label: longTitle }]}
        onClose={() => setOpen(false)}
      />
      <CascadeConfirmSheet
        open={change}
        losing={[{ label: "خدمت", value: longTitle }]}
        onCancel={() => setChange(false)}
        onConfirm={() => setChange(false)}
      />
      <nav className="fixed inset-x-0 bottom-0 z-50 h-20 bg-gray-200">
        نوار پایین
      </nav>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <NextIntlClientProvider locale="fa" messages={messages}>
    <Fixture />
  </NextIntlClientProvider>
);
