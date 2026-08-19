import type { ExtendedModuleDefinition } from "./types";

export type ModuleCatalogCategory =
  | "Administration"
  | "Provider operations"
  | "Customer experience"
  | "Growth and engagement"
  | "Finance and commercial"
  | "Platform services";

const categoryRules: Array<[RegExp, ModuleCatalogCategory]> = [
  [/admin|governance|access|manage|dashboard|portal/, "Administration"],
  [/finance|payment|billing|pricing|gift|loyalty|membership|offer/, "Finance and commercial"],
  [/growth|content|conversion|audience|community|referral|boost|challenge|relationship/, "Growth and engagement"],
  [/booking|availability|arrival|checkin|dispatch|journey|consultation|concierge|package|rebooking|slotdrop|staff|service|provider/, "Provider operations"],
  [/review|trust|support|ticket|conversation|customer|consent|document|feedback|engagement|decision/, "Customer experience"],
];

export function getModuleCategory(module: ExtendedModuleDefinition): ModuleCatalogCategory {
  const haystack = `${module.id} ${module.name}`.toLowerCase();
  return categoryRules.find(([pattern]) => pattern.test(haystack))?.[1] ?? "Platform services";
}

export function getModuleDescription(module: ExtendedModuleDefinition) {
  const routeDescriptions = [...new Set(module.routes.map((route) => route.description?.trim()).filter(Boolean))] as string[];
  const routeTitles = [...new Set(module.routes.map((route) => route.title.trim()).filter(Boolean))];
  const capabilities = (module.capabilities ?? []).map(humanizeCapability).filter(Boolean);
  const scopes = [...new Set(module.routes.map((route) => route.scope))].map((scope) => scope === "admin" ? "administrators" : scope === "provider" ? "provider teams" : scope === "public" ? "public users" : "portal users");

  const purpose = routeDescriptions.length
    ? routeDescriptions.slice(0, 3).join(" ")
    : `Manages ${module.name.toLowerCase()} workflows inside the LSevin Providers Portal.`;
  const pages = routeTitles.length
    ? `Its registered pages cover ${routeTitles.slice(0, 6).join(", ")}${routeTitles.length > 6 ? ", and related workflows" : ""}.`
    : "It currently exposes no registered page routes.";
  const users = scopes.length ? `The module is used by ${scopes.join(", ")}.` : "The module is available through internal platform capabilities.";
  const capabilityText = capabilities.length
    ? `Its main capabilities include ${capabilities.slice(0, 6).join(", ")}${capabilities.length > 6 ? ", and additional operations" : ""}.`
    : "Its behavior is delivered through its registered pages and module services.";
  const data = module.databaseSchema
    ? `It stores its module-owned data in the ${module.databaseSchema} schema and includes ${(module.migrations ?? []).length} migration file${(module.migrations ?? []).length === 1 ? "" : "s"}.`
    : `It uses shared platform data contracts and includes ${(module.migrations ?? []).length} migration file${(module.migrations ?? []).length === 1 ? "" : "s"}.`;

  return [purpose, pages, users, capabilityText, data].join(" ");
}

export function isProtectedModule(module: ExtendedModuleDefinition) {
  return module.id === "admin-governance";
}

function humanizeCapability(capability: string) {
  const value = capability.split(".").slice(1).join(" ") || capability;
  return value.replaceAll("_", " ").replaceAll("-", " ").trim();
}
