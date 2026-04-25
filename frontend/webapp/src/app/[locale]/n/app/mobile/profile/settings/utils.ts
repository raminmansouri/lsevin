export function formatCurrency(amount: string | number | null, currencyCode: string): string {
  if (amount === null || amount === undefined) return "—";
  const numeric = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(numeric)) return "—";
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch {
    return `${numeric.toFixed(2)} ${currencyCode}`;
  }
}

export function getLocationLabel(country: string | null, city: string | null): string {
  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  return "Not set";
}
