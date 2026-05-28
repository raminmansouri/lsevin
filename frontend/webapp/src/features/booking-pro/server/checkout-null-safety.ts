export function pgSqlValue<T>(value: T | undefined): T | null {
  return value === undefined ? null : value;
}

export function pgNull<T>(value: T | null | undefined): T | null {
  return value === undefined ? null : value;
}

export function pgString(value: unknown, fallback: string | null = null): string | null {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'string') return String(value);
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
}

export function pgNumber(value: unknown, fallback: number | null = null): number | null {
  if (value === null || value === undefined || value === '') return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function pgBoolean(value: unknown, fallback: boolean | null = null): boolean | null {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
}

export function pgJson<T>(value: T | null | undefined, fallback: T): T {
  return value === undefined || value === null ? fallback : value;
}

export function assertNoUndefinedRecord(record: Record<string, unknown>, label = 'postgres parameters') {
  const undefinedKeys = Object.entries(record)
    .filter(([, value]) => value === undefined)
    .map(([key]) => key);

  if (undefinedKeys.length) {
    throw new Error(`${label} contains undefined values: ${undefinedKeys.join(', ')}`);
  }
}
