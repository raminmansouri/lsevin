import "server-only";
import { getPortalLocale } from "@core/i18n/server";
import { translateUiText } from "@core/i18n/uiText";

export async function UiText({ text }: { text: string }) {
  const locale = await getPortalLocale();
  return translateUiText(text, locale.header);
}
