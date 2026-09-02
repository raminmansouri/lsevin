"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { placeOrderAction, quoteCheckoutAction, saveAddressAction } from "../actions/checkout.actions";
import { formatShopMoney } from "./money";
import type { CheckoutQuote } from "../api/checkout.repository";
import type { ShopAddress } from "../api/address.repository";

type SummaryItem = {
  id: string;
  name: string;
  variantTitle: string | null;
  imageUrl: string | null;
  quantity: number;
  lineTotal: number;
  currency: string;
};

const EMPTY_ADDR = {
  fullName: "",
  phoneNumber: "",
  country: "",
  city: "",
  stateRegion: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  company: "",
};

export function CheckoutClient({
  locale,
  cartId,
  items,
  initialQuote,
  paymentMethods,
  savedAddresses,
  defaultEmail,
  isAuthenticated,
}: {
  locale: string;
  cartId: string;
  items: SummaryItem[];
  initialQuote: CheckoutQuote;
  paymentMethods: Array<{ id: string; code: string; name: string; description: string }>;
  savedAddresses: ShopAddress[];
  defaultEmail?: string;
  isAuthenticated: boolean;
}) {
  const t = useTranslations("Shop");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const idempotencyKey = useRef(
    (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `k-${Date.now()}-${Math.random()}`).replace(/-/g, "")
  );

  const [email, setEmail] = useState(defaultEmail ?? "");
  const initialAddr = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
  const [addrChoice, setAddrChoice] = useState<string>(initialAddr?.id ?? "new");
  const [saveNewAddr, setSaveNewAddr] = useState(false);
  const [addr, setAddr] = useState<typeof EMPTY_ADDR>(() =>
    initialAddr ? { ...EMPTY_ADDR, ...initialAddr } : EMPTY_ADDR,
  );
  const usingNewAddr = addrChoice === "new" || savedAddresses.length === 0;
  const [deliveryId, setDeliveryId] = useState(initialQuote.selectedDeliveryMethodId ?? "");
  const [paymentCode, setPaymentCode] = useState(paymentMethods[0]?.code ?? "");
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState(initialQuote);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState<{ amount: number; currency: string } | null>(null);

  const cur = quote.currency;

  const reQuote = (nextDeliveryId: string, dest?: { country?: string; region?: string }) => {
    setDeliveryId(nextDeliveryId);
    startTransition(async () => {
      const res = await quoteCheckoutAction({
        cartId,
        deliveryMethodId: nextDeliveryId || undefined,
        destinationCountry: (dest?.country ?? addr.country) || undefined,
        destinationRegion: (dest?.region ?? addr.stateRegion) || undefined,
      });
      if (res.ok) setQuote(res.quote);
    });
  };

  const canPlace = useMemo(() => {
    return (
      (isAuthenticated || /.+@.+\..+/.test(email)) &&
      addr.fullName.trim().length > 1 &&
      addr.country.trim() &&
      addr.city.trim() &&
      addr.addressLine1.trim().length > 2 &&
      deliveryId &&
      paymentCode &&
      !quote.totals.hasUnavailablePrice &&
      quote.blockingIssues.length === 0
    );
  }, [email, addr, deliveryId, paymentCode, quote, isAuthenticated]);

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        if (usingNewAddr && saveNewAddr && isAuthenticated) {
          await saveAddressAction({
            fullName: addr.fullName,
            phoneNumber: addr.phoneNumber || undefined,
            country: addr.country,
            city: addr.city,
            stateRegion: addr.stateRegion || undefined,
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2 || undefined,
            postalCode: addr.postalCode || undefined,
            company: addr.company || undefined,
            isDefault: savedAddresses.length === 0,
          }).catch(() => undefined);
        }
        const res = await placeOrderAction({
          cartId,
          idempotencyKey: idempotencyKey.current,
          email: email || undefined,
          shippingAddress: {
            fullName: addr.fullName,
            phoneNumber: addr.phoneNumber || undefined,
            country: addr.country,
            city: addr.city,
            stateRegion: addr.stateRegion || undefined,
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2 || undefined,
            postalCode: addr.postalCode || undefined,
            company: addr.company || undefined,
          },
          sameBilling: true,
          deliveryMethodId: deliveryId,
          paymentMethodCode: paymentCode,
          note: note || undefined,
          sourceSurface: "shop_checkout",
        });

        const p = res.payment;
        if (p.mode === "redirect") {
          window.location.href = p.redirectUrl;
          return;
        }
        if (p.mode === "manual") {
          setManual({ amount: p.amount, currency: p.currency });
          return;
        }
        // already_paid or error -> go to the order page
        router.push(`/n/app/mobile/shop/order/${res.order.orderNumber}?email=${encodeURIComponent(email)}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("somethingWrong"));
      }
    });
  }

  if (manual) {
    return (
      <div className="space-y-4 p-4 pb-24">
        <div className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/[0.04]">
          <div className="text-4xl">🏦</div>
          <p className="mt-3 text-base font-bold text-neutral-900">{t("orderAwaitingPayment")}</p>
          <p className="mt-2 text-sm text-neutral-600">
            {t("bankTransferInstructions", { amount: formatShopMoney(manual.amount, manual.currency, locale) })}
          </p>
          <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-start text-sm">
            <p><span className="text-neutral-500">IBAN:</span> <span className="font-mono">GE00 LS00 0000 0000 0000 00</span></p>
            <p><span className="text-neutral-500">Ref:</span> <span className="font-mono">{idempotencyKey.current.slice(0, 10).toUpperCase()}</span></p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/n/app/mobile/shop/orders`)}
          className="w-full rounded-full bg-[#083f30] px-6 py-3 text-sm font-bold text-white"
        >
          {t("myOrders")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 pb-40">
      {error ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p> : null}
      {quote.blockingIssues.length ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{t("somethingWrong")}</p>
      ) : null}

      <Section title={t("contact")}>
        <input
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={isAuthenticated ? t("emailOptional") : t("email")}
          className={field}
        />
      </Section>

      <Section title={t("shippingAddress")}>
        {isAuthenticated ? (
          <a href="/n/app/mobile/shop/addresses" className="mb-2 inline-block text-xs font-semibold text-[#083f30]">
            {t("savedAddresses")} ›
          </a>
        ) : null}
        {savedAddresses.length ? (
          <div className="mb-3 space-y-1.5">
            <p className="text-xs font-semibold text-neutral-500">{t("selectAddress")}</p>
            {savedAddresses.map((a) => (
              <label
                key={a.id}
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-xl border p-2.5 text-sm",
                  addrChoice === a.id ? "border-[#083f30] bg-[#083f30]/5" : "border-neutral-200",
                )}
              >
                <input
                  type="radio"
                  name="savedAddr"
                  className="mt-0.5"
                  checked={addrChoice === a.id}
                  onChange={() => {
                    setAddrChoice(a.id ?? "new");
                    setAddr({ ...EMPTY_ADDR, ...a });
                    reQuote(deliveryId, {
                      country: (a as { country?: string }).country,
                      region: (a as { stateRegion?: string }).stateRegion,
                    });
                  }}
                />
                <span>
                  <span className="font-medium text-neutral-800">{a.fullName}</span>
                  <br />
                  <span className="text-xs text-neutral-500">
                    {[a.addressLine1, a.city, a.country].filter(Boolean).join("، ")}
                  </span>
                </span>
              </label>
            ))}
            <label
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-sm",
                addrChoice === "new" ? "border-[#083f30] bg-[#083f30]/5" : "border-neutral-200",
              )}
            >
              <input
                type="radio"
                name="savedAddr"
                checked={addrChoice === "new"}
                onChange={() => {
                  setAddrChoice("new");
                  setAddr(EMPTY_ADDR);
                }}
              />
              <span className="font-medium text-neutral-800">{t("useNewAddress")}</span>
            </label>
          </div>
        ) : null}
        <div className={cn("grid grid-cols-2 gap-2", usingNewAddr ? "" : "hidden")}>
          <input value={addr.fullName} onChange={(e) => setAddr({ ...addr, fullName: e.target.value })} placeholder={t("fullName")} className={cn(field, "col-span-2")} />
          <input value={addr.phoneNumber} onChange={(e) => setAddr({ ...addr, phoneNumber: e.target.value })} placeholder={t("phone")} className={field} inputMode="tel" />
          <input value={addr.company} onChange={(e) => setAddr({ ...addr, company: e.target.value })} placeholder={t("company")} className={field} />
          <input
            value={addr.country}
            onChange={(e) => setAddr({ ...addr, country: e.target.value })}
            onBlur={(e) => reQuote(deliveryId, { country: e.target.value, region: addr.stateRegion })}
            placeholder={t("country")}
            className={field}
          />
          <input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} placeholder={t("city")} className={field} />
          <input value={addr.stateRegion} onChange={(e) => setAddr({ ...addr, stateRegion: e.target.value })} placeholder={t("stateRegion")} className={cn(field, "col-span-2")} />
          <input value={addr.addressLine1} onChange={(e) => setAddr({ ...addr, addressLine1: e.target.value })} placeholder={t("addressLine1")} className={cn(field, "col-span-2")} />
          <input value={addr.addressLine2} onChange={(e) => setAddr({ ...addr, addressLine2: e.target.value })} placeholder={t("addressLine2")} className={cn(field, "col-span-2")} />
          <input value={addr.postalCode} onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })} placeholder={t("postalCode")} className={field} />
        </div>
        {usingNewAddr && isAuthenticated ? (
          <label className="mt-2 flex items-center gap-2 text-xs text-neutral-600">
            <input type="checkbox" checked={saveNewAddr} onChange={(e) => setSaveNewAddr(e.target.checked)} />
            {t("saveThisAddress")}
          </label>
        ) : null}
      </Section>

      <Section title={t("deliveryMethod")}>
        <div className="space-y-2">
          {quote.deliveryOptions.map((d) => (
            <label
              key={d.id}
              className={cn(
                "flex items-center justify-between rounded-xl border px-3 py-2.5",
                deliveryId === d.id ? "border-[#083f30] bg-[#083f30]/5" : "border-neutral-200"
              )}
            >
              <span className="flex items-center gap-2 text-sm">
                <input type="radio" name="delivery" checked={deliveryId === d.id} onChange={() => reQuote(d.id)} />
                <span>
                  <span className="font-medium text-neutral-800">{d.name}</span>
                  {d.etaMinDays ? <span className="ms-1 text-xs text-neutral-500">· {d.etaMinDays}-{d.etaMaxDays}d</span> : null}
                </span>
              </span>
              <span className="text-sm font-semibold">
                {d.fee === 0 ? t("freeShipping") : formatShopMoney(d.fee, cur, locale)}
              </span>
            </label>
          ))}
        </div>
      </Section>

      <Section title={t("paymentMethod")}>
        <div className="space-y-2">
          {paymentMethods.map((m) => (
            <label
              key={m.id}
              className={cn(
                "flex items-start gap-2 rounded-xl border px-3 py-2.5",
                paymentCode === m.code ? "border-[#083f30] bg-[#083f30]/5" : "border-neutral-200"
              )}
            >
              <input type="radio" name="payment" className="mt-1" checked={paymentCode === m.code} onChange={() => setPaymentCode(m.code)} />
              <span>
                <span className="block text-sm font-medium text-neutral-800">{m.name}</span>
                {m.description ? <span className="block text-xs text-neutral-500">{m.description}</span> : null}
              </span>
            </label>
          ))}
        </div>
      </Section>

      <Section title={t("orderNote")}>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={cn(field, "resize-none")} />
      </Section>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
        <p className="mb-2 text-sm font-bold text-neutral-900">{t("orderSummary")}</p>
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between py-1 text-sm">
            <span className="line-clamp-1 text-neutral-600">
              {it.name} <span className="text-neutral-400">×{it.quantity}</span>
            </span>
            <span className="font-medium">{formatShopMoney(it.lineTotal, cur, locale)}</span>
          </div>
        ))}
        <div className="mt-2 space-y-1 border-t border-neutral-100 pt-2 text-sm text-neutral-600">
          <Line label={t("subtotal")} value={formatShopMoney(quote.totals.subtotal, cur, locale)} />
          <Line label={t("shipping")} value={quote.totals.shippingTotal === 0 ? t("freeShipping") : formatShopMoney(quote.totals.shippingTotal, cur, locale)} />
          {quote.totals.taxTotal > 0 ? <Line label={t("tax")} value={formatShopMoney(quote.totals.taxTotal, cur, locale)} /> : null}
          {quote.totals.discountTotal > 0 ? <Line label={t("discount")} value={`− ${formatShopMoney(quote.totals.discountTotal, cur, locale)}`} /> : null}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-2 text-base font-extrabold">
          <span>{t("grandTotal")}</span>
          <span className="text-[#e02e2a]">{formatShopMoney(quote.totals.grandTotal, cur, locale)}</span>
        </div>
        {quote.paymentCurrency !== cur ? (
          <p className="mt-1 text-xs text-neutral-500">
            {t("payInCurrency", { currency: quote.paymentCurrency })}: {quote.paymentCurrency}{" "}
            {formatShopMoney(quote.paymentTotal, quote.paymentCurrency, locale)}
          </p>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 border-t border-neutral-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-500">{t("payableNow")}</span>
            <span className="text-lg font-extrabold text-[#e02e2a]">
              {formatShopMoney(quote.paymentTotal, quote.paymentCurrency, locale)}
            </span>
          </div>
          <button
            disabled={!canPlace || pending}
            onClick={submit}
            className="ms-auto rounded-full bg-[#083f30] px-8 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {pending ? t("loading") : t("placeOrder")}
          </button>
        </div>
      </div>
    </div>
  );
}

const field =
  "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none focus:border-[#083f30]";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
      <p className="mb-2.5 text-sm font-bold text-neutral-900">{title}</p>
      {children}
    </section>
  );
}
function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-medium text-neutral-800">{value}</span>
    </div>
  );
}
