"use client";

import {
  useMemo,
  useRef,
  useState,
  useTransition,
  type InputHTMLAttributes,
} from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import {
  placeOrderAction,
  quoteCheckoutAction,
  saveCheckoutAddressAction,
  startPaymentAction,
} from "../actions/checkout.actions";
import type { ShopAddress } from "../api/address.repository";
import type { CheckoutQuote } from "../api/checkout.repository";
import {
  getCheckoutIssues,
  type CheckoutIssue,
} from "../lib/checkout-validation";
import { currencyLabel, formatShopMoney } from "./money";

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
  paymentMethods: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    currency: string;
  }>;
  savedAddresses: ShopAddress[];
  defaultEmail?: string;
  isAuthenticated: boolean;
}) {
  const t = useTranslations("Shop");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const idempotencyKey = useRef(
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `k-${Date.now()}-${Math.random()}`
    ).replace(/-/g, "")
  );

  const [email, setEmail] = useState(defaultEmail ?? "");
  const initialAddr =
    savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
  const [addrChoice, setAddrChoice] = useState<string>(
    initialAddr?.id ?? "new"
  );
  const [saveNewAddr, setSaveNewAddr] = useState(false);
  const [addr, setAddr] = useState<typeof EMPTY_ADDR>(() =>
    initialAddr ? { ...EMPTY_ADDR, ...initialAddr } : EMPTY_ADDR
  );
  const usingNewAddr = addrChoice === "new" || savedAddresses.length === 0;
  const [deliveryId, setDeliveryId] = useState(
    initialQuote.selectedDeliveryMethodId ?? ""
  );
  const [paymentCode, setPaymentCode] = useState(paymentMethods[0]?.code ?? "");
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState(initialQuote);
  const [error, setError] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<{
    orderId: string;
    orderNumber: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const quoteRequest = useRef(0);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [manual, setManual] = useState<{
    amount: number;
    currency: string;
  } | null>(null);

  const cur = quote.currency;

  const reQuote = (
    nextDeliveryId: string,
    dest?: { country?: string; region?: string },
    nextPaymentCode = paymentCode
  ) => {
    if (placedOrder) return;
    const request = ++quoteRequest.current;
    setDeliveryId(nextDeliveryId);
    setQuoteError(null);
    startTransition(async () => {
      try {
        const res = await quoteCheckoutAction({
          cartId,
          deliveryMethodId: nextDeliveryId || undefined,
          paymentCurrency: paymentMethods.find(
            (method) => method.code === nextPaymentCode
          )?.currency,
          destinationCountry: (dest?.country ?? addr.country) || undefined,
          destinationRegion: (dest?.region ?? addr.stateRegion) || undefined,
        });
        if (request !== quoteRequest.current) return;
        if (res.ok) {
          setQuote(res.quote);
          setDeliveryId(res.quote.selectedDeliveryMethodId ?? "");
          setQuoteError(null);
        } else {
          setQuoteError(res.message || t("somethingWrong"));
        }
      } catch {
        if (request === quoteRequest.current)
          setQuoteError(t("somethingWrong"));
      }
    });
  };

  const issues = useMemo(
    () =>
      getCheckoutIssues({
        email,
        address: addr,
        note,
        deliveryId,
        paymentCode,
        deliveryOptions: quote.deliveryOptions,
        paymentMethods,
        blockingIssues: quote.blockingIssues,
        hasUnavailablePrice: quote.totals.hasUnavailablePrice,
        quoteFailed: Boolean(quoteError),
      }),
    [
      email,
      addr,
      note,
      deliveryId,
      paymentCode,
      quote,
      paymentMethods,
      quoteError,
    ]
  );
  const canPlace = Boolean(placedOrder) || issues.length === 0;
  const fieldLabels: Record<string, string> = {
    email: t("email"),
    fullName: t("fullName"),
    phoneNumber: t("phone"),
    company: t("company"),
    country: t("country"),
    city: t("city"),
    stateRegion: t("stateRegion"),
    addressLine1: t("addressLine1"),
    addressLine2: t("addressLine2"),
    postalCode: t("postalCode"),
    orderNote: t("orderNote"),
  };
  function issueText(issue: CheckoutIssue) {
    const fieldLabel = fieldLabels[issue.target] ?? t("shippingAddress");
    if (issue.kind === "required")
      return t("checkoutHints.required", { field: fieldLabel });
    if (issue.kind === "minLength")
      return t("checkoutHints.minLength", {
        field: fieldLabel,
        min: issue.min!,
      });
    if (issue.kind === "maxLength")
      return t("checkoutHints.maxLength", {
        field: fieldLabel,
        max: issue.max!,
      });
    if (issue.kind === "price" || issue.kind === "stock") {
      const item = items.find((item) => item.id === issue.itemId);
      return `${issue.kind === "price" ? t("priceUnavailable") : t("outOfStock")}${item ? `: ${item.name}` : ""}`;
    }
    if (issue.kind === "cartEmpty") return t("cartEmpty");
    return t(`checkoutHints.${issue.kind}`);
  }
  function focusIssue(issue: CheckoutIssue) {
    if (issue.target === "quote") {
      reQuote(deliveryId);
      return;
    }
    if (issue.target === "orderSummary") {
      router.push("/n/app/mobile/shop/cart");
      return;
    }
    setTouched((old) => ({ ...old, [issue.target]: true }));
    const node = document.getElementById(`checkout-${issue.target}`);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
    (node?.matches("input,textarea")
      ? node
      : node?.querySelector<HTMLElement>("input")
    )?.focus({ preventScroll: true });
  }
  function paymentResult(
    payment: Awaited<ReturnType<typeof placeOrderAction>>["payment"],
    order: { orderId: string; orderNumber: string }
  ) {
    if (payment.mode === "redirect") {
      window.location.assign(payment.redirectUrl);
      return;
    }
    if (payment.mode === "manual") {
      setManual({ amount: payment.amount, currency: payment.currency });
      return;
    }
    if (payment.mode === "error") {
      setError(payment.message);
      return;
    }
    router.push(
      `/n/app/mobile/shop/order/${order.orderNumber}?email=${encodeURIComponent(email.trim())}`
    );
  }

  function submit() {
    if (!canPlace || pending || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    startTransition(async () => {
      try {
        if (placedOrder) {
          const res = await startPaymentAction({
            orderId: placedOrder.orderId,
            methodCode: paymentCode,
          });
          paymentResult(res.payment, placedOrder);
          return;
        }
        if (usingNewAddr && saveNewAddr && isAuthenticated) {
          await saveCheckoutAddressAction({
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
          email: email.trim() || undefined,
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
          paymentCurrency: quote.paymentCurrency,
          note: note || undefined,
          sourceSurface: "shop_checkout",
        });

        setPlacedOrder({
          orderId: res.order.orderId,
          orderNumber: res.order.orderNumber,
        });
        paymentResult(res.payment, res.order);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("somethingWrong"));
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    });
  }

  if (manual) {
    return (
      <div className="space-y-4 p-4 pb-24">
        <div className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/[0.04]">
          <div className="text-4xl">🏦</div>
          <p className="mt-3 text-base font-bold text-neutral-900">
            {t("orderAwaitingPayment")}
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            {t("bankTransferInstructions", {
              amount: formatShopMoney(manual.amount, manual.currency, locale),
            })}
          </p>
          <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-start text-sm">
            <p>
              <span className="text-neutral-500">{t("iban")}</span>{" "}
              <span className="font-mono">{t("ge00Ls0000000000000000")}</span>
            </p>
            <p>
              <span className="text-neutral-500">{t("ref")}</span>{" "}
              <span className="font-mono">
                {idempotencyKey.current.slice(0, 10).toUpperCase()}
              </span>
            </p>
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
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-3 p-4 pb-72"
    >
      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          {error}
        </p>
      ) : null}
      {!placedOrder && issues.length ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <p className="font-semibold">{t("checkoutHints.completeToPay")}</p>
          <ul className="mt-1 list-inside list-disc space-y-1">
            {issues.map((issue, index) => (
              <li key={`${issue.target}-${index}`}>
                <button
                  type="button"
                  onClick={() => focusIssue(issue)}
                  className="text-start underline underline-offset-2"
                >
                  {issueText(issue)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {placedOrder ? (
        <p className="rounded-xl bg-white p-3 text-sm text-neutral-700">
          {t("checkoutHints.retryNotice")}
        </p>
      ) : null}

      <fieldset
        disabled={Boolean(placedOrder) || submitting}
        className="min-w-0 space-y-3"
      >
        <Section title={t("contact")}>
          <CheckoutInput
            id="checkout-email"
            label={t("email")}
            required
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("email")}
            aria-label={t("email")}
            hint={
              issues.find((i) => i.target === "email") && touched.email
                ? issueText(issues.find((i) => i.target === "email")!)
                : undefined
            }
            onBlur={() => setTouched((old) => ({ ...old, email: true }))}
          />
        </Section>

        <Section title={t("shippingAddress")}>
          {isAuthenticated ? (
            <a
              href="/n/app/mobile/shop/addresses"
              className="mb-2 inline-block text-xs font-semibold text-[#083f30]"
            >
              {t("savedAddresses")} ›
            </a>
          ) : null}
          {savedAddresses.length ? (
            <div className="mb-3 space-y-1.5">
              <p className="text-xs font-semibold text-neutral-500">
                {t("selectAddress")}
              </p>
              {savedAddresses.map((a) => (
                <label
                  key={a.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-xl border p-2.5 text-sm",
                    addrChoice === a.id
                      ? "border-[#083f30] bg-[#083f30]/5"
                      : "border-neutral-200"
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
                    <span className="font-medium text-neutral-800">
                      {a.fullName}
                    </span>
                    <br />
                    <span className="text-xs text-neutral-500">
                      {[a.addressLine1, a.city, a.country]
                        .filter(Boolean)
                        .join("، ")}
                    </span>
                  </span>
                </label>
              ))}
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-sm",
                  addrChoice === "new"
                    ? "border-[#083f30] bg-[#083f30]/5"
                    : "border-neutral-200"
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
                <span className="font-medium text-neutral-800">
                  {t("useNewAddress")}
                </span>
              </label>
            </div>
          ) : null}
          <div
            className={cn(
              "grid grid-cols-2 gap-2",
              usingNewAddr ? "" : "hidden"
            )}
          >
            {(
              [
                "fullName",
                "phoneNumber",
                "company",
                "country",
                "city",
                "stateRegion",
                "addressLine1",
                "addressLine2",
                "postalCode",
              ] as const
            ).map((key) => {
              const issue = issues.find((i) => i.target === key);
              return (
                <CheckoutInput
                  key={key}
                  id={`checkout-${key}`}
                  label={fieldLabels[key]}
                  placeholder={fieldLabels[key]}
                  required={[
                    "fullName",
                    "country",
                    "city",
                    "addressLine1",
                  ].includes(key)}
                  className={
                    [
                      "fullName",
                      "stateRegion",
                      "addressLine1",
                      "addressLine2",
                    ].includes(key)
                      ? "col-span-2"
                      : undefined
                  }
                  inputMode={key === "phoneNumber" ? "tel" : undefined}
                  value={addr[key]}
                  hint={issue && touched[key] ? issueText(issue) : undefined}
                  onChange={(e) => setAddr({ ...addr, [key]: e.target.value })}
                  onBlur={(e) => {
                    setTouched((old) => ({ ...old, [key]: true }));
                    if (key === "country" || key === "stateRegion")
                      reQuote(deliveryId, {
                        country:
                          key === "country" ? e.target.value : addr.country,
                        region:
                          key === "stateRegion"
                            ? e.target.value
                            : addr.stateRegion,
                      });
                  }}
                />
              );
            })}
          </div>
          {usingNewAddr && isAuthenticated ? (
            <label className="mt-2 flex items-center gap-2 text-xs text-neutral-600">
              <input
                type="checkbox"
                checked={saveNewAddr}
                onChange={(e) => setSaveNewAddr(e.target.checked)}
              />
              {t("saveThisAddress")}
            </label>
          ) : null}
        </Section>

        <Section id="checkout-deliveryMethod" title={t("deliveryMethod")}>
          <div className="space-y-2">
            {quote.deliveryOptions.map((d) => (
              <label
                key={d.id}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3 py-2.5",
                  deliveryId === d.id
                    ? "border-[#083f30] bg-[#083f30]/5"
                    : "border-neutral-200"
                )}
              >
                <span className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryId === d.id}
                    onChange={() => reQuote(d.id)}
                  />
                  <span>
                    <span className="font-medium text-neutral-800">
                      {d.name}
                    </span>
                    {d.etaMinDays ? (
                      <span className="ms-1 text-xs text-neutral-500">
                        · {d.etaMinDays}-{d.etaMaxDays}d
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="text-sm font-semibold">
                  {d.fee === 0
                    ? t("freeShipping")
                    : formatShopMoney(d.fee, cur, locale)}
                </span>
              </label>
            ))}
          </div>
        </Section>

        <Section id="checkout-paymentMethod" title={t("paymentMethod")}>
          <div className="space-y-2">
            {paymentMethods.map((m) => (
              <label
                key={m.id}
                className={cn(
                  "flex items-start gap-2 rounded-xl border px-3 py-2.5",
                  paymentCode === m.code
                    ? "border-[#083f30] bg-[#083f30]/5"
                    : "border-neutral-200"
                )}
              >
                <input
                  type="radio"
                  name="payment"
                  className="mt-1"
                  checked={paymentCode === m.code}
                  onChange={() => {
                    setPaymentCode(m.code);
                    reQuote(deliveryId, undefined, m.code);
                  }}
                />
                <span>
                  <span className="block text-sm font-medium text-neutral-800">
                    {m.name}
                  </span>
                  {m.description ? (
                    <span className="block text-xs text-neutral-500">
                      {m.description}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </Section>

        <Section title={t("orderNote")}>
          <textarea
            id="checkout-orderNote"
            aria-label={t("orderNote")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className={cn(field, "resize-none")}
          />
          {issues.find((i) => i.target === "orderNote") ? (
            <p className="mt-1 text-xs text-red-700">
              {issueText(issues.find((i) => i.target === "orderNote")!)}
            </p>
          ) : null}
        </Section>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
          <p className="mb-2 text-sm font-bold text-neutral-900">
            {t("orderSummary")}
          </p>
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between py-1 text-sm"
            >
              <span className="line-clamp-1 text-neutral-600">
                {it.name}{" "}
                <span className="text-neutral-400">×{it.quantity}</span>
              </span>
              <span className="font-medium">
                {formatShopMoney(it.lineTotal, cur, locale)}
              </span>
            </div>
          ))}
          <div className="mt-2 space-y-1 border-t border-neutral-100 pt-2 text-sm text-neutral-600">
            <Line
              label={t("subtotal")}
              value={formatShopMoney(quote.totals.subtotal, cur, locale)}
            />
            <Line
              label={t("shipping")}
              value={
                quote.totals.shippingTotal === 0
                  ? t("freeShipping")
                  : formatShopMoney(quote.totals.shippingTotal, cur, locale)
              }
            />
            {quote.totals.taxTotal > 0 ? (
              <Line
                label={t("tax")}
                value={formatShopMoney(quote.totals.taxTotal, cur, locale)}
              />
            ) : null}
            {quote.totals.discountTotal > 0 ? (
              <Line
                label={t("discount")}
                value={`− ${formatShopMoney(quote.totals.discountTotal, cur, locale)}`}
              />
            ) : null}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-2 text-base font-extrabold">
            <span>{t("grandTotal")}</span>
            <span className="text-[#e02e2a]">
              {formatShopMoney(quote.totals.grandTotal, cur, locale)}
            </span>
          </div>
          {quote.paymentCurrency !== cur ? (
            <p className="mt-1 text-xs text-neutral-500">
              {t("payInCurrency", {
                currency: currencyLabel(quote.paymentCurrency, locale),
              })}
              :{" "}
              {formatShopMoney(
                quote.paymentTotal,
                quote.paymentCurrency,
                locale
              )}
            </p>
          ) : null}
        </div>
      </fieldset>

      <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 border-t border-neutral-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <p
          id="checkout-payment-hint"
          aria-live="polite"
          className={cn(
            "mx-auto mb-2 max-w-md text-xs text-neutral-700",
            !pending && (placedOrder || !issues.length) && "sr-only"
          )}
        >
          {pending
            ? t("checkoutHints.updating")
            : issues[0]
              ? issueText(issues[0])
              : t("payNow")}
        </p>
        <div className="mx-auto flex max-w-md flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1 basis-36 [overflow-wrap:anywhere] break-words">
            <span className="text-[10px] text-neutral-500">
              {t("payableNow")}
            </span>
            <span className="text-lg font-extrabold text-[#e02e2a]">
              {formatShopMoney(
                quote.paymentTotal,
                quote.paymentCurrency,
                locale
              )}
            </span>
          </div>
          <button
            type="submit"
            aria-describedby="checkout-payment-hint"
            disabled={!canPlace || pending}
            className="ms-auto shrink-0 rounded-full bg-[#083f30] px-8 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {pending ? t("loading") : placedOrder ? t("retry") : t("payNow")}
          </button>
        </div>
      </div>
    </form>
  );
}

const field =
  "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none focus:border-[#083f30]";

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"
    >
      <p className="mb-2.5 text-sm font-bold text-neutral-900">{title}</p>
      {children}
    </section>
  );
}

function CheckoutInput({
  id,
  label,
  hint,
  className,
  required,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label htmlFor={id} className={cn("block min-w-0", className)}>
      <span className="mb-1 block text-xs font-medium text-neutral-600">
        {label}
        {required ? (
          <span aria-hidden="true" className="ms-1 text-red-700">
            *
          </span>
        ) : null}
      </span>
      <input
        {...props}
        id={id}
        required={required}
        aria-required={required}
        aria-invalid={Boolean(hint)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cn(field, hint && "border-red-400")}
      />
      {hint ? (
        <span id={`${id}-hint`} className="mt-1 block text-xs text-red-700">
          {hint}
        </span>
      ) : null}
    </label>
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
