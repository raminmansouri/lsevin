import "server-only";
import { getPortalLocale } from "@core/i18n/server";
import { LocalizedField, type LocalizedValue } from "@core/ui/LocalizedField";
import type { PortalLocaleHeader } from "@core/i18n/config";

export async function LocalizedContentField({
  name,
  label,
  value,
  mode = "input",
  required = false,
  help,
}: {
  name: string;
  label: string;
  value?: LocalizedValue | string | null;
  mode?: "input" | "textarea" | "richtext";
  required?: boolean;
  help?: string;
}) {
  const locale = await getPortalLocale();
  const normalizedValue: LocalizedValue = typeof value === "string"
    ? { [locale.header]: value }
    : (value || {});
  return (
    <LocalizedField
      name={name}
      label={label}
      value={normalizedValue}
      mode={mode}
      requiredLocale={required ? locale.header as PortalLocaleHeader : null}
      help={help}
    />
  );
}
