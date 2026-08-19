import type { ExtendedModuleDefinition } from "@core/modules/types";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { LandingPage } from "./pages/LandingPage";
import { NewApplicationPage } from "./pages/NewApplicationPage";
import { StaffLandingPage } from "./pages/StaffLandingPage";
import { NewStaffApplicationPage } from "./pages/NewStaffApplicationPage";
import { AdminApplicationsPage } from "./pages/AdminApplicationsPage";
import { AdminApplicationPage } from "./pages/AdminApplicationPage";
import { LoginPage, RegisterPage } from "./pages/LoginPage";

const onboardingModule: ExtendedModuleDefinition = {
  id: "provider-onboarding",
  name: "Provider Onboarding",
  version: "2.2.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/onboarding",
  databaseSchema: "provider_portal",
  migrations: ["migrations/001_onboarding_admin.sql", "migrations/002_application_draft_workflow.sql"],
  capabilities: [
    "onboarding.submit_application",
    "onboarding.review_application",
    "onboarding.request_changes",
    "onboarding.approve_application",
    "onboarding.create_owner_membership",
  ],
  routes: [
    { key: "public.landing", scope: "public", path: "", title: "Provider landing", component: LandingPage },
    { key: "public.become-provider", scope: "public", path: "become-provider", title: "Become a provider", component: LandingPage },
    { key: "public.become-staff", scope: "public", path: "become-staff", title: "Become LSevin staff", component: StaffLandingPage },
    { key: "public.login", scope: "public", path: "login", title: "Sign in", component: LoginPage },
    { key: "public.register", scope: "public", path: "register", title: "Register", component: RegisterPage },
    { key: "portal.applications", scope: "portal", path: "applications", title: "Applications", icon: "file", component: ApplicationsPage },
    { key: "portal.applications.new", scope: "portal", path: "applications/new", title: "New provider application", icon: "sparkles", component: NewApplicationPage },
    { key: "portal.applications.new-staff", scope: "portal", path: "applications/new/staff", title: "New staff profile request", icon: "staff", component: NewStaffApplicationPage },
    { key: "admin.applications", scope: "admin", path: "admin/applications", title: "Provider Applications", icon: "file", adminPermission: "PROVIDER_ADMIN", component: AdminApplicationsPage },
    { key: "admin.applications.detail", scope: "admin", path: "admin/applications/:applicationId", title: "Application Review", icon: "file", adminPermission: "PROVIDER_ADMIN", component: AdminApplicationPage },
  ],
  navigation: [
    { scope: "portal", label: "Become provider", hrefTemplate: "/applications/new", icon: "sparkles", routeKey: "portal.applications.new", order: 10 },
    { scope: "portal", label: "Claim staff profile", hrefTemplate: "/applications/new/staff", icon: "staff", routeKey: "portal.applications.new-staff", order: 11 },
    { scope: "portal", label: "Applications", hrefTemplate: "/applications", icon: "file", routeKey: "portal.applications", order: 40 },
    { scope: "admin", label: "Applications", hrefTemplate: "/admin/applications", icon: "file", routeKey: "admin.applications", adminPermission: "PROVIDER_ADMIN", order: 10 },
  ],
};

export default onboardingModule;
