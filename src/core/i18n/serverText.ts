import "server-only";
import { getPortalLocale } from "./server";
import { translateUiText } from "./uiText";

export async function translatePortalText(text: string) {
  const locale = await getPortalLocale();
  return translateUiText(text, locale.header);
}
