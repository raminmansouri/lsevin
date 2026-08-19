import type { ExtendedModuleDefinition, ModuleApiRoute, ModuleNavigationItem, ModuleRoute } from "./types";

export type MatchedRoute = { module: ExtendedModuleDefinition; route: ModuleRoute; params: Record<string, string> };
export type MatchedApiRoute = { module: ExtendedModuleDefinition; route: ModuleApiRoute; params: Record<string, string> };

export function normalizePath(input: string | string[]) {
  const raw = Array.isArray(input) ? input.join("/") : input;
  return raw.replace(/^\/+|\/+$/g, "");
}

export function matchModuleRoute(modules: ExtendedModuleDefinition[], pathParts: string[]): MatchedRoute | null {
  const incoming = normalizePath(pathParts);
  for (const module of modules) {
    for (const route of module.routes) {
      const params = matchPattern(route.path, incoming);
      if (params) return { module, route, params };
    }
  }
  return null;
}

export function matchModuleApiRoute(modules: ExtendedModuleDefinition[], method: string, pathParts: string[]): MatchedApiRoute | null {
  const incoming = normalizePath(pathParts);
  for (const module of modules) {
    for (const route of module.apiRoutes ?? []) {
      if (route.method !== method.toUpperCase()) continue;
      const params = matchPattern(route.path, incoming);
      if (params) return { module, route, params };
    }
  }
  return null;
}

export function fillHref(template: string, params: Record<string, string>) {
  return template.replace(/:([A-Za-z0-9_]+)/g, (_, key: string) => params[key] ?? "");
}

export function sortNavigation<T extends ModuleNavigationItem>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.order ?? 1000) - (b.order ?? 1000) || a.label.localeCompare(b.label));
}

function matchPattern(pattern: string, incoming: string): Record<string, string> | null {
  const patternParts = normalizePath(pattern).split("/").filter(Boolean);
  const incomingParts = normalizePath(incoming).split("/").filter(Boolean);
  if (patternParts.length !== incomingParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const expected = patternParts[i];
    const actual = incomingParts[i];
    if (expected.startsWith(":")) {
      params[expected.slice(1)] = decodeURIComponent(actual);
      continue;
    }
    if (expected !== actual) return null;
  }
  return params;
}
