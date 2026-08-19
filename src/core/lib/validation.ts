import { z } from "zod";

const uuidSchema = z.string().uuid();

export function requireUuid(value: string, label: string) {
  const normalized = value.trim();
  if (!uuidSchema.safeParse(normalized).success) throw new Error(`${label} must be a valid UUID.`);
  return normalized;
}

export function requireText(value: string, label: string, options: { min?: number; max?: number } = {}) {
  const normalized = value.trim();
  const min = options.min ?? 1;
  const max = options.max ?? 10_000;
  if (normalized.length < min) throw new Error(`${label} must contain at least ${min} characters.`);
  if (normalized.length > max) throw new Error(`${label} must not exceed ${max} characters.`);
  return normalized;
}

export function requireOneOf<T extends string>(value: string, allowed: readonly T[], label: string): T {
  if (!allowed.includes(value as T)) throw new Error(`${label} is not supported.`);
  return value as T;
}

export function requireNumber(value: number, label: string, options: { min?: number; max?: number; integer?: boolean } = {}) {
  if (!Number.isFinite(value)) throw new Error(`${label} must be a finite number.`);
  if (options.integer && !Number.isInteger(value)) throw new Error(`${label} must be a whole number.`);
  if (options.min !== undefined && value < options.min) throw new Error(`${label} must be at least ${options.min}.`);
  if (options.max !== undefined && value > options.max) throw new Error(`${label} must not exceed ${options.max}.`);
  return value;
}

export function optionalIsoDate(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || Number.isNaN(Date.parse(`${normalized}T00:00:00Z`))) {
    throw new Error(`${label} must be a valid date.`);
  }
  return normalized;
}
