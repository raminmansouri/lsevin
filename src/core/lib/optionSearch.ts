export function normalizeOptionSearchQuery(value: unknown, maxLength = 120) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export function normalizeOptionSearchLimit(value: unknown, fallback = 30, maximum = 50, minimum = 10) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(parsed)));
}
