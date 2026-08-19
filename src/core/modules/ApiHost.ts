import { NextResponse } from "next/server";
import { requireCurrentUser } from "@core/auth/session";
import { requireAdminUser, requireProviderPermission } from "@core/auth/permissions";
import { extendedModules } from "./registry";
import { matchModuleApiRoute } from "./routeMatcher";
import { handleCoreApi } from "@core/api/handlers";

export async function handleModuleApi(request: Request, method: string, modulePath?: string[]) {
  const coreResponse = await handleCoreApi(request, method, modulePath ?? []);
  if (coreResponse) return coreResponse;

  const match = matchModuleApiRoute(extendedModules, method, modulePath ?? []);
  if (!match) return NextResponse.json({ error: "API route not found" }, { status: 404 });

  const { route, params } = match;
  if (route.public) {
    return route.handler({ request, params });
  }
  if (params.providerId) {
    const user = await requireCurrentUser();
    await requireProviderPermission(user.id, params.providerId, route.providerPermission ?? "view");
  } else if (route.adminPermission) {
    await requireAdminUser(route.adminPermission);
  } else {
    await requireCurrentUser();
  }
  return route.handler({ request, params });
}
