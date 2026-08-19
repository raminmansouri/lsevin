import { notFound } from "next/navigation";
import { requireCurrentUser } from "@core/auth/session";
import { requireAdminUser, requireProviderPermission } from "@core/auth/permissions";
import { PortalShell } from "@core/ui/PortalShell";
import { getPortalLocale } from "@core/i18n/server";
import { localizeReactTree } from "@core/i18n/localize-tree";
import { withPortalFormatContext } from "@core/i18n/format-context";
import { getProviderTimeZone } from "@core/providers/timezone";
import { extendedModules } from "./registry";
import { matchModuleRoute } from "./routeMatcher";

export async function ModuleHost({ modulePath, searchParams, shell = true }: { modulePath?: string[]; searchParams: Record<string, string | string[] | undefined>; shell?: boolean }) {
  const locale = await getPortalLocale();
  const match = matchModuleRoute(extendedModules, modulePath ?? []);
  if (!match) notFound();

  const { route, params } = match;
  const returnTo = `/${(modulePath ?? []).map(encodeURIComponent).join("/")}`;
  const renderRoute = (timeZone = process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || "Asia/Tehran") =>
    withPortalFormatContext(locale.header, timeZone, () => route.component({ params, searchParams }));

  if (route.scope === "public") {
    return localizeReactTree(await renderRoute(), locale.locale);
  }

  if (route.scope === "portal") {
    await requireCurrentUser(returnTo);
    const page = await renderRoute();
    return <PortalShell>{localizeReactTree(page, locale.locale)}</PortalShell>;
  }

  if (route.scope === "provider") {
    const providerId = params.providerId;
    if (!providerId) notFound();
    const user = await requireCurrentUser(returnTo);
    await requireProviderPermission(user.id, providerId, route.providerPermission ?? "view");
    const page = await renderRoute(await getProviderTimeZone(providerId));
    const localizedPage = localizeReactTree(page, locale.locale);
    return shell ? <PortalShell providerId={providerId}>{localizedPage}</PortalShell> : localizedPage;
  }

  await requireAdminUser(route.adminPermission);
  const page = await renderRoute();
  return <PortalShell admin>{localizeReactTree(page, locale.locale)}</PortalShell>;
}
