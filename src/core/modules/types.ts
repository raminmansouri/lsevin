import type { ReactNode } from "react";
import type { ProviderPermission } from "@core/auth/permissions";

export type ModuleScope = "public" | "portal" | "provider" | "admin";
export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ModulePageProps = {
  params: Record<string, string>;
  searchParams: Record<string, string | string[] | undefined>;
};

export type ModuleApiProps = {
  request: Request;
  params: Record<string, string>;
};

export type ModulePageComponent = (props: ModulePageProps) => ReactNode | Promise<ReactNode>;
export type ModuleApiHandler = (props: ModuleApiProps) => Response | Promise<Response>;

export type ModuleRoute = {
  key: string;
  scope: ModuleScope;
  path: string;
  title: string;
  description?: string;
  icon?: string;
  providerPermission?: ProviderPermission;
  adminPermission?: string;
  component: ModulePageComponent;
};

export type ModuleApiRoute = {
  key: string;
  path: string;
  method: ApiMethod;
  public?: boolean;
  providerPermission?: ProviderPermission;
  adminPermission?: string;
  handler: ModuleApiHandler;
};

export type ModuleNavigationItem = {
  scope: ModuleScope;
  label: string;
  hrefTemplate: string;
  icon?: string;
  routeKey: string;
  providerPermission?: ProviderPermission;
  adminPermission?: string;
  order?: number;
};

export type ExtendedModuleDefinition = {
  id: string;
  name: string;
  version: string;
  kind: "extended-module";
  dependsOn: ["core"];
  basePath: `src/modules/${string}`;
  routes: ModuleRoute[];
  apiRoutes?: ModuleApiRoute[];
  navigation?: ModuleNavigationItem[];
  migrations?: string[];
  capabilities?: string[];
  permissions?: string[];
  pricingPlans?: string[];
  installMode?: "required" | "optional";
  databaseSchema?: string;
};
