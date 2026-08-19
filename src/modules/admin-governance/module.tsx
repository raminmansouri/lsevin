import type { ExtendedModuleDefinition } from "@core/modules/types";
import { AdminAuditPage } from "./pages/AdminAuditPage";
import { AdminGovernancePage } from "./pages/AdminGovernancePage";
import { AdminGovernanceUserPage } from "./pages/AdminGovernanceUserPage";
import { AdminGovernanceUsersPage } from "./pages/AdminGovernanceUsersPage";

const adminGovernanceModule: ExtendedModuleDefinition = {
  id: "admin-governance",
  name: "Administration Governance",
  version: "1.0.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/admin-governance",
  databaseSchema: "provider_portal",
  migrations: ["migrations/001_admin_governance.sql"],
  routes: [
    { key: "admin-governance.overview", scope: "admin", path: "admin/governance", title: "Governance", icon: "shield-check", adminPermission: "SUPERADMIN", component: AdminGovernancePage },
    { key: "admin-governance.users", scope: "admin", path: "admin/governance/users", title: "Administrative users", icon: "staff", adminPermission: "SUPERADMIN", component: AdminGovernanceUsersPage },
    { key: "admin-governance.user", scope: "admin", path: "admin/governance/users/:userId", title: "Administrative user", icon: "staff", adminPermission: "SUPERADMIN", component: AdminGovernanceUserPage },
    { key: "admin-governance.audit", scope: "admin", path: "admin/audit", title: "Admin audit", icon: "clipboard-check", adminPermission: "ADMIN", component: AdminAuditPage },
  ],
  navigation: [
    { scope: "admin", label: "Governance", hrefTemplate: "/admin/governance", icon: "shield-check", routeKey: "admin-governance.overview", adminPermission: "SUPERADMIN", order: 2 },
    { scope: "admin", label: "Admin audit", hrefTemplate: "/admin/audit", icon: "clipboard-check", routeKey: "admin-governance.audit", adminPermission: "ADMIN", order: 3 },
  ],
};

export default adminGovernanceModule;
