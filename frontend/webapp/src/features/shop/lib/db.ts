import sql from "@/config/database/db";
export { sql };
export function normalizeLocale(locale?: string) { return locale?.trim() || "en"; }
export async function resolveCurrentCustomerId(): Promise<string | null> { return null; }
export async function assertAdmin(): Promise<void> { return; }
