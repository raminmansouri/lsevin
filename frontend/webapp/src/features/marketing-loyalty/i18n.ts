"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import type { AdminEntityConfig } from "./types";

/**
 * Localises an `AdminEntityConfig` in one place.
 *
 * `constants.ts` is a plain module — it cannot call a hook — so every `title`,
 * `description`, column `label`, field `label`, `placeholder` and `helperText`
 * across the seven marketing/loyalty entities (146 strings) was hardcoded
 * English and rendered as-is in a Persian panel. `MARKETING_LOYALTY_TRANSLATION_KEY`
 * was declared there pointing at a `MarketingLoyaltyAdmin` namespace that never
 * existed and was never imported by anything.
 *
 * Rather than thread a `t` through the ~15 render sites, the config is
 * translated once at the component boundary and every downstream read of
 * `config.title` / `field.label` keeps working unchanged.
 *
 * Keys are derived from the stable identifiers already in the config
 * (`config.key`, `column.key`, `field.name`), so adding an entity or a field
 * needs no wiring here — only the message keys. Anything without a message
 * falls back to the English in `constants.ts`, so a missing key degrades to
 * today's behaviour instead of a key path.
 */
export function useLocalizedEntityConfig(
  config: AdminEntityConfig
): AdminEntityConfig {
  const t = useTranslations("AdminPages.marketingLoyalty");

  return useMemo(() => {
    const pick = (key: string, fallback: string) =>
      t.has(key) ? t(key) : fallback;

    const scope = `entities.${config.key}`;

    return {
      ...config,
      title: pick(`${scope}.title`, config.title),
      description: pick(`${scope}.description`, config.description),
      createTitle: pick(`${scope}.createTitle`, config.createTitle),
      updateTitle: pick(`${scope}.updateTitle`, config.updateTitle),
      listColumns: config.listColumns.map((column) => ({
        ...column,
        label: pick(`${scope}.columns.${column.key}`, column.label),
      })),
      fields: config.fields.map((field) => ({
        ...field,
        label: pick(`${scope}.fields.${field.name}.label`, field.label),
        placeholder: field.placeholder
          ? pick(`${scope}.fields.${field.name}.placeholder`, field.placeholder)
          : field.placeholder,
        helperText: field.helperText
          ? pick(`${scope}.fields.${field.name}.helperText`, field.helperText)
          : field.helperText,
      })),
    };
  }, [config, t]);
}
