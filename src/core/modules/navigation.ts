import { extendedModules } from "./registry";
import { fillHref, sortNavigation } from "./routeMatcher";
import type { ModuleNavigationItem, ModuleScope } from "./types";

export type ResolvedNavigationItem = ModuleNavigationItem & { href: string; moduleId: string };

export function getModuleNavigation(scope: ModuleScope, params: Record<string, string> = {}) {
  const items: ResolvedNavigationItem[] = [];
  for (const module of extendedModules) {
    for (const item of module.navigation ?? []) {
      if (item.scope !== scope) continue;
      items.push({ ...item, href: fillHref(item.hrefTemplate, params), moduleId: module.id });
    }
  }
  return sortNavigation(items);
}
