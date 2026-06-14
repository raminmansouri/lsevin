import { revalidateTag } from "next/cache";

import { getGlobalTag, getIdTag, getUserTag } from "@/lib/data-cache";

import type { MarketingLoyaltyEntityKey } from "../types";

export function getMarketingLoyaltyGlobalTag(entityKey?: MarketingLoyaltyEntityKey) {
  return getGlobalTag(entityKey ? `marketing-loyalty-${entityKey}` : "marketing-loyalty");
}

export function getMarketingLoyaltyIdTag(entityKey: MarketingLoyaltyEntityKey, id: string) {
  return getIdTag(`marketing-loyalty-${entityKey}`, id);
}

export function getMarketingLoyaltyUserTag(userId: string) {
  return getUserTag("marketing-loyalty", userId);
}

export function revalidateMarketingLoyaltyCache({
  entityKey,
  id,
  userId,
}: {
  entityKey: MarketingLoyaltyEntityKey;
  id?: string;
  userId?: string;
}) {
  revalidateTag(getMarketingLoyaltyGlobalTag());
  revalidateTag(getMarketingLoyaltyGlobalTag(entityKey));
  if (id) revalidateTag(getMarketingLoyaltyIdTag(entityKey, id));
  if (userId) revalidateTag(getMarketingLoyaltyUserTag(userId));
}
