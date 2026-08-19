import type { ModuleCapabilityRequest, ModuleCapabilityResult } from "./contracts";

export type ModuleCapabilityHandler<TPayload = Record<string, unknown>, TResult = Record<string, unknown>> = (
  request: ModuleCapabilityRequest<TPayload>
) => Promise<ModuleCapabilityResult<TResult>>;

const handlers = new Map<string, ModuleCapabilityHandler<any, any>>();
let registryLoaded = false;

export function registerModuleCapability<TPayload = Record<string, unknown>, TResult = Record<string, unknown>>(
  capability: string,
  handler: ModuleCapabilityHandler<TPayload, TResult>
) {
  handlers.set(capability, handler as ModuleCapabilityHandler<any, any>);
}

async function ensureModuleRegistryLoaded() {
  if (registryLoaded) return;
  registryLoaded = true;
  await import("./registry");
}

export async function invokeModuleCapability<TPayload = Record<string, unknown>, TResult = Record<string, unknown>>(
  request: ModuleCapabilityRequest<TPayload>
): Promise<ModuleCapabilityResult<TResult>> {
  await ensureModuleRegistryLoaded();
  if (!request.source && request.sourceModule) {
    request = {
      ...request,
      source: {
        moduleCode: request.sourceModule,
        entityType: "module_event",
        entityId: "legacy",
      },
    };
  }
  const handler = handlers.get(request.capability);
  if (!handler) {
    return { ok: false, message: `Capability '${request.capability}' is not registered or its module is disabled.` };
  }
  return handler(request) as Promise<ModuleCapabilityResult<TResult>>;
}

export async function listRegisteredCapabilities() {
  await ensureModuleRegistryLoaded();
  return [...handlers.keys()].sort();
}
