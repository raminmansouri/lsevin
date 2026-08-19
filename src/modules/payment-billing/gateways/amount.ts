const IRANIAN_UNITS = new Set(["IRR", "IRT"]);

export function convertIranianGatewayAmount(amount: number, sourceCurrency: string, targetUnit: string) {
  const source = sourceCurrency.trim().toUpperCase();
  const target = targetUnit.trim().toUpperCase();
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Gateway amount must be a positive number.");
  if (!IRANIAN_UNITS.has(source) || !IRANIAN_UNITS.has(target)) {
    throw new Error(`Iranian gateways accept only IRR or IRT invoices; received ${source || "unknown"} for a ${target || "unknown"} gateway.`);
  }
  const converted = source === target ? amount : source === "IRT" ? amount * 10 : amount / 10;
  if (!Number.isSafeInteger(converted)) {
    throw new Error(`The ${source} invoice amount cannot be represented exactly in ${target}.`);
  }
  return converted;
}
