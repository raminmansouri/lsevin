import { LocalizedContentResponse } from "@/features/shared/types/localization";
import { LocaleHeaderTypes } from "@/types/common";
import { IProblem } from "@/types/error";

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/**
 * Convert all ASCII (Latin) digits 0-9 in a string to Persian digits ۰-۹.
 * Non-digit characters are left untouched. Safe to call on already-Persian
 * strings (it is a no-op for them).
 */
export const toPersianDigits = (
  value: string | number | null | undefined
): string => {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
};

export const formatDate = (
  date: string | null | undefined,
  locale: string = "en-US",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
) => {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString(locale, options);
  } catch {
    return "-";
  }
};

export const formatDateForForm = (dateString?: string): string => {
  if (!dateString) return "";

  try {
    // Try parsing as ISO date first
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

export function truncateText(text: string, startLength = 10, endLength = 8) {
  if (!text) return text;
  if (text.length <= startLength + endLength) return text;
  return `${text.slice(0, startLength)}...${text.slice(-endLength)}`;
}

export function formatError(error: IProblem) {
  const errorMessage = error.errors
    ? Object.values(error.errors)[0]?.[0]
    : error.detail
      ? `${error.title}: ${error.detail}`
      : (error.title ?? "An error occurred");
  return errorMessage;
}

// Add to frontend/webapp/src/lib/formatters.ts
export const formatLocalizedContent = (
  content: LocalizedContentResponse | string,
  locale: LocaleHeaderTypes = "en-US"
): string => {
  if (typeof content === "string") return content;

  return (
    content.translations[locale] ||
    content.translations["en-US"] ||
    Object.values(content.translations)[0] ||
    "-"
  );
};

export const formatPrice = (
  price: number | null | undefined,
  locale: string = "en-US"
): string => {
  if (price === null || price === undefined || isNaN(price)) return "-";

  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return price.toString();
  }
};
