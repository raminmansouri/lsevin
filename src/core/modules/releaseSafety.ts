export type ModuleSafetyIssue = "placeholder_admin_context" | "missing_lsevin_frontend";

export type ModuleReleaseSafetyPolicy = { moduleId: string; issue: ModuleSafetyIssue; note: string };

// B77 / RC16.2: unsupported historical modules are physically absent from source.
// Runtime enable/disable for the 24 supported modules is controlled by module_states,
// not by a stale deny-list from the former 60-module development tree.
export const moduleReleaseSafetyPolicies: readonly ModuleReleaseSafetyPolicy[] = [] as const;
const policiesByModuleId = new Map<string, ModuleReleaseSafetyPolicy>();
export function getModuleReleaseSafetyPolicy(moduleId: string) { return policiesByModuleId.get(moduleId) ?? null; }
export function isModuleDisabledByReleaseSafety(moduleId: string) { return policiesByModuleId.has(moduleId); }
