import "server-only";

import type { AdminRelationOption, AdminRow, AdminTableConfig } from "../types";
import { listRelationOptions } from "./db";

export async function buildRelationOptions(config: AdminTableConfig, row?: AdminRow | null) {
  const entries = await Promise.all(
    config.fields
      .filter((field) => field.relation)
      .map(async (field) => {
        const options = await listRelationOptions(field.relation!);
        const currentValue = row?.[field.name];
        if (currentValue && !options.some((option) => option.value === String(currentValue))) {
          options.unshift({ value: String(currentValue), label: String(currentValue) });
        }
        return [field.name, options] as [string, AdminRelationOption[]];
      })
  );
  return Object.fromEntries(entries) as Record<string, AdminRelationOption[]>;
}
