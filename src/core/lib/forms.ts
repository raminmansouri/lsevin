export function stringFromForm(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : fallback;
}

export function phoneCountryCodeFromForm(formData: FormData, key: string, fallback = "+98") {
  const raw = stringFromForm(formData, key, fallback);
  const digits = raw.replace(/\D/g, "").slice(0, 7);
  if (digits) return `+${digits}`;
  const fallbackDigits = fallback.replace(/\D/g, "").slice(0, 7);
  return fallbackDigits ? `+${fallbackDigits}` : "+98";
}

export function numberFromForm(formData: FormData, key: string, fallback = 0) {
  const raw = stringFromForm(formData, key);
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function booleanFromForm(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export function translationsFromForm(formData: FormData, key: string) {
  const localeFields = [
    ["fa-IR", "fa"],
    ["en-US", "en"],
    ["ar-SA", "ar"],
    ["tr-TR", "tr"],
    ["es-ES", "es"],
    ["ku-KU", "ku"],
    ["de-DE", "de"],
    ["fr-FR", "fr"],
  ] as const;

  return Object.fromEntries(localeFields.map(([header, legacy]) => {
    const modern = stringFromForm(formData, `${key}__${header}`);
    const old = stringFromForm(formData, `${key}_${legacy}`);
    return [header, modern || old];
  }));
}

export function csvFromForm(formData: FormData, key: string) {
  return stringFromForm(formData, key)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
