/** "20, 45 or 60" in the visitor's language and digits. */
export function formatDurations(locale: string, minutes: number[]): string {
  const numbers = minutes.map((value) => new Intl.NumberFormat(locale).format(value));
  try {
    return new Intl.ListFormat(locale, { type: "disjunction" }).format(numbers);
  } catch {
    return numbers.join(" / ");
  }
}
