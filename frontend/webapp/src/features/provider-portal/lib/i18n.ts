export type ProviderPortalTranslator = ((
  key: string,
  values?: Record<string, string | number | Date>,
) => string) & {
  has?: (key: string) => boolean;
};

export function keyFromText(value: string) {
  const cleaned = value
    .trim()
    .replace(/[`'".()[\]]/g, "")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/\//g, " ")
    .replace(/-/g, " ");

  const words = cleaned.match(/[A-Za-z0-9]+/g) || [];
  if (!words.length) return "value";

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      return index === 0
        ? lower
        : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

export function humanizeValue(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export function translateWithFallback(
  t: ProviderPortalTranslator,
  key: string,
  fallback: string,
  values?: Record<string, string | number | Date>,
) {
  return typeof t.has === "function" && t.has(key) ? t(key, values) : fallback;
}

export function tCommon(
  t: ProviderPortalTranslator,
  key: string,
  fallback: string,
  values?: Record<string, string | number | Date>,
) {
  return translateWithFallback(t, `common.${key}`, fallback, values);
}

export function tLabel(t: ProviderPortalTranslator, label: string) {
  return translateWithFallback(t, `labels.${keyFromText(label)}`, label);
}

export function tMessage(t: ProviderPortalTranslator, message: string) {
  return translateWithFallback(t, `messages.${keyFromText(message)}`, message);
}

export function tStatus(t: ProviderPortalTranslator, value?: string | null) {
  if (!value) return "-";
  const fallback = humanizeValue(value);
  return translateWithFallback(t, `statuses.${keyFromText(value)}`, fallback);
}

export function tResourceGroup(t: ProviderPortalTranslator, group: string) {
  return translateWithFallback(
    t,
    `resourceGroups.${keyFromText(group)}`,
    group,
  );
}

export function tResourceLabel(
  t: ProviderPortalTranslator,
  resourceKey: string,
  fallback: string,
  field: "label" | "pluralLabel" | "description" = "label",
) {
  return translateWithFallback(
    t,
    `resources.${resourceKey}.${field}`,
    fallback,
  );
}
