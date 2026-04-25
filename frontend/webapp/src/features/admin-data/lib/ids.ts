import type { AdminRow, AdminTableConfig } from "../types";

export function encodeRowId(config: AdminTableConfig, row: AdminRow) {
  const idObject = Object.fromEntries(
    config.primaryKey.map((column) => [column, row[column]])
  );
  return encodeURIComponent(JSON.stringify(idObject));
}

export function decodeRowId(rowId: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(decodeURIComponent(rowId));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Invalid row id payload.");
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error("Invalid row id.");
  }
}
