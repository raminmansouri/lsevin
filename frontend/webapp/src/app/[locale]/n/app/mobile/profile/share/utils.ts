import type { DiscountType } from "./types";

export function formatDiscountValue(
  discountType: DiscountType,
  discountValue: number,
  currencyCode = "USD"
): string {
  if (discountType === "percent") {
    return `${trimTrailingZeros(discountValue)}%`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(discountValue);
}

export function formatDateLabel(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function encodeShareText(text: string): string {
  return encodeURIComponent(text);
}

function trimTrailingZeros(value: number): string {
  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}
