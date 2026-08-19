import "server-only";
import { cache } from "react";
import { sql } from "@core/db/client";
import { extendedModules, getModuleById } from "./registry";
import { getModuleCategory, getModuleDescription, isProtectedModule } from "./catalog";
import { getModuleReleaseSafetyPolicy, isModuleDisabledByReleaseSafety, type ModuleSafetyIssue } from "./releaseSafety";
import type { ModuleScope } from "./types";

export type ModuleStateRow = {
  moduleId: string;
  isEnabled: boolean;
  reason: string;
  updatedBy: string | null;
  updatedByName: string | null;
  updatedAt: string;
};

export type ModuleRuntimePageItem = {
  key: string;
  scope: "public" | "portal" | "provider" | "admin";
  path: string;
  href: string | null;
  title: string;
  description: string | null;
  dynamicParameters: string[];
  permission: string | null;
};

export type ModuleRuntimeApiItem = {
  key: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  public: boolean;
  dynamicParameters: string[];
  permission: string | null;
};

export type ModuleRuntimeCatalogItem = {
  id: string;
  name: string;
  version: string;
  description: string;
  category: ReturnType<typeof getModuleCategory>;
  databaseSchema: string | null;
  routeCount: number;
  apiRouteCount: number;
  capabilityCount: number;
  capabilities: string[];
  permissions: string[];
  scopes: ModuleScope[];
  migrationCount: number;
  installMode: "required" | "optional";
  protected: boolean;
  enabled: boolean;
  reason: string | null;
  updatedBy: string | null;
  updatedByName: string | null;
  updatedAt: string | null;
  pages: ModuleRuntimePageItem[];
  apiRoutes: ModuleRuntimeApiItem[];
  disabledByReleaseSafety: boolean;
  releaseSafetyIssue: ModuleSafetyIssue | null;
  releaseSafetyNote: string | null;
};

function isUndefinedTable(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "42P01");
}

const readModuleStateRows = cache(async (): Promise<ModuleStateRow[]> => {
  try {
    return await sql<ModuleStateRow[]>`
      select
        s.module_id as "moduleId",
        s.is_enabled as "isEnabled",
        s.reason,
        s.updated_by::text as "updatedBy",
        coalesce(nullif(trim(concat_ws(' ', actor.first_name, actor.last_name)), ''), actor.email, s.updated_by::text) as "updatedByName",
        s.updated_at::text as "updatedAt"
      from provider_portal.module_states s
      left join identity.asp_net_users actor on actor.id = s.updated_by
      order by s.module_id
    `;
  } catch (error) {
    if (isUndefinedTable(error)) return [];
    throw error;
  }
});

export async function getEnabledModuleIds() {
  const rows = await readModuleStateRows();
  const states = new Map(rows.map((row) => [row.moduleId, row.isEnabled]));
  return new Set(
    extendedModules
      .filter((module) => {
        if (isProtectedModule(module)) return true;
        const persisted = states.get(module.id);
        if (persisted !== undefined) return persisted;
        return !isModuleDisabledByReleaseSafety(module.id);
      })
      .map((module) => module.id),
  );
}

export async function isModuleEnabled(moduleId: string) {
  const module = getModuleById(moduleId);
  if (module && isProtectedModule(module)) return true;
  return (await getEnabledModuleIds()).has(moduleId);
}

export async function listModuleRuntimeCatalog(): Promise<ModuleRuntimeCatalogItem[]> {
  const rows = await readModuleStateRows();
  const states = new Map(rows.map((row) => [row.moduleId, row]));
  return extendedModules.map((module) => {
    const state = states.get(module.id);
    const protectedModule = isProtectedModule(module);
    const releaseSafety = getModuleReleaseSafetyPolicy(module.id);
    const enabled = protectedModule || state?.isEnabled === true || (state === undefined && !releaseSafety);
    return {
      id: module.id,
      name: module.name,
      version: module.version,
      description: getModuleDescription(module),
      category: getModuleCategory(module),
      databaseSchema: module.databaseSchema ?? null,
      routeCount: module.routes.length,
      apiRouteCount: module.apiRoutes?.length ?? 0,
      capabilityCount: module.capabilities?.length ?? 0,
      capabilities: [...(module.capabilities ?? [])],
      permissions: [...(module.permissions ?? [])],
      scopes: [...new Set(module.routes.map((route) => route.scope))],
      migrationCount: module.migrations?.length ?? 0,
      installMode: protectedModule ? "required" : module.installMode ?? "optional",
      protected: protectedModule,
      enabled,
      reason: state?.reason ?? releaseSafety?.note ?? null,
      updatedBy: state?.updatedBy ?? null,
      updatedByName: state?.updatedByName ?? null,
      updatedAt: state?.updatedAt ?? null,
      pages: module.routes.map((route) => {
        const dynamicParameters = [...route.path.matchAll(/:([A-Za-z][A-Za-z0-9]*)/g)].map((match) => match[1]);
        const path = route.path ? `/${route.path}` : "/";
        return {
          key: route.key,
          scope: route.scope,
          path,
          href: dynamicParameters.length ? null : path,
          title: route.title,
          description: route.description ?? null,
          dynamicParameters,
          permission: route.adminPermission ?? route.providerPermission ?? null,
        };
      }),
      apiRoutes: (module.apiRoutes ?? []).map((route) => ({
        key: route.key,
        method: route.method,
        path: `/api/${route.path}`,
        public: route.public === true,
        dynamicParameters: [...route.path.matchAll(/:([A-Za-z][A-Za-z0-9]*)/g)].map((match) => match[1]),
        permission: route.adminPermission ?? route.providerPermission ?? null,
      })),
      disabledByReleaseSafety: Boolean(releaseSafety),
      releaseSafetyIssue: releaseSafety?.issue ?? null,
      releaseSafetyNote: releaseSafety?.note ?? null,
    };
  });
}

export async function setModuleEnabled(input: { moduleId: string; enabled: boolean; reason?: string; actorUserId: string }) {
  const module = getModuleById(input.moduleId);
  if (!module) throw new Error("Registered module not found.");
  if (isProtectedModule(module) && !input.enabled) throw new Error("The Administration Governance module cannot be disabled because it contains the recovery controls.");
  const reason = input.reason?.trim() || (input.enabled ? "Enabled from module manager." : "Disabled from module manager.");

  return sql.begin(async (tx) => {
    const currentRows = await tx<{ isEnabled: boolean }[]>`
      select is_enabled as "isEnabled"
      from provider_portal.module_states
      where module_id = ${module.id}
      for update
    `;
    const previousEnabled = currentRows[0]?.isEnabled ?? !isModuleDisabledByReleaseSafety(module.id);
    if (previousEnabled === input.enabled) {
      return { changed: false, previousEnabled, enabled: input.enabled };
    }

    await tx`
      insert into provider_portal.module_states (module_id, is_enabled, reason, updated_by, updated_at)
      values (${module.id}, ${input.enabled}, ${reason}, ${input.actorUserId}::uuid, now())
      on conflict (module_id) do update set
        is_enabled = excluded.is_enabled,
        reason = excluded.reason,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at
    `;
    await tx`
      insert into provider_portal.module_state_events (
        module_id, action, previous_enabled, new_enabled, actor_user_id, reason
      ) values (
        ${module.id}, ${input.enabled ? "enable" : "disable"}, ${previousEnabled}, ${input.enabled}, ${input.actorUserId}::uuid, ${reason}
      )
    `;
    return { changed: true, previousEnabled, enabled: input.enabled };
  });
}
