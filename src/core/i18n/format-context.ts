import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { DEFAULT_PORTAL_LOCALE_HEADER, portalLocaleHeader } from "./config";
import { assertTimeZone } from "@core/lib/dateTime";

type PortalFormatContext = { locale: string; timeZone: string };

const storage = new AsyncLocalStorage<PortalFormatContext>();

export function withPortalFormatContext<T>(locale: string, timeZone: string, callback: () => T) {
  return storage.run({ locale: portalLocaleHeader(locale), timeZone: assertTimeZone(timeZone) }, callback);
}

export function currentPortalFormatContext() {
  return storage.getStore() || {
    locale: DEFAULT_PORTAL_LOCALE_HEADER,
    timeZone: process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || "Asia/Tehran",
  };
}

