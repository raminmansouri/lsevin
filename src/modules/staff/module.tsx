import { NextResponse } from "next/server";
import type { ExtendedModuleDefinition } from "@core/modules/types";
import { AdminStaffPage } from "./pages/AdminStaffPage";
import { EditStaffPage } from "./pages/EditStaffPage";
import { StaffPage } from "./pages/StaffPage";
import { SelfStaffProfilePage } from "./pages/SelfStaffProfilePage";
import { listProviderStaff } from "./repository";

const staffModule: ExtendedModuleDefinition = {
  id: "provider-staff",
  name: "Provider Staff",
  version: "2.2.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/staff",
  routes: [
    { key: "provider.staff", scope: "provider", path: "providers/:providerId/staff", title: "Staff", icon: "staff", providerPermission: "manageStaff", component: StaffPage },
    { key: "provider.staff.edit", scope: "provider", path: "providers/:providerId/staff/:providerStaffId/edit", title: "Edit staff", icon: "staff", providerPermission: "manageStaff", component: EditStaffPage },
    { key: "staff.self.profile", scope: "portal", path: "staff/:staffId/profile", title: "Manage My Staff Profile", icon: "staff", component: SelfStaffProfilePage },
    { key: "staff.admin", scope: "admin", path: "admin/staff", title: "Staff", icon: "staff", adminPermission: "PROVIDER_ADMIN", component: AdminStaffPage },
  ],
  apiRoutes: [
    { key: "api.provider.staff", method: "GET", path: "providers/:providerId/staff", providerPermission: "view", handler: async ({ params }) => NextResponse.json(await listProviderStaff(params.providerId)) },
  ],
  navigation: [
    { scope: "provider", label: "Staff", hrefTemplate: "/providers/:providerId/staff", icon: "staff", routeKey: "provider.staff", providerPermission: "manageStaff", order: 50 },
    { scope: "admin", label: "Staff", hrefTemplate: "/admin/staff", icon: "staff", routeKey: "staff.admin", adminPermission: "PROVIDER_ADMIN", order: 14 },
  ],
};
export default staffModule;
