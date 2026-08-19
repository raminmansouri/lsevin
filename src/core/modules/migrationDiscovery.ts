import { extendedModules } from "./registry";

export type DiscoveredMigration = {
  owner: "core" | "module";
  moduleId?: string;
  path: string;
};

export function discoverModuleMigrations(): DiscoveredMigration[] {
  const migrations: DiscoveredMigration[] = [
    { owner: "core", path: "src/core/migrations/001_provider_portal_hardening.sql" },
    { owner: "core", path: "src/core/migrations/002_provider_portal_management.sql" },
    { owner: "core", path: "src/core/migrations/003_admin_catalog_actions.sql" },
    { owner: "core", path: "src/core/migrations/004_lsevin_media_ownership.sql" },
    { owner: "core", path: "src/core/migrations/005_module_runtime_state.sql" },
    { owner: "core", path: "src/core/migrations/005_staff_shared_provider_media.sql" },
    { owner: "core", path: "src/core/migrations/009_lsevin_sso_sessions.sql" },
    { owner: "core", path: "src/core/migrations/010_provider_phone_country_codes.sql" },
  ];
  for (const module of extendedModules) {
    for (const migration of module.migrations ?? []) {
      migrations.push({ owner: "module", moduleId: module.id, path: `${module.basePath}/${migration}` });
    }
  }
  return migrations;
}
