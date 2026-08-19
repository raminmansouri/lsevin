import { PORTAL_LOCALES, normalizePortalLocale } from "@core/i18n/config";
import { Select } from "@core/ui/Field";

export function LocaleSelect({
  name = "locale",
  value,
  required = true,
  className,
  "aria-label": ariaLabel = "زبان محتوا",
}: {
  name?: string;
  value?: string;
  required?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const current = normalizePortalLocale(value).header;
  return (
    <Select name={name} defaultValue={current} required={required} className={className} aria-label={ariaLabel}>
      {PORTAL_LOCALES.map((item) => (
        <option key={item.header} value={item.header}>{item.label} · {item.header}</option>
      ))}
    </Select>
  );
}
