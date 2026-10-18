import {
  addressInputSchema,
  checkoutEmailSchema,
  placeOrderSchema,
} from "../schemas/checkout";

export type CheckoutIssue = {
  target: string;
  kind:
    | "required"
    | "minLength"
    | "maxLength"
    | "email"
    | "delivery"
    | "noDelivery"
    | "payment"
    | "noPayment"
    | "price"
    | "stock"
    | "cartEmpty"
    | "coupon"
    | "unavailable"
    | "quoteFailed";
  min?: number;
  max?: number;
  itemId?: string;
};

export function getCheckoutIssues(input: {
  email: string;
  address: Record<string, unknown>;
  note: string;
  deliveryId: string;
  paymentCode: string;
  deliveryOptions: Array<{ id: string }>;
  paymentMethods: Array<{ code: string }>;
  blockingIssues: string[];
  hasUnavailablePrice: boolean;
  quoteFailed: boolean;
}): CheckoutIssue[] {
  const issues: CheckoutIssue[] = [];
  if (!checkoutEmailSchema.safeParse(input.email).success)
    issues.push({
      target: "email",
      kind: input.email.trim() ? "email" : "required",
    });
  const address = addressInputSchema.safeParse(input.address);
  if (!address.success)
    for (const issue of address.error.issues) {
      const target = String(issue.path[0]);
      const value = input.address[target];
      if (typeof value !== "string" || !value.trim())
        issues.push({ target, kind: "required" });
      else if (issue.code === "too_small")
        issues.push({ target, kind: "minLength", min: Number(issue.minimum) });
      else if (issue.code === "too_big")
        issues.push({ target, kind: "maxLength", max: Number(issue.maximum) });
      else issues.push({ target, kind: "required" });
    }
  if (!placeOrderSchema.shape.note.safeParse(input.note).success)
    issues.push({ target: "orderNote", kind: "maxLength", max: 1000 });
  if (!input.deliveryOptions.length)
    issues.push({ target: "deliveryMethod", kind: "noDelivery" });
  else if (!input.deliveryOptions.some((d) => d.id === input.deliveryId))
    issues.push({ target: "deliveryMethod", kind: "delivery" });
  if (!input.paymentMethods.length)
    issues.push({ target: "paymentMethod", kind: "noPayment" });
  else if (!input.paymentMethods.some((m) => m.code === input.paymentCode))
    issues.push({ target: "paymentMethod", kind: "payment" });
  const blockKinds: Record<string, CheckoutIssue["kind"]> = {
    cart_empty: "cartEmpty",
    price_unavailable: "price",
    out_of_stock: "stock",
    coupon_invalid: "coupon",
    no_delivery_to_destination: "noDelivery",
  };
  for (const code of input.blockingIssues) {
    const [reason, itemId] = code.split(":");
    const kind = blockKinds[reason] ?? "unavailable";
    if (kind !== "noDelivery" || !issues.some((i) => i.kind === "noDelivery"))
      issues.push({
        target: kind === "noDelivery" ? "deliveryMethod" : "orderSummary",
        kind,
        itemId,
      });
  }
  if (input.hasUnavailablePrice && !issues.some((i) => i.kind === "price"))
    issues.push({ target: "orderSummary", kind: "price" });
  if (input.quoteFailed) issues.push({ target: "quote", kind: "quoteFailed" });
  return issues;
}
