"use server";

import sql from "@/config/database/db";

import { getEntityConfig } from "../constants";
import { revalidateMarketingLoyaltyCache } from "../db/cache";
import { DeleteMarketingLoyaltyRecordSchema } from "../schemas";
import type { MarketingLoyaltyActionResult } from "./upsert-record";

export async function deleteMarketingLoyaltyRecordAction(input: unknown): Promise<MarketingLoyaltyActionResult> {
  const parsed = DeleteMarketingLoyaltyRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { detail: parsed.error.issues[0]?.message || "Invalid delete request." } };
  }

  const { entityKey, id } = parsed.data;
  const config = getEntityConfig(entityKey);

  if (config.deletable === false || config.appendOnly) {
    return { error: { detail: "This record cannot be deleted from the admin panel." } };
  }

  try {
    await sql.unsafe(
      `delete from "${config.schemaName}"."${config.tableName}" where "${config.primaryKey}" = $1`,
      [id]
    );

    revalidateMarketingLoyaltyCache({ entityKey, id });
    return { data: id };
  } catch (error) {
    return { error: { detail: error instanceof Error ? error.message : "Delete failed." } };
  }
}
